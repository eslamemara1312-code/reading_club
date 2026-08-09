from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class WeeklyTitleRead(BaseModel):
    id: str
    group_id: str
    user_id: str
    week_start_date: date
    title_type: str
    title_name: str
    created_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)
