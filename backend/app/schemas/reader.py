from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BookAssetRead(BaseModel):
    id: str
    group_id: str
    book_id: str
    storage_key: str
    original_filename: str
    mime_type: str
    file_size_bytes: int
    uploaded_by_user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReadingProgressRead(BaseModel):
    id: str
    user_id: str
    group_id: str
    book_id: str
    book_asset_id: str
    current_page: int
    total_pages: Optional[int] = None
    progress_percent: Optional[float] = None
    last_read_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReadingProgressUpdate(BaseModel):
    current_page: int = Field(..., ge=1, description="1-indexed current page number")
    total_pages: Optional[int] = Field(None, ge=1, description="Total pages of the document if known")


class ReaderUrlResponse(BaseModel):
    url: str
    expires_in_seconds: int = 900
    book_asset_id: str


class BookAssetWithProgress(BaseModel):
    has_asset: bool
    asset: Optional[BookAssetRead] = None
    progress: Optional[ReadingProgressRead] = None
