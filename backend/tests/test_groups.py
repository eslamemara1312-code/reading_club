import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_group_create_join_flow(client: AsyncClient):
    # Register Owner
    owner_res = await client.post("/api/v1/auth/register", json={
        "name": "Owner User", "email": "owner@example.com", "password": "password123"
    })
    token = owner_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Register Member
    member_res = await client.post("/api/v1/auth/register", json={
        "name": "Member User", "email": "member@example.com", "password": "password123"
    })
    member_token = member_res.json()["access_token"]
    member_headers = {"Authorization": f"Bearer {member_token}"}

    # 1. Create Group
    create_res = await client.post("/api/v1/groups", json={
        "name": "Reading Group Alpha",
        "fine_amount": 25.0
    }, headers=headers)
    assert create_res.status_code == 201
    group_data = create_res.json()
    group_id = group_data["id"]
    invite_code = group_data["invite_code"]
    assert len(invite_code) == 6

    # 2. Join Group with valid code
    join_res = await client.post("/api/v1/groups/join", json={
        "invite_code": invite_code
    }, headers=member_headers)
    assert join_res.status_code == 200
    assert join_res.json()["members_count"] == 2

    # 3. Join with invalid code
    bad_join = await client.post("/api/v1/groups/join", json={
        "invite_code": "INVALID"
    }, headers=member_headers)
    assert bad_join.status_code == 404

    # 4. Get Group Details
    get_res = await client.get(f"/api/v1/groups/{group_id}", headers=member_headers)
    assert get_res.status_code == 200
    assert len(get_res.json()["members"]) == 2

    # 5. Non-owner tries to update settings -> 403
    non_owner_update = await client.patch(f"/api/v1/groups/{group_id}/settings", json={
        "name": "Hacked Name"
    }, headers=member_headers)
    assert non_owner_update.status_code == 403

    # 6. Owner updates settings -> 200
    owner_update = await client.patch(f"/api/v1/groups/{group_id}/settings", json={
        "name": "Reading Group Premium"
    }, headers=headers)
    assert owner_update.status_code == 200
    assert owner_update.json()["name"] == "Reading Group Premium"


@pytest.mark.asyncio
async def test_my_groups_query_count_does_not_grow_per_group(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    owner = await client.post("/api/v1/auth/register", json={
        "name": "Many Groups Owner",
        "email": "many-groups-owner@example.com",
        "password": "password123",
    })
    headers = {"Authorization": f"Bearer {owner.json()['access_token']}"}

    for index in range(3):
        response = await client.post(
            "/api/v1/groups",
            json={"name": f"Reading Group {index}"},
            headers=headers,
        )
        assert response.status_code == 201

    original_execute = AsyncSession.execute
    query_count = 0

    async def counted_execute(self, *args, **kwargs):
        nonlocal query_count
        query_count += 1
        return await original_execute(self, *args, **kwargs)

    monkeypatch.setattr(AsyncSession, "execute", counted_execute)

    response = await client.get("/api/v1/groups/me", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 3
    assert query_count <= 3
