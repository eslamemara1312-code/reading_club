import logging
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import AsyncSessionLocal
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.weekly_title import WeeklyTitle

logger = logging.getLogger("reading_club.weekly_titles")


async def run_weekly_titles_for_group(db: AsyncSession, group: Group, week_start: date):
    """Calculates and awards weekly titles for a group for week_start date."""
    week_end = week_start + timedelta(days=6)

    # 1. Commitment Hero (most checkins in past 7 days)
    hero_res = await db.execute(
        select(Checkin.user_id, func.count(Checkin.id).label("cnt"))
        .where(
            Checkin.group_id == group.id,
            Checkin.checkin_date >= week_start,
            Checkin.checkin_date <= week_end
        )
        .group_by(Checkin.user_id)
        .order_by(func.count(Checkin.id).desc())
        .limit(1)
    )
    hero_row = hero_res.first()
    if hero_row:
        hero_title = WeeklyTitle(
            group_id=group.id,
            user_id=hero_row.user_id,
            week_start_date=week_start,
            title_type="commitment_hero",
            title_name="أسطورة الالتزام 🛡️"
        )
        db.add(hero_title)

    # 2. Pages King (most total pages read in past 7 days)
    king_res = await db.execute(
        select(Checkin.user_id, func.sum(Checkin.pages_read).label("total_pages"))
        .where(
            Checkin.group_id == group.id,
            Checkin.checkin_date >= week_start,
            Checkin.checkin_date <= week_end,
            Checkin.pages_read.is_not(None)
        )
        .group_by(Checkin.user_id)
        .order_by(func.sum(Checkin.pages_read).desc())
        .limit(1)
    )
    king_row = king_res.first()
    if king_row and king_row.total_pages and king_row.total_pages > 0:
        king_title = WeeklyTitle(
            group_id=group.id,
            user_id=king_row.user_id,
            week_start_date=week_start,
            title_type="pages_king",
            title_name="ملك الصفحات 👑"
        )
        db.add(king_title)


async def calculate_weekly_titles():
    """Weekly background job running every Monday morning."""
    async with AsyncSessionLocal() as db:
        try:
            today = date.today()
            # Calculate Monday of current week
            week_start = today - timedelta(days=today.weekday())

            groups_res = await db.execute(select(Group))
            groups = groups_res.scalars().all()

            for group in groups:
                await run_weekly_titles_for_group(db, group, week_start)

            await db.commit()
            logger.info("Weekly titles calculated successfully for all active groups")
        except Exception as e:
            logger.error(f"Error calculating weekly titles: {e}", exc_info=True)
