"""Monthly Summary model — cached 'Wrapped' summary per member per month."""
import uuid
from datetime import date, datetime, timezone
from sqlalchemy import String, ForeignKey, Date, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class MonthlySummary(Base):
    __tablename__ = "monthly_summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    month: Mapped[date] = mapped_column(Date, nullable=False)
    # JSON-encoded stats: commitment_rate, total_pages, books_finished, longest_streak, fines_total
    stats_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
