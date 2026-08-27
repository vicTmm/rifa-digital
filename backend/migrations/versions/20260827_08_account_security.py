"""Add account recovery and email verification state."""
from alembic import op
import sqlalchemy as sa

revision = "20260827_08"
down_revision = "20260827_07"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("users", sa.Column("password_reset_token_hash", sa.String(), nullable=True))
    op.add_column("users", sa.Column("password_reset_expires_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("email_verification_token_hash", sa.String(), nullable=True))
    op.add_column("users", sa.Column("email_verification_expires_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.create_index("ix_users_password_reset_token_hash", "users", ["password_reset_token_hash"])
    op.create_index("ix_users_email_verification_token_hash", "users", ["email_verification_token_hash"])

def downgrade() -> None:
    op.drop_index("ix_users_email_verification_token_hash", table_name="users")
    op.drop_index("ix_users_password_reset_token_hash", table_name="users")
    for name in ("email_verified_at", "email_verification_expires_at", "email_verification_token_hash", "password_reset_expires_at", "password_reset_token_hash"):
        op.drop_column("users", name)
