from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class WithdrawalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class WithdrawalRequest(Base):
    __tablename__ = "withdrawal_requests"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    pix_key = Column(String, nullable=False)
    pix_key_type = Column(String, nullable=False)
    
    status = Column(String, default=WithdrawalStatus.PENDING.value, nullable=False)
    admin_notes = Column(Text, nullable=True)
    proof_url = Column(String, nullable=True)
    
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="withdrawals")
