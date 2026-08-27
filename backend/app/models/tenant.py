from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False) # e.g. "premios-do-victor"
    name = Column(String, nullable=False) # Display Name
    bio = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    pix_key = Column(String, nullable=True)
    pix_key_type = Column(String, nullable=True) # CPF, CNPJ, EMAIL, PHONE, RANDOM
    
    # Mercado Pago Organizer Custom Credentials (optional, fallback to platform gateway)
    mp_access_token = Column(String, nullable=True)
    mp_public_key = Column(String, nullable=True)
    
    # Custom Platform Fee (if None, use global DEFAULT_PLATFORM_FEE_PERCENT)
    custom_fee_percent = Column(Float, nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Financial Balance
    available_balance = Column(Float, default=0.0)
    total_sales_amount = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="tenant")
    raffles = relationship("Raffle", back_populates="tenant", cascade="all, delete-orphan")
    withdrawals = relationship("WithdrawalRequest", back_populates="tenant")
