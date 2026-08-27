import hashlib
import json
from datetime import datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from backend.app.models.payment import PaymentEvent


class PaymentEventService:
    @staticmethod
    def event_key(payload: dict[str, Any], request_id: Optional[str]) -> str:
        if request_id:
            return f"mercadopago:{request_id}"
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
        return f"mercadopago:sha256:{hashlib.sha256(canonical.encode()).hexdigest()}"

    @classmethod
    def get_or_create(
        cls,
        db: Session,
        *,
        payload: dict[str, Any],
        request_id: Optional[str],
        payment_id: Optional[str],
        event_type: str,
    ) -> tuple[PaymentEvent, bool]:
        key = cls.event_key(payload, request_id)
        existing = db.query(PaymentEvent).filter(PaymentEvent.event_key == key).first()
        if existing:
            return existing, False
        event = PaymentEvent(
            event_key=key,
            provider_payment_id=payment_id,
            event_type=event_type,
            payload=payload,
        )
        db.add(event)
        db.flush()
        return event, True

    @staticmethod
    def finish(event: PaymentEvent, status: str, order_id: int | None = None, error: str | None = None):
        event.processing_status = status
        event.order_id = order_id
        event.error_message = error
        event.processed_at = datetime.utcnow()
