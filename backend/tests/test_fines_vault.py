import pytest
from httpx import AsyncClient


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
