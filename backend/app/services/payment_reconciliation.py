from datetime import datetime

from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.order import Order, OrderStatus
from backend.app.models.tenant import Tenant
from backend.app.services.credentials import CredentialService
from backend.app.services.mercadopago_service import MercadoPagoService
from backend.app.services.raffle_service import RaffleService


class PaymentReconciliationService:
    @staticmethod
    def payment_matches_order(payment: dict, order: Order) -> bool:
        return (
            payment.get("status") == "approved"
            and abs(float(payment.get("transaction_amount", 0)) - float(order.total_amount)) <= 0.001
        )

    @classmethod
    async def reconcile_pending(cls, db: Session, limit: int = 100) -> dict[str, int]:
        candidates = (
            db.query(Order)
            .filter(
                Order.status == OrderStatus.PENDING.value,
                Order.expires_at > datetime.utcnow(),
                Order.mp_payment_id.isnot(None),
                ~Order.mp_payment_id.like("mock_%"),
            )
            .order_by(Order.created_at.asc())
            .limit(min(max(limit, 1), 500))
            .all()
        )
        result = {"checked": 0, "confirmed": 0, "errors": 0}
        for candidate in candidates:
            result["checked"] += 1
            try:
                tenant = db.query(Tenant).filter(Tenant.id == candidate.raffle.tenant_id).first()
                access_token = (
                    CredentialService.decrypt(tenant.mp_access_token)
                    if tenant and tenant.mp_access_token
                    else settings.MERCADO_PAGO_ACCESS_TOKEN
                )
                payment = await MercadoPagoService.get_payment(candidate.mp_payment_id, access_token)
                if not payment or not cls.payment_matches_order(payment, candidate):
                    continue

                order = (
                    db.query(Order)
                    .filter(Order.id == candidate.id, Order.status == OrderStatus.PENDING.value)
                    .with_for_update()
                    .first()
                )
                if order:
                    success, _ = RaffleService.confirm_payment(db, order)
                    if success:
                        result["confirmed"] += 1
            except Exception:
                db.rollback()
                result["errors"] += 1
        return result
