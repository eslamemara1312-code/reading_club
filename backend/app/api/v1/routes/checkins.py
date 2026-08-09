from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.streak import Streak
from app.schemas.checkin import CheckinCreate, CheckinRead, MemberTodayStatus
from app.schemas.user import UserRead
from app.services.streak_service import bump_streak_on_checkin

from app.services.badge_service import evaluate_and_award_badges

router = APIRouter(prefix="/checkins", tags=["Checkins"])


@router.post("", response_model=CheckinRead, status_code=status.HTTP_201_CREATED)
async def log_checkin(
    checkin_in: CheckinCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check group membership
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == checkin_in.group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be an active member of the group to check in"
        )
    
    today = date.today()
    
    # Check duplicate
    existing_res = await db.execute(
        select(Checkin).where(
            Checkin.user_id == current_user.id,
            Checkin.group_id == checkin_in.group_id,
            Checkin.checkin_date == today
        )
    )
    if existing_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already checked in today for this group"
        )
    
    checkin = Checkin(
        user_id=current_user.id,
        group_id=checkin_in.group_id,
        checkin_date=today,
        pages_read=checkin_in.pages_read,
        note=checkin_in.note,
        is_late=False
    )
    db.add(checkin)
    
    # Update streak & evaluate badges
    await bump_streak_on_checkin(db, current_user.id, checkin_in.group_id, today)
    await evaluate_and_award_badges(db, current_user.id, checkin_in.group_id, checkin)

    # Auto-update nudges: if someone nudged this user today, mark resulted_in_checkin = True
    from app.models.nudge import Nudge
    nudges_res = await db.execute(
        select(Nudge).where(
            Nudge.to_user_id == current_user.id,
            Nudge.nudge_date == today,
            Nudge.group_id == checkin_in.group_id,
            Nudge.resulted_in_checkin == False,
        )
    )
    for nudge in nudges_res.scalars().all():
        nudge.resulted_in_checkin = True

    # Check if all active members checked in today for a full-day celebration
    from app.models.notification import Notification
    from sqlalchemy import func
    members_cnt_res = await db.execute(
        select(func.count()).select_from(GroupMember).where(
            GroupMember.group_id == checkin_in.group_id,
            GroupMember.status == "active"
        )
    )
    total_members = members_cnt_res.scalar() or 0

    checkins_cnt_res = await db.execute(
        select(func.count()).select_from(Checkin).where(
            Checkin.group_id == checkin_in.group_id,
            Checkin.checkin_date == today
        )
    )
    total_checkins = (checkins_cnt_res.scalar() or 0) + 1  # Including current checkin

    if total_members > 0 and total_checkins >= total_members:
        # All members checked in today! Send notification to all group members
        all_members_res = await db.execute(
            select(GroupMember).where(
                GroupMember.group_id == checkin_in.group_id,
                GroupMember.status == "active"
            )
        )
        for gm in all_members_res.scalars().all():
            notif = Notification(
                user_id=gm.user_id,
                type="badge_unlocked",
                title="🎉 يوم متكامل بدون غيابات!",
                message="رائع! اكتمل حضور جميع أعضاء المجموعة اليوم بدون أي غياب 🚀"
            )
            db.add(notif)

    await db.commit()
    await db.refresh(checkin)
    
    return CheckinRead.model_validate(checkin)


@router.get("/today", response_model=List[MemberTodayStatus])
async def get_today_status(
    group_id: str = Query(...),
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
    
    today = date.today()
    
    # Get all active members
    members_res = await db.execute(
        select(GroupMember)
        .options(selectinload(GroupMember.user))
        .where(GroupMember.group_id == group_id, GroupMember.status == "active")
    )
    members = members_res.scalars().all()
    
    # Get today's checkins for group
    checkins_res = await db.execute(
        select(Checkin).where(Checkin.group_id == group_id, Checkin.checkin_date == today)
    )
    checkins_dict = {c.user_id: c for c in checkins_res.scalars().all()}
    
    # Get streaks for group
    streaks_res = await db.execute(
        select(Streak).where(Streak.group_id == group_id)
    )
    streaks_dict = {s.user_id: s.current_streak for s in streaks_res.scalars().all()}
    
    statuses = []
    for member in members:
        checkin_item = checkins_dict.get(member.user_id)
        statuses.append(
            MemberTodayStatus(
                user=UserRead.model_validate(member.user),
                has_checked_in=checkin_item is not None,
                checkin=CheckinRead.model_validate(checkin_item) if checkin_item else None,
                current_streak=streaks_dict.get(member.user_id, 0)
            )
        )
    
    return statuses
