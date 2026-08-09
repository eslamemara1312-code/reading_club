import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_group_calendar_endpoint(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Calendar User", "email": "cal@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    group_res = await client.post("/api/v1/groups", json={"name": "Calendar Group"}, headers=headers)
    group_id = group_res.json()["id"]

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
