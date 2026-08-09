from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.badge import Badge, UserBadge
from app.models.weekly_title import WeeklyTitle
from app.schemas.badge import BadgeRead, UserBadgeRead, FrameUpdate
from app.schemas.weekly_title import WeeklyTitleRead
from app.schemas.user import UserRead
from app.services.badge_service import ensure_default_badges_exist

router = APIRouter(tags=["Gamification"])


@router.get("/badges", response_model=List[BadgeRead])
async def list_all_badges(db: AsyncSession = Depends(get_db)):
    await ensure_default_badges_exist(db)
    res = await db.execute(select(Badge))
    return [BadgeRead.model_validate(b) for b in res.scalars().all()]


@router.get("/users/{user_id}/badges", response_model=List[UserBadgeRead])
async def get_user_badges(user_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(UserBadge)
        .options(joinedload(UserBadge.badge))
        .where(UserBadge.user_id == user_id)
    )
    user_badges = res.scalars().all()
    
    return [
        UserBadgeRead(
            id=ub.id,
            user_id=ub.user_id,
            badge_id=ub.badge_id,
            earned_at=ub.earned_at,
            badge=BadgeRead.model_validate(ub.badge)
        )
        for ub in user_badges
    ]


@router.get("/groups/{group_id}/titles", response_model=List[WeeklyTitleRead])
async def get_group_weekly_titles(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(WeeklyTitle)
        .options(joinedload(WeeklyTitle.user))
        .where(WeeklyTitle.group_id == group_id)
        .order_by(WeeklyTitle.week_start_date.desc())
        .limit(10)
    )
    titles = res.scalars().all()

    return [
        WeeklyTitleRead(
            id=t.id,
            group_id=t.group_id,
            user_id=t.user_id,
            week_start_date=t.week_start_date,
            title_type=t.title_type,
            title_name=t.title_name,
            created_at=t.created_at,
            user=UserRead.model_validate(t.user)
        )
        for t in titles
    ]


@router.patch("/users/me/frame", response_model=UserRead)
async def update_avatar_frame(
    frame_in: FrameUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    valid_frames = ["none", "gold", "fire", "emerald"]
    if frame_in.current_frame not in valid_frames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frame. Must be one of {valid_frames}"
        )

    current_user.current_frame = frame_in.current_frame
    await db.commit()
    await db.refresh(current_user)

    return UserRead.model_validate(current_user)
