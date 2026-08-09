"""Monthly Summary Job — generates Wrapped summaries + resets freezes + opens new vault."""
import json
import logging
from datetime import date, datetime, timezone

from sqlalchemy import select, func, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models import (
    Group, GroupMember, Checkin, Streak, Fine,
    MonthlySummary, FineVault, Book, GroupBook,
)

logger = logging.getLogger(__name__)


async def generate_monthly_summaries(db: AsyncSession = None):
    """Run on the 1st of each month: generate per-member summaries for last month,
    reset freezes_remaining, open a new fine_vault row."""

    if db is not None:
        await _run(db)
    else:
        async with AsyncSessionLocal() as db:
            try:
                await _run(db)
            except Exception:
                logger.exception("monthly_summary job failed")


async def _run(db: AsyncSession):
    today = date.today()
    # Last month
    if today.month == 1:
        prev_month, prev_year = 12, today.year - 1
    else:
        prev_month, prev_year = today.month - 1, today.year

    last_month_start = date(prev_year, prev_month, 1)
    # Days in last month
    if prev_month == 12:
        last_month_end = date(prev_year + 1, 1, 1)
    else:
        last_month_end = date(prev_year, prev_month + 1, 1)

    groups_res = await db.execute(select(Group))
    groups = groups_res.scalars().all()

    for group in groups:
        # Get active members
        members_res = await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == group.id,
                GroupMember.status == "active",
            )
        )
        members = members_res.scalars().all()

        for member in members:
            user_id = member.user_id

            # Total checkins last month
            checkins_res = await db.execute(
                select(func.count()).select_from(Checkin).where(
                    and_(
                        Checkin.user_id == user_id,
                        Checkin.group_id == group.id,
                        Checkin.checkin_date >= last_month_start,
                        Checkin.checkin_date < last_month_end,
                    )
                )
            )
            total_checkins = checkins_res.scalar() or 0

            # Total pages
            pages_res = await db.execute(
                select(func.coalesce(func.sum(Checkin.pages_read), 0)).where(
                    and_(
                        Checkin.user_id == user_id,
                        Checkin.group_id == group.id,
                        Checkin.checkin_date >= last_month_start,
                        Checkin.checkin_date < last_month_end,
                    )
                )
            )
            total_pages = pages_res.scalar() or 0

            # Days in month
            days_in_month = (last_month_end - last_month_start).days
            commitment_rate = round((total_checkins / days_in_month) * 100, 1) if days_in_month > 0 else 0

            # Total fines last month
            fines_res = await db.execute(
                select(func.coalesce(func.sum(Fine.amount), 0)).where(
                    and_(
                        Fine.user_id == user_id,
                        Fine.group_id == group.id,
                        Fine.fine_date >= last_month_start,
                        Fine.fine_date < last_month_end,
                    )
                )
            )
            total_fines = float(fines_res.scalar() or 0)

            # Streak info
            streak_res = await db.execute(
                select(Streak).where(
                    Streak.user_id == user_id,
                    Streak.group_id == group.id,
                )
            )
            streak = streak_res.scalar_one_or_none()
            longest_streak = streak.longest_streak if streak else 0

            stats = {
                "commitment_rate": commitment_rate,
                "total_checkins": total_checkins,
                "total_pages": total_pages,
                "days_in_month": days_in_month,
                "longest_streak": longest_streak,
                "total_fines": total_fines,
            }

            existing_summary = await db.execute(
                select(MonthlySummary).where(
                    and_(
                        MonthlySummary.user_id == user_id,
                        MonthlySummary.group_id == group.id,
                        MonthlySummary.month == last_month_start,
                    )
                )
            )
            if not existing_summary.scalar_one_or_none():
                summary = MonthlySummary(
                    user_id=user_id,
                    group_id=group.id,
                    month=last_month_start,
                    stats_json=json.dumps(stats),
                )
                db.add(summary)

            # Reset freezes_remaining
            if streak:
                streak.freezes_remaining = 2


        # Open a new fine_vault for this month
        this_month_start = date(today.year, today.month, 1)
        existing_vault = await db.execute(
            select(FineVault).where(
                FineVault.group_id == group.id,
                FineVault.month == this_month_start,
            )
        )
        if not existing_vault.scalar_one_or_none():
            new_vault = FineVault(
                group_id=group.id,
                month=this_month_start,
                total_amount=0,
                status="open",
            )
            db.add(new_vault)

    await db.commit()
    logger.info("monthly_summary job completed for %d groups", len(groups))
