"""Add enhanced linguistic analysis fields

Revision ID: 002_enhanced_linguistic_analysis
Revises: fb5da0a4082f
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_enhanced_linguistic_analysis'
down_revision = 'fb5da0a4082f'
branch_labels = None
depends_on = None


def upgrade():
    # Add new enhanced linguistic analysis fields to analysis_results table
    op.add_column('analysis_results', sa.Column('overall_sentiment', sa.String(50), nullable=True))
    op.add_column('analysis_results', sa.Column('overall_sentiment_score', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('emotions_breakdown', sa.JSON(), nullable=True))
    op.add_column('analysis_results', sa.Column('dominant_emotion', sa.String(50), nullable=True))
    op.add_column('analysis_results', sa.Column('emotion_confidence', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('dialogue_acts_breakdown', sa.JSON(), nullable=True))
    op.add_column('analysis_results', sa.Column('primary_dialogue_act', sa.String(100), nullable=True))
    op.add_column('analysis_results', sa.Column('sentence_count', sa.Integer(), nullable=True))
    op.add_column('analysis_results', sa.Column('sentence_analysis', sa.JSON(), nullable=True))
    
    # Create indexes for better query performance
    op.create_index('idx_analysis_sentiment', 'analysis_results', ['overall_sentiment'])
    op.create_index('idx_analysis_emotion', 'analysis_results', ['dominant_emotion'])
    op.create_index('idx_analysis_dialogue', 'analysis_results', ['primary_dialogue_act'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_analysis_dialogue', table_name='analysis_results')
    op.drop_index('idx_analysis_emotion', table_name='analysis_results')
    op.drop_index('idx_analysis_sentiment', table_name='analysis_results')
    
    # Drop columns
    op.drop_column('analysis_results', 'sentence_analysis')
    op.drop_column('analysis_results', 'sentence_count')
    op.drop_column('analysis_results', 'primary_dialogue_act')
    op.drop_column('analysis_results', 'dialogue_acts_breakdown')
    op.drop_column('analysis_results', 'emotion_confidence')
    op.drop_column('analysis_results', 'dominant_emotion')
    op.drop_column('analysis_results', 'emotions_breakdown')
    op.drop_column('analysis_results', 'overall_sentiment_score')
    op.drop_column('analysis_results', 'overall_sentiment')
