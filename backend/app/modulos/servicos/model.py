import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class Service(Base):
    __tablename__ = "services"
    __table_args__ = (Index("idx_services_salon_id", "salon_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(100))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    commission_type: Mapped[str] = mapped_column(String(20))
    commission_value: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    color: Mapped[str] = mapped_column(String(7), default="#ec4899")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="services")
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="service"
    )
