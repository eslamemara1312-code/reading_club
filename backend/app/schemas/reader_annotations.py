from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class ReaderBookmarkCreate(BaseModel):
    page_number: int = Field(..., ge=1)


class ReaderBookmarkRead(ReaderBookmarkCreate):
    id: str
    user_id: str
    group_id: str
    book_id: str
    book_asset_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReaderNoteCreate(BaseModel):
    page_number: int = Field(..., ge=1)
    note_text: str = Field(..., min_length=1, max_length=10000)
    selected_text: Optional[str] = Field(None, max_length=20000)
    position_data: Optional[dict[str, Any]] = None


class ReaderNoteUpdate(BaseModel):
    note_text: Optional[str] = Field(None, min_length=1, max_length=10000)
    selected_text: Optional[str] = Field(None, max_length=20000)
    position_data: Optional[dict[str, Any]] = None


class ReaderNoteRead(ReaderNoteCreate):
    id: str
    user_id: str
    group_id: str
    book_id: str
    book_asset_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReaderHighlightCreate(BaseModel):
    page_number: int = Field(..., ge=1)
    selected_text: str = Field(..., min_length=1, max_length=20000)
    color: str = Field("yellow", min_length=1, max_length=32)
    position_data: Optional[dict[str, Any]] = None


class ReaderHighlightUpdate(BaseModel):
    color: Optional[str] = Field(None, min_length=1, max_length=32)
    position_data: Optional[dict[str, Any]] = None


class ReaderHighlightRead(ReaderHighlightCreate):
    id: str
    user_id: str
    group_id: str
    book_id: str
    book_asset_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ReaderAnnotationsRead(BaseModel):
    bookmarks: list[ReaderBookmarkRead]
    notes: list[ReaderNoteRead]
    highlights: list[ReaderHighlightRead]
