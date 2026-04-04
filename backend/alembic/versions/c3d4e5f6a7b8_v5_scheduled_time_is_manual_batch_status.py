"""V5: add scheduled_time + is_manual to strategic_posts; add manual_draft to batchstatus enum

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend the batchstatus enum with the new value (PostgreSQL-safe)
    op.execute("ALTER TYPE batchstatus ADD VALUE IF NOT EXISTS 'manual_draft'")

    # Add V5 scheduling and origin-flag columns
    op.add_column('strategic_posts', sa.Column('scheduled_time', sa.Time(), nullable=True))
    op.add_column('strategic_posts', sa.Column('is_manual', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('strategic_posts', 'is_manual')
    op.drop_column('strategic_posts', 'scheduled_time')
    # PostgreSQL does not support removing enum values; leave batchstatus as-is
