"""Phase 7 — Shared In-App Book Reader tables (book_assets + reading_progress)."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = '2026_08_12_0007'
down_revision: Union[str, None] = '2026_08_08_0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # book_assets table
    op.create_table(
        'book_assets',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('book_id', sa.String(length=36), nullable=False),
        sa.Column('storage_key', sa.String(length=500), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('uploaded_by_user_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('storage_key', name='uq_book_asset_storage_key'),
        sa.UniqueConstraint('group_id', 'book_id', name='uq_book_asset_group_book')
    )
    op.create_index('ix_book_assets_group_book', 'book_assets', ['group_id', 'book_id'])

    # reading_progress table
    op.create_table(
        'reading_progress',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('book_id', sa.String(length=36), nullable=False),
        sa.Column('book_asset_id', sa.String(length=36), nullable=False),
        sa.Column('current_page', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_pages', sa.Integer(), nullable=True),
        sa.Column('progress_percent', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('last_read_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_asset_id'], ['book_assets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'book_asset_id', name='uq_reading_progress_user_asset')
    )
    op.create_index('ix_reading_progress_user_asset', 'reading_progress', ['user_id', 'book_asset_id'])


def downgrade() -> None:
    op.drop_index('ix_reading_progress_user_asset', table_name='reading_progress')
    op.drop_table('reading_progress')
    op.drop_index('ix_book_assets_group_book', table_name='book_assets')
    op.drop_table('book_assets')
