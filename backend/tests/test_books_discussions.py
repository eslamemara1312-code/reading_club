import pytest
from datetime import date, timedelta
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_books_and_discussions_flow(client: AsyncClient):
    # Register Owner
    o_reg = await client.post("/api/v1/auth/register", json={
        "name": "Book Owner", "email": "bowner@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {o_reg.json()['access_token']}"}

    # 1. Fetch catalog books
    b_res = await client.get("/api/v1/books")
    assert b_res.status_code == 200

    # Create new book in catalog
    nb_res = await client.post("/api/v1/books", json={
        "title": "كتاب القراءة السريعة",
        "author": "توني بوزان",
        "total_pages": 240,
        "category": "تطوير الذات"
    }, headers=headers)
    assert nb_res.status_code == 201
    book_id = nb_res.json()["id"]

    # 2. Create Group & set active book plan
    group_res = await client.post("/api/v1/groups", json={"name": "Book Club Group"}, headers=headers)
    group_id = group_res.json()["id"]

    today = date.today()
    target_end = today + timedelta(days=12)

    plan_res = await client.post(f"/api/v1/groups/{group_id}/books", json={
        "book_id": book_id,
        "start_date": str(today),
        "target_end_date": str(target_end)
    }, headers=headers)
    assert plan_res.status_code == 201
    assert plan_res.json()["daily_target_pages"] == 20  # 240 / 12 = 20 pages/day

    # Fetch active book
    ab_res = await client.get(f"/api/v1/groups/{group_id}/books/active", headers=headers)
    assert ab_res.status_code == 200
    assert ab_res.json()["book"]["title"] == "كتاب القراءة السريعة"

    # 3. Create Discussion Thread
    disc_res = await client.post(f"/api/v1/groups/{group_id}/discussions", json={
        "title": "ما رأيكم في الفصل الأول؟",
        "content": "استفدت كثيراً من فكرة التركيز البصري"
    }, headers=headers)
    assert disc_res.status_code == 201
    disc_id = disc_res.json()["id"]

    # 4. Reply to Discussion Thread
    reply_res = await client.post(f"/api/v1/discussions/{disc_id}/replies", json={
        "content": "أتفق معك تماماً، تقنية ممتازة!"
    }, headers=headers)
    assert reply_res.status_code == 201
    assert reply_res.json()["content"] == "أتفق معك تماماً، تقنية ممتازة!"

    # Fetch group discussions
    discs_res = await client.get(f"/api/v1/groups/{group_id}/discussions", headers=headers)
    assert discs_res.status_code == 200
    assert len(discs_res.json()) >= 1
    assert len(discs_res.json()[0]["replies"]) == 1
