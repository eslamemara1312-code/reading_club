from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.schemas.reader import (
    BookAssetRead,
    ReadingProgressRead,
    ReadingProgressUpdate,
    ReaderUrlResponse,
    BookAssetWithProgress
)
from app.services import reader_service, storage_service

router = APIRouter(tags=["Shared Reader"])


@router.post(
    "/groups/{group_id}/books/{book_id}/asset",
    response_model=BookAssetRead,
    status_code=status.HTTP_201_CREATED
)
async def upload_shared_book_asset(
    group_id: str,
    book_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    asset = await reader_service.upload_or_replace_book_asset(
        db=db,
        group_id=group_id,
        book_id=book_id,
        user_id=current_user.id,
        filename=file.filename or "book.pdf",
        content=content,
        content_type=file.content_type or "application/pdf"
    )
    return BookAssetRead.model_validate(asset)


@router.get(
    "/groups/{group_id}/books/{book_id}/asset",
    response_model=BookAssetWithProgress
)
async def get_book_asset_metadata(
    group_id: str,
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    asset, progress = await reader_service.get_book_asset_info(
        db=db, group_id=group_id, book_id=book_id, user_id=current_user.id
    )
    if not asset:
        return BookAssetWithProgress(has_asset=False, asset=None, progress=None)

    return BookAssetWithProgress(
        has_asset=True,
        asset=BookAssetRead.model_validate(asset),
        progress=ReadingProgressRead.model_validate(progress) if progress else None
    )


@router.get(
    "/groups/{group_id}/books/{book_id}/reader-url",
    response_model=ReaderUrlResponse
)
async def get_authorized_reader_url(
    group_id: str,
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    signed_url, asset_id = await reader_service.generate_reader_url(
        db=db, group_id=group_id, book_id=book_id, user_id=current_user.id
    )
    return ReaderUrlResponse(
        url=signed_url,
        expires_in_seconds=900,
        book_asset_id=asset_id
    )


@router.delete(
    "/groups/{group_id}/books/{book_id}/asset",
    status_code=status.HTTP_200_OK
)
async def delete_shared_book_asset(
    group_id: str,
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await reader_service.delete_book_asset(
        db=db, group_id=group_id, book_id=book_id, user_id=current_user.id
    )
    return {"message": "Shared book asset removed successfully"}


@router.get(
    "/groups/{group_id}/books/{book_id}/progress",
    response_model=ReadingProgressRead
)
async def get_reading_progress(
    group_id: str,
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    progress = await reader_service.get_user_progress(
        db=db, group_id=group_id, book_id=book_id, user_id=current_user.id
    )
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No reading progress found for this book asset"
        )
    return ReadingProgressRead.model_validate(progress)


@router.put(
    "/groups/{group_id}/books/{book_id}/progress",
    response_model=ReadingProgressRead
)
async def update_reading_progress(
    group_id: str,
    book_id: str,
    progress_in: ReadingProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    progress = await reader_service.upsert_user_progress(
        db=db,
        group_id=group_id,
        book_id=book_id,
        user_id=current_user.id,
        current_page=progress_in.current_page,
        total_pages=progress_in.total_pages
    )
    return ReadingProgressRead.model_validate(progress)


@router.get(
    "/reader/stream/{token}",
    response_class=FileResponse
)
async def stream_local_reader_file(token: str):
    file_path = storage_service.get_local_stream_file(token)
    return FileResponse(file_path, media_type="application/pdf")
