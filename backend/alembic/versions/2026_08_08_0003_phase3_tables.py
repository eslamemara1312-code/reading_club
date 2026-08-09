"""phase3_tables_badges_titles

Revision ID: 2026_08_08_0003
Revises: 2026_08_08_0002
Create Date: 2026-08-08 19:34:00.000000

"""
import uuid
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '2026_08_08_0003'
down_revision: Union[str, None] = '2026_08_08_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # badges
    badges_table = op.create_table(
        'badges',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('slug', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('icon', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='milestone'),
        sa.Column('xp_award', sa.Integer(), nullable=False, server_default='50'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_badges_slug'), 'badges', ['slug'], unique=True)

    # user_badges
    op.create_table(
        'user_badges',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('badge_id', sa.String(length=36), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge')
    )

    # weekly_titles
    op.create_table(
        'weekly_titles',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('week_start_date', sa.Date(), nullable=False),
        sa.Column('title_type', sa.String(length=50), nullable=False),
        sa.Column('title_name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_titles_group_week', 'weekly_titles', ['group_id', 'week_start_date'], unique=False)

    # Seed default badges
    op.bulk_insert(
        badges_table,
        [
            {
                "id": str(uuid.uuid4()),
                "slug": "first_step",
                "name": "الخطوة الأولى",
                "description": "سجّلت أول قراءة لك في ورد",
                "icon": "🌱",
                "category": "milestone",
                "xp_award": 50
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "streak_7",
                "name": "أسطورة الأسبوع",
                "description": "حافظت على streak لمدة 7 أيام متتالية دون انقطاع",
                "icon": "🔥",
                "category": "streak",
                "xp_award": 150
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "streak_30",
                "name": "سيد الالتزام",
                "description": "حافظت على streak لمدة 30 يوماً متتالياً",
                "icon": "👑",
                "category": "streak",
                "xp_award": 500
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "century_reader",
                "name": "القارئ المئوي",
                "description": "قرأت أكثر من 100 صفحة إجمالاً",
                "icon": "📚",
                "category": "volume",
                "xp_award": 200
            },
            {
                "id": str(uuid.uuid4()),
                "slug": "early_bird",
                "name": "الطائر المبكر",
                "description": "سجلت قراءتك قبل الساعة 12 ظهراً",
                "icon": "🌅",
                "category": "special",
                "xp_award": 100
            }
        ]
    )


def downgrade() -> None:
    op.drop_index('idx_titles_group_week', table_name='weekly_titles')
    op.drop_table('weekly_titles')
    op.drop_table('user_badges')
    op.drop_index(op.f('ix_badges_slug'), table_name='badges')
    op.drop_table('badges')
