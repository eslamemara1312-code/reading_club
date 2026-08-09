import pytest
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.streak import Streak
from app.models.fine import Fine
from app.tasks.daily_close import run_daily_close_for_group


@pytest.mark.asyncio
async def test_daily_close_freeze_and_fine(db_session: AsyncSession):
    # Setup User & Group joined 5 days ago
    user = User(name="Absent User", email="absent@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.flush()

    group = Group(name="Daily Close Group", invite_code="DCLOSE", owner_id=user.id, fine_amount=20.0)
    db_session.add(group)
    await db_session.flush()

    five_days_ago = date.today() - timedelta(days=5)
    member = GroupMember(
        group_id=group.id, user_id=user.id, role="owner", status="active",
        joined_at=five_days_ago
    )
    db_session.add(member)

    # Initial streak with 2 freezes
    streak = Streak(user_id=user.id, group_id=group.id, current_streak=3, freezes_remaining=2)
    db_session.add(streak)
    await db_session.commit()

    yesterday = date.today() - timedelta(days=1)

    # 1st Miss -> consumes 1 freeze, streak stays 3, no fine created
    await run_daily_close_for_group(db_session, group, yesterday)
    await db_session.commit()

    await db_session.refresh(streak)
    assert streak.freezes_remaining == 1
    assert streak.current_streak == 3

    fines_res = await db_session.execute(select(Fine).where(Fine.user_id == user.id))
    assert len(fines_res.scalars().all()) == 0

    # 2nd Miss (simulate another missed day)
    streak.freezes_remaining = 0  # Force 0 freezes left
    await db_session.commit()

    day_before_yesterday = yesterday - timedelta(days=1)
    await run_daily_close_for_group(db_session, group, day_before_yesterday)
    await db_session.commit()

    await db_session.refresh(streak)
    assert streak.current_streak == 0  # Streak reset

    fines_res2 = await db_session.execute(select(Fine).where(Fine.user_id == user.id))
    fines = fines_res2.scalars().all()
    assert len(fines) == 1
    assert float(fines[0].amount) == 20.0


@pytest.mark.asyncio
async def test_daily_close_idempotency(db_session: AsyncSession):
    """Verify that running daily close twice for the same group and date is idempotent."""
    user = User(name="Idempotent User", email="idempotent@example.com", password_hash="hash")
    db_session.add(user)
    await db_session.flush()

    group = Group(name="Idempotent Group", invite_code="IDEMP1", owner_id=user.id, fine_amount=20.0)
    db_session.add(group)
    await db_session.flush()

    five_days_ago = date.today() - timedelta(days=5)
    member = GroupMember(
        group_id=group.id, user_id=user.id, role="owner", status="active",
        joined_at=five_days_ago
    )
    db_session.add(member)

    streak = Streak(user_id=user.id, group_id=group.id, current_streak=1, freezes_remaining=0)
    db_session.add(streak)
    await db_session.commit()

    target_d = date.today() - timedelta(days=2)

    # First run -> creates fine
    await run_daily_close_for_group(db_session, group, target_d)
    await db_session.commit()

    fines_res1 = await db_session.execute(
        select(Fine).where(Fine.user_id == user.id, Fine.fine_date == target_d)
    )
    assert len(fines_res1.scalars().all()) == 1

    # Second run for SAME target_d -> MUST NOT create duplicate fine
    await run_daily_close_for_group(db_session, group, target_d)
    await db_session.commit()

    fines_res2 = await db_session.execute(
        select(Fine).where(Fine.user_id == user.id, Fine.fine_date == target_d)
    )
    assert len(fines_res2.scalars().all()) == 1

