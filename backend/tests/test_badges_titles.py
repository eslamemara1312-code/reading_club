import pytest
from datetime import date
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_badges_and_titles_flow(client: AsyncClient):
    # Register User
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Gamer Reader", "email": "gamer@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    user_id = reg.json()["user"]["id"]

    # 1. Fetch system badges
    b_res = await client.get("/api/v1/badges")
    assert b_res.status_code == 200
    badges = b_res.json()
    assert len(badges) >= 5

    # 2. Create Group & Log 1st check-in -> unlocks 'first_step' badge
    group_res = await client.post("/api/v1/groups", json={"name": "Gamified Group"}, headers=headers)
    group_id = group_res.json()["id"]

    await client.post("/api/v1/checkins", json={
        "group_id": group_id, "pages_read": 105
    }, headers=headers)

    # 3. Check user badges -> 'first_step' and 'century_reader' should be earned
    ub_res = await client.get(f"/api/v1/users/{user_id}/badges")
    assert ub_res.status_code == 200
    ub_data = ub_res.json()
    earned_slugs = [item["badge"]["slug"] for item in ub_data]
    assert "first_step" in earned_slugs
    assert "century_reader" in earned_slugs

    # 4. Equip Avatar Frame
    frame_res = await client.patch("/api/v1/users/me/frame", json={"current_frame": "fire"}, headers=headers)
    assert frame_res.status_code == 200
    assert frame_res.json()["current_frame"] == "fire"

    # 5. Fetch Weekly Titles for Group
    titles_res = await client.get(f"/api/v1/groups/{group_id}/titles", headers=headers)
    assert titles_res.status_code == 200
