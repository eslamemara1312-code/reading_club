import calendar as pycalendar
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group_member import GroupMember
from app.models.checkin import Checkin
from app.models.fine import Fine
from app.schemas.calendar import MemberDayStatus, MemberCalendarGrid, MonthCalendarResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/groups", tags=["Calendar"])


@router.get("/{group_id}/calendar", response_model=MonthCalendarResponse)
async def get_group_calendar(
    group_id: str,
    month: Optional[str] = Query(None, description="Format YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    today = date.today()
    if month:
        try:
            year, m_num = map(int, month.split("-"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")
    else:
        year, m_num = today.year, today.month

    num_days = pycalendar.monthrange(year, m_num)[1]
    start_date = date(year, m_num, 1)
    end_date = date(year, m_num, num_days)

    # Get active members
    members_res = await db.execute(
        select(GroupMember)
        .options(joinedload(GroupMember.user))
        .where(GroupMember.group_id == group_id, GroupMember.status == "active")
    )
    members = members_res.scalars().all()

    # Pre-fetch checkins for group & month
    checkins_res = await db.execute(
        select(Checkin).where(
            Checkin.group_id == group_id,
            Checkin.checkin_date >= start_date,
            Checkin.checkin_date <= end_date
        )
    )
    checkins_map = {(c.user_id, c.checkin_date): c for c in checkins_res.scalars().all()}

    # Pre-fetch fines for group & month
    fines_res = await db.execute(
        select(Fine).where(
            Fine.group_id == group_id,
            Fine.fine_date >= start_date,
            Fine.fine_date <= end_date
        )
    )
    fines_map = {(f.user_id, f.fine_date): f for f in fines_res.scalars().all()}

    member_grids = []
    for member in members:
        days_list = []
        for d in range(1, num_days + 1):
            curr_day = date(year, m_num, d)
            
            if curr_day < member.joined_at.date():
                status_str = "not_joined"
                c_item = None
            elif curr_day > today:
                status_str = "future"
                c_item = None
            elif (member.user_id, curr_day) in checkins_map:
                status_str = "present"
                c_item = checkins_map[(member.user_id, curr_day)]
            elif (member.user_id, curr_day) in fines_map:
                status_str = "absent"
                c_item = None
            else:
                # If day is past and neither checkin nor fine exists yet (or freeze consumed)
                status_str = "absent" if curr_day < today else "future"
                c_item = None

            days_list.append(
                MemberDayStatus(
                    day=curr_day,
                    status=status_str,
                    pages_read=c_item.pages_read if c_item else None,
                    note=c_item.note if c_item else None
                )
            )

        member_grids.append(
            MemberCalendarGrid(
                user=UserRead.model_validate(member.user),
                days=days_list
            )
        )

    return MonthCalendarResponse(
        group_id=group_id,
        month=f"{year:04d}-{m_num:02d}",
        members=member_grids
    )
