import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from fastapi import HTTPException, status

from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.book import Book, GroupBook
from app.models.book_asset import BookAsset
from app.models.reading_progress import ReadingProgress
from app.services import storage_service


async def verify_active_group_member(db: AsyncSession, group_id: str, user_id: str) -> Tuple[Group, GroupMember]:
    res_group = await db.execute(select(Group).where(Group.id == group_id))
    group = res_group.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    res_member = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.status == "active"
        )
    )
    member = res_member.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Active group membership required")

    return group, member


async def verify_book_in_group_or_catalog(db: AsyncSession, group_id: str, book_id: str) -> Book:
    res_book = await db.execute(select(Book).where(Book.id == book_id))
    book = res_book.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found in catalog")

    # Check if book is part of group books or catalog
    res_gb = await db.execute(
        select(GroupBook).where(GroupBook.group_id == group_id, GroupBook.book_id == book_id)
    )
    gb = res_gb.scalar_one_or_none()
    if not gb:
        # Check if any catalog book is being accessed by active group member
        pass

    return book


async def upload_or_replace_book_asset(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str,
    filename: str,
    content: bytes,
    content_type: str
) -> BookAsset:
    await verify_active_group_member(db, group_id, user_id)
    await verify_book_in_group_or_catalog(db, group_id, book_id)

    # Validate PDF content & size
    storage_service.validate_pdf_file(filename, content, content_type)

    # Check existing asset
    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    existing_asset = res_asset.scalar_one_or_none()

    new_asset_id = str(uuid.uuid4())
    storage_key = f"groups/{group_id}/books/{book_id}/{new_asset_id}.pdf"

    # Upload new file to storage
    await storage_service.upload_asset_object(storage_key, content, "application/pdf")

    if existing_asset:
        old_storage_key = existing_asset.storage_key
        # Delete existing reading progress rows because page numbers may no longer match
        await db.execute(
            delete(ReadingProgress).where(ReadingProgress.book_asset_id == existing_asset.id)
        )

        # Update existing asset record
        existing_asset.storage_key = storage_key
        existing_asset.original_filename = filename
        existing_asset.file_size_bytes = len(content)
        existing_asset.mime_type = "application/pdf"
        existing_asset.uploaded_by_user_id = user_id
        existing_asset.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(existing_asset)

        # Remove old file from storage asynchronously / cleanup
        if old_storage_key != storage_key:
            await storage_service.delete_asset_object(old_storage_key)

        return existing_asset
    else:
        new_asset = BookAsset(
            id=new_asset_id,
            group_id=group_id,
            book_id=book_id,
            storage_key=storage_key,
            original_filename=filename,
            mime_type="application/pdf",
            file_size_bytes=len(content),
            uploaded_by_user_id=user_id,
        )
        db.add(new_asset)
        await db.commit()
        await db.refresh(new_asset)
        return new_asset


async def get_book_asset_info(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str
) -> Tuple[Optional[BookAsset], Optional[ReadingProgress]]:
    await verify_active_group_member(db, group_id, user_id)

    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = res_asset.scalar_one_or_none()
    if not asset:
        return None, None

    res_progress = await db.execute(
        select(ReadingProgress).where(
            ReadingProgress.user_id == user_id,
            ReadingProgress.book_asset_id == asset.id
        )
    )
    progress = res_progress.scalar_one_or_none()
    return asset, progress


async def generate_reader_url(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str,
    expires_in_seconds: int = 900
) -> Tuple[str, str]:
    await verify_active_group_member(db, group_id, user_id)

    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = res_asset.scalar_one_or_none()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shared reader PDF not found for this book in this group"
        )

    signed_url = await storage_service.generate_signed_reader_url(
        asset.storage_key, expires_in_seconds=expires_in_seconds
    )
    return signed_url, asset.id


async def delete_book_asset(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str
) -> None:
    await verify_active_group_member(db, group_id, user_id)

    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = res_asset.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared PDF asset not found")

    storage_key = asset.storage_key

    # Delete linked reading progress records
    await db.execute(delete(ReadingProgress).where(ReadingProgress.book_asset_id == asset.id))
    # Delete asset record
    await db.delete(asset)
    await db.commit()

    # Remove storage file
    await storage_service.delete_asset_object(storage_key)


async def get_user_progress(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str
) -> Optional[ReadingProgress]:
    await verify_active_group_member(db, group_id, user_id)

    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = res_asset.scalar_one_or_none()
    if not asset:
        return None

    res_progress = await db.execute(
        select(ReadingProgress).where(
            ReadingProgress.user_id == user_id,
            ReadingProgress.book_asset_id == asset.id
        )
    )
    return res_progress.scalar_one_or_none()


async def upsert_user_progress(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    user_id: str,
    current_page: int,
    total_pages: Optional[int] = None
) -> ReadingProgress:
    if current_page < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="current_page must be an integer >= 1"
        )

    await verify_active_group_member(db, group_id, user_id)

    res_asset = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = res_asset.scalar_one_or_none()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cannot save progress because no shared PDF asset exists for this book"
        )

    res_progress = await db.execute(
        select(ReadingProgress).where(
            ReadingProgress.user_id == user_id,
            ReadingProgress.book_asset_id == asset.id
        )
    )
    progress = res_progress.scalar_one_or_none()

    progress_percent = None
    if total_pages and total_pages > 0:
        progress_percent = round((current_page / total_pages) * 100.0, 2)

    now = datetime.now(timezone.utc)

    if progress:
        progress.current_page = current_page
        if total_pages is not None:
            progress.total_pages = total_pages
        if progress_percent is not None:
            progress.progress_percent = progress_percent
        progress.last_read_at = now
        progress.updated_at = now
    else:
        progress = ReadingProgress(
            id=str(uuid.uuid4()),
            user_id=user_id,
            group_id=group_id,
            book_id=book_id,
            book_asset_id=asset.id,
            current_page=current_page,
            total_pages=total_pages,
            progress_percent=progress_percent,
            last_read_at=now,
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)
    return progress
