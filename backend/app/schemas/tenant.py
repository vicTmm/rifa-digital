from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TenantBase(BaseModel):
    name: str
    slug: str
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    pix_key: Optional[str] = None
    pix_key_type: Optional[str] = None

class TenantCreate(TenantBase):
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    pix_key: Optional[str] = None
    pix_key_type: Optional[str] = None
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None

class TenantResponse(TenantBase):
    id: int
    user_id: int
    custom_fee_percent: Optional[float] = None
    is_verified: bool
    is_active: bool
    available_balance: float
    total_sales_amount: float
    created_at: datetime

    class Config:
        from_attributes = True

class TenantPublic(BaseModel):
    id: int
    name: str
    slug: str
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    is_verified: bool
    total_active_raffles: Optional[int] = 0

    class Config:
        from_attributes = True
