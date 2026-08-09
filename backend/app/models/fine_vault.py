import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Numeric, Date, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.group import Group


class FineVault(Base):
    __tablename__ = "fine_vault"
    __table_args__ = (
        UniqueConstraint("group_id", "month", name="uq_group_month_vault"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("groups.id"), nullable=False)
    month: Mapped[date] = mapped_column(Date, nullable=False)  # first day of month (e.g. 2026-08-01)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open, settled
    settlement_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    group: Mapped["Group"] = relationship("Group")
