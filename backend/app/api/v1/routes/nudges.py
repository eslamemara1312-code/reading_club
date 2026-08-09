"""Nudges API — the 'rescuer' feature."""
import uuid
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models import User, Nudge, GroupMember, Checkin
from pydantic import BaseModel


router = APIRouter(prefix="/nudges", tags=["nudges"])


class NudgeCreate(BaseModel):
    group_id: str
    to_user_id: str


class NudgeRead(BaseModel):
    id: str
    group_id: str
    from_user_id: str
    to_user_id: str
    nudge_date: str
    resulted_in_checkin: bool
    from_user_name: str | None = None
    to_user_name: str | None = None

    class Config:
        from_attributes = True


@router.post("", response_model=NudgeRead, status_code=201)
async def send_nudge(
    body: NudgeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a nudge to a member who hasn't checked in today. Max 1 per sender/receiver/day."""
    today = date.today()

    # Verify both sender and recipient are members of the same group
    sender_member = await db.execute(
        select(GroupMember).where(
            and_(GroupMember.group_id == body.group_id, GroupMember.user_id == current_user.id)
        )
    )
    if not sender_member.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="أنت لست عضواً في هذه المجموعة")

    recipient_member = await db.execute(
        select(GroupMember).where(
            and_(GroupMember.group_id == body.group_id, GroupMember.user_id == body.to_user_id)
        )
    )
    if not recipient_member.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="المستلم ليس عضواً في هذه المجموعة")

    # Can't nudge yourself
    if current_user.id == body.to_user_id:
        raise HTTPException(status_code=400, detail="لا يمكنك إرسال تنبيه لنفسك")

    # Check that recipient hasn't checked in today
    recipient_checkin = await db.execute(
        select(Checkin).where(
            and_(
                Checkin.user_id == body.to_user_id,
                Checkin.group_id == body.group_id,
                Checkin.checkin_date == today,
            )
        )
    )
    if recipient_checkin.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="هذا العضو سجّل قراءته اليوم بالفعل")

    # Check unique constraint: only 1 nudge per sender → recipient per day
    existing_nudge = await db.execute(
        select(Nudge).where(
            and_(
                Nudge.from_user_id == current_user.id,
                Nudge.to_user_id == body.to_user_id,
                Nudge.nudge_date == today,
            )
        )
    )
    if existing_nudge.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="لقد أرسلت تنبيهاً لهذا العضو اليوم بالفعل")

    nudge = Nudge(
        group_id=body.group_id,
        from_user_id=current_user.id,
        to_user_id=body.to_user_id,
        nudge_date=today,
    )
    db.add(nudge)
    await db.commit()
    await db.refresh(nudge, attribute_names=["from_user", "to_user"])

    return NudgeRead(
        id=nudge.id,
        group_id=nudge.group_id,
        from_user_id=nudge.from_user_id,
        to_user_id=nudge.to_user_id,
        nudge_date=str(nudge.nudge_date),
        resulted_in_checkin=nudge.resulted_in_checkin,
        from_user_name=nudge.from_user.name if nudge.from_user else None,
        to_user_name=nudge.to_user.name if nudge.to_user else None,
    )
