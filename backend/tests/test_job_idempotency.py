import pytest
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import (
    User, Group, GroupMember, Checkin, Streak, Fine,
    MonthlySummary, WeeklyTitle, Notification
)
from app.tasks.monthly_summary import generate_monthly_summaries
from app.tasks.weekly_titles import run_weekly_titles_for_group
from app.tasks.reminder_job import run_evening_reminders_for_group


@pytest.mark.asyncio
async def test_monthly_summary_idempotency(db_session: AsyncSession):
    user = User(name="Summary User", email="summary@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.flush()

    group = Group(name="Summary Group", invite_code="SUMM1", owner_id=user.id)
    db_session.add(group)
    await db_session.flush()

    member = GroupMember(group_id=group.id, user_id=user.id, role="owner", status="active")
    db_session.add(member)
    streak = Streak(user_id=user.id, group_id=group.id, current_streak=5, freezes_remaining=0)
    db_session.add(streak)
    await db_session.commit()

    # First run
    await generate_monthly_summaries(db_session)

    today = date.today()
    if today.month == 1:
        prev_month, prev_year = 12, today.year - 1
    else:
        prev_month, prev_year = today.month - 1, today.year
    last_month_start = date(prev_year, prev_month, 1)

    summaries1 = await db_session.execute(
        select(MonthlySummary).where(
            MonthlySummary.user_id == user.id,
            MonthlySummary.group_id == group.id,
            MonthlySummary.month == last_month_start,
        )
    )
    assert len(summaries1.scalars().all()) == 1

    # Second run (re-trigger)
    await generate_monthly_summaries(db_session)

    summaries2 = await db_session.execute(
        select(MonthlySummary).where(
            MonthlySummary.user_id == user.id,
            MonthlySummary.group_id == group.id,
            MonthlySummary.month == last_month_start,
        )
    )
    assert len(summaries2.scalars().all()) == 1


@pytest.mark.asyncio
async def test_weekly_titles_idempotency(db_session: AsyncSession):
    user = User(name="Title User", email="title@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.flush()

    group = Group(name="Title Group", invite_code="TITLE1", owner_id=user.id)
    db_session.add(group)
    await db_session.flush()

    member = GroupMember(group_id=group.id, user_id=user.id, role="owner", status="active")
    db_session.add(member)

    week_start = date.today() - timedelta(days=date.today().weekday())
    checkin = Checkin(
        user_id=user.id,
        group_id=group.id,
        checkin_date=week_start,
        pages_read=50,
    )
    db_session.add(checkin)
    await db_session.commit()

    # First run
    await run_weekly_titles_for_group(db_session, group, week_start)
    await db_session.commit()

    titles1 = await db_session.execute(
        select(WeeklyTitle).where(
            WeeklyTitle.group_id == group.id,
            WeeklyTitle.week_start_date == week_start
        )
    )
    assert len(titles1.scalars().all()) == 2  # hero & king

    # Second run (re-trigger)
    await run_weekly_titles_for_group(db_session, group, week_start)
    await db_session.commit()

    titles2 = await db_session.execute(
        select(WeeklyTitle).where(
            WeeklyTitle.group_id == group.id,
            WeeklyTitle.week_start_date == week_start
        )
    )
    assert len(titles2.scalars().all()) == 2


@pytest.mark.asyncio
async def test_reminder_job_idempotency(db_session: AsyncSession):
    user = User(name="Reminder User", email="reminder@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.flush()

    group = Group(name="Reminder Group", invite_code="REMIND1", owner_id=user.id)
    db_session.add(group)
    await db_session.flush()

    member = GroupMember(group_id=group.id, user_id=user.id, role="owner", status="active")
    db_session.add(member)
    await db_session.commit()

    today = date.today()

    # First run
    await run_evening_reminders_for_group(db_session, group, today)
    await db_session.commit()

    notifs1 = await db_session.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.type == "reminder_warning"
        )
    )
    assert len(notifs1.scalars().all()) == 1

    # Second run (re-trigger)
    await run_evening_reminders_for_group(db_session, group, today)
    await db_session.commit()

    notifs2 = await db_session.execute(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.type == "reminder_warning"
        )
    )
    assert len(notifs2.scalars().all()) == 1
