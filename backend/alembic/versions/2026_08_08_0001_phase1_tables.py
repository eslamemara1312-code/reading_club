"""phase1_initial_tables

Revision ID: 2026_08_08_0001
Revises: 
Create Date: 2026-08-08 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '2026_08_08_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('xp_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('current_frame', sa.String(length=50), nullable=False, server_default='none'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # groups
    op.create_table(
        'groups',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('invite_code', sa.String(length=10), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('checkin_deadline_time', sa.String(length=5), nullable=False, server_default='00:00'),
        sa.Column('grace_period_hours', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('fine_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='20.00'),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='EGP'),
        sa.Column('fun_mode_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('monthly_page_goal', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_groups_invite_code'), 'groups', ['invite_code'], unique=True)

    # group_members
    op.create_table(
        'group_members',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='member'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('group_id', 'user_id', name='uq_group_user')
    )

    # checkins
    op.create_table(
        'checkins',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('checkin_date', sa.Date(), nullable=False),
        sa.Column('pages_read', sa.Integer(), nullable=True),
        sa.Column('note', sa.String(length=280), nullable=True),
        sa.Column('checked_in_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_late', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'group_id', 'checkin_date', name='uq_user_group_checkin_date')
    )
    op.create_index('idx_checkins_group_date', 'checkins', ['group_id', 'checkin_date'], unique=False)
    op.create_index('idx_checkins_user_group_date', 'checkins', ['user_id', 'group_id', 'checkin_date'], unique=False)

    # streaks
    op.create_table(
        'streaks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('group_id', sa.String(length=36), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_checkin_date', sa.Date(), nullable=True),
        sa.Column('freezes_remaining', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('freezes_used_total', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'group_id', name='uq_user_group_streak')
    )
    op.create_index('idx_streaks_group_current', 'streaks', ['group_id', 'current_streak'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_streaks_group_current', table_name='streaks')
    op.drop_table('streaks')
    op.drop_index('idx_checkins_user_group_date', table_name='checkins')
    op.drop_index('idx_checkins_group_date', table_name='checkins')
    op.drop_table('checkins')
    op.drop_table('group_members')
    op.drop_index(op.f('ix_groups_invite_code'), table_name='groups')
    op.drop_table('groups')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
