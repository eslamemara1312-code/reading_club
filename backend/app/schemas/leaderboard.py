from typing import Optional
from pydantic import BaseModel
from app.schemas.user import UserRead


class LeaderboardEntry(BaseModel):
    rank: int
    user: UserRead
    commitment_rate: float
    days_present: int
    days_total: int
    total_pages_read: int
    current_streak: int
    longest_streak: int
