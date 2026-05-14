import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class Client(Base):
    __tablename__ = "clients"
    __table_args__ = (Index("idx_clients_salon_id", "salon_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(200))
    birth_date: Mapped[date | None] = mapped_column(Date)
    cpf: Mapped[str | None] = mapped_column(String(11))
    notes: Mapped[str | None] = mapped_column(Text)
    how_met: Mapped[str | None] = mapped_column(String(200))
    total_spent: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    visit_count: Mapped[int] = mapped_column(Integer, default=0)
    last_visit_date: Mapped[date | None] = mapped_column(Date)
    password_hash: Mapped[str | None] = mapped_column(String(500))
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="clients")
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="client"
    )
