-- Add profile_updated and password_reset to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'profile_updated';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'password_reset';

-- Add force_password_change flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false NOT NULL;
