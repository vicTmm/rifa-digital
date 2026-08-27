from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional
from datetime import datetime

class TenantBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    pix_key: Optional[str] = None
    pix_key_type: Optional[Literal["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATORIA"]] = None

class TenantCreate(TenantBase):
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = Field(default=None, min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    bio: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    pix_key: Optional[str] = None
    pix_key_type: Optional[Literal["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATORIA"]] = None
    mp_access_token: Optional[str] = None
    mp_public_key: Optional[str] = None

class TenantResponse(TenantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    custom_fee_percent: Optional[float] = None
    is_verified: bool
    is_active: bool
    available_balance: float
    total_sales_amount: float
    created_at: datetime

class TenantPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
