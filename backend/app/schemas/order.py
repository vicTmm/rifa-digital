from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class OrderCreate(BaseModel):
    raffle_id: int
    quantity: int = Field(gt=0)
    manual_numbers: Optional[List[str]] = None # If user chose specific numbers on grid
    
    # Customer Details
    customer_name: str = Field(min_length=2, max_length=120)
    customer_phone: str = Field(min_length=10, max_length=20)
    customer_email: Optional[EmailStr] = None
    customer_cpf: Optional[str] = None

class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    raffle_id: int
    raffle_title: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    quantity: int
    unit_price: float
    discount_amount: float
    total_amount: float
    status: str
    payment_method: str
    pix_qr_code: Optional[str] = None
    pix_code: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    tickets: List[str] = Field(default_factory=list)
    lucky_numbers_won: List[dict] = Field(default_factory=list)
    access_token: Optional[str] = None

class OrderStatusResponse(BaseModel):
    id: int
    status: str # PENDING, PAID, EXPIRED, CANCELLED
    paid_at: Optional[datetime] = None
    tickets: List[str] = Field(default_factory=list)
    lucky_numbers_won: List[dict] = Field(default_factory=list)

class SimulatePaymentRequest(BaseModel):
    order_id: int
