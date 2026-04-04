"""Add concept_title, narrative_goal to strategic_posts; make caption nullable

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-03 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Phase 1 ideation columns
    op.add_column('strategic_posts', sa.Column('concept_title', sa.String(255), nullable=True))
    op.add_column('strategic_posts', sa.Column('narrative_goal', sa.Text(), nullable=True))

    # Make caption optional (Phase 2 / Signal stage only)
    op.alter_column('strategic_posts', 'caption', nullable=True)


def downgrade() -> None:
    # Restore caption to NOT NULL (fill empty first to avoid constraint violation)
    op.execute("UPDATE strategic_posts SET caption = '' WHERE caption IS NULL")
    op.alter_column('strategic_posts', 'caption', nullable=False)
    op.drop_column('strategic_posts', 'narrative_goal')
    op.drop_column('strategic_posts', 'concept_title')
