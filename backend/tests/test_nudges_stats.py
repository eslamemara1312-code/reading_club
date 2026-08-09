import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.tasks.monthly_summary import generate_monthly_summaries


@pytest.mark.asyncio
async def test_nudges_and_stats_flow(client: AsyncClient, db_session: AsyncSession):
    # Register User A (owner)
    reg_a = await client.post("/api/v1/auth/register", json={
        "name": "User A",
        "email": "usera_nudges@example.com",
        "password": "password123"
    })
    token_a = reg_a.json()["access_token"]
    user_a_id = reg_a.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    reg_b = await client.post("/api/v1/auth/register", json={
        "name": "User B",
        "email": "userb_nudges@example.com",
        "password": "password123"
    })
    token_b = reg_b.json()["access_token"]
    user_b_id = reg_b.json()["user"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Create Group
    grp = await client.post("/api/v1/groups", json={"name": "Nudge Test Group"}, headers=headers_a)
    group_id = grp.json()["id"]
    code = grp.json()["invite_code"]

    # User B joins group
    await client.post("/api/v1/groups/join", json={"invite_code": code}, headers=headers_b)

    # 1. User A nudges User B (User B hasn't checked in yet)
    nudge_res = await client.post("/api/v1/nudges", json={
        "group_id": group_id,
        "to_user_id": user_b_id,
    }, headers=headers_a)
    assert nudge_res.status_code == 201
    assert nudge_res.json()["to_user_id"] == user_b_id
    assert nudge_res.json()["resulted_in_checkin"] is False

    # 2. Duplicate nudge on same day should return 409
    dup_nudge = await client.post("/api/v1/nudges", json={
        "group_id": group_id,
        "to_user_id": user_b_id,
    }, headers=headers_a)
    assert dup_nudge.status_code == 409

    # 3. User B logs checkin -> auto resolves nudge
    chk_b = await client.post("/api/v1/checkins", json={
        "group_id": group_id,
        "pages_read": 30,
        "note": "Reading Chapter 1"
    }, headers=headers_b)
    assert chk_b.status_code == 201

    # 4. Check Group Stats endpoint
    stats_res = await client.get(f"/api/v1/groups/{group_id}/stats", headers=headers_a)
    assert stats_res.status_code == 200
    assert stats_res.json()["total_pages_read"] == 30

    # 5. Check Hall of Fame endpoint
    hof_res = await client.get(f"/api/v1/groups/{group_id}/hall-of-fame", headers=headers_a)
    assert hof_res.status_code == 200

    # 6. Test Monthly Summary job & endpoint
    await generate_monthly_summaries(db=db_session)
    sum_res = await client.get("/api/v1/users/me/summary", headers=headers_b)
    assert sum_res.status_code == 200
