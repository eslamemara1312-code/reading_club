from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class BookCreate(BaseModel):
    title: str
    author: str
    cover_url: Optional[str] = None
    total_pages: int
    category: Optional[str] = None


class BookRead(BaseModel):
    id: str
    title: str
    author: str
    cover_url: Optional[str] = None
    total_pages: int
    category: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GroupBookCreate(BaseModel):
    book_id: str
    start_date: date
    target_end_date: date


class GroupBookRead(BaseModel):
    id: str
    group_id: str
    book_id: str
    start_date: date
    target_end_date: date
    daily_target_pages: int
    status: str
    created_at: datetime
    book: BookRead

    model_config = ConfigDict(from_attributes=True)
