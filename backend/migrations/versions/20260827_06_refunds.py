"""Add refund lifecycle fields.

Revision ID: 20260827_06
Revises: 20260827_05
"""
from alembic import op
import sqlalchemy as sa

revision = "20260827_06"
down_revision = "20260827_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("refunded_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("refund_reason", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("provider_refund_id", sa.String(), nullable=True))
        batch_op.add_column(sa.Column("refund_error", sa.Text(), nullable=True))
        batch_op.create_index("ix_orders_provider_refund_id", ["provider_refund_id"])


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_index("ix_orders_provider_refund_id")
        batch_op.drop_column("refund_error")
        batch_op.drop_column("provider_refund_id")
        batch_op.drop_column("refund_reason")
        batch_op.drop_column("refunded_at")
