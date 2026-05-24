-- Update built-in template names/descriptions for launch and product planning templates.

UPDATE public.prd_templates
SET description = $$Strategic plan for launching the product, including marketing, sales, and operational activities.$$
WHERE name = $$Go-to-Market Plan$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Spec for a marketing or product landing page: hero, value props, social proof, CTAs, and design direction. Hand this to an AI tool like v0, Cursor, or Lovable to generate a polished landing page.$$
WHERE name = $$Landing Page Brief$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Generate a list of objectives and key results based on your product and business goals$$
WHERE name = $$OKRs$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$Amazon-style press release from the book Working Backwards. Written in the format of a Press Release and FAQs after the successful launch of a product.$$
WHERE name = $$PR FAQ$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$A detailed checklist for ensuring all aspects of product launch are covered to minimize risks.$$
WHERE name = $$Product Launch Checklist$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$A comprehensive guide to evaluate and enhance the security of a product, focusing on various aspects such as technical specifications, key features, and risk assessment.$$
WHERE name = $$Product Security Assessment$$ AND is_built_in = true;

UPDATE public.prd_templates
SET name = $$Product Brief for AI Development$$,
    description = $$A structured product brief optimized for AI-assisted development. Defines goals, user stories, requirements, UX flows, and technical architecture so AI coding tools (Cursor, Claude, v0, Lovable, Replit) can build exactly what you need.$$
WHERE name = $$Product Brief for AI$$ AND is_built_in = true;

UPDATE public.prd_templates
SET description = $$A structured product brief optimized for AI-assisted development. Defines goals, user stories, requirements, UX flows, and technical architecture so AI coding tools (Cursor, Claude, v0, Lovable, Replit) can build exactly what you need.$$
WHERE name = $$Product Brief for AI Development$$ AND is_built_in = true;
