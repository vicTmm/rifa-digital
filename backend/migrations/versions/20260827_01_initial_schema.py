"""Initial application schema.

Revision ID: 20260827_01
Revises:
"""
from typing import Optional

from alembic import op

from backend.app.database import Base
from backend.app import models  # noqa: F401

revision: str = "20260827_01"
down_revision: Optional[str] = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_all is intentionally idempotent so this baseline can adopt the
    # development database that predates Alembic without deleting its data.
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
