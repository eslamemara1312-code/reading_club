"""Stats & Hall-of-Fame & Monthly Summary API routes."""
import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, and_, extract
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models import (
    User, Group, GroupMember, Checkin, Streak, Fine,
    MonthlySummary, Book, GroupBook,
)


router = APIRouter(tags=["stats"])


# --- Pydantic schemas ---

class GroupStats(BaseModel):
    group_id: str
    month: str
    total_pages_read: int
    total_checkins: int
    total_members: int
    monthly_page_goal: int | None
    goal_progress_percent: float | None


class HallOfFameEntry(BaseModel):
    title: str
    user_id: str
    user_name: str
    value: str


class MonthlySummaryRead(BaseModel):
    id: str
    user_id: str
    group_id: str
    month: str
    stats: dict
    generated_at: str

    class Config:
        from_attributes = True


# --- GET /groups/{id}/stats ---

@router.get("/groups/{group_id}/stats", response_model=GroupStats)
async def get_group_stats(
    group_id: str,
    month: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Group's collective goal progress for the current or specified month."""
    # Verify membership
    member = await db.execute(
        select(GroupMember).where(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        )
    )
    if not member.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="أنت لست عضواً في هذه المجموعة")

    # Parse month or use current
    if month:
        try:
            target_year, target_month = int(month[:4]), int(month[5:7])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="صيغة الشهر غير صحيحة (YYYY-MM)")
    else:
        today = date.today()
        target_year, target_month = today.year, today.month

    # Group info
    group_res = await db.execute(select(Group).where(Group.id == group_id))
    group = group_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

    # Total members
    members_res = await db.execute(
        select(func.count()).select_from(GroupMember).where(GroupMember.group_id == group_id)
    )
    total_members = members_res.scalar() or 0

    # Total pages this month
    pages_res = await db.execute(
        select(func.coalesce(func.sum(Checkin.pages_read), 0))
        .where(
            and_(
                Checkin.group_id == group_id,
                extract("year", Checkin.checkin_date) == target_year,
                extract("month", Checkin.checkin_date) == target_month,
            )
        )
    )
    total_pages = pages_res.scalar() or 0

    # Total checkins this month
    checkins_res = await db.execute(
        select(func.count())
        .select_from(Checkin)
        .where(
            and_(
                Checkin.group_id == group_id,
                extract("year", Checkin.checkin_date) == target_year,
                extract("month", Checkin.checkin_date) == target_month,
            )
        )
    )
    total_checkins = checkins_res.scalar() or 0

    goal = getattr(group, "monthly_page_goal", None)
    goal_progress = round((total_pages / goal) * 100, 1) if goal and goal > 0 else None

    return GroupStats(
        group_id=group_id,
        month=f"{target_year}-{target_month:02d}",
        total_pages_read=total_pages,
        total_checkins=total_checkins,
        total_members=total_members,
        monthly_page_goal=goal,
        goal_progress_percent=goal_progress,
    )


# --- GET /groups/{id}/hall-of-fame ---

@router.get("/groups/{group_id}/hall-of-fame", response_model=list[HallOfFameEntry])
async def get_hall_of_fame(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Hall of fame: most committed, longest streak, most pages."""
    # Verify membership
    member = await db.execute(
        select(GroupMember).where(
            and_(GroupMember.group_id == group_id, GroupMember.user_id == current_user.id)
        )
    )
    if not member.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="أنت لست عضواً في هذه المجموعة")

    hall = []

    # 1. Longest streak ever
    streak_res = await db.execute(
        select(Streak, User)
        .join(User, User.id == Streak.user_id)
        .where(Streak.group_id == group_id)
        .order_by(Streak.longest_streak.desc())
        .limit(1)
    )
    top_streak = streak_res.first()
    if top_streak:
        streak_obj, user_obj = top_streak
        hall.append(HallOfFameEntry(
            title="🔥 أطول سلسلة التزام",
            user_id=user_obj.id,
            user_name=user_obj.name,
            value=f"{streak_obj.longest_streak} يوم متواصل",
        ))

    # 2. Most pages read (all time)
    pages_res = await db.execute(
        select(User.id, User.name, func.coalesce(func.sum(Checkin.pages_read), 0).label("total"))
        .join(Checkin, and_(Checkin.user_id == User.id, Checkin.group_id == group_id))
        .group_by(User.id, User.name)
        .order_by(func.sum(Checkin.pages_read).desc())
        .limit(1)
    )
    top_pages = pages_res.first()
    if top_pages:
        hall.append(HallOfFameEntry(
            title="📚 أكثر صفحات مقروءة",
            user_id=top_pages[0],
            user_name=top_pages[1],
            value=f"{top_pages[2]} صفحة",
        ))

    # 3. Most checkins (all time)
    checkins_res = await db.execute(
        select(User.id, User.name, func.count().label("total"))
        .join(Checkin, and_(Checkin.user_id == User.id, Checkin.group_id == group_id))
        .group_by(User.id, User.name)
        .order_by(func.count().desc())
        .limit(1)
    )
    top_checkins = checkins_res.first()
    if top_checkins:
        hall.append(HallOfFameEntry(
            title="💎 أكثر أيام التزام",
            user_id=top_checkins[0],
            user_name=top_checkins[1],
            value=f"{top_checkins[2]} يوم",
        ))

    return hall


# --- GET /users/me/summary ---

@router.get("/users/me/summary", response_model=MonthlySummaryRead | None)
async def get_my_monthly_summary(
    month: str | None = None,
    group_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's monthly Wrapped summary."""
    if month:
        try:
            target_year, target_month = int(month[:4]), int(month[5:7])
            target_date = date(target_year, target_month, 1)
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="صيغة الشهر غير صحيحة (YYYY-MM)")
    else:
        today = date.today()
        target_date = date(today.year, today.month, 1)

    query = select(MonthlySummary).where(
        and_(
            MonthlySummary.user_id == current_user.id,
            MonthlySummary.month == target_date,
        )
    )
    if group_id:
        query = query.where(MonthlySummary.group_id == group_id)

    result = await db.execute(query.order_by(MonthlySummary.generated_at.desc()).limit(1))
    summary = result.scalar_one_or_none()

    if not summary:
        return None

    return MonthlySummaryRead(
        id=summary.id,
        user_id=summary.user_id,
        group_id=summary.group_id,
        month=str(summary.month),
        stats=json.loads(summary.stats_json) if summary.stats_json else {},
        generated_at=str(summary.generated_at),
    )
