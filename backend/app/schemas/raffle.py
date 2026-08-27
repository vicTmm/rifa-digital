from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Literal, Optional, List
from datetime import datetime
from backend.app.schemas.tenant import TenantPublic

class DiscountComboSchema(BaseModel):
    quantity: int = Field(gt=0)
    discount_percentage: float = Field(ge=0, le=100)

class LuckyNumberSchema(BaseModel):
    number: str
    prize: str
    winner_name: Optional[str] = None
    winner_phone: Optional[str] = None
    claimed: bool = False

class RankingPrizeSchema(BaseModel):
    position: int = Field(gt=0)
    prize: str

class RaffleBase(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: Optional[str] = None
    category: Optional[str] = "Geral"
    images: List[str] = Field(default_factory=list)
    price_per_number: float = Field(gt=0)
    total_numbers: int = Field(gt=0) # 100, 1000, 10000, 100000, 1000000
    min_purchase: int = Field(default=1, gt=0)
    max_purchase: int = Field(default=10000, gt=0)
    draw_date: Optional[datetime] = None
    draw_type: Literal["FEDERAL", "AUTOMATIC", "MANUAL"] = "FEDERAL"
    discount_combos: List[DiscountComboSchema] = Field(default_factory=list)
    lucky_numbers: List[LuckyNumberSchema] = Field(default_factory=list)
    ranking_prizes: List[RankingPrizeSchema] = Field(default_factory=list)
    badge_text: Optional[str] = None
    is_featured: bool = False

    @model_validator(mode="after")
    def validate_purchase_limits_and_promotions(self):
        if self.min_purchase > self.max_purchase:
            raise ValueError("min_purchase não pode ser maior que max_purchase")
        lucky_values = [item.number for item in self.lucky_numbers]
        if len(lucky_values) != len(set(lucky_values)):
            raise ValueError("Números premiados não podem ser duplicados")
        positions = [item.position for item in self.ranking_prizes]
        if len(positions) != len(set(positions)):
            raise ValueError("Posições do ranking não podem ser duplicadas")
        return self

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
    model_config = ConfigDict(from_attributes=True)
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
    top_buyers: List[TopBuyerSchema] = Field(default_factory=list)
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
