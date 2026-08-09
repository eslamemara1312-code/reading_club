"""Nudge model — the 'rescuer' feature."""
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, ForeignKey, Date, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Nudge(Base):
    __tablename__ = "nudges"
    __table_args__ = (
        UniqueConstraint("from_user_id", "to_user_id", "nudge_date", name="uq_nudge_per_day"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    from_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    to_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    nudge_date: Mapped[date] = mapped_column(Date, nullable=False)
    resulted_in_checkin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    from_user = relationship("User", foreign_keys=[from_user_id], lazy="joined")
    to_user = relationship("User", foreign_keys=[to_user_id], lazy="joined")
