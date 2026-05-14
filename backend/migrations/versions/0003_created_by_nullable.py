"""created_by_nullable

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-13
"""
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("appointments", "created_by_id", nullable=True)


def downgrade() -> None:
    op.alter_column("appointments", "created_by_id", nullable=False)
