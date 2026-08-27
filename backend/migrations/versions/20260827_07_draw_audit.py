"""Create immutable draw audit records.

Revision ID: 20260827_07
Revises: 20260827_06
"""
from alembic import op
import sqlalchemy as sa

revision = "20260827_07"
down_revision = "20260827_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "draw_audits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("raffle_id", sa.Integer(), sa.ForeignKey("raffles.id"), nullable=False),
        sa.Column("draw_type", sa.String(), nullable=False),
        sa.Column("algorithm", sa.String(), nullable=False),
        sa.Column("eligible_count", sa.Integer(), nullable=False),
        sa.Column("eligible_snapshot", sa.JSON(), nullable=False),
        sa.Column("snapshot_hash", sa.String(), nullable=False),
        sa.Column("entropy", sa.String(), nullable=True),
        sa.Column("selection_hash", sa.String(), nullable=True),
        sa.Column("selected_index", sa.Integer(), nullable=True),
        sa.Column("winning_ticket_id", sa.Integer(), sa.ForeignKey("tickets.id"), nullable=False),
        sa.Column("winning_number", sa.String(), nullable=False),
        sa.Column("proof_url", sa.String(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("raffle_id", name="uq_draw_audits_raffle_id"),
    )
    op.create_index("ix_draw_audits_raffle_id", "draw_audits", ["raffle_id"], unique=True)
    op.create_index("ix_draw_audits_snapshot_hash", "draw_audits", ["snapshot_hash"])


def downgrade() -> None:
    op.drop_table("draw_audits")
