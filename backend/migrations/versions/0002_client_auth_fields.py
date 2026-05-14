"""client_auth_fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("clients", sa.Column("password_hash", sa.String(500), nullable=True))
    op.add_column("clients", sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("clients", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("clients", "last_login_at")
    op.drop_column("clients", "email_verified_at")
    op.drop_column("clients", "password_hash")
