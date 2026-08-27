"""Initial application schema.

Revision ID: 20260827_01
Revises:
"""
from typing import Optional

from alembic import op
import sqlalchemy as sa

revision: str = "20260827_01"
down_revision: Optional[str] = None
branch_labels = None
depends_on = None


def baseline_metadata() -> sa.MetaData:
    """Return the schema as it existed when this baseline was created.

    An old migration must not use the application's live model metadata. If it
    does, later model changes alter the baseline and subsequent migrations try
    to recreate tables or columns that were created too early.
    """
    metadata = sa.MetaData()

    sa.Table(
        "users", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("phone", sa.String(), nullable=True, index=True),
        sa.Column("cpf", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    sa.Table(
        "tenants", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("slug", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(), nullable=True),
        sa.Column("banner_url", sa.String(), nullable=True),
        sa.Column("whatsapp", sa.String(), nullable=True),
        sa.Column("instagram", sa.String(), nullable=True),
        sa.Column("pix_key", sa.String(), nullable=True),
        sa.Column("pix_key_type", sa.String(), nullable=True),
        sa.Column("mp_access_token", sa.String(), nullable=True),
        sa.Column("mp_public_key", sa.String(), nullable=True),
        sa.Column("custom_fee_percent", sa.Float(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("available_balance", sa.Float(), nullable=True),
        sa.Column("total_sales_amount", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    sa.Table(
        "raffles", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False, index=True),
        sa.Column("slug", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("images", sa.JSON(), nullable=True),
        sa.Column("price_per_number", sa.Float(), nullable=False),
        sa.Column("total_numbers", sa.Integer(), nullable=False),
        sa.Column("min_purchase", sa.Integer(), nullable=True),
        sa.Column("max_purchase", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("draw_date", sa.DateTime(), nullable=True),
        sa.Column("draw_type", sa.String(), nullable=False),
        sa.Column("discount_combos", sa.JSON(), nullable=True),
        sa.Column("lucky_numbers", sa.JSON(), nullable=True),
        sa.Column("ranking_prizes", sa.JSON(), nullable=True),
        sa.Column("winner_number", sa.String(), nullable=True),
        sa.Column("winner_name", sa.String(), nullable=True),
        sa.Column("winner_phone", sa.String(), nullable=True),
        sa.Column("winner_order_id", sa.Integer(), nullable=True),
        sa.Column("draw_proof_url", sa.String(), nullable=True),
        sa.Column("draw_notes", sa.Text(), nullable=True),
        sa.Column("drawn_at", sa.DateTime(), nullable=True),
        sa.Column("sold_count", sa.Integer(), nullable=True),
        sa.Column("reserved_count", sa.Integer(), nullable=True),
        sa.Column("is_featured", sa.Boolean(), nullable=True),
        sa.Column("badge_text", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    sa.Table(
        "orders", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("raffle_id", sa.Integer(), sa.ForeignKey("raffles.id"), nullable=False, index=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_phone", sa.String(), nullable=False, index=True),
        sa.Column("customer_email", sa.String(), nullable=True),
        sa.Column("customer_cpf", sa.String(), nullable=True, index=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("discount_amount", sa.Float(), nullable=True),
        sa.Column("total_amount", sa.Float(), nullable=False),
        sa.Column("platform_fee_percent", sa.Float(), nullable=True),
        sa.Column("platform_fee_amount", sa.Float(), nullable=True),
        sa.Column("organizer_net_amount", sa.Float(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, index=True),
        sa.Column("payment_method", sa.String(), nullable=True),
        sa.Column("pix_qr_code", sa.Text(), nullable=True),
        sa.Column("pix_code", sa.Text(), nullable=True),
        sa.Column("pix_txid", sa.String(), nullable=True, index=True),
        sa.Column("mp_payment_id", sa.String(), nullable=True, index=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    sa.Table(
        "withdrawal_requests", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("tenant_id", sa.Integer(), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("pix_key", sa.String(), nullable=False),
        sa.Column("pix_key_type", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("proof_url", sa.String(), nullable=True),
        sa.Column("requested_at", sa.DateTime(), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )
    sa.Table(
        "tickets", metadata,
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("raffle_id", sa.Integer(), sa.ForeignKey("raffles.id"), nullable=False, index=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False, index=True),
        sa.Column("number_int", sa.Integer(), nullable=False, index=True),
        sa.Column("number_str", sa.String(), nullable=False, index=True),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_phone", sa.String(), nullable=False, index=True),
        sa.Column("status", sa.String(), nullable=False, index=True),
        sa.Column("is_lucky_number", sa.Boolean(), nullable=True),
        sa.Column("lucky_prize", sa.String(), nullable=True),
        sa.Column("lucky_prize_claimed", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("raffle_id", "number_int", name="uix_raffle_number"),
    )

    return metadata


def upgrade() -> None:
    baseline_metadata().create_all(bind=op.get_bind())


def downgrade() -> None:
    baseline_metadata().drop_all(bind=op.get_bind())
