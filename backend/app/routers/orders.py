from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.exc import IntegrityError
from backend.app.database import get_db
from backend.app.models.raffle import Raffle, RaffleStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.models.tenant import Tenant
from backend.app.schemas.order import OrderCreate, OrderResponse, OrderStatusResponse, SimulatePaymentRequest
from backend.app.services.raffle_service import RaffleService
from backend.app.services.mercadopago_service import MercadoPagoService
from backend.app.config import settings
from backend.app.services.credentials import CredentialService

router = APIRouter(prefix="/orders", tags=["Pedidos e Checkout PIX"])

@router.post("", response_model=OrderResponse)
async def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    RaffleService.cleanup_expired_orders(db, payload.raffle_id)
    
    raffle = db.query(Raffle).filter(Raffle.id == payload.raffle_id).first()
    if not raffle or raffle.status != RaffleStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campanha indisponível ou já finalizada."
        )
        
    if payload.quantity < raffle.min_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A compra mínima para esta rifa é de {raffle.min_purchase} cotas."
        )
        
    if payload.quantity > raffle.max_purchase:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A compra máxima por pedido é de {raffle.max_purchase} cotas."
        )
        
    # Allocate ticket numbers atomically
    allocated_numbers = RaffleService.allocate_tickets(
        db=db,
        raffle=raffle,
        quantity=payload.quantity,
        manual_numbers=payload.manual_numbers,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone
    )
    
    unit_price, discount_amount, total_amount = RaffleService.calculate_order_price(raffle, payload.quantity)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.ORDER_RESERVATION_MINUTES)
    
    # Get organizer custom credentials if present
    tenant = db.query(Tenant).filter(Tenant.id == raffle.tenant_id).first()
    custom_mp_token = CredentialService.decrypt(tenant.mp_access_token) if tenant else None
    
    # Generate PIX Payment
    payment_data = await MercadoPagoService.create_pix_payment(
        amount=total_amount,
        description=f"Rifa: {raffle.title[:50]} ({payload.quantity} cotas)",
        payer_email=payload.customer_email or f"comprador_{payload.customer_phone[-6:]}@rifadigital.com",
        payer_name=payload.customer_name,
        payer_cpf=payload.customer_cpf,
        custom_access_token=custom_mp_token,
        expires_minutes=settings.ORDER_RESERVATION_MINUTES
    )
    
    # Create Order record
    new_order = Order(
        raffle_id=raffle.id,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        customer_email=payload.customer_email,
        customer_cpf=payload.customer_cpf,
        quantity=payload.quantity,
        unit_price=unit_price,
        discount_amount=discount_amount,
        total_amount=total_amount,
        status=OrderStatus.PENDING.value,
        pix_qr_code=payment_data.get("pix_qr_code"),
        pix_code=payment_data.get("pix_code"),
        pix_txid=payment_data.get("txid"),
        mp_payment_id=payment_data.get("payment_id"),
        expires_at=expires_at
    )
    db.add(new_order)
    db.flush()

    # Persist the order and every reserved ticket atomically.
    formatted_numbers = []
    for num_int in allocated_numbers:
        num_str = RaffleService.format_number(num_int, raffle.total_numbers)
        formatted_numbers.append(num_str)
        db.add(
            Ticket(
                raffle_id=raffle.id,
                order_id=new_order.id,
                number_int=num_int,
                number_str=num_str,
                customer_name=payload.customer_name,
                customer_phone=payload.customer_phone,
                status=TicketStatus.RESERVED.value
            )
        )
    raffle.reserved_count = (raffle.reserved_count or 0) + payload.quantity
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Uma ou mais cotas acabaram de ser reservadas. Selecione outros números.",
        )
    db.refresh(new_order)
    
    return {
        "id": new_order.id,
        "raffle_id": raffle.id,
        "raffle_title": raffle.title,
        "customer_name": new_order.customer_name,
        "customer_phone": new_order.customer_phone,
        "customer_email": new_order.customer_email,
        "quantity": new_order.quantity,
        "unit_price": new_order.unit_price,
        "discount_amount": new_order.discount_amount,
        "total_amount": new_order.total_amount,
        "status": new_order.status,
        "payment_method": new_order.payment_method,
        "pix_qr_code": new_order.pix_qr_code,
        "pix_code": new_order.pix_code,
        "expires_at": new_order.expires_at,
        "created_at": new_order.created_at,
        "tickets": formatted_numbers,
        "lucky_numbers_won": []
    }

@router.get("/{order_id}", response_model=OrderStatusResponse)
def get_order_status(order_id: int, db: Session = Depends(get_db)):
    RaffleService.cleanup_expired_orders(db)
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        
    tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
    ticket_numbers = [t.number_str for t in tickets]
    
    lucky_won = [
        {"number": t.number_str, "prize": t.lucky_prize}
        for t in tickets if t.is_lucky_number
    ]
    
    return {
        "id": order.id,
        "status": order.status,
        "paid_at": order.paid_at,
        "tickets": ticket_numbers,
        "lucky_numbers_won": lucky_won
    }

@router.post("/{order_id}/simulate-payment", response_model=OrderStatusResponse)
def simulate_order_payment(order_id: int, db: Session = Depends(get_db)):
    """Simulates instant PIX payment for testing/demonstration"""
    if settings.is_production or not settings.ENABLE_PAYMENT_SIMULATOR:
        raise HTTPException(status_code=404, detail="Recurso não disponível.")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        
    if order.status == OrderStatus.PAID.value:
        tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
        return {
            "id": order.id,
            "status": order.status,
            "paid_at": order.paid_at,
            "tickets": [t.number_str for t in tickets],
            "lucky_numbers_won": [{"number": t.number_str, "prize": t.lucky_prize} for t in tickets if t.is_lucky_number]
        }
        
    success, lucky_prizes_won = RaffleService.confirm_payment(db, order)
    if not success:
        raise HTTPException(status_code=400, detail="Erro ao processar pagamento.")
        
    tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
    return {
        "id": order.id,
        "status": order.status,
        "paid_at": order.paid_at,
        "tickets": [t.number_str for t in tickets],
        "lucky_numbers_won": lucky_prizes_won
    }

@router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    """Mercado Pago IPN / Webhook notification handler"""
    try:
        data = await request.json()
        topic = data.get("type") or data.get("topic")
        
        if topic != "payment":
            return {"status": "ignored"}

        payment_id = str(data.get("data", {}).get("id") or data.get("id") or "")
        if not payment_id:
            raise HTTPException(status_code=400, detail="Pagamento ausente.")

        if settings.MERCADO_PAGO_WEBHOOK_SECRET:
            valid_signature = MercadoPagoService.validate_webhook_signature(
                request.headers.get("x-signature"),
                request.headers.get("x-request-id"),
                payment_id,
                settings.MERCADO_PAGO_WEBHOOK_SECRET,
            )
            if not valid_signature:
                raise HTTPException(status_code=401, detail="Assinatura inválida.")

        order = db.query(Order).filter(Order.mp_payment_id == payment_id).first()
        if not order or order.status != OrderStatus.PENDING.value:
            return {"status": "ignored"}

        tenant = db.query(Tenant).filter(Tenant.id == order.raffle.tenant_id).first()
        access_token = CredentialService.decrypt(tenant.mp_access_token) if tenant and tenant.mp_access_token else settings.MERCADO_PAGO_ACCESS_TOKEN
        payment = await MercadoPagoService.get_payment(payment_id, access_token)
        if not payment:
            raise HTTPException(status_code=502, detail="Não foi possível validar o pagamento.")
        if payment.get("status") != "approved":
            return {"status": "pending"}
        if abs(float(payment.get("transaction_amount", 0)) - float(order.total_amount)) > 0.001:
            raise HTTPException(status_code=409, detail="Valor do pagamento divergente.")

        success, _ = RaffleService.confirm_payment(db, order)
        if not success:
            raise HTTPException(status_code=409, detail="Pedido não pode ser confirmado.")
        return {"status": "ok", "order_id": order.id}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Notificação inválida.")
