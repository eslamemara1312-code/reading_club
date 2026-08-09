from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserRead


class DiscussionReplyCreate(BaseModel):
    content: str


class DiscussionReplyRead(BaseModel):
    id: str
    discussion_id: str
    user_id: str
    content: str
    created_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)


class DiscussionCreate(BaseModel):
    title: str
    content: str
    group_book_id: Optional[str] = None


class DiscussionRead(BaseModel):
    id: str
    group_id: str
    user_id: str
    group_book_id: Optional[str] = None
    title: str
    content: str
    discussion_date: date
    created_at: datetime
    user: UserRead
    replies: List[DiscussionReplyRead] = []

    model_config = ConfigDict(from_attributes=True)
