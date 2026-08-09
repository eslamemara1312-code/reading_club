from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationRead, WhatsAppSettingsUpdate
from app.schemas.user import UserRead

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=List[NotificationRead])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    return [NotificationRead.model_validate(n) for n in res.scalars().all()]


@router.patch("/notifications/{notification_id}/read", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Notification).where(Notification.id == notification_id))
    notif = res.scalar_one_or_none()
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return NotificationRead.model_validate(notif)


@router.patch("/users/me/whatsapp", response_model=UserRead)
async def update_whatsapp_settings(
    settings_in: WhatsAppSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if settings_in.phone is not None:
        current_user.phone = settings_in.phone
    current_user.whatsapp_enabled = settings_in.whatsapp_enabled

    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)
