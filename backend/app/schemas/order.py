from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class OrderCreate(BaseModel):
    raffle_id: int
    quantity: int = Field(gt=0)
    manual_numbers: Optional[List[str]] = None # If user chose specific numbers on grid
    
    # Customer Details
    customer_name: str
    customer_phone: str
    customer_email: Optional[EmailStr] = None
    customer_cpf: Optional[str] = None

class OrderResponse(BaseModel):
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
    tickets: List[str] = [] # Numbers assigned to this order
    lucky_numbers_won: List[dict] = [] # Any instant prize won!

    class Config:
        from_attributes = True

class OrderStatusResponse(BaseModel):
    id: int
    status: str # PENDING, PAID, EXPIRED, CANCELLED
    paid_at: Optional[datetime] = None
    tickets: List[str] = []
    lucky_numbers_won: List[dict] = []

class SimulatePaymentRequest(BaseModel):
    order_id: int
