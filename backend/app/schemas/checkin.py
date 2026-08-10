from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class CheckinCreate(BaseModel):
    group_id: str
    pages_read: Optional[int] = None
    note: Optional[str] = None


class CheckinUpdate(BaseModel):
    group_id: str
    pages_read: Optional[int] = None
    additional_pages: Optional[int] = None
    note: Optional[str] = None


class CheckinRead(BaseModel):
    id: str
    user_id: str
    group_id: str
    checkin_date: date
    pages_read: Optional[int] = None
    note: Optional[str] = None
    checked_in_at: datetime
    is_late: bool

    model_config = ConfigDict(from_attributes=True)


class MemberTodayStatus(BaseModel):
    user: UserRead
    has_checked_in: bool
    checkin: Optional[CheckinRead] = None
    current_streak: int = 0
