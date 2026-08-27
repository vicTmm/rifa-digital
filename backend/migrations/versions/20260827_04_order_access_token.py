"""Add private order access token hash.

Revision ID: 20260827_04
Revises: 20260827_03
"""
from alembic import op
import sqlalchemy as sa

revision = "20260827_04"
down_revision = "20260827_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.add_column(sa.Column("access_token_hash", sa.String(), nullable=True))
        batch_op.create_index("ix_orders_access_token_hash", ["access_token_hash"])


def downgrade() -> None:
    with op.batch_alter_table("orders") as batch_op:
        batch_op.drop_index("ix_orders_access_token_hash")
        batch_op.drop_column("access_token_hash")
