-- Add hidden_sections column to prds table
-- Stores an array of section keys that should be hidden from editor, export, and share views
ALTER TABLE prds ADD COLUMN IF NOT EXISTS hidden_sections text[] DEFAULT '{}';
