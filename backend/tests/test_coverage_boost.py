import pytest
from datetime import date, datetime, timedelta, timezone
from app.models import User, Group, GroupMember, Checkin, Fine, Streak
from app.schemas.checkin import CheckinCreate
from app.schemas.fine import VaultSettleRequest
from app.api.v1.routes.checkins import log_checkin, get_today_status
from app.api.v1.routes.calendar import get_group_calendar
from app.api.v1.routes.fines import get_group_vault, settle_group_vault, mark_fine_paid


@pytest.mark.asyncio
async def test_checkins_direct_route_coverage(db_session):
    u1 = User(name="Direct U1", email="directu1@example.com", password_hash="hash")
    u2 = User(name="Direct U2", email="directu2@example.com", password_hash="hash")
    db_session.add_all([u1, u2])
    await db_session.flush()

    group = Group(
        name="Direct Checkin Group",
        invite_code="DIRC1",
        owner_id=u1.id,
        checkin_deadline_time="00:00:00",
        grace_period_hours=3
    )
    db_session.add(group)
    await db_session.flush()

    gm1 = GroupMember(group_id=group.id, user_id=u1.id, role="owner", status="active")
    gm2 = GroupMember(group_id=group.id, user_id=u2.id, role="member", status="active")
    db_session.add_all([gm1, gm2])
    await db_session.commit()

    # 1. Log check-in for u1
    c_in1 = CheckinCreate(group_id=group.id, pages_read=15, note="Direct test")
    res1 = await log_checkin(checkin_in=c_in1, current_user=u1, db=db_session)
    assert res1.pages_read == 15

    # 2. Log check-in for u2 -> triggers all members checked in notification
    c_in2 = CheckinCreate(group_id=group.id, pages_read=25, note="Completes group")
    res2 = await log_checkin(checkin_in=c_in2, current_user=u2, db=db_session)
    assert res2.pages_read == 25

    # 3. Get today status
    statuses = await get_today_status(group_id=group.id, current_user=u1, db=db_session)
    assert len(statuses) == 2


@pytest.mark.asyncio
async def test_calendar_direct_route_coverage(db_session):
    u = User(name="Direct Cal", email="directcal@example.com", password_hash="hash")
    db_session.add(u)
    await db_session.flush()

    group = Group(name="Direct Cal Group", invite_code="DIRCAL", owner_id=u.id)
    db_session.add(group)
    await db_session.flush()

    gm = GroupMember(group_id=group.id, user_id=u.id, role="owner", status="active", joined_at=datetime.now(timezone.utc) - timedelta(days=10))
    db_session.add(gm)

    fine = Fine(user_id=u.id, group_id=group.id, fine_date=date.today() - timedelta(days=2), amount=20.0)
    checkin = Checkin(user_id=u.id, group_id=group.id, checkin_date=date.today() - timedelta(days=1), pages_read=10)
    db_session.add_all([fine, checkin])
    await db_session.commit()

    today = date.today()
    month_str = f"{today.year:04d}-{today.month:02d}"

    res = await get_group_calendar(group_id=group.id, month=month_str, current_user=u, db=db_session)
    assert res.group_id == group.id
    assert len(res.members) == 1


@pytest.mark.asyncio
async def test_fines_direct_route_coverage(db_session):
    u_owner = User(name="Direct Owner", email="directowner@example.com", password_hash="hash")
    u_member = User(name="Direct Member", email="directmem@example.com", password_hash="hash")
    db_session.add_all([u_owner, u_member])
    await db_session.flush()

    group = Group(name="Direct Fine Group", invite_code="DIRFINE", owner_id=u_owner.id, fine_amount=20.0)
    db_session.add(group)
    await db_session.flush()

    gm_owner = GroupMember(group_id=group.id, user_id=u_owner.id, role="owner", status="active")
    gm_member = GroupMember(group_id=group.id, user_id=u_member.id, role="member", status="active")
    db_session.add_all([gm_owner, gm_member])

    fine = Fine(user_id=u_member.id, group_id=group.id, fine_date=date.today(), amount=20.0, status="pending")
    db_session.add(fine)
    await db_session.commit()

    today = date.today()
    month_str = f"{today.year:04d}-{today.month:02d}"

    # Get vault
    vault = await get_group_vault(group_id=group.id, month_str=month_str, current_user=u_owner, db=db_session)
    assert vault.group_id == group.id

    # Mark fine paid
    paid_res = await mark_fine_paid(fine_id=fine.id, current_user=u_owner, db=db_session)
    assert paid_res.status == "paid"

    # Settle vault
    settle_req = VaultSettleRequest(settlement_note="Coffee night")
    settle_res = await settle_group_vault(group_id=group.id, settle_in=settle_req, month_str=month_str, current_user=u_owner, db=db_session)
    assert settle_res.status == "settled"
