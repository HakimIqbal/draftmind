-- Update built-in template descriptions for research and technical planning templates.

UPDATE public.prd_templates
SET description = $$This template provides a comprehensive structure for analyzing and reporting on competitors, covering company background, product offerings, market positioning, and strategic insights.$$
WHERE name = $$Competitive Analysis Report$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$A comprehensive template for mapping out and improving the customer journey, including customer personas, journey stages, opportunities for improvement, and an action plan.$$
WHERE name = $$Customer Journey Map$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Plan your data model, relationships, indexes, and migrations before AI generates them. Prevents costly rework by thinking through entities, access patterns, and constraints upfront.$$
WHERE name = $$Database Schema Design$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$A single-feature spec optimized for handing to an AI coding agent. Defines exactly what to build, acceptance criteria, edge cases, and files to touch — everything needed for a focused implementation session.$$
WHERE name = $$Feature Implementation Spec$$ AND is_built_in = true;
