from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.reader_annotations import (
    ReaderBookmarkCreate, ReaderBookmarkRead, ReaderHighlightCreate, ReaderHighlightRead,
    ReaderHighlightUpdate, ReaderNoteCreate, ReaderNoteRead, ReaderNoteUpdate, ReaderAnnotationsRead,
)
from app.services import reader_annotation_service

router = APIRouter(tags=["Reader annotations"])


@router.get("/groups/{group_id}/books/{book_id}/annotations", response_model=ReaderAnnotationsRead)
async def get_reader_annotations(group_id: str, book_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    bookmarks, notes, highlights = await reader_annotation_service.list_all_annotations(db, group_id, book_id, current_user.id)
    return ReaderAnnotationsRead(bookmarks=bookmarks, notes=notes, highlights=highlights)


@router.get("/groups/{group_id}/books/{book_id}/bookmarks", response_model=list[ReaderBookmarkRead])
async def list_reader_bookmarks(group_id: str, book_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.list_bookmarks(db, group_id, book_id, current_user.id)


@router.post("/groups/{group_id}/books/{book_id}/bookmarks", response_model=ReaderBookmarkRead, status_code=status.HTTP_201_CREATED)
async def create_reader_bookmark(group_id: str, book_id: str, payload: ReaderBookmarkCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.create_bookmark(db, group_id, book_id, current_user.id, payload.page_number)


@router.delete("/groups/{group_id}/books/{book_id}/bookmarks/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reader_bookmark(group_id: str, book_id: str, bookmark_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await reader_annotation_service.delete_bookmark(db, group_id, book_id, bookmark_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/groups/{group_id}/books/{book_id}/notes", response_model=list[ReaderNoteRead])
async def list_reader_notes(group_id: str, book_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.list_notes(db, group_id, book_id, current_user.id)


@router.post("/groups/{group_id}/books/{book_id}/notes", response_model=ReaderNoteRead, status_code=status.HTTP_201_CREATED)
async def create_reader_note(group_id: str, book_id: str, payload: ReaderNoteCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.create_note(db, group_id, book_id, current_user.id, payload.model_dump())


@router.patch("/groups/{group_id}/books/{book_id}/notes/{note_id}", response_model=ReaderNoteRead)
async def update_reader_note(group_id: str, book_id: str, note_id: str, payload: ReaderNoteUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.update_note(db, group_id, book_id, note_id, current_user.id, payload.model_dump(exclude_unset=True))


@router.delete("/groups/{group_id}/books/{book_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reader_note(group_id: str, book_id: str, note_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await reader_annotation_service.delete_note(db, group_id, book_id, note_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/groups/{group_id}/books/{book_id}/highlights", response_model=list[ReaderHighlightRead])
async def list_reader_highlights(group_id: str, book_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.list_highlights(db, group_id, book_id, current_user.id)


@router.post("/groups/{group_id}/books/{book_id}/highlights", response_model=ReaderHighlightRead, status_code=status.HTTP_201_CREATED)
async def create_reader_highlight(group_id: str, book_id: str, payload: ReaderHighlightCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.create_highlight(db, group_id, book_id, current_user.id, payload.model_dump())


@router.patch("/groups/{group_id}/books/{book_id}/highlights/{highlight_id}", response_model=ReaderHighlightRead)
async def update_reader_highlight(group_id: str, book_id: str, highlight_id: str, payload: ReaderHighlightUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await reader_annotation_service.update_highlight(db, group_id, book_id, highlight_id, current_user.id, payload.model_dump(exclude_unset=True))


@router.delete("/groups/{group_id}/books/{book_id}/highlights/{highlight_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reader_highlight(group_id: str, book_id: str, highlight_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await reader_annotation_service.delete_highlight(db, group_id, book_id, highlight_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
