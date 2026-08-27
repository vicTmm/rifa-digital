"""Add indexes used by withdrawal operations.

Revision ID: 20260827_02
Revises: 20260827_01
"""
from alembic import op

revision = "20260827_02"
down_revision = "20260827_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("withdrawal_requests") as batch_op:
        batch_op.create_index("ix_withdrawal_requests_tenant_id", ["tenant_id"])
        batch_op.create_index("ix_withdrawal_requests_status", ["status"])


def downgrade() -> None:
    with op.batch_alter_table("withdrawal_requests") as batch_op:
        batch_op.drop_index("ix_withdrawal_requests_status")
        batch_op.drop_index("ix_withdrawal_requests_tenant_id")
