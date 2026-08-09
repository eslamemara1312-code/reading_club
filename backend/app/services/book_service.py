import math
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.book import Book, GroupBook


def calculate_daily_target(total_pages: int, start_date: date, target_end_date: date) -> int:
    """Calculates daily target pages required to finish book by target_end_date."""
    days = (target_end_date - start_date).days
    if days <= 0:
        return total_pages
    return math.ceil(total_pages / days)


async def set_active_group_book(
    db: AsyncSession,
    group_id: str,
    book_id: str,
    start_date: date,
    target_end_date: date
) -> GroupBook:
    """Sets a book as the active reading plan for a group."""
    # Deactivate any currently active group book
    res = await db.execute(
        select(GroupBook).where(GroupBook.group_id == group_id, GroupBook.status == "active")
    )
    active_gb = res.scalars().all()
    for gb in active_gb:
        gb.status = "completed"

    # Fetch book details
    b_res = await db.execute(select(Book).where(Book.id == book_id))
    book = b_res.scalar_one_or_none()
    if not book:
        raise ValueError("Book not found")

    daily_target = calculate_daily_target(book.total_pages, start_date, target_end_date)

    group_book = GroupBook(
        group_id=group_id,
        book_id=book_id,
        start_date=start_date,
        target_end_date=target_end_date,
        daily_target_pages=daily_target,
        status="active"
    )
    db.add(group_book)
    await db.flush()
    return group_book
