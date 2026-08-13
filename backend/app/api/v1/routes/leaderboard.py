from datetime import date, datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.streak import Streak
from app.schemas.leaderboard import LeaderboardEntry
from app.schemas.user import UserRead

router = APIRouter(prefix="/groups", tags=["Leaderboard"])


@router.get("/{group_id}/leaderboard", response_model=List[LeaderboardEntry])
async def get_group_leaderboard(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Get active members
    members_res = await db.execute(
        select(GroupMember)
        .options(selectinload(GroupMember.user))
        .where(GroupMember.group_id == group_id, GroupMember.status == "active")
    )
    members = members_res.scalars().all()
    
    today = date.today()
    entries = []

    checkins_res = await db.execute(
        select(
            Checkin.user_id,
            func.count(Checkin.id).label("days_present"),
            func.coalesce(func.sum(Checkin.pages_read), 0).label("total_pages"),
        )
        .where(Checkin.group_id == group_id)
        .group_by(Checkin.user_id)
    )
    checkins_by_user = {
        row.user_id: (row.days_present, int(row.total_pages))
        for row in checkins_res.all()
    }

    streaks_res = await db.execute(
        select(Streak).where(Streak.group_id == group_id)
    )
    streaks_by_user = {
        streak.user_id: streak
        for streak in streaks_res.scalars().all()
    }
    
    for member in members:
        days_total = max(1, (today - member.joined_at.date()).days + 1)
        days_present, total_pages = checkins_by_user.get(member.user_id, (0, 0))
        
        commitment_rate = round((days_present / days_total) * 100, 1)
        
        streak_obj = streaks_by_user.get(member.user_id)
        c_streak = streak_obj.current_streak if streak_obj else 0
        l_streak = streak_obj.longest_streak if streak_obj else 0
        
        entries.append({
            "user": UserRead.model_validate(member.user),
            "commitment_rate": commitment_rate,
            "days_present": days_present,
            "days_total": days_total,
            "total_pages_read": total_pages,
            "current_streak": c_streak,
            "longest_streak": l_streak
        })
    
    # Sort by commitment_rate DESC, then total_pages_read DESC
    entries.sort(key=lambda x: (x["commitment_rate"], x["total_pages_read"]), reverse=True)
    
    result = []
    for rank, item in enumerate(entries, start=1):
        result.append(
            LeaderboardEntry(
                rank=rank,
                user=item["user"],
                commitment_rate=item["commitment_rate"],
                days_present=item["days_present"],
                days_total=item["days_total"],
                total_pages_read=item["total_pages_read"],
                current_streak=item["current_streak"],
                longest_streak=item["longest_streak"]
            )
        )
    
    return result
