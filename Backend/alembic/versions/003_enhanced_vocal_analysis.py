"""Add enhanced vocal analysis fields

Revision ID: 003_enhanced_vocal_analysis
Revises: 002_enhanced_linguistic_analysis
Create Date: 2024-01-15 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_enhanced_vocal_analysis'
down_revision = '002_enhanced_linguistic_analysis'
branch_labels = None
depends_on = None


def upgrade():
    # Add new enhanced vocal analysis fields to analysis_results table
    
    # Core Pitch Metrics
    op.add_column('analysis_results', sa.Column('intensity_db', sa.Float(), nullable=True))
    
    # Jitter Metrics (Frequency Perturbation)
    op.add_column('analysis_results', sa.Column('jitter_local_percent', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('jitter_rap_percent', sa.Float(), nullable=True))
    
    # Shimmer Metrics (Amplitude Perturbation)
    op.add_column('analysis_results', sa.Column('shimmer_local_percent', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('shimmer_apq11_percent', sa.Float(), nullable=True))
    
    # Voice Quality Metrics
    op.add_column('analysis_results', sa.Column('mean_f1_hz', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('mean_f2_hz', sa.Float(), nullable=True))
    
    # Spectral Features (Librosa)
    op.add_column('analysis_results', sa.Column('mfcc_1_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_centroid_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_bandwidth_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_contrast_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_flatness_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('spectral_rolloff_mean', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('chroma_mean', sa.Float(), nullable=True))
    
    # Speech Rate Metrics
    op.add_column('analysis_results', sa.Column('speech_rate_sps', sa.Float(), nullable=True))
    op.add_column('analysis_results', sa.Column('articulation_rate_sps', sa.Float(), nullable=True))
    
    # Create indexes for better query performance on vocal metrics
    op.create_index('idx_analysis_pitch', 'analysis_results', ['mean_pitch_hz'])
    op.create_index('idx_analysis_jitter', 'analysis_results', ['jitter_local_percent'])
    op.create_index('idx_analysis_shimmer', 'analysis_results', ['shimmer_local_percent'])
    op.create_index('idx_analysis_hnr', 'analysis_results', ['mean_hnr_db'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_analysis_hnr', table_name='analysis_results')
    op.drop_index('idx_analysis_shimmer', table_name='analysis_results')
    op.drop_index('idx_analysis_jitter', table_name='analysis_results')
    op.drop_index('idx_analysis_pitch', table_name='analysis_results')
    
    # Drop columns
    op.drop_column('analysis_results', 'articulation_rate_sps')
    op.drop_column('analysis_results', 'speech_rate_sps')
    op.drop_column('analysis_results', 'chroma_mean')
    op.drop_column('analysis_results', 'spectral_rolloff_mean')
    op.drop_column('analysis_results', 'spectral_flatness_mean')
    op.drop_column('analysis_results', 'spectral_contrast_mean')
    op.drop_column('analysis_results', 'spectral_bandwidth_mean')
    op.drop_column('analysis_results', 'spectral_centroid_mean')
    op.drop_column('analysis_results', 'mfcc_1_mean')
    op.drop_column('analysis_results', 'mean_f2_hz')
    op.drop_column('analysis_results', 'mean_f1_hz')
    op.drop_column('analysis_results', 'shimmer_apq11_percent')
    op.drop_column('analysis_results', 'shimmer_local_percent')
    op.drop_column('analysis_results', 'jitter_rap_percent')
    op.drop_column('analysis_results', 'jitter_local_percent')
    op.drop_column('analysis_results', 'intensity_db')
