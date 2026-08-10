from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.book import Book, GroupBook
from app.schemas.book import BookCreate, BookRead, GroupBookCreate, GroupBookRead
from app.services.book_service import set_active_group_book

import httpx
from fastapi.responses import Response

router = APIRouter(tags=["Books"])


@router.get("/books/cover-proxy")
async def proxy_book_cover(url: str):
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            resp = await client.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                }
            )
            if resp.status_code == 200:
                content_type = resp.headers.get("content-type", "image/jpeg")
                return Response(content=resp.content, media_type=content_type)
    except Exception as e:
        print("Cover Proxy error:", e)
    
    raise HTTPException(status_code=404, detail="Could not fetch cover image")


@router.get("/books", response_model=List[BookRead])
async def list_books(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Book).order_by(Book.created_at.desc()))
    return [BookRead.model_validate(b) for b in res.scalars().all()]


@router.post("/books", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_in: BookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    book = Book(**book_in.model_dump())
    db.add(book)
    await db.commit()
    await db.refresh(book)
    return BookRead.model_validate(book)


from app.models.discussion import Discussion

@router.delete("/books/{book_id}")
async def delete_book(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Book).where(Book.id == book_id))
    book = res.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Clean up associated group_books and discussion references first
    gb_res = await db.execute(select(GroupBook).where(GroupBook.book_id == book_id))
    group_books = gb_res.scalars().all()
    for gb in group_books:
        disc_res = await db.execute(select(Discussion).where(Discussion.group_book_id == gb.id))
        for d in disc_res.scalars().all():
            d.group_book_id = None
        await db.delete(gb)

    await db.delete(book)
    await db.commit()
    return {"message": "Book deleted from catalog successfully"}


@router.get("/groups/{group_id}/books/active", response_model=Optional[GroupBookRead])
async def get_active_group_book(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(GroupBook)
        .options(joinedload(GroupBook.book))
        .where(GroupBook.group_id == group_id, GroupBook.status == "active")
    )
    gb = res.scalar_one_or_none()
    if not gb:
        return None

    return GroupBookRead(
        id=gb.id,
        group_id=gb.group_id,
        book_id=gb.book_id,
        start_date=gb.start_date,
        target_end_date=gb.target_end_date,
        daily_target_pages=gb.daily_target_pages,
        status=gb.status,
        created_at=gb.created_at,
        book=BookRead.model_validate(gb.book)
    )


@router.post("/groups/{group_id}/books", response_model=GroupBookRead, status_code=status.HTTP_201_CREATED)
async def set_group_book_plan(
    group_id: str,
    plan_in: GroupBookCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify owner
    group_res = await db.execute(select(Group).where(Group.id == group_id))
    group = group_res.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    member = mem_res.scalar_one_or_none()
    is_owner = (group.owner_id == current_user.id) or (member is not None and member.role == "owner")
    if not is_owner:
        raise HTTPException(status_code=403, detail="Only the group owner can set the active reading plan")

    try:
        gb = await set_active_group_book(
            db, group_id, plan_in.book_id, plan_in.start_date, plan_in.target_end_date
        )
        await db.commit()

        # Fetch joined book
        res = await db.execute(
            select(GroupBook).options(joinedload(GroupBook.book)).where(GroupBook.id == gb.id)
        )
        full_gb = res.scalar_one()

        return GroupBookRead(
            id=full_gb.id,
            group_id=full_gb.group_id,
            book_id=full_gb.book_id,
            start_date=full_gb.start_date,
            target_end_date=full_gb.target_end_date,
            daily_target_pages=full_gb.daily_target_pages,
            status=full_gb.status,
            created_at=full_gb.created_at,
            book=BookRead.model_validate(full_gb.book)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/groups/{group_id}/books", response_model=List[GroupBookRead])
async def get_all_group_books(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(GroupBook)
        .options(joinedload(GroupBook.book))
        .where(GroupBook.group_id == group_id)
        .order_by(GroupBook.created_at.desc())
    )
    gbs = res.scalars().all()
    return [
        GroupBookRead(
            id=gb.id,
            group_id=gb.group_id,
            book_id=gb.book_id,
            start_date=gb.start_date,
            target_end_date=gb.target_end_date,
            daily_target_pages=gb.daily_target_pages,
            status=gb.status,
            created_at=gb.created_at,
            book=BookRead.model_validate(gb.book)
        ) for gb in gbs
    ]


@router.delete("/groups/{group_id}/books/{group_book_id}")
async def delete_group_book(
    group_id: str,
    group_book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(GroupBook).where(GroupBook.id == group_book_id, GroupBook.group_id == group_id)
    )
    gb = res.scalar_one_or_none()
    if not gb:
        raise HTTPException(status_code=404, detail="Book plan not found")
    
    disc_res = await db.execute(select(Discussion).where(Discussion.group_book_id == group_book_id))
    for d in disc_res.scalars().all():
        d.group_book_id = None

    await db.delete(gb)
    await db.commit()
    return {"message": "Book removed successfully"}
