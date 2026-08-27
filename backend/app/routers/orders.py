from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.exc import IntegrityError
import hashlib
import hmac
import secrets
from backend.app.database import get_db
from backend.app.models.raffle import Raffle, RaffleStatus
from backend.app.models.order import Order, OrderStatus
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.models.tenant import Tenant
from backend.app.schemas.order import OrderCreate, OrderResponse, OrderStatusResponse, SimulatePaymentRequest
from backend.app.services.raffle_service import RaffleService
from backend.app.services.mercadopago_service import MercadoPagoService
from backend.app.services.whatsapp_service import WhatsAppService
from backend.app.config import settings
from backend.app.services.credentials import CredentialService
from backend.app.services.payment_events import PaymentEventService
from backend.app.services.rate_limit import limiter

router = APIRouter(prefix="/orders", tags=["Pedidos e Checkout PIX"])

def hash_order_access_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def validate_order_access(order: Order, token: Optional[str]) -> None:
    if not token or not order.access_token_hash:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    if not hmac.compare_digest(order.access_token_hash, hash_order_access_token(token)):
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")

@router.post("", response_model=OrderResponse)
@limiter.limit(settings.ORDER_CREATE_RATE_LIMIT)
async def create_order(request: Request, payload: OrderCreate, db: Session = Depends(get_db)):
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
    
    # Create Order record. Only the hash is persisted; the raw token is returned once.
    raw_access_token = secrets.token_urlsafe(32)
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
        access_token_hash=hash_order_access_token(raw_access_token),
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
        "lucky_numbers_won": [],
        "access_token": raw_access_token,
    }

@router.get("/{order_id}", response_model=OrderStatusResponse)
@limiter.limit(settings.ORDER_LOOKUP_RATE_LIMIT)
def get_order_status(
    request: Request,
    order_id: int,
    order_token: Optional[str] = Header(None, alias="X-Order-Token"),
    db: Session = Depends(get_db),
):
    RaffleService.cleanup_expired_orders(db)
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        
    validate_order_access(order, order_token)
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
@limiter.limit(settings.PAYMENT_SIMULATOR_RATE_LIMIT)
async def simulate_order_payment(
    request: Request,
    order_id: int,
    background_tasks: BackgroundTasks,
    order_token: Optional[str] = Header(None, alias="X-Order-Token"),
    db: Session = Depends(get_db)
):
    """Simulates instant PIX payment for testing/demonstration"""
    if settings.is_production or not settings.ENABLE_PAYMENT_SIMULATOR:
        raise HTTPException(status_code=404, detail="Recurso não disponível.")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    validate_order_access(order, order_token)
        
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
    ticket_numbers = [t.number_str for t in tickets]

    # Dispatch WhatsApp Confirmation via Background Task
    if order.customer_phone:
        background_tasks.add_task(
            WhatsAppService.notify_order_paid,
            customer_phone=order.customer_phone,
            customer_name=order.customer_name,
            raffle_title=order.raffle.title if order.raffle else "Rifa Digital",
            tickets=ticket_numbers,
            total_amount=order.total_amount,
            order_id=order.id
        )
        if lucky_prizes_won:
            background_tasks.add_task(
                WhatsAppService.notify_lucky_prize,
                customer_phone=order.customer_phone,
                customer_name=order.customer_name,
                raffle_title=order.raffle.title if order.raffle else "Rifa Digital",
                lucky_prizes=lucky_prizes_won
            )

    return {
        "id": order.id,
        "status": order.status,
        "paid_at": order.paid_at,
        "tickets": ticket_numbers,
        "lucky_numbers_won": lucky_prizes_won
    }

@router.post("/webhook/mercadopago")
async def mercadopago_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
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

        event, created = PaymentEventService.get_or_create(
            db,
            payload=data,
            request_id=request.headers.get("x-request-id"),
            payment_id=payment_id,
            event_type=topic,
        )
        if not created and event.processing_status == "PROCESSED":
            return {"status": "ok", "order_id": event.order_id, "duplicate": True}

        order = db.query(Order).filter(Order.mp_payment_id == payment_id).first()
        if not order or order.status != OrderStatus.PENDING.value:
            PaymentEventService.finish(event, "IGNORED", order.id if order else None)
            db.commit()
            return {"status": "ignored"}

        tenant = db.query(Tenant).filter(Tenant.id == order.raffle.tenant_id).first()
        access_token = CredentialService.decrypt(tenant.mp_access_token) if tenant and tenant.mp_access_token else settings.MERCADO_PAGO_ACCESS_TOKEN
        payment = await MercadoPagoService.get_payment(payment_id, access_token)
        if not payment:
            raise HTTPException(status_code=502, detail="Não foi possível validar o pagamento.")
        if payment.get("status") != "approved":
            PaymentEventService.finish(event, "PENDING", order.id)
            db.commit()
            return {"status": "pending"}
        if abs(float(payment.get("transaction_amount", 0)) - float(order.total_amount)) > 0.001:
            raise HTTPException(status_code=409, detail="Valor do pagamento divergente.")

        success, lucky_prizes_won = RaffleService.confirm_payment(db, order)
        if not success:
            raise HTTPException(status_code=409, detail="Pedido não pode ser confirmado.")

        PaymentEventService.finish(event, "PROCESSED", order.id)
        db.commit()

        tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
        ticket_numbers = [t.number_str for t in tickets]

        # Dispatch WhatsApp Notification
        if order.customer_phone:
            background_tasks.add_task(
                WhatsAppService.notify_order_paid,
                customer_phone=order.customer_phone,
                customer_name=order.customer_name,
                raffle_title=order.raffle.title if order.raffle else "Rifa Digital",
                tickets=ticket_numbers,
                total_amount=order.total_amount,
                order_id=order.id
            )
            if lucky_prizes_won:
                background_tasks.add_task(
                    WhatsAppService.notify_lucky_prize,
                    customer_phone=order.customer_phone,
                    customer_name=order.customer_name,
                    raffle_title=order.raffle.title if order.raffle else "Rifa Digital",
                    lucky_prizes=lucky_prizes_won
                )

        return {"status": "ok", "order_id": order.id}
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Notificação inválida.")
