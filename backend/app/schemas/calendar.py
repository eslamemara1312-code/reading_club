from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.user import UserRead


class MemberDayStatus(BaseModel):
    day: date
    status: str  # present (🟩), absent (🟥), freeze (❄️), future (⬜)
    pages_read: Optional[int] = None
    note: Optional[str] = None


class MemberCalendarGrid(BaseModel):
    user: UserRead
    days: List[MemberDayStatus]


class MonthCalendarResponse(BaseModel):
    group_id: str
    month: str  # YYYY-MM
    members: List[MemberCalendarGrid]
