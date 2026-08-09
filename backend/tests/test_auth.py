import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register a new user
    register_data = {
        "name": "Eslam User",
        "email": "eslam@example.com",
        "password": "SecretPassword123!",
        "phone": "+201000000000"
    }
    res = await client.post("/api/v1/auth/register", json=register_data)
    assert res.status_code == 201
    payload = res.json()
    assert "access_token" in payload
    assert "refresh_token" in payload
    assert payload["user"]["email"] == "eslam@example.com"
    assert payload["user"]["name"] == "Eslam User"

    # 2. Duplicate email registration rejection
    dup_res = await client.post("/api/v1/auth/register", json=register_data)
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"]

    # 3. Login with correct credentials
    login_data = {
        "email": "eslam@example.com",
        "password": "SecretPassword123!"
    }
    login_res = await client.post("/api/v1/auth/login", json=login_data)
    assert login_res.status_code == 200
    login_payload = login_res.json()
    assert "access_token" in login_payload
    refresh_token = login_payload["refresh_token"]

    # 4. Login with wrong password
    wrong_login_data = {
        "email": "eslam@example.com",
        "password": "WrongPassword!"
    }
    wrong_res = await client.post("/api/v1/auth/login", json=wrong_login_data)
    assert wrong_res.status_code == 401

    # 5. Token refresh
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()
