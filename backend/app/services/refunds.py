from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.financial import LedgerEntryType
from backend.app.models.order import Order, OrderStatus
from backend.app.models.raffle import RaffleStatus
from backend.app.models.tenant import Tenant
from backend.app.models.ticket import Ticket, TicketStatus
from backend.app.services.credentials import CredentialService
from backend.app.services.financial import FinancialService, money
from backend.app.services.mercadopago_service import MercadoPagoService


class RefundService:
    @staticmethod
    def cancel_pending(db: Session, order: Order) -> Order:
        if order.status == OrderStatus.CANCELLED.value:
            return order
        if order.status != OrderStatus.PENDING.value:
            raise HTTPException(status_code=409, detail="Somente pedidos pendentes podem ser cancelados.")
        tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
        db.query(Ticket).filter(Ticket.order_id == order.id).delete()
        order.raffle.reserved_count = max(0, (order.raffle.reserved_count or 0) - len(tickets))
        order.status = OrderStatus.CANCELLED.value
        db.commit()
        return order

    @classmethod
    async def refund_paid(cls, db: Session, order_id: int, reason: str) -> Order:
        order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
        if not order:
            raise HTTPException(status_code=404, detail="Pedido não encontrado.")
        if order.status == OrderStatus.REFUNDED.value:
            return order
        if order.status != OrderStatus.PAID.value:
            raise HTTPException(status_code=409, detail="Somente pedidos pagos podem ser reembolsados.")
        if order.raffle.status == RaffleStatus.DRAWN.value:
            raise HTTPException(status_code=409, detail="Não é possível reembolsar após o sorteio.")

        tenant = db.query(Tenant).filter(Tenant.id == order.raffle.tenant_id).with_for_update().first()
        debit = money(order.organizer_net_amount)
        if money(tenant.available_balance) < debit:
            raise HTTPException(status_code=409, detail="Saldo do organizador insuficiente para o reembolso.")

        order.status = OrderStatus.REFUND_PENDING.value
        order.refund_reason = reason
        order.refund_error = None
        db.commit()

        access_token = (
            CredentialService.decrypt(tenant.mp_access_token)
            if tenant.mp_access_token
            else settings.MERCADO_PAGO_ACCESS_TOKEN
        )
        refund = await MercadoPagoService.refund_payment(
            order.mp_payment_id or "",
            access_token,
            f"order-refund:{order.id}",
        )
        if not refund or refund.get("status") not in {"approved", "refunded"}:
            order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
            order.status = OrderStatus.PAID.value
            order.refund_error = "O provedor não confirmou o reembolso."
            db.commit()
            raise HTTPException(status_code=502, detail=order.refund_error)

        order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
        if order.status == OrderStatus.REFUNDED.value:
            return order
        tenant = db.query(Tenant).filter(Tenant.id == order.raffle.tenant_id).with_for_update().first()
        tenant.available_balance = float(money(tenant.available_balance) - debit)
        tenant.total_sales_amount = float(max(money(0), money(tenant.total_sales_amount) - money(order.total_amount)))
        FinancialService.add_ledger_entry(
            db,
            tenant_id=tenant.id,
            order_id=order.id,
            entry_type=LedgerEntryType.REFUND_DEBIT,
            amount=-debit,
            balance_after=tenant.available_balance,
            description=f"Débito por reembolso do pedido #{order.id}",
            idempotency_key=f"refund-debit:{order.id}",
        )
        tickets = db.query(Ticket).filter(Ticket.order_id == order.id).all()
        for ticket in tickets:
            ticket.status = TicketStatus.REFUNDED.value
        order.raffle.sold_count = max(0, (order.raffle.sold_count or 0) - order.quantity)
        order.status = OrderStatus.REFUNDED.value
        order.refunded_at = datetime.utcnow()
        order.provider_refund_id = str(refund.get("id"))
        db.commit()
        return order
