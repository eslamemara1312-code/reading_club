from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BadgeRead(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    icon: str
    category: str
    xp_award: int

    model_config = ConfigDict(from_attributes=True)


class UserBadgeRead(BaseModel):
    id: str
    user_id: str
    badge_id: str
    earned_at: datetime
    badge: BadgeRead

    model_config = ConfigDict(from_attributes=True)


class FrameUpdate(BaseModel):
    current_frame: str  # none, gold, fire, emerald
