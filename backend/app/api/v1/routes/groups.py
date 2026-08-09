import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.schemas.group import GroupCreate, GroupJoin, GroupRead, GroupSettingsUpdate, GroupMemberRead
from app.schemas.user import UserRead

router = APIRouter(prefix="/groups", tags=["Groups"])


def generate_invite_code(length: int = 6) -> str:
    """Generate a random uppercase alphanumeric invite code."""
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace("O", "").replace("0", "").replace("I", "").replace("1", "")
    return "".join(random.choice(chars) for _ in range(length))


async def fetch_group_with_members(db: AsyncSession, group_id: str) -> GroupRead:
    """Helper to fetch group with all active members preloaded into Pydantic schema."""
    res = await db.execute(
        select(Group).where(Group.id == group_id)
    )
    group = res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    members_res = await db.execute(
        select(GroupMember)
        .options(joinedload(GroupMember.user))
        .where(GroupMember.group_id == group_id, GroupMember.status == "active")
    )
    members = members_res.scalars().all()

    member_schemas = [
        GroupMemberRead(
            id=m.id,
            group_id=m.group_id,
            user_id=m.user_id,
            role=m.role,
            status=m.status,
            joined_at=m.joined_at,
            user=UserRead.model_validate(m.user)
        )
        for m in members
    ]

    return GroupRead(
        id=group.id,
        name=group.name,
        invite_code=group.invite_code,
        owner_id=group.owner_id,
        checkin_deadline_time=group.checkin_deadline_time,
        grace_period_hours=group.grace_period_hours,
        fine_amount=float(group.fine_amount),
        currency=group.currency,
        fun_mode_enabled=group.fun_mode_enabled,
        monthly_page_goal=group.monthly_page_goal,
        created_at=group.created_at,
        members_count=len(member_schemas),
        members=member_schemas
    )


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_in: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    for _ in range(10):
        code = generate_invite_code()
        res = await db.execute(select(Group).where(Group.invite_code == code))
        if not res.scalar_one_or_none():
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique invite code"
        )
    
    group = Group(
        name=group_in.name,
        invite_code=code,
        owner_id=current_user.id,
        checkin_deadline_time=group_in.checkin_deadline_time or "00:00",
        grace_period_hours=group_in.grace_period_hours or 3,
        fine_amount=group_in.fine_amount or 20.00,
        currency=group_in.currency or "EGP",
        fun_mode_enabled=group_in.fun_mode_enabled if group_in.fun_mode_enabled is not None else True,
        monthly_page_goal=group_in.monthly_page_goal
    )
    db.add(group)
    await db.flush()
    
    owner_member = GroupMember(
        group_id=group.id,
        user_id=current_user.id,
        role="owner",
        status="active"
    )
    db.add(owner_member)
    await db.commit()
    
    return await fetch_group_with_members(db, group.id)


@router.post("/join", response_model=GroupRead)
async def join_group(
    join_in: GroupJoin,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    code = join_in.invite_code.strip().upper()
    res = await db.execute(select(Group).where(Group.invite_code == code))
    group = res.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code"
        )
    
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id
        )
    )
    existing_member = mem_res.scalar_one_or_none()
    if existing_member:
        if existing_member.status == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already an active member of this group"
            )
        else:
            existing_member.status = "active"
    else:
        new_member = GroupMember(
            group_id=group.id,
            user_id=current_user.id,
            role="member",
            status="active"
        )
        db.add(new_member)
    
    await db.commit()
    return await fetch_group_with_members(db, group.id)


@router.get("/{group_id}", response_model=GroupRead)
async def get_group_details(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
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
            detail="Access denied: You are not an active member of this group"
        )
    
    return await fetch_group_with_members(db, group_id)


@router.patch("/{group_id}/settings", response_model=GroupRead)
async def update_group_settings(
    group_id: str,
    settings_in: GroupSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Group).where(Group.id == group_id))
    group = res.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner can update group settings"
        )
    
    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)
    
    await db.commit()
    return await fetch_group_with_members(db, group_id)
