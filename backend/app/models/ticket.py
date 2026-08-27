from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class TicketStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    PAID = "PAID"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    
    number_int = Column(Integer, nullable=False, index=True)
    number_str = Column(String, nullable=False, index=True) # Zero padded, e.g. "00452"
    
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False, index=True)
    
    status = Column(String, default=TicketStatus.RESERVED.value, nullable=False, index=True)
    
    # Lucky Number Details
    is_lucky_number = Column(Boolean, default=False)
    lucky_prize = Column(String, nullable=True)
    lucky_prize_claimed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    raffle = relationship("Raffle", back_populates="tickets")
    order = relationship("Order", back_populates="tickets")

    # A number must be unique per raffle
    __table_args__ = (
        UniqueConstraint('raffle_id', 'number_int', name='uix_raffle_number'),
    )
