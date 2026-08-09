"""phase4_tables_books_discussions

Revision ID: 2026_08_08_0004
Revises: 2026_08_08_0003
Create Date: 2026-08-08 19:52:00.000000

"""
import uuid
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '2026_08_08_0004'
down_revision: Union[str, None] = '2026_08_08_0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from datetime import datetime, timezone

def upgrade() -> None:
    # books
    books_table = op.create_table(
        'books',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('author', sa.String(length=150), nullable=False),
        sa.Column('cover_url', sa.String(length=500), nullable=True),
        sa.Column('total_pages', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # group_books
    op.create_table(
        'group_books',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('book_id', sa.String(length=36), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('target_end_date', sa.Date(), nullable=False),
        sa.Column('daily_target_pages', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # discussions
    op.create_table(
        'discussions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('group_book_id', sa.String(length=36), nullable=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('discussion_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_book_id'], ['group_books.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # discussion_replies
    op.create_table(
        'discussion_replies',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('discussion_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['discussion_id'], ['discussions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Seed initial catalog books
    now_dt = datetime.now(timezone.utc)
    op.bulk_insert(
        books_table,
        [
            {
                "id": str(uuid.uuid4()),
                "title": "العادات الذرية",
                "author": "جيمس كلير",
                "cover_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c",
                "total_pages": 320,
                "category": "تطوير الذات",
                "created_at": now_dt
            },
            {
                "id": str(uuid.uuid4()),
                "title": "معنى المحنة",
                "author": "د. مصطفى محمود",
                "cover_url": "https://images.unsplash.com/photo-1512820790803-83ca734da794",
                "total_pages": 140,
                "category": "فكر وفلسفة",
                "created_at": now_dt
            },
            {
                "id": str(uuid.uuid4()),
                "title": "تفريج الكروب",
                "author": "ابن رجب الحنبلي",
                "cover_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6",
                "total_pages": 180,
                "category": "تزكية ونفس",
                "created_at": now_dt
            }
        ]
    )


def downgrade() -> None:
    op.drop_table('discussion_replies')
    op.drop_table('discussions')
    op.drop_table('group_books')
    op.drop_table('books')
