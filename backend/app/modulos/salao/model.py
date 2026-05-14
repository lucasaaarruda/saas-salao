import uuid
from datetime import datetime, time, timezone

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class Salon(Base):
    __tablename__ = "salons"
    __table_args__ = (UniqueConstraint("slug", name="uq_salons_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(500))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(2))
    logo_url: Mapped[str | None] = mapped_column(String(500))
    plan: Mapped[str] = mapped_column(String(20), default="free")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Configurações de funcionamento
    opening_time: Mapped[time] = mapped_column(Time, default=time(8, 0))
    closing_time: Mapped[time] = mapped_column(Time, default=time(19, 0))
    working_days: Mapped[list] = mapped_column(JSON, default=lambda: [1, 2, 3, 4, 5])
    slot_duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    allow_online_booking: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relacionamentos
    users: Mapped[list["User"]] = relationship(
        "User", back_populates="salon", cascade="all, delete-orphan"
    )
    professionals: Mapped[list["Professional"]] = relationship(
        "Professional", back_populates="salon", cascade="all, delete-orphan"
    )
    services: Mapped[list["Service"]] = relationship(
        "Service", back_populates="salon", cascade="all, delete-orphan"
    )
    clients: Mapped[list["Client"]] = relationship(
        "Client", back_populates="salon", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="salon", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["FinancialTransaction"]] = relationship(
        "FinancialTransaction", back_populates="salon", cascade="all, delete-orphan"
    )
