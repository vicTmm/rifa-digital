"""Create immutable financial ledger.

Revision ID: 20260827_03
Revises: 20260827_02
"""
from alembic import op
import sqlalchemy as sa

revision = "20260827_03"
down_revision = "20260827_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "financial_ledger",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
        sa.Column("withdrawal_id", sa.Integer(), sa.ForeignKey("withdrawal_requests.id"), nullable=True),
        sa.Column("entry_type", sa.String(), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("balance_after", sa.Numeric(14, 2), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("idempotency_key", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("idempotency_key", name="uq_financial_ledger_idempotency"),
    )
    op.create_index("ix_financial_ledger_tenant_id", "financial_ledger", ["tenant_id"])
    op.create_index("ix_financial_ledger_order_id", "financial_ledger", ["order_id"])
    op.create_index("ix_financial_ledger_withdrawal_id", "financial_ledger", ["withdrawal_id"])
    op.create_index("ix_financial_ledger_entry_type", "financial_ledger", ["entry_type"])


def downgrade() -> None:
    op.drop_table("financial_ledger")
