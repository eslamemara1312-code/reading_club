from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class GroupCreate(BaseModel):
    name: str
    checkin_deadline_time: Optional[str] = "00:00"
    grace_period_hours: Optional[int] = 3
    fine_amount: Optional[float] = 20.00
    currency: Optional[str] = "EGP"
    fun_mode_enabled: Optional[bool] = True
    monthly_page_goal: Optional[int] = None


class GroupJoin(BaseModel):
    invite_code: str


class GroupSettingsUpdate(BaseModel):
    name: Optional[str] = None
    checkin_deadline_time: Optional[str] = None
    grace_period_hours: Optional[int] = None
    fine_amount: Optional[float] = None
    currency: Optional[str] = None
    fun_mode_enabled: Optional[bool] = None
    monthly_page_goal: Optional[int] = None


class GroupMemberRead(BaseModel):
    id: str
    group_id: str
    user_id: str
    role: str
    status: str
    joined_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)


class GroupRead(BaseModel):
    id: str
    name: str
    invite_code: str
    owner_id: str
    checkin_deadline_time: str
    grace_period_hours: int
    fine_amount: float
    currency: str
    fun_mode_enabled: bool
    monthly_page_goal: Optional[int] = None
    created_at: datetime
    members_count: int = 0
    members: Optional[List[GroupMemberRead]] = None

    model_config = ConfigDict(from_attributes=True)
