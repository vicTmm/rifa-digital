from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class UserRole(str, enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    ORGANIZER = "ORGANIZER"
    CUSTOMER = "CUSTOMER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, index=True, nullable=True)
    cpf = Column(String, nullable=True)
    role = Column(String, default=UserRole.CUSTOMER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    password_reset_token_hash = Column(String, nullable=True, index=True)
    password_reset_expires_at = Column(DateTime, nullable=True)
    email_verification_token_hash = Column(String, nullable=True, index=True)
    email_verification_expires_at = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)

    # Relationships
    tenant = relationship("Tenant", back_populates="owner", uselist=False)
    orders = relationship("Order", back_populates="customer")
