-- ============================================================
-- DraftMind: Seed built-in PRD templates
-- Migration 0003
-- ============================================================

INSERT INTO public.prd_templates (workspace_id, name, description, category, structure, use_count, is_built_in)
VALUES
  -- feature
  (NULL, 'Feature PRD',
   'Full product requirements document for a new feature.',
   'feature',
   '{"sections_enabled":["overview","problem_statement","goals","user_stories","requirements","design","technical_approach","milestones","success_metrics","risks","open_questions"]}',
   0, true),

  (NULL, 'Design Proposal',
   'Lightweight proposal focused on UX/UI design decisions.',
   'feature',
   '{"sections_enabled":["overview","problem_statement","design","user_flows","acceptance_criteria","open_questions"]}',
   0, true),

  -- experiment
  (NULL, 'Experiment Brief',
   'Structured brief for running product experiments and A/B tests.',
   'experiment',
   '{"sections_enabled":["overview","hypothesis","experiment_design","success_metrics","timeline","risks","open_questions"]}',
   0, true),

  -- rfc
  (NULL, 'RFC',
   'Request for Comments template for architectural or process proposals.',
   'rfc',
   '{"sections_enabled":["overview","motivation","detailed_design","alternatives_considered","migration_plan","open_questions"]}',
   0, true),

  (NULL, 'API Specification',
   'Describe a new or updated API surface with endpoints, schemas, and auth.',
   'rfc',
   '{"sections_enabled":["overview","endpoints","data_models","authentication","error_handling","versioning","open_questions"]}',
   0, true),

  (NULL, 'Migration Plan',
   'Step-by-step plan for migrating data, services, or infrastructure.',
   'rfc',
   '{"sections_enabled":["overview","current_state","target_state","migration_steps","rollback_plan","timeline","risks","open_questions"]}',
   0, true),

  -- one-pager
  (NULL, 'One-pager',
   'Concise single-page summary of a product initiative.',
   'one-pager',
   '{"sections_enabled":["overview","problem_statement","proposed_solution","success_metrics","timeline"]}',
   0, true),

  (NULL, 'Quarterly OKR',
   'Define objectives and key results for the quarter.',
   'one-pager',
   '{"sections_enabled":["overview","objectives","key_results","initiatives","dependencies"]}',
   0, true),

  -- research
  (NULL, 'Research Brief',
   'Template for user research or market research initiatives.',
   'research',
   '{"sections_enabled":["overview","research_questions","methodology","target_audience","timeline","deliverables","open_questions"]}',
   0, true),

  (NULL, 'Marketing Campaign Brief',
   'Plan and coordinate marketing campaigns with clear goals.',
   'research',
   '{"sections_enabled":["overview","target_audience","messaging","channels","budget","timeline","success_metrics"]}',
   0, true),

  -- custom
  (NULL, 'Incident Postmortem',
   'Structured review of an incident including timeline, root cause, and action items.',
   'custom',
   '{"sections_enabled":["overview","incident_timeline","root_cause","impact","action_items","lessons_learned"]}',
   0, true),

  (NULL, 'Custom (blank)',
   'Start from scratch with a blank template.',
   'custom',
   '{"sections_enabled":[]}',
   0, true);
