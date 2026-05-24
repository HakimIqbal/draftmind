-- Update built-in template descriptions to match user-provided content.

UPDATE public.prd_templates
SET description = $$A comprehensive checklist to ensure accessibility compliance in design, content readability, and navigation for all users, including those with disabilities.$$
WHERE name = $$Accessibility Compliance Checklist$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Plan your system architecture before you start building. Covers data model, API design, auth, integrations, and deployment — everything an AI coding agent needs to scaffold your app correctly from the start.$$
WHERE name = $$App Architecture Plan$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Structured document for investigating, diagnosing, and fixing a bug. Covers symptoms, reproduction, root cause analysis, proposed fix, and verification — useful for complex bugs that need clear documentation.$$
WHERE name = $$Bug Investigation & Fix Plan$$ AND is_built_in = true;
