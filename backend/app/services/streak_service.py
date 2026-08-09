from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.streak import Streak


async def bump_streak_on_checkin(
    db: AsyncSession, user_id: str, group_id: str, checkin_date: date
) -> Streak:
    """Updates current_streak and longest_streak immediately on a successful check-in."""
    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id, Streak.group_id == group_id)
    )
    streak = result.scalar_one_or_none()

    if not streak:
        streak = Streak(
            user_id=user_id,
            group_id=group_id,
            current_streak=1,
            longest_streak=1,
            last_checkin_date=checkin_date,
            freezes_remaining=2,
            freezes_used_total=0
        )
        db.add(streak)
        return streak

    if streak.last_checkin_date == checkin_date:
        # Already checked in today (re-saving note/pages)
        return streak

    yesterday = checkin_date - timedelta(days=1)
    if streak.last_checkin_date == yesterday:
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_checkin_date = checkin_date

    return streak
