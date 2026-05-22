-- Add announcement activity event types.
-- announcement_published matches the current product behavior: admin publishes notifications immediately.
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'announcement_published';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'announcement_created';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'announcement_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'announcement_deleted';
