import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_checkin_streak_leaderboard_flow(client: AsyncClient):
    # Register user & create group
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Reader One", "email": "reader1@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    group_res = await client.post("/api/v1/groups", json={"name": "Book Club 101"}, headers=headers)
    group_id = group_res.json()["id"]

    # 1. Log check-in
    checkin_res = await client.post("/api/v1/checkins", json={
        "group_id": group_id,
        "pages_read": 15,
        "note": "Reading Chapter 1"
    }, headers=headers)
    assert checkin_res.status_code == 201
    assert checkin_res.json()["pages_read"] == 15

    # 2. Duplicate same-day check-in -> 409
    dup_res = await client.post("/api/v1/checkins", json={
        "group_id": group_id,
        "pages_read": 20
    }, headers=headers)
    assert dup_res.status_code == 409

    # 3. Get today's status
    today_res = await client.get(f"/api/v1/checkins/today?group_id={group_id}", headers=headers)
    assert today_res.status_code == 200
    statuses = today_res.json()
    assert len(statuses) == 1
    assert statuses[0]["has_checked_in"] is True
    assert statuses[0]["current_streak"] == 1

    # 4. Get Leaderboard
    lb_res = await client.get(f"/api/v1/groups/{group_id}/leaderboard", headers=headers)
    assert lb_res.status_code == 200
    lb_data = lb_res.json()
    assert len(lb_data) == 1
    assert lb_data[0]["rank"] == 1
    assert lb_data[0]["commitment_rate"] == 100.0
    assert lb_data[0]["total_pages_read"] == 15
    assert lb_data[0]["current_streak"] == 1
