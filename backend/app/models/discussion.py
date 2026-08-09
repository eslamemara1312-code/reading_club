import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import Group
    from app.models.book import GroupBook


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    group_book_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("group_books.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    discussion_date: Mapped[date] = mapped_column(Date, default=date.today)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    group: Mapped["Group"] = relationship("Group")
    user: Mapped["User"] = relationship("User")
    group_book: Mapped[Optional["GroupBook"]] = relationship("GroupBook")
    replies: Mapped[List["DiscussionReply"]] = relationship("DiscussionReply", back_populates="discussion")


class DiscussionReply(Base):
    __tablename__ = "discussion_replies"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    discussion_id: Mapped[str] = mapped_column(String(36), ForeignKey("discussions.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    discussion: Mapped["Discussion"] = relationship("Discussion", back_populates="replies")
    user: Mapped["User"] = relationship("User")
