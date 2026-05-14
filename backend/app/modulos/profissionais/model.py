import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class Professional(Base):
    __tablename__ = "professionals"
    __table_args__ = (Index("idx_professionals_salon_id", "salon_id"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str] = mapped_column(String(20))
    specialty: Mapped[str] = mapped_column(String(200))
    commission_percentage: Mapped[float] = mapped_column(Float, default=40.0)
    color: Mapped[str] = mapped_column(String(7), default="#ec4899")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    working_hours: Mapped[dict] = mapped_column(JSON, default=lambda: {})
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="professionals")
    user: Mapped["User | None"] = relationship(
        "User", back_populates="professional", foreign_keys=[user_id]
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        "Appointment", back_populates="professional"
    )
    transactions: Mapped[list["FinancialTransaction"]] = relationship(
        "FinancialTransaction", back_populates="professional"
    )
