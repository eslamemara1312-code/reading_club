from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.db.session import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.group_member import GroupMember
from app.models.discussion import Discussion, DiscussionReply
from app.schemas.discussion import (
    DiscussionCreate, DiscussionRead, DiscussionReplyCreate, DiscussionReplyRead
)
from app.schemas.user import UserRead

router = APIRouter(tags=["Discussions"])


@router.get("/groups/{group_id}/discussions", response_model=List[DiscussionRead])
async def list_group_discussions(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    res = await db.execute(
        select(Discussion)
        .options(
            joinedload(Discussion.user),
            selectinload(Discussion.replies).joinedload(DiscussionReply.user)
        )
        .where(Discussion.group_id == group_id)
        .order_by(Discussion.created_at.desc())
    )
    discussions = res.scalars().all()

    return [
        DiscussionRead(
            id=d.id,
            group_id=d.group_id,
            user_id=d.user_id,
            group_book_id=d.group_book_id,
            title=d.title,
            content=d.content,
            discussion_date=d.discussion_date,
            created_at=d.created_at,
            user=UserRead.model_validate(d.user),
            replies=[
                DiscussionReplyRead(
                    id=r.id,
                    discussion_id=r.discussion_id,
                    user_id=r.user_id,
                    content=r.content,
                    created_at=r.created_at,
                    user=UserRead.model_validate(r.user)
                )
                for r in d.replies
            ]
        )
        for d in discussions
    ]


@router.post("/groups/{group_id}/discussions", response_model=DiscussionRead, status_code=status.HTTP_201_CREATED)
async def create_discussion_thread(
    group_id: str,
    disc_in: DiscussionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    discussion = Discussion(
        group_id=group_id,
        user_id=current_user.id,
        group_book_id=disc_in.group_book_id,
        title=disc_in.title,
        content=disc_in.content
    )
    db.add(discussion)
    await db.commit()

    res = await db.execute(
        select(Discussion)
        .options(
            joinedload(Discussion.user),
            selectinload(Discussion.replies)
        )
        .where(Discussion.id == discussion.id)
    )
    full_d = res.scalar_one()

    return DiscussionRead(
        id=full_d.id,
        group_id=full_d.group_id,
        user_id=full_d.user_id,
        group_book_id=full_d.group_book_id,
        title=full_d.title,
        content=full_d.content,
        discussion_date=full_d.discussion_date,
        created_at=full_d.created_at,
        user=UserRead.model_validate(full_d.user),
        replies=[]
    )


@router.post("/discussions/{discussion_id}/replies", response_model=DiscussionReplyRead, status_code=status.HTTP_201_CREATED)
async def add_discussion_reply(
    discussion_id: str,
    reply_in: DiscussionReplyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    d_res = await db.execute(select(Discussion).where(Discussion.id == discussion_id))
    discussion = d_res.scalar_one_or_none()
    if not discussion:
        raise HTTPException(status_code=404, detail="Discussion thread not found")

    mem_res = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == discussion.group_id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        )
    )
    if not mem_res.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Access denied")

    reply = DiscussionReply(
        discussion_id=discussion_id,
        user_id=current_user.id,
        content=reply_in.content
    )
    db.add(reply)
    await db.commit()

    r_res = await db.execute(
        select(DiscussionReply)
        .options(joinedload(DiscussionReply.user))
        .where(DiscussionReply.id == reply.id)
    )
    full_r = r_res.scalar_one()

    return DiscussionReplyRead(
        id=full_r.id,
        discussion_id=full_r.discussion_id,
        user_id=full_r.user_id,
        content=full_r.content,
        created_at=full_r.created_at,
        user=UserRead.model_validate(full_r.user)
    )
