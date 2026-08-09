import logging
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.user import User
from app.models.notification import Notification
from app.core.whatsapp import send_whatsapp_message

logger = logging.getLogger("reading_club.reminder_job")


async def run_evening_reminders_for_group(db: AsyncSession, group: Group, today: date):
    """Sends 22:00 PM warning reminders to active members who haven't checked in today."""
    # Fetch active members
    mem_res = await db.execute(
        select(GroupMember).where(GroupMember.group_id == group.id, GroupMember.status == "active")
    )
    members = mem_res.scalars().all()

    # Fetch today's checkin user_ids for group
    c_res = await db.execute(
        select(Checkin.user_id).where(Checkin.group_id == group.id, Checkin.checkin_date == today)
    )
    checked_in_user_ids = set(c_res.scalars().all())

    for member in members:
        if member.user_id not in checked_in_user_ids:
            # Check if notification was already sent today
            from sqlalchemy import func
            existing_notif = await db.execute(
                select(Notification).where(
                    Notification.user_id == member.user_id,
                    Notification.type == "reminder_warning",
                    func.date(Notification.created_at) == today
                )
            )
            if existing_notif.scalar_one_or_none():
                continue

            # Create in-app notification
            title = f"تنبيه قراءة اليوم - {group.name}"
            msg = f"متبقي ساعتان فقط قبل انتهاء مهلة الورد اليومي لمجموعة {group.name} وتطبيق الغرامة ⚠️"

            notif = Notification(
                user_id=member.user_id,
                type="reminder_warning",
                title=title,
                message=msg
            )
            db.add(notif)

            # Fetch user to check phone & whatsapp settings
            u_res = await db.execute(select(User).where(User.id == member.user_id))
            user = u_res.scalar_one_or_none()
            if user and user.phone and user.whatsapp_enabled:
                await send_whatsapp_message(user.phone, f"{title}\n{msg}")



async def send_evening_reminders(db: AsyncSession = None):
    """APScheduler cron job running every evening at 22:00 PM."""
    if db is not None:
        today = date.today()
        groups_res = await db.execute(select(Group))
        groups = groups_res.scalars().all()
        for group in groups:
            await run_evening_reminders_for_group(db, group, today)
        await db.commit()
    else:
        async with AsyncSessionLocal() as session:
            try:
                today = date.today()
                groups_res = await session.execute(select(Group))
                groups = groups_res.scalars().all()

                for group in groups:
                    await run_evening_reminders_for_group(session, group, today)

                await session.commit()
                logger.info("Evening 22:00 PM reminders dispatched successfully")
            except Exception as e:
                logger.error(f"Error in send_evening_reminders task: {e}", exc_info=True)
