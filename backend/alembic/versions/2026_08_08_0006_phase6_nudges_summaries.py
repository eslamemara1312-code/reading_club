"""Phase 6 — Nudges + Monthly Summaries tables."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers
revision: str = '2026_08_08_0006'
down_revision: Union[str, None] = '2026_08_08_0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # nudges table
    op.create_table(
        'nudges',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('from_user_id', sa.String(length=36), nullable=False),
        sa.Column('to_user_id', sa.String(length=36), nullable=False),
        sa.Column('nudge_date', sa.Date(), nullable=False),
        sa.Column('resulted_in_checkin', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.ForeignKeyConstraint(['from_user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['to_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('from_user_id', 'to_user_id', 'nudge_date', name='uq_nudge_per_day')
    )

    # monthly_summaries table
    op.create_table(
        'monthly_summaries',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('month', sa.Date(), nullable=False),
        sa.Column('stats_json', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id']),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('monthly_summaries')
    op.drop_table('nudges')
