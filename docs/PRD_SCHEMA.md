# PRD Schema (14 Sections)

DraftMind PRDs follow a structured JSON schema with 14 sections. The schema is defined in `src/lib/prd/schema.ts` and stored in the `prds.content` column as JSONB.

---

## Document Structure

```typescript
interface PRDDocument {
  version: 1;
  metadata: PRDMetadata;
  sections: PRDSections;
}

interface PRDMetadata {
  title: string;
  project_tag?: string;
  owner_id: string;
  stakeholders: string[]; // user_ids
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  template_id?: string;
  locale: 'en' | 'id' | 'mixed';
}
```

---

## Sections

### 1. `overview` -- Overview

**Type:** Rich text (PRDRichText)

High-level summary of the product or feature. Typically 2-5 paragraphs covering the what and why at a glance.

```typescript
interface PRDRichText {
  content: TiptapContent; // Tiptap JSON document
  word_count: number;
  ai_generated: boolean;
  last_edited_by?: string; // user_id
  last_edited_at?: string; // ISO 8601
}
```

### 2. `problem_statement` -- Problem Statement

**Type:** Rich text (PRDRichText)

Describes the problem being solved, who is affected, and the impact of not solving it. Supports rich text formatting including bullet lists and emphasis.

### 3. `objectives` -- Objectives

**Type:** Structured array (PRDObjective[])

Measurable goals with baseline and target values.

```typescript
interface PRDObjective {
  id: string; // nanoid
  metric: string; // e.g. "User activation rate"
  baseline: string; // e.g. "32%"
  target: string; // e.g. "50%"
  measurement_window?: string; // e.g. "Q3 2026"
}
```

### 4. `darci` -- DARCI Matrix

**Type:** Structured object (PRDDarciMatrix)

Responsibility assignment matrix defining who decides, who is accountable, who does the work, who is consulted, and who is informed.

```typescript
interface PRDDarciMatrix {
  decider: string; // user_id or name
  accountable: string; // user_id or name
  responsible: string[]; // user_ids or names
  consulted: string[]; // user_ids or names
  informed: string[]; // user_ids or names
}
```

### 5. `scope` -- Scope

**Type:** Structured object

Explicitly defines what is in scope and out of scope for the project.

```typescript
interface PRDScope {
  in_scope: string[]; // list of items included
  out_of_scope: string[]; // list of items excluded
}
```

### 6. `user_stories` -- User Stories

**Type:** Structured array (PRDUserStory[])

User-centric requirements following the "As a [role], I want [feature], so that [benefit]" pattern.

```typescript
interface PRDUserStory {
  id: string; // e.g. "US-001"
  role: string; // e.g. "Product Manager"
  want: string; // the desired feature/action
  benefit: string; // the expected outcome
  acceptance_criteria: string[]; // testable conditions
}
```

### 7. `functional_reqs` -- Functional Requirements

**Type:** Structured array (PRDRequirement[])

Detailed functional requirements with priority levels and dependency tracking.

```typescript
interface PRDRequirement {
  id: string; // e.g. "FR-001"
  priority: 'must' | 'should' | 'could' | 'wont'; // MoSCoW
  title: string;
  description: string;
  dependencies: string[]; // IDs of other requirements
}
```

### 8. `nfr` -- Non-Functional Requirements

**Type:** Structured object (PRDNFR)

Quality attributes and constraints organized by category.

```typescript
interface PRDNFR {
  performance: string; // e.g. "LCP < 2.5s, API response < 500ms"
  security: string; // e.g. "AES-256 encryption at rest, RLS on all tables"
  accessibility: string; // e.g. "WCAG 2.1 AA, keyboard navigable"
  scalability: string; // e.g. "Support 1000 concurrent users"
  [key: string]: string; // extensible for additional categories
}
```

### 9. `success_metrics` -- Success Metrics

**Type:** Structured array (PRDMetric[])

Quantifiable metrics to measure the success of the feature post-launch.

```typescript
interface PRDMetric {
  name: string; // e.g. "Monthly Active Users"
  baseline: string; // current value
  target: string; // desired value
  measurement_window: string; // e.g. "30 days post-launch"
}
```

### 10. `timeline` -- Timeline

**Type:** Structured array (PRDMilestone[])

Project milestones with target dates.

```typescript
interface PRDMilestone {
  id: string; // nanoid
  title: string; // e.g. "Alpha Release"
  date: string; // ISO 8601 date
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
}
```

### 11. `risks` -- Risks

**Type:** Structured array (PRDRisk[])

Identified risks with assessment and mitigation plans.

```typescript
interface PRDRisk {
  id: string; // nanoid
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  owner: string; // user_id or name
}
```

### 12. `references` -- References

**Type:** Structured array (PRDReference[])

External documents, links, and resources relevant to the PRD.

```typescript
interface PRDReference {
  type: 'document' | 'url' | 'figma' | 'jira' | 'slack' | 'other';
  url: string;
  title: string;
  description?: string;
}
```

### 13. `glossary` -- Glossary

**Type:** Structured array

Domain-specific terms and their definitions.

```typescript
interface PRDGlossaryEntry {
  term: string;
  definition: string;
}
```

### 14. `changelog` -- Changelog

**Type:** Structured array

Version history of the PRD document itself.

```typescript
interface PRDChangelogEntry {
  version: number;
  date: string; // ISO 8601
  author: string; // user_id or name
  summary: string; // what changed
}
```

---

## Section Keys

The following keys are used in `prd_sections.section_key` and throughout the codebase:

```
overview
problem_statement
objectives
darci
scope
user_stories
functional_reqs
nfr
success_metrics
timeline
risks
references
glossary
changelog
```

---

## Health Score

Each PRD has a computed health score (0-100) based on four dimensions stored in `prds.health_breakdown`:

| Dimension        | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Completeness** | Percentage of sections that are filled in with meaningful content                        |
| **Specificity**  | Whether objectives, metrics, and requirements contain measurable values                  |
| **Structural**   | Correct use of IDs, valid references between sections, proper formatting                 |
| **Consistency**  | Alignment between objectives, user stories, functional requirements, and success metrics |

The health score is computed by `src/lib/prd/health-score.ts` and updated on every save.

---

## Storage

- **`prds.content`** (JSONB): The canonical PRD document following this schema.
- **`prds.tiptap_content`** (JSONB): Mirror of the Tiptap editor state for the rich-text sections.
- **`prd_sections`** table: Optional denormalized per-section storage for querying individual sections.
- **`prd_versions.content`** (JSONB): Full snapshot of the PRD document at each version.
