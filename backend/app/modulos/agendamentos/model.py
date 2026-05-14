import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("idx_appointments_salon_id", "salon_id"),
        Index("idx_appointments_date", "salon_id", "scheduled_date"),
        Index("idx_appointments_professional", "professional_id", "scheduled_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("salons.id"))
    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"))
    professional_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("professionals.id"))
    service_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("services.id"))

    scheduled_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)

    status: Mapped[str] = mapped_column(String(20), default="scheduled")
    # scheduled | confirmed | in_progress | completed | cancelled | no_show

    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    discount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0"))
    final_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    payment_status: Mapped[str] = mapped_column(String(20), default="pending")
    payment_method: Mapped[str | None] = mapped_column(String(20))

    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancellation_reason: Mapped[str | None] = mapped_column(Text)

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="appointments")
    client: Mapped["Client"] = relationship("Client", back_populates="appointments")
    professional: Mapped["Professional"] = relationship(
        "Professional", back_populates="appointments"
    )
    service: Mapped["Service"] = relationship("Service", back_populates="appointments")
    created_by: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_id])
    reminders: Mapped[list["AppointmentReminder"]] = relationship(
        "AppointmentReminder", back_populates="appointment", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["FinancialTransaction"]] = relationship(
        "FinancialTransaction", back_populates="appointment"
    )


class AppointmentReminder(Base):
    __tablename__ = "appointment_reminders"
    __table_args__ = (
        Index("idx_reminders_scheduled", "scheduled_for", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    appointment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(String(20))
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    error_message: Mapped[str | None] = mapped_column(Text)

    # Relacionamentos
    appointment: Mapped["Appointment"] = relationship(
        "Appointment", back_populates="reminders"
    )
