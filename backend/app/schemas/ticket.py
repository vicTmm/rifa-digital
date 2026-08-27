from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TicketPublic(BaseModel):
    number_str: str
    status: str # RESERVED, PAID
    is_lucky_number: bool = False
    lucky_prize: Optional[str] = None
    lucky_prize_claimed: bool = False

class CustomerRaffleTickets(BaseModel):
    raffle_id: int
    raffle_title: str
    raffle_slug: str
    raffle_image: Optional[str] = None
    raffle_status: str
    draw_date: Optional[datetime] = None
    order_id: int
    order_status: str
    total_amount: float
    paid_at: Optional[datetime] = None
    tickets: List[str]
    lucky_prizes: List[dict] = Field(default_factory=list)

class MyTicketsQuery(BaseModel):
    phone_or_cpf: str
