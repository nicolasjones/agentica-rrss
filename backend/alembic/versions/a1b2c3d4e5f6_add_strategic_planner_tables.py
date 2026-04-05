"""Add strategic planner tables (EcosystemEvent, StrategicBatch, StrategicPost)

Revision ID: a1b2c3d4e5f6
Revises: 5600a3685d5e
Create Date: 2026-04-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '5600a3685d5e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE eventcategory AS ENUM ('launch', 'gig', 'bts', 'announcement', 'other')")
    op.execute("CREATE TYPE batchstatus AS ENUM ('proposed', 'accepted', 'archived')")
    op.execute("CREATE TYPE batchtimeframe AS ENUM ('weekly', 'biweekly', 'monthly')")

    op.create_table(
        'ecosystem_events',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('band_id', sa.Integer(), sa.ForeignKey('bands.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_date', sa.Date(), nullable=False),
        sa.Column('category', sa.Enum('launch', 'gig', 'bts', 'announcement', 'other', name='eventcategory'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_ecosystem_events_band_date', 'ecosystem_events', ['band_id', 'event_date'])

    op.create_table(
        'strategic_batches',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('band_id', sa.Integer(), sa.ForeignKey('bands.id'), nullable=False),
        sa.Column('status', sa.Enum('proposed', 'accepted', 'archived', name='batchstatus'), nullable=True),
        sa.Column('timeframe', sa.Enum('weekly', 'biweekly', 'monthly', name='batchtimeframe'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_strategic_batches_band_status', 'strategic_batches', ['band_id', 'status'])

    op.create_table(
        'strategic_posts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('batch_id', sa.Integer(), sa.ForeignKey('strategic_batches.id'), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('ecosystem_events.id'), nullable=True),
        sa.Column('parent_post_id', sa.Integer(), sa.ForeignKey('strategic_posts.id'), nullable=True),
        sa.Column('platform', sa.String(50), nullable=False),
        sa.Column('caption', sa.Text(), nullable=False),
        sa.Column('hashtags', sa.JSON(), nullable=True),
        sa.Column('scheduled_date', sa.Date(), nullable=True),
        sa.Column('is_approved', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('strategic_posts')
    op.drop_index('idx_strategic_batches_band_status', table_name='strategic_batches')
    op.drop_table('strategic_batches')
    op.drop_index('idx_ecosystem_events_band_date', table_name='ecosystem_events')
    op.drop_table('ecosystem_events')
    op.execute("DROP TYPE IF EXISTS batchtimeframe")
    op.execute("DROP TYPE IF EXISTS batchstatus")
    op.execute("DROP TYPE IF EXISTS eventcategory")
