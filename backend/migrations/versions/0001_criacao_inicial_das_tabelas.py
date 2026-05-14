"""criacao_inicial_das_tabelas

Revision ID: 0001
Revises:
Create Date: 2025-05-12
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # salons
    # -------------------------------------------------------------------------
    op.create_table(
        "salons",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(2), nullable=False),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("opening_time", sa.Time(), nullable=False, server_default="08:00:00"),
        sa.Column("closing_time", sa.Time(), nullable=False, server_default="19:00:00"),
        sa.Column("working_days", sa.JSON(), nullable=False, server_default="[1,2,3,4,5]"),
        sa.Column("slot_duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column(
            "allow_online_booking", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_salons_slug"),
    )

    # -------------------------------------------------------------------------
    # users
    # -------------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("password_hash", sa.String(500), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("salon_id", "email", name="uq_users_salon_email"),
    )
    op.create_index("idx_users_salon_id", "users", ["salon_id"])

    # -------------------------------------------------------------------------
    # professionals
    # -------------------------------------------------------------------------
    op.create_table(
        "professionals",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("specialty", sa.String(200), nullable=False),
        sa.Column("commission_percentage", sa.Float(), nullable=False, server_default="40.0"),
        sa.Column("color", sa.String(7), nullable=False, server_default="#ec4899"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("working_hours", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_professionals_salon_id", "professionals", ["salon_id"])

    # -------------------------------------------------------------------------
    # services
    # -------------------------------------------------------------------------
    op.create_table(
        "services",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_type", sa.String(20), nullable=False),
        sa.Column("commission_value", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("color", sa.String(7), nullable=False, server_default="#ec4899"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_services_salon_id", "services", ["salon_id"])

    # -------------------------------------------------------------------------
    # clients
    # -------------------------------------------------------------------------
    op.create_table(
        "clients",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("email", sa.String(200), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("cpf", sa.String(11), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("how_met", sa.String(200), nullable=True),
        sa.Column("total_spent", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("visit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_visit_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_clients_salon_id", "clients", ["salon_id"])

    # -------------------------------------------------------------------------
    # appointments
    # -------------------------------------------------------------------------
    op.create_table(
        "appointments",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("client_id", sa.UUID(), nullable=False),
        sa.Column("professional_id", sa.UUID(), nullable=False),
        sa.Column("service_id", sa.UUID(), nullable=False),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("final_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("payment_method", sa.String(20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"]),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_appointments_salon_id", "appointments", ["salon_id"])
    op.create_index(
        "idx_appointments_date", "appointments", ["salon_id", "scheduled_date"]
    )
    op.create_index(
        "idx_appointments_professional",
        "appointments",
        ["professional_id", "scheduled_date"],
    )

    # -------------------------------------------------------------------------
    # financial_transactions
    # -------------------------------------------------------------------------
    op.create_table(
        "financial_transactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("salon_id", sa.UUID(), nullable=False),
        sa.Column("appointment_id", sa.UUID(), nullable=True),
        sa.Column("professional_id", sa.UUID(), nullable=True),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_method", sa.String(20), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"]),
        sa.ForeignKeyConstraint(["salon_id"], ["salons.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_transactions_salon_id", "financial_transactions", ["salon_id"])
    op.create_index(
        "idx_transactions_date",
        "financial_transactions",
        ["salon_id", "transaction_date"],
    )

    # -------------------------------------------------------------------------
    # appointment_reminders
    # -------------------------------------------------------------------------
    op.create_table(
        "appointment_reminders",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("appointment_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(20), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["appointment_id"], ["appointments.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_reminders_scheduled",
        "appointment_reminders",
        ["scheduled_for", "status"],
    )


def downgrade() -> None:
    op.drop_table("appointment_reminders")
    op.drop_table("financial_transactions")
    op.drop_table("appointments")
    op.drop_table("clients")
    op.drop_table("services")
    op.drop_table("professionals")
    op.drop_table("users")
    op.drop_table("salons")
