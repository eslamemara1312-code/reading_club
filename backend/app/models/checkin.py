import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, Date, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import Group


class Checkin(Base):
    __tablename__ = "checkins"
    __table_args__ = (
        UniqueConstraint("user_id", "group_id", "checkin_date", name="uq_user_group_checkin_date"),
        Index("idx_checkins_user_group_date", "user_id", "group_id", "checkin_date"),
        Index("idx_checkins_group_date", "group_id", "checkin_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    checkin_date: Mapped[date] = mapped_column(Date, nullable=False)
    pages_read: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(String(280), nullable=True)
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    is_late: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="checkins")
    group: Mapped["Group"] = relationship("Group", back_populates="checkins")
