from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from backend.app.database import Base

class RaffleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    DRAWING = "DRAWING"
    DRAWN = "DRAWN"
    CANCELLED = "CANCELLED"

class DrawType(str, enum.Enum):
    FEDERAL = "FEDERAL" # Baseado na Loteria Federal
    AUTOMATIC = "AUTOMATIC" # Sistema sorteia aleatoriamente entre cotas pagas
    MANUAL = "MANUAL" # Organizador insere o número sorteado com comprovante

class Raffle(Base):
    __tablename__ = "raffles"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="Geral") # Automóveis, Eletrônicos, Dinheiro / Pix, Outros
    
    images = Column(JSON, default=list) # List of image URLs
    
    price_per_number = Column(Float, nullable=False) # e.g. 0.35
    total_numbers = Column(Integer, nullable=False) # e.g. 1000, 10000, 100000
    
    min_purchase = Column(Integer, default=1)
    max_purchase = Column(Integer, default=10000)
    
    # Status & Timing
    status = Column(String, default=RaffleStatus.ACTIVE.value, nullable=False)
    draw_date = Column(DateTime, nullable=True)
    draw_type = Column(String, default=DrawType.FEDERAL.value, nullable=False)
    
    # Promotion & Combos (e.g. [{"quantity": 10, "discount_percentage": 5}, {"quantity": 100, "discount_percentage": 15}])
    discount_combos = Column(JSON, default=list)
    
    # Cotas Premiadas (Instant Prizes)
    # [{"number": "00777", "prize": "R$ 500 no PIX", "winner_name": "...", "winner_phone": "...", "claimed": false}]
    lucky_numbers = Column(JSON, default=list)
    
    # Ranking de Compradores (Incentive for top buyers)
    # [{"position": 1, "prize": "R$ 1.500 no PIX"}, {"position": 2, "prize": "R$ 500 no PIX"}]
    ranking_prizes = Column(JSON, default=list)
    
    # Winner Info (when drawn)
    winner_number = Column(String, nullable=True)
    winner_name = Column(String, nullable=True)
    winner_phone = Column(String, nullable=True)
    winner_order_id = Column(Integer, nullable=True)
    draw_proof_url = Column(String, nullable=True) # Foto / Vídeo / Comprovante
    draw_notes = Column(Text, nullable=True)
    drawn_at = Column(DateTime, nullable=True)
    
    # Counters (cached for super high performance)
    sold_count = Column(Integer, default=0)
    reserved_count = Column(Integer, default=0)
    
    # Visual Highlights
    is_featured = Column(Boolean, default=False)
    badge_text = Column(String, nullable=True) # e.g. "⚡ Quase Esgotado", "🔥 Mais Procurado"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tenant = relationship("Tenant", back_populates="raffles")
    orders = relationship("Order", back_populates="raffle", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="raffle", cascade="all, delete-orphan")
