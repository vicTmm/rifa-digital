from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class WithdrawalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class LedgerEntryType(str, enum.Enum):
    SALE_CREDIT = "SALE_CREDIT"
    REFUND_DEBIT = "REFUND_DEBIT"
    WITHDRAWAL_RESERVE = "WITHDRAWAL_RESERVE"
    WITHDRAWAL_REVERSAL = "WITHDRAWAL_REVERSAL"
    MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT"

class FinancialLedgerEntry(Base):
    __tablename__ = "financial_ledger"

    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True, index=True)
    withdrawal_id = Column(Integer, ForeignKey("withdrawal_requests.id"), nullable=True, index=True)
    entry_type = Column(String, nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    balance_after = Column(Numeric(14, 2), nullable=False)
    description = Column(String, nullable=False)
    idempotency_key = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("idempotency_key", name="uq_financial_ledger_idempotency"),)

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
