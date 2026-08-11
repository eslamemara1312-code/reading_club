import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.group import Group
    from app.models.book import Book
    from app.models.book_asset import BookAsset


class ReadingProgress(Base):
    __tablename__ = "reading_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "book_asset_id", name="uq_reading_progress_user_asset"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    book_id: Mapped[str] = mapped_column(String(36), ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    book_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("book_assets.id", ondelete="CASCADE"), nullable=False)
    current_page: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_pages: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    progress_percent: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    last_read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    group: Mapped["Group"] = relationship("Group")
    book: Mapped["Book"] = relationship("Book")
    book_asset: Mapped["BookAsset"] = relationship("BookAsset", back_populates="progress_records")
