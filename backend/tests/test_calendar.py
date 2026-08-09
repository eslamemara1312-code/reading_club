import pytest
from datetime import date, datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select
from app.models import GroupMember, Fine


@pytest.mark.asyncio
async def test_group_calendar_endpoint(client: AsyncClient, db_session):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Calendar User", "email": "cal@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    group_res = await client.post("/api/v1/groups", json={"name": "Calendar Group"}, headers=headers)
    group_id = group_res.json()["id"]
    user_id = reg.json()["user"]["id"]

    # Set member joined 10 days ago
    m_res = await db_session.execute(select(GroupMember).where(GroupMember.group_id == group_id, GroupMember.user_id == user_id))
    member = m_res.scalar_one()
    member.joined_at = datetime.now(timezone.utc) - timedelta(days=10)

    # Add a fine for 2 days ago (absent day)
    fine_day = date.today() - timedelta(days=2)
    fine = Fine(user_id=user_id, group_id=group_id, fine_date=fine_day, amount=20.0)
    db_session.add(fine)
    await db_session.commit()

    # Log checkin for today
    await client.post("/api/v1/checkins", json={
        "group_id": group_id,
        "pages_read": 10
    }, headers=headers)

    # Get calendar for current month
    today = date.today()
    month_str = f"{today.year:04d}-{today.month:02d}"

    cal_res = await client.get(f"/api/v1/groups/{group_id}/calendar?month={month_str}", headers=headers)
    assert cal_res.status_code == 200
    cal_data = cal_res.json()
    assert cal_data["group_id"] == group_id
    assert len(cal_data["members"]) == 1

    days = cal_data["members"][0]["days"]
    today_day_item = next(d for d in days if d["day"] == str(today))
    assert today_day_item["status"] == "present"
    assert today_day_item["pages_read"] == 10

    fine_day_item = next(d for d in days if d["day"] == str(fine_day))
    assert fine_day_item["status"] == "absent"


@pytest.mark.asyncio
async def test_calendar_invalid_month_and_non_member(client: AsyncClient):
    reg1 = await client.post("/api/v1/auth/register", json={
        "name": "Owner Cal", "email": "ocal@example.com", "password": "password123"
    })
    h1 = {"Authorization": f"Bearer {reg1.json()['access_token']}"}

    reg2 = await client.post("/api/v1/auth/register", json={
        "name": "Stranger Cal", "email": "strangercal@example.com", "password": "password123"
    })
    h2 = {"Authorization": f"Bearer {reg2.json()['access_token']}"}

    g_res = await client.post("/api/v1/groups", json={"name": "Cal Auth Group"}, headers=h1)
    group_id = g_res.json()["id"]

    # Non-member forbidden
    res_403 = await client.get(f"/api/v1/groups/{group_id}/calendar", headers=h2)
    assert res_403.status_code == 403

    # Invalid month format -> 400
    res_400 = await client.get(f"/api/v1/groups/{group_id}/calendar?month=invalid", headers=h1)
    assert res_400.status_code == 400
