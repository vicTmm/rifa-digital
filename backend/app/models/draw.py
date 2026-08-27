from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint

from backend.app.database import Base


class DrawAudit(Base):
    __tablename__ = "draw_audits"
    __table_args__ = (
        UniqueConstraint("raffle_id", name="uq_draw_audits_raffle_id"),
    )

    id = Column(Integer, primary_key=True)
    raffle_id = Column(Integer, ForeignKey("raffles.id"), nullable=False, unique=True, index=True)
    draw_type = Column(String, nullable=False)
    algorithm = Column(String, nullable=False)
    eligible_count = Column(Integer, nullable=False)
    eligible_snapshot = Column(JSON, nullable=False)
    snapshot_hash = Column(String, nullable=False, index=True)
    entropy = Column(String, nullable=True)
    selection_hash = Column(String, nullable=True)
    selected_index = Column(Integer, nullable=True)
    winning_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    winning_number = Column(String, nullable=False)
    proof_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
