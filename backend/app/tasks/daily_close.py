import logging
from datetime import date, datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.streak import Streak
from app.services.fine_service import create_fine_and_add_to_vault

logger = logging.getLogger("reading_club.tasks")


async def run_daily_close_for_group(db: AsyncSession, group: Group, target_date: date):
    """Executes daily close logic for a specific group for target_date."""
    # Get active members
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group.id,
            GroupMember.status == "active"
        )
    )
    members = mem_res.scalars().all()

    for member in members:
        # Don't penalize days before member joined
        joined_date = member.joined_at.date() if isinstance(member.joined_at, datetime) else member.joined_at
        if target_date < joined_date:
            continue

        # Check if member checked in for target_date
        checkin_res = await db.execute(
            select(Checkin).where(
                Checkin.group_id == group.id,
                Checkin.user_id == member.user_id,
                Checkin.checkin_date == target_date
            )
        )
        if checkin_res.scalar_one_or_none():
            continue  # Checked in successfully

        # Get or create streak
        streak_res = await db.execute(
            select(Streak).where(
                Streak.group_id == group.id,
                Streak.user_id == member.user_id
            )
        )
        streak = streak_res.scalar_one_or_none()
        if not streak:
            streak = Streak(
                user_id=member.user_id,
                group_id=group.id,
                current_streak=0,
                longest_streak=0,
                freezes_remaining=2,
                freezes_used_total=0
            )
            db.add(streak)

        # Apply Freeze or Fine logic
        if streak.freezes_remaining > 0:
            streak.freezes_remaining -= 1
            streak.freezes_used_total += 1
            logger.info(f"Consumed streak freeze for user {member.user_id} in group {group.id} for date {target_date}")
        else:
            streak.current_streak = 0
            await create_fine_and_add_to_vault(
                db=db,
                user_id=member.user_id,
                group_id=group.id,
                fine_date=target_date,
                amount=float(group.fine_amount)
            )
            logger.info(f"Issued fine of {group.fine_amount} {group.currency} to user {member.user_id} in group {group.id} for date {target_date}")


async def check_and_run_daily_closes():
    """Background task running periodically to close yesterday for active groups."""
    async with AsyncSessionLocal() as db:
        try:
            groups_res = await db.execute(select(Group))
            groups = groups_res.scalars().all()

            yesterday = date.today() - timedelta(days=1)
            for group in groups:
                await run_daily_close_for_group(db, group, yesterday)

            await db.commit()
        except Exception as e:
            logger.error(f"Error executing daily_close job: {e}", exc_info=True)
