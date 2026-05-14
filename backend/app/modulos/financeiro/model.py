import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"
    __table_args__ = (
        Index("idx_transactions_salon_id", "salon_id"),
        Index("idx_transactions_date", "salon_id", "transaction_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    appointment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("appointments.id"))
    professional_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("professionals.id")
    )

    type: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    payment_method: Mapped[str] = mapped_column(String(20))

    transaction_date: Mapped[date] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="transactions")
    appointment: Mapped["Appointment | None"] = relationship(
        "Appointment", back_populates="transactions"
    )
    professional: Mapped["Professional | None"] = relationship(
        "Professional", back_populates="transactions"
    )
    created_by: Mapped["User"] = relationship("User", foreign_keys=[created_by_id])
