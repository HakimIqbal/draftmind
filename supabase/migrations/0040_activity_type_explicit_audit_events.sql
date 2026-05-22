-- Expand activity_type enum for explicit audit events
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'force_password_change_completed';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'super_admin_enabled';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'super_admin_disabled';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'user_updated_by_admin';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'user_role_changed';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'login_failed';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'provider_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'provider_tested';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'public_share_revoked';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'ai_generation_started';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'ai_generation_failed';
