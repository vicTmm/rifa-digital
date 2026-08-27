from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WithdrawalCreate(BaseModel):
    amount: float = Field(gt=0)
    pix_key: str
    pix_key_type: str # CPF, CNPJ, EMAIL, TELEFONE, ALEATORIA

class WithdrawalResponse(BaseModel):
    id: int
    tenant_id: int
    amount: float
    pix_key: str
    pix_key_type: str
    status: str
    admin_notes: Optional[str] = None
    proof_url: Optional[str] = None
    requested_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    total_organizers: int
    total_raffles: int
    active_raffles: int
    total_sales_volume: float
    total_platform_revenue: float
    total_tickets_sold: int
    pending_withdrawals_count: int
