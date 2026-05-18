-- Add missing notification_type enum values used in codebase
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'member_joined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'prd_duplicated';
