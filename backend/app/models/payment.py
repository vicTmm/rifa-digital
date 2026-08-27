from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, JSON, String, Text

from backend.app.database import Base


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True)
    event_key = Column(String, nullable=False, unique=True, index=True)
    provider = Column(String, nullable=False, default="MERCADO_PAGO")
    provider_payment_id = Column(String, nullable=True, index=True)
    event_type = Column(String, nullable=False)
    processing_status = Column(String, nullable=False, default="RECEIVED", index=True)
    order_id = Column(Integer, nullable=True, index=True)
    payload = Column(JSON, nullable=False, default=dict)
    error_message = Column(Text, nullable=True)
    received_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
