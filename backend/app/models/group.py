import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group_member import GroupMember
    from app.models.checkin import Checkin
    from app.models.streak import Streak


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    invite_code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    checkin_deadline_time: Mapped[str] = mapped_column(String(5), default="00:00")
    grace_period_hours: Mapped[int] = mapped_column(Integer, default=3)
    fine_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=20.00)
    currency: Mapped[str] = mapped_column(String(10), default="EGP")
    fun_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    monthly_page_goal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_groups")
    members: Mapped[List["GroupMember"]] = relationship("GroupMember", back_populates="group")
    checkins: Mapped[List["Checkin"]] = relationship("Checkin", back_populates="group")
    streaks: Mapped[List["Streak"]] = relationship("Streak", back_populates="group")
