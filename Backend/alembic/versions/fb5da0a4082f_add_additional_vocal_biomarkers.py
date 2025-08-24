"""add_additional_vocal_biomarkers

Revision ID: fb5da0a4082f
Revises: 001
Create Date: 2025-08-20 05:12:50.058875

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fb5da0a4082f'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add additional vocal biomarker columns to analysis_results table
    op.add_column('analysis_results', sa.Column('pitch_std_hz', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('pitch_range_hz', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('mean_hnr_db', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('mfcc_1', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_contrast', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('zero_crossing_rate', sa.Float(), nullable=True))


def downgrade() -> None:
    # Remove additional vocal biomarker columns
    op.drop_column('analysis_results', 'zero_crossing_rate')
    op.drop_column('analysis_results', 'spectral_contrast')
    op.drop_column('analysis_results', 'mfcc_1')
    op.drop_column('analysis_results', 'mean_hnr_db')
    op.drop_column('analysis_results', 'pitch_range_hz')
    op.drop_column('analysis_results', 'pitch_std_hz') 