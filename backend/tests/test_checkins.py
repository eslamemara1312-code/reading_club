import pytest
from datetime import datetime, date, timedelta
from unittest.mock import patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


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


@pytest.mark.asyncio
async def test_leaderboard_query_count_does_not_grow_per_member(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    owner = await client.post("/api/v1/auth/register", json={
        "name": "Leaderboard Owner",
        "email": "leaderboard-owner@example.com",
        "password": "password123",
    })
    owner_headers = {"Authorization": f"Bearer {owner.json()['access_token']}"}
    group = await client.post(
        "/api/v1/groups",
        json={"name": "Efficient Leaderboard"},
        headers=owner_headers,
    )
    group_id = group.json()["id"]
    invite_code = group.json()["invite_code"]

    for index in range(3):
        member = await client.post("/api/v1/auth/register", json={
            "name": f"Leaderboard Member {index}",
            "email": f"leaderboard-member-{index}@example.com",
            "password": "password123",
        })
        member_headers = {"Authorization": f"Bearer {member.json()['access_token']}"}
        joined = await client.post(
            "/api/v1/groups/join",
            json={"invite_code": invite_code},
            headers=member_headers,
        )
        assert joined.status_code == 200

    original_execute = AsyncSession.execute
    query_count = 0

    async def counted_execute(self, *args, **kwargs):
        nonlocal query_count
        query_count += 1
        return await original_execute(self, *args, **kwargs)

    monkeypatch.setattr(AsyncSession, "execute", counted_execute)

    response = await client.get(
        f"/api/v1/groups/{group_id}/leaderboard",
        headers=owner_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 4
    assert query_count <= 6


@pytest.mark.asyncio
async def test_checkin_grace_period_boundaries(client: AsyncClient):
    # Register user & create group with 00:00 deadline & 3 hour grace period
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Grace Boundary User", "email": "gracebound@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    group_res = await client.post("/api/v1/groups", json={
        "name": "Grace Group", "checkin_deadline_time": "00:00:00", "grace_period_hours": 3
    }, headers=headers)
    group_id = group_res.json()["id"]

    # Boundary 1: Check in during grace period (01:30 AM) when yesterday not checked in
    mock_now_grace = datetime(2026, 8, 9, 1, 30, 0)
    with patch("app.api.v1.routes.checkins.datetime") as mock_dt, \
         patch("app.api.v1.routes.checkins.date") as mock_d:
        mock_dt.now.return_value = mock_now_grace
        mock_d.today.return_value = date(2026, 8, 9)
        mock_d.side_effect = lambda *args, **kwargs: date(*args, **kwargs)

        res = await client.post("/api/v1/checkins", json={"group_id": group_id, "pages_read": 10}, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["is_late"] is True
        assert data["checkin_date"] == "2026-08-08"

    # Boundary 2: Check in after grace period window closes (03:00 AM)
    mock_now_after_grace = datetime(2026, 8, 9, 3, 0, 0)
    with patch("app.api.v1.routes.checkins.datetime") as mock_dt, \
         patch("app.api.v1.routes.checkins.date") as mock_d:
        mock_dt.now.return_value = mock_now_after_grace
        mock_d.today.return_value = date(2026, 8, 9)
        mock_d.side_effect = lambda *args, **kwargs: date(*args, **kwargs)

        res2 = await client.post("/api/v1/checkins", json={"group_id": group_id, "pages_read": 25}, headers=headers)
        assert res2.status_code == 201
        data2 = res2.json()
        assert data2["is_late"] is False
        assert data2["checkin_date"] == "2026-08-09"


@pytest.mark.asyncio
async def test_checkin_non_member_forbidden(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Outsider", "email": "outsider@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    reg_owner = await client.post("/api/v1/auth/register", json={
        "name": "Owner Ins", "email": "ownerins@example.com", "password": "password123"
    })
    o_headers = {"Authorization": f"Bearer {reg_owner.json()['access_token']}"}
    g_res = await client.post("/api/v1/groups", json={"name": "Private Group"}, headers=o_headers)
    group_id = g_res.json()["id"]

    res = await client.post("/api/v1/checkins", json={"group_id": group_id, "pages_read": 5}, headers=headers)
    assert res.status_code == 403

    today_res = await client.get(f"/api/v1/checkins/today?group_id={group_id}", headers=headers)
    assert today_res.status_code == 403


@pytest.mark.asyncio
async def test_undo_and_update_checkin(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Undo User", "email": "undo@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    g_res = await client.post("/api/v1/groups", json={"name": "Undo Group"}, headers=headers)
    group_id = g_res.json()["id"]

    # 1. Log checkin
    await client.post("/api/v1/checkins", json={"group_id": group_id, "pages_read": 10}, headers=headers)

    # 2. Update checkin (add 5 pages)
    patch_res = await client.patch("/api/v1/checkins/today", json={"group_id": group_id, "additional_pages": 5}, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["pages_read"] == 15

    # 3. Undo checkin
    del_res = await client.delete(f"/api/v1/checkins/today?group_id={group_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Confirm today status is cleared
    today_res = await client.get(f"/api/v1/checkins/today?group_id={group_id}", headers=headers)
    assert today_res.json()[0]["has_checked_in"] is False
