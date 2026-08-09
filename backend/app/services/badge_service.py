from typing import List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.checkin import Checkin
from app.models.streak import Streak
from app.models.badge import Badge, UserBadge


async def ensure_default_badges_exist(db: AsyncSession):
    """Ensure default badges exist in DB (especially for in-memory test databases)."""
    default_badges = [
        {"slug": "first_step", "name": "الخطوة الأولى", "description": "سجّلت أول قراءة لك في ورد", "icon": "🌱", "category": "milestone", "xp_award": 50},
        {"slug": "streak_7", "name": "أسطورة الأسبوع", "description": "حافظت على streak لمدة 7 أيام متتالية دون انقطاع", "icon": "🔥", "category": "streak", "xp_award": 150},
        {"slug": "streak_30", "name": "سيد الالتزام", "description": "حافظت على streak لمدة 30 يوماً متتالياً", "icon": "👑", "category": "streak", "xp_award": 500},
        {"slug": "century_reader", "name": "القارئ المئوي", "description": "قرأت أكثر من 100 صفحة إجمالاً", "icon": "📚", "category": "volume", "xp_award": 200},
        {"slug": "early_bird", "name": "الطائر المبكر", "description": "سجلت قراءتك قبل الساعة 12 ظهراً", "icon": "🌅", "category": "special", "xp_award": 100},
    ]

    for b in default_badges:
        res = await db.execute(select(Badge).where(Badge.slug == b["slug"]))
        if not res.scalar_one_or_none():
            db.add(Badge(**b))
    await db.flush()


async def evaluate_and_award_badges(
    db: AsyncSession, user_id: str, group_id: str, latest_checkin: Checkin
) -> List[Badge]:
    """Evaluates criteria and awards new badges to the user."""
    await ensure_default_badges_exist(db)

    # Get user's already earned badge IDs
    ub_res = await db.execute(select(UserBadge.badge_id).where(UserBadge.user_id == user_id))
    earned_badge_ids = set(ub_res.scalars().all())

    # Fetch all badges
    all_badges_res = await db.execute(select(Badge))
    badges_map = {b.slug: b for b in all_badges_res.scalars().all()}

    # Gather user stats
    checkin_count_res = await db.execute(select(func.count(Checkin.id)).where(Checkin.user_id == user_id))
    total_checkins = checkin_count_res.scalar_one()

    pages_res = await db.execute(select(func.coalesce(func.sum(Checkin.pages_read), 0)).where(Checkin.user_id == user_id))
    total_pages = int(pages_res.scalar_one())

    streak_res = await db.execute(select(Streak).where(Streak.user_id == user_id, Streak.group_id == group_id))
    streak_obj = streak_res.scalar_one_or_none()
    c_streak = streak_obj.current_streak if streak_obj else 0
    l_streak = streak_obj.longest_streak if streak_obj else 0
    max_streak = max(c_streak, l_streak)

    newly_earned: List[Badge] = []

    def try_award(slug: str, condition: bool):
        badge = badges_map.get(slug)
        if badge and badge.id not in earned_badge_ids and condition:
            user_badge = UserBadge(user_id=user_id, badge_id=badge.id)
            db.add(user_badge)
            newly_earned.append(badge)

    # Check criteria
    try_award("first_step", total_checkins >= 1)
    try_award("streak_7", max_streak >= 7)
    try_award("streak_30", max_streak >= 30)
    try_award("century_reader", total_pages >= 100)
    
    if latest_checkin and latest_checkin.checked_in_at:
        try_award("early_bird", latest_checkin.checked_in_at.hour < 12)

    if newly_earned:
        user_res = await db.execute(select(User).where(User.id == user_id))
        user = user_res.scalar_one_or_none()
        if user:
            total_new_xp = sum(b.xp_award for b in newly_earned)
            user.xp_points += total_new_xp
            user.level = (user.xp_points // 200) + 1

    return newly_earned
