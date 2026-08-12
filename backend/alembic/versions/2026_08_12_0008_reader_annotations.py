"""Add private reader bookmarks, notes, and highlights."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2026_08_12_0008"
down_revision: Union[str, None] = "2026_08_12_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    def common_columns():
        return [
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("group_id", sa.String(length=36), nullable=False),
            sa.Column("book_id", sa.String(length=36), nullable=False),
            sa.Column("book_asset_id", sa.String(length=36), nullable=False),
            sa.Column("page_number", sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["book_asset_id"], ["book_assets.id"], ondelete="CASCADE"),
        ]

    op.create_table(
        "reader_bookmarks",
        *common_columns(),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "book_asset_id", "page_number", name="uq_reader_bookmark_user_asset_page"),
    )
    op.create_index("ix_reader_bookmarks_user_asset", "reader_bookmarks", ["user_id", "book_asset_id"])

    op.create_table(
        "reader_notes",
        *common_columns(),
        sa.Column("selected_text", sa.Text(), nullable=True),
        sa.Column("note_text", sa.Text(), nullable=False),
        sa.Column("position_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reader_notes_user_asset", "reader_notes", ["user_id", "book_asset_id"])

    op.create_table(
        "reader_highlights",
        *common_columns(),
        sa.Column("selected_text", sa.Text(), nullable=False),
        sa.Column("color", sa.String(length=32), nullable=False, server_default="yellow"),
        sa.Column("position_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reader_highlights_user_asset", "reader_highlights", ["user_id", "book_asset_id"])


def downgrade() -> None:
    op.drop_index("ix_reader_highlights_user_asset", table_name="reader_highlights")
    op.drop_table("reader_highlights")
    op.drop_index("ix_reader_notes_user_asset", table_name="reader_notes")
    op.drop_table("reader_notes")
    op.drop_index("ix_reader_bookmarks_user_asset", table_name="reader_bookmarks")
    op.drop_table("reader_bookmarks")
