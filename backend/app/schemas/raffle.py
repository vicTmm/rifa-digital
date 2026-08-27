from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from backend.app.schemas.tenant import TenantPublic

class DiscountComboSchema(BaseModel):
    quantity: int
    discount_percentage: float # e.g. 10.0 for 10% off

class LuckyNumberSchema(BaseModel):
    number: str
    prize: str
    winner_name: Optional[str] = None
    winner_phone: Optional[str] = None
    claimed: bool = False

class RankingPrizeSchema(BaseModel):
    position: int # 1, 2, 3
    prize: str

class RaffleBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "Geral"
    images: List[str] = []
    price_per_number: float = Field(gt=0)
    total_numbers: int = Field(gt=0) # 100, 1000, 10000, 100000, 1000000
    min_purchase: int = 1
    max_purchase: int = 10000
    draw_date: Optional[datetime] = None
    draw_type: str = "FEDERAL"
    discount_combos: List[DiscountComboSchema] = []
    lucky_numbers: List[LuckyNumberSchema] = []
    ranking_prizes: List[RankingPrizeSchema] = []
    badge_text: Optional[str] = None
    is_featured: bool = False

class RaffleCreate(RaffleBase):
    pass

class RaffleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None
    draw_date: Optional[datetime] = None
    draw_type: Optional[str] = None
    discount_combos: Optional[List[DiscountComboSchema]] = None
    lucky_numbers: Optional[List[LuckyNumberSchema]] = None
    ranking_prizes: Optional[List[RankingPrizeSchema]] = None
    badge_text: Optional[str] = None
    is_featured: Optional[bool] = None

class RafflePublicItem(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    tenant_slug: str
    tenant_verified: bool
    title: str
    slug: str
    category: str
    images: List[str]
    price_per_number: float
    total_numbers: int
    sold_count: int
    progress_percentage: float
    status: str
    draw_date: Optional[datetime] = None
    draw_type: str
    badge_text: Optional[str] = None
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TopBuyerSchema(BaseModel):
    position: int
    customer_name: str
    total_tickets: int
    prize_description: Optional[str] = None

class RaffleDetail(RafflePublicItem):
    description: Optional[str] = None
    min_purchase: int
    max_purchase: int
    discount_combos: List[DiscountComboSchema]
    lucky_numbers: List[LuckyNumberSchema]
    ranking_prizes: List[RankingPrizeSchema]
    top_buyers: List[TopBuyerSchema] = []
    winner_number: Optional[str] = None
    winner_name: Optional[str] = None
    drawn_at: Optional[datetime] = None
    draw_proof_url: Optional[str] = None
    draw_notes: Optional[str] = None
    tenant: Optional[TenantPublic] = None

class RaffleDrawExecute(BaseModel):
    winning_number: Optional[str] = None # If manual or federal lottery. If None and draw_type is AUTOMATIC, random paid number is picked.
    draw_proof_url: Optional[str] = None
    draw_notes: Optional[str] = None
