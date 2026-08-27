"""Persist payment provider events.

Revision ID: 20260827_05
Revises: 20260827_04
"""
from alembic import op
import sqlalchemy as sa

revision = "20260827_05"
down_revision = "20260827_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "payment_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_key", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_payment_id", sa.String(), nullable=True),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("processing_status", sa.String(), nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("received_at", sa.DateTime(), nullable=False),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("event_key", name="uq_payment_events_event_key"),
    )
    op.create_index("ix_payment_events_event_key", "payment_events", ["event_key"], unique=True)
    op.create_index("ix_payment_events_provider_payment_id", "payment_events", ["provider_payment_id"])
    op.create_index("ix_payment_events_processing_status", "payment_events", ["processing_status"])
    op.create_index("ix_payment_events_order_id", "payment_events", ["order_id"])


def downgrade() -> None:
    op.drop_table("payment_events")
