from typing import Any, Optional, TypeVar

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.book_asset import BookAsset
from app.models.reader_bookmark import ReaderBookmark
from app.models.reader_highlight import ReaderHighlight
from app.models.reader_note import ReaderNote
from app.services.reader_service import verify_active_group_member

AnnotationModel = TypeVar("AnnotationModel", ReaderBookmark, ReaderNote, ReaderHighlight)


async def get_reader_asset(db: AsyncSession, group_id: str, book_id: str, user_id: str) -> BookAsset:
    await verify_active_group_member(db, group_id, user_id)
    result = await db.execute(
        select(BookAsset).where(BookAsset.group_id == group_id, BookAsset.book_id == book_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared reader PDF not found for this book")
    return asset


async def list_bookmarks(db: AsyncSession, group_id: str, book_id: str, user_id: str) -> list[ReaderBookmark]:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(
        select(ReaderBookmark).where(
            ReaderBookmark.user_id == user_id, ReaderBookmark.book_asset_id == asset.id
        ).order_by(ReaderBookmark.page_number, ReaderBookmark.created_at)
    )
    return list(result.scalars().all())


async def list_all_annotations(
    db: AsyncSession, group_id: str, book_id: str, user_id: str
) -> tuple[list[ReaderBookmark], list[ReaderNote], list[ReaderHighlight]]:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    bookmarks_result = await db.execute(select(ReaderBookmark).where(
        ReaderBookmark.user_id == user_id, ReaderBookmark.book_asset_id == asset.id
    ).order_by(ReaderBookmark.page_number, ReaderBookmark.created_at))
    notes_result = await db.execute(select(ReaderNote).where(
        ReaderNote.user_id == user_id, ReaderNote.book_asset_id == asset.id
    ).order_by(ReaderNote.page_number, ReaderNote.created_at))
    highlights_result = await db.execute(select(ReaderHighlight).where(
        ReaderHighlight.user_id == user_id, ReaderHighlight.book_asset_id == asset.id
    ).order_by(ReaderHighlight.page_number, ReaderHighlight.created_at))
    return (
        list(bookmarks_result.scalars().all()),
        list(notes_result.scalars().all()),
        list(highlights_result.scalars().all()),
    )


async def create_bookmark(db: AsyncSession, group_id: str, book_id: str, user_id: str, page_number: int) -> ReaderBookmark:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    existing = await db.execute(
        select(ReaderBookmark).where(
            ReaderBookmark.user_id == user_id,
            ReaderBookmark.book_asset_id == asset.id,
            ReaderBookmark.page_number == page_number,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A bookmark already exists on this page")
    bookmark = ReaderBookmark(user_id=user_id, group_id=group_id, book_id=book_id, book_asset_id=asset.id, page_number=page_number)
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return bookmark


async def delete_bookmark(db: AsyncSession, group_id: str, book_id: str, bookmark_id: str, user_id: str) -> None:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderBookmark).where(
        ReaderBookmark.id == bookmark_id, ReaderBookmark.user_id == user_id, ReaderBookmark.book_asset_id == asset.id
    ))
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found")
    await db.delete(bookmark)
    await db.commit()


async def list_notes(db: AsyncSession, group_id: str, book_id: str, user_id: str) -> list[ReaderNote]:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderNote).where(
        ReaderNote.user_id == user_id, ReaderNote.book_asset_id == asset.id
    ).order_by(ReaderNote.page_number, ReaderNote.created_at))
    return list(result.scalars().all())


async def create_note(db: AsyncSession, group_id: str, book_id: str, user_id: str, payload: dict[str, Any]) -> ReaderNote:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    note = ReaderNote(user_id=user_id, group_id=group_id, book_id=book_id, book_asset_id=asset.id, **payload)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def update_note(db: AsyncSession, group_id: str, book_id: str, note_id: str, user_id: str, payload: dict[str, Any]) -> ReaderNote:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderNote).where(
        ReaderNote.id == note_id, ReaderNote.user_id == user_id, ReaderNote.book_asset_id == asset.id
    ))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    for field, value in payload.items():
        setattr(note, field, value)
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, group_id: str, book_id: str, note_id: str, user_id: str) -> None:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderNote).where(
        ReaderNote.id == note_id, ReaderNote.user_id == user_id, ReaderNote.book_asset_id == asset.id
    ))
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    await db.delete(note)
    await db.commit()


async def list_highlights(db: AsyncSession, group_id: str, book_id: str, user_id: str) -> list[ReaderHighlight]:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderHighlight).where(
        ReaderHighlight.user_id == user_id, ReaderHighlight.book_asset_id == asset.id
    ).order_by(ReaderHighlight.page_number, ReaderHighlight.created_at))
    return list(result.scalars().all())


async def create_highlight(db: AsyncSession, group_id: str, book_id: str, user_id: str, payload: dict[str, Any]) -> ReaderHighlight:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    highlight = ReaderHighlight(user_id=user_id, group_id=group_id, book_id=book_id, book_asset_id=asset.id, **payload)
    db.add(highlight)
    await db.commit()
    await db.refresh(highlight)
    return highlight


async def update_highlight(db: AsyncSession, group_id: str, book_id: str, highlight_id: str, user_id: str, payload: dict[str, Any]) -> ReaderHighlight:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderHighlight).where(
        ReaderHighlight.id == highlight_id, ReaderHighlight.user_id == user_id, ReaderHighlight.book_asset_id == asset.id
    ))
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Highlight not found")
    for field, value in payload.items():
        setattr(highlight, field, value)
    await db.commit()
    await db.refresh(highlight)
    return highlight


async def delete_highlight(db: AsyncSession, group_id: str, book_id: str, highlight_id: str, user_id: str) -> None:
    asset = await get_reader_asset(db, group_id, book_id, user_id)
    result = await db.execute(select(ReaderHighlight).where(
        ReaderHighlight.id == highlight_id, ReaderHighlight.user_id == user_id, ReaderHighlight.book_asset_id == asset.id
    ))
    highlight = result.scalar_one_or_none()
    if not highlight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Highlight not found")
    await db.delete(highlight)
    await db.commit()
