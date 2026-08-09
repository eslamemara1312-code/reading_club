import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import Group


class WeeklyTitle(Base):
    __tablename__ = "weekly_titles"
    __table_args__ = (
        Index("idx_titles_group_week", "group_id", "week_start_date"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    title_type: Mapped[str] = mapped_column(String(50), nullable=False)  # commitment_hero, pages_king, early_bird
    title_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    group: Mapped["Group"] = relationship("Group")
    user: Mapped["User"] = relationship("User")
