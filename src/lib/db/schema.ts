// Drizzle schema mirror of Supabase tables
// Currently using Supabase client directly for queries
// This file will hold Drizzle schema definitions if we migrate to Drizzle queries

export const TABLES = [
  'profiles',
  'workspaces',
  'workspace_members',
  'workspace_invitations',
  'prd_templates',
  'prds',
  'prd_sections',
  'prd_versions',
  'comments',
  'prd_shares',
  'providers',
  'ai_runs',
  'ai_review_findings',
  'activity_log',
  'notifications',
] as const;

export type TableName = (typeof TABLES)[number];
