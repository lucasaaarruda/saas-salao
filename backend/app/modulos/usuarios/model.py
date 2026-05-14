import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.banco import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("salon_id", "email", name="uq_users_salon_email"),
        Index("idx_users_salon_id", "salon_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    salon_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("salons.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200))
    password_hash: Mapped[str] = mapped_column(String(500))
    role: Mapped[str] = mapped_column(String(50))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relacionamentos
    salon: Mapped["Salon"] = relationship("Salon", back_populates="users")
    professional: Mapped["Professional | None"] = relationship(
        "Professional",
        back_populates="user",
        uselist=False,
        foreign_keys="[Professional.user_id]",
    )
