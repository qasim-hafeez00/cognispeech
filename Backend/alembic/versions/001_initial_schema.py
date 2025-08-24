"""Initial database schema for CogniSpeech

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id')
    )
    
    # Create audio_recordings table
    op.create_table('audio_recordings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create analysis_results table
    op.create_table('analysis_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recording_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='PENDING'),
        sa.Column('transcript_text', sa.Text(), nullable=True),
        sa.Column('sentiment_label', sa.String(50), nullable=True),
        sa.Column('sentiment_score', sa.Float(), nullable=True),
        sa.Column('summary_text', sa.Text(), nullable=True),
        sa.Column('mean_pitch_hz', sa.Float(), nullable=True),
        sa.Column('jitter_percent', sa.Float(), nullable=True),
        sa.Column('shimmer_percent', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.ForeignKeyConstraint(['recording_id'], ['audio_recordings.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('recording_id')
    )
    
    # Create indexes for better query performance
    op.create_index('idx_analysis_status', 'analysis_results', ['status'])
    op.create_index('idx_user_external_id', 'users', ['external_id'])
    op.create_index('idx_recording_user_id', 'audio_recordings', ['user_id'])
    op.create_index('idx_recording_created_at', 'audio_recordings', ['created_at'])
    op.create_index('idx_analysis_created_at', 'analysis_results', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_analysis_created_at', 'analysis_results')
    op.drop_index('idx_recording_created_at', 'audio_recordings')
    op.drop_index('idx_recording_user_id', 'audio_recordings')
    op.drop_index('idx_user_external_id', 'users')
    op.drop_index('idx_analysis_status', 'analysis_results')
    
    # Drop tables
    op.drop_table('analysis_results')
    op.drop_table('audio_recordings')
    op.drop_table('users') 