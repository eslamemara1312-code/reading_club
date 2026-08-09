import pytest
from datetime import date, datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select, update
from app.models import Streak, Fine, GroupMember
from app.tasks.daily_close import run_daily_close_for_group


@pytest.mark.asyncio
async def test_fines_and_vault_flow(client: AsyncClient):
    # Register owner & member
    o_reg = await client.post("/api/v1/auth/register", json={
        "name": "Owner Fine", "email": "ofine@example.com", "password": "password123"
    })
    owner_headers = {"Authorization": f"Bearer {o_reg.json()['access_token']}"}

    m_reg = await client.post("/api/v1/auth/register", json={
        "name": "Member Fine", "email": "mfine@example.com", "password": "password123"
    })
    member_headers = {"Authorization": f"Bearer {m_reg.json()['access_token']}"}

    # Create Group
    group_res = await client.post("/api/v1/groups", json={
        "name": "Fine Test Group", "fine_amount": 30.0
    }, headers=owner_headers)
    group_id = group_res.json()["id"]
    invite_code = group_res.json()["invite_code"]

    # Member joins group
    await client.post("/api/v1/groups/join", json={"invite_code": invite_code}, headers=member_headers)

    # 1. Fetch initial vault -> should be 0 amount
    v_res = await client.get(f"/api/v1/groups/{group_id}/vault", headers=member_headers)
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["status"] == "open"
    assert v_data["total_amount"] == 0.0

    # 2. Member cannot settle vault -> 403
    m_settle = await client.post(f"/api/v1/groups/{group_id}/vault/settle", json={
        "settlement_note": "Group dinner"
    }, headers=member_headers)
    assert m_settle.status_code == 403

    # 3. Owner settles vault -> 200
    o_settle = await client.post(f"/api/v1/groups/{group_id}/vault/settle", json={
        "settlement_note": "Spent on coffee and books"
    }, headers=owner_headers)
    assert o_settle.status_code == 200
    assert o_settle.json()["status"] == "settled"
    assert o_settle.json()["settlement_note"] == "Spent on coffee and books"


@pytest.mark.asyncio
async def test_freeze_exhaustion_boundary_and_mark_paid(client: AsyncClient, db_session):
    # Setup owner & member
    o_reg = await client.post("/api/v1/auth/register", json={
        "name": "Vault Owner", "email": "vowner@example.com", "password": "password123"
    })
    owner_headers = {"Authorization": f"Bearer {o_reg.json()['access_token']}"}

    m_reg = await client.post("/api/v1/auth/register", json={
        "name": "Zero Freeze User", "email": "zerofreeze@example.com", "password": "password123"
    })
    member_headers = {"Authorization": f"Bearer {m_reg.json()['access_token']}"}

    g_res = await client.post("/api/v1/groups", json={"name": "Exhaustion Group", "fine_amount": 25.0}, headers=owner_headers)
    group_id = g_res.json()["id"]
    code = g_res.json()["invite_code"]

    await client.post("/api/v1/groups/join", json={"invite_code": code}, headers=member_headers)
    user_id = m_reg.json()["user"]["id"]

    # Backdate member's joined_at so daily_close doesn't skip them for yesterday
    five_days_ago = datetime.now(timezone.utc) - timedelta(days=5)
    await db_session.execute(
        update(GroupMember)
        .where(GroupMember.group_id == group_id, GroupMember.user_id == user_id)
        .values(joined_at=five_days_ago)
    )

    # Explicitly set member's streak freezes_remaining = 0 via update/insert
    streak_res = await db_session.execute(select(Streak).where(Streak.group_id == group_id, Streak.user_id == user_id))
    streak = streak_res.scalar_one_or_none()
    if not streak:
        streak = Streak(user_id=user_id, group_id=group_id, current_streak=4, freezes_remaining=0)
        db_session.add(streak)
    else:
        streak.freezes_remaining = 0
        streak.current_streak = 4
    await db_session.commit()

    # Trigger daily close for yesterday when member has 0 freezes remaining
    yesterday = date.today() - timedelta(days=1)
    from app.models.group import Group
    group_obj = (await db_session.execute(select(Group).where(Group.id == group_id))).scalar_one()
    await run_daily_close_for_group(db_session, group_obj, yesterday)
    await db_session.commit()

    # Verify streak reset to 0 & fine of 25.0 created
    streak_after = (await db_session.execute(select(Streak).where(Streak.group_id == group_id, Streak.user_id == user_id))).scalar_one()
    assert streak_after.current_streak == 0

    fines_res = await db_session.execute(select(Fine).where(Fine.user_id == user_id, Fine.group_id == group_id))
    fines = fines_res.scalars().all()
    assert len(fines) == 1
    assert float(fines[0].amount) == 25.0
    fine_id = fines[0].id

    # Member tries to mark paid -> 403
    m_paid = await client.patch(f"/api/v1/fines/{fine_id}/mark-paid", headers=member_headers)
    assert m_paid.status_code == 403

    # Owner marks paid -> 200
    o_paid = await client.patch(f"/api/v1/fines/{fine_id}/mark-paid", headers=owner_headers)
    assert o_paid.status_code == 200
    assert o_paid.json()["status"] == "paid"
