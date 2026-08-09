from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.fine import Fine
from app.models.fine_vault import FineVault
from app.schemas.fine import FineRead, FineVaultRead, VaultSettleRequest
from app.schemas.user import UserRead
from app.services.fine_service import get_or_create_monthly_vault

router = APIRouter(tags=["Fines & Vault"])


@router.get("/groups/{group_id}/vault", response_model=FineVaultRead)
async def get_group_vault(
    group_id: str,
    month_str: Optional[str] = Query(None, description="Format YYYY-MM"),
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

    if month_str:
        try:
            year, month = map(int, month_str.split("-"))
            target_date = date(year, month, 1)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        today = date.today()
        target_date = date(today.year, today.month, 1)

    vault = await get_or_create_monthly_vault(db, group_id, target_date)

    # Fetch fines for group & month
    next_month = date(target_date.year + (1 if target_date.month == 12 else 0), 1 if target_date.month == 12 else target_date.month + 1, 1)
    fines_res = await db.execute(
        select(Fine)
        .options(joinedload(Fine.user))
        .where(
            Fine.group_id == group_id,
            Fine.fine_date >= target_date,
            Fine.fine_date < next_month
        )
    )
    fines = fines_res.scalars().all()

    fine_schemas = [
        FineRead(
            id=f.id,
            user_id=f.user_id,
            group_id=f.group_id,
            fine_date=f.fine_date,
            amount=float(f.amount),
            status=f.status,
            paid_at=f.paid_at,
            user=UserRead.model_validate(f.user)
        )
        for f in fines
    ]

    return FineVaultRead(
        id=vault.id,
        group_id=vault.group_id,
        month=vault.month,
        total_amount=float(vault.total_amount),
        status=vault.status,
        settlement_note=vault.settlement_note,
        settled_at=vault.settled_at,
        fines=fine_schemas
    )


@router.post("/groups/{group_id}/vault/settle", response_model=FineVaultRead)
async def settle_group_vault(
    group_id: str,
    settle_in: VaultSettleRequest,
    month_str: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    group_res = await db.execute(select(Group).where(Group.id == group_id))
    group = group_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    member = mem_res.scalar_one_or_none()
    is_owner = (group.owner_id == current_user.id) or (member is not None and member.role == "owner")
    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner can settle the fine vault"
        )

    if month_str:
        year, month = map(int, month_str.split("-"))
        target_date = date(year, month, 1)
    else:
        today = date.today()
        target_date = date(today.year, today.month, 1)

    vault = await get_or_create_monthly_vault(db, group_id, target_date)
    vault.status = "settled"
    vault.settlement_note = settle_in.settlement_note
    vault.settled_at = datetime.now(timezone.utc)

    await db.commit()
    return await get_group_vault(group_id, month_str, current_user, db)


@router.patch("/fines/{fine_id}/mark-paid", response_model=FineRead)
async def mark_fine_paid(
    fine_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    fine_res = await db.execute(
        select(Fine).options(joinedload(Fine.user)).where(Fine.id == fine_id)
    )
    fine = fine_res.scalar_one_or_none()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")

    group_res = await db.execute(select(Group).where(Group.id == fine.group_id))
    group = group_res.scalar_one_or_none()
    
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == fine.group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    member = mem_res.scalar_one_or_none()
    is_owner = (group and group.owner_id == current_user.id) or (member is not None and member.role == "owner")
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only the group owner can mark fines as paid")

    fine.status = "paid"
    fine.paid_at = datetime.now(timezone.utc)
    user_read = UserRead.model_validate(fine.user)

    await db.commit()

    return FineRead(
        id=fine.id,
        user_id=fine.user_id,
        group_id=fine.group_id,
        fine_date=fine.fine_date,
        amount=float(fine.amount),
        status=fine.status,
        paid_at=fine.paid_at,
        user=user_read
    )

