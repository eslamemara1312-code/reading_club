import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.tasks.reminder_job import send_evening_reminders


@pytest.mark.asyncio
async def test_whatsapp_and_notifications_flow(client: AsyncClient, db_session: AsyncSession):
    # Register User
    reg = await client.post("/api/v1/auth/register", json={
        "name": "Notif User", "email": "notif@example.com", "password": "password123"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # 1. Update WhatsApp phone number & toggle settings
    wa_res = await client.patch("/api/v1/users/me/whatsapp", json={
        "phone": "+201000000000",
        "whatsapp_enabled": True
    }, headers=headers)
    assert wa_res.status_code == 200
    assert wa_res.json()["phone"] == "+201000000000"
    assert wa_res.json()["whatsapp_enabled"] is True

    # 2. Meta Webhook Verification Challenge Test
    verify_res = await client.get(
        "/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=reading_club_secret_token&hub.challenge=12345"
    )
    assert verify_res.status_code == 200
    assert verify_res.text == "12345"

    # Meta Webhook Inbound Listener Test
    payload_res = await client.post("/api/v1/whatsapp/webhook", json={"object": "whatsapp_business_account"})
    assert payload_res.status_code == 200

    # 3. Create Group -> User has NOT checked in today
    group_res = await client.post("/api/v1/groups", json={"name": "Notif Group"}, headers=headers)
    assert group_res.status_code == 201

    # 4. Trigger 22:00 PM evening reminder job
    await send_evening_reminders(db=db_session)

    # 5. Fetch in-app notifications -> should have reminder_warning
    n_res = await client.get("/api/v1/notifications", headers=headers)
    assert n_res.status_code == 200
    notifications = n_res.json()
    assert len(notifications) >= 1
    notif_id = notifications[0]["id"]
    assert notifications[0]["type"] == "reminder_warning"
    assert notifications[0]["is_read"] is False

    # 6. Mark notification as read
    read_res = await client.patch(f"/api/v1/notifications/{notif_id}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["is_read"] is True
