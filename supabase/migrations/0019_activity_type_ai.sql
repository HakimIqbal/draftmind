-- Add AI activity types to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'ai_suggest_used';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'ai_copilot_used';
