import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.group import Group
    from app.models.group_member import GroupMember
    from app.models.checkin import Checkin
    from app.models.streak import Streak


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    xp_points: Mapped[int] = mapped_column(Integer, default=0)
    current_frame: Mapped[str] = mapped_column(String(50), default="none")
    whatsapp_enabled: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    owned_groups: Mapped[List["Group"]] = relationship("Group", back_populates="owner")
    group_memberships: Mapped[List["GroupMember"]] = relationship("GroupMember", back_populates="user")
    checkins: Mapped[List["Checkin"]] = relationship("Checkin", back_populates="user")
    streaks: Mapped[List["Streak"]] = relationship("Streak", back_populates="user")
