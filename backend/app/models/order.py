from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Optional if guest checkout
    
    # Customer Data
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False, index=True)
    customer_email = Column(String, nullable=True)
    customer_cpf = Column(String, nullable=True, index=True)
    
    # Numbers purchased
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)
    
    # Platform Commission & Organizer Net
    platform_fee_percent = Column(Float, default=5.0)
    platform_fee_amount = Column(Float, default=0.0)
    organizer_net_amount = Column(Float, default=0.0)
    
    status = Column(String, default=OrderStatus.PENDING.value, nullable=False, index=True)
    
    # Payment Details (PIX)
    payment_method = Column(String, default="PIX")
    pix_qr_code = Column(Text, nullable=True) # Base64 Image or URL
    pix_code = Column(Text, nullable=True) # Copia e Cola Payload
    pix_txid = Column(String, nullable=True, index=True)
    mp_payment_id = Column(String, nullable=True, index=True) # Mercado Pago payment ID
    access_token_hash = Column(String, nullable=True, index=True)
    
    expires_at = Column(DateTime, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    refund_reason = Column(Text, nullable=True)
    provider_refund_id = Column(String, nullable=True, index=True)
    refund_error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    raffle = relationship("Raffle", back_populates="orders")
    customer = relationship("User", back_populates="orders")
    tickets = relationship("Ticket", back_populates="order", cascade="all, delete-orphan")
