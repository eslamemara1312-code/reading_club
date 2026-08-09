import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import Group


class Streak(Base):
    __tablename__ = "streaks"
    __table_args__ = (
        UniqueConstraint("user_id", "group_id", name="uq_user_group_streak"),
        Index("idx_streaks_group_current", "group_id", "current_streak"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_checkin_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    freezes_remaining: Mapped[int] = mapped_column(Integer, default=2)
    freezes_used_total: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="streaks")
    group: Mapped["Group"] = relationship("Group", back_populates="streaks")
