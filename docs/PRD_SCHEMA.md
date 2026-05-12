# PRD Document Schema

This document describes the JSON schema for PRD (Product Requirements Document) data stored in the `tiptap_content` column of the `prds` table. The source of truth is `src/lib/prd/schema.ts`.

---

## Document Structure

```typescript
{
  version: 1,                 // Schema version (always 1)
  metadata: PRDMetadata,
  sections: PRDSections,
}
```

---

## Metadata

```typescript
interface PRDMetadata {
  title: string;
  project_tag?: string;
  owner_id: string; // UUID
  owner_name?: string; // Display name of owner
  developers: { name: string; role: string }[]; // Team members
  stakeholder_names: string[]; // Display names
  stakeholders: string[]; // UUIDs
  start_date?: string; // ISO 8601
  end_date?: string; // ISO 8601
  template_id?: string; // UUID of source template
  locale: 'en' | 'id' | 'mixed'; // Default: 'mixed'
}
```

---

## Sections

### 1. `overview` — Overview

**Type:** Rich text (PRDRichText)

High-level summary of the product or feature. Typically 2–5 paragraphs covering the what and why at a glance.

```typescript
interface PRDRichText {
  content: TiptapContent; // Tiptap JSON document { type: 'doc', content: Node[] }
  word_count: number; // Default: 0
  ai_generated: boolean; // Default: false
  last_edited_by?: string; // UUID
  last_edited_at?: string; // ISO 8601
}
```

### 2. `problem_statement` — Problem Statement

**Type:** Rich text (PRDRichText)

Describes the problem being solved, who is affected, and the impact of not solving it.

### 3. `objectives` — Objectives

**Type:** Structured array (PRDObjective[])

Goals and non-goals with measurable key results.

```typescript
interface PRDObjective {
  id: string;
  type: 'goal' | 'non-goal';
  description: string;
  key_results: string[]; // Default: []
}
```

### 4. `darci` — DARCI Matrix

**Type:** Structured object (PRDDarciMatrix)

Responsibility assignment matrix. Each role accepts either a simple string array (legacy) or a structured role object:

```typescript
interface PRDDarciMatrix {
  decider: string[] | PRDDarciRole;
  accountable: string[] | PRDDarciRole;
  responsible: string[] | PRDDarciRole;
  consulted: string[] | PRDDarciRole;
  informed: string[] | PRDDarciRole;
}

interface PRDDarciRole {
  people: string[]; // Names or user IDs (default: [])
  guidelines: string; // Role-specific guidelines (default: '')
}
```

### 5. `scope` — Scope

**Type:** Structured object (PRDScope)

```typescript
interface PRDScope {
  in_scope: string[]; // Default: []
  out_of_scope: string[]; // Default: []
}
```

### 6. `user_stories` — User Stories

**Type:** Structured array (PRDUserStory[])

```typescript
interface PRDUserStory {
  id: string;
  role: string; // "As a [role]..."
  want: string; // "I want [feature]..."
  benefit: string; // "So that [benefit]..."
  acceptance_criteria: string[]; // Default: []
  priority: 'must' | 'should' | 'could' | 'wont'; // MoSCoW, default: 'should'
}
```

### 7. `functional_reqs` — Functional Requirements

**Type:** Structured array (PRDRequirement[])

```typescript
interface PRDRequirement {
  id: string;
  priority: 'must' | 'should' | 'could' | 'wont'; // MoSCoW, default: 'must'
  title: string;
  description: string;
  dependencies: string[]; // IDs of dependent requirements (default: [])
}
```

### 8. `nfr` — Non-Functional Requirements

**Type:** Structured object (PRDNFR)

Each category contains an array of requirement strings:

```typescript
interface PRDNFR {
  performance: string[]; // Default: []
  security: string[]; // Default: []
  accessibility: string[]; // Default: []
  scalability: string[]; // Default: []
  reliability: string[]; // Default: []
  compliance: string[]; // Default: []
}
```

### 9. `success_metrics` — Success Metrics

**Type:** Structured array (PRDMetric[])

```typescript
interface PRDMetric {
  id: string;
  name: string; // e.g., "Monthly Active Users"
  definition: string; // What this metric measures (default: '')
  baseline: string; // Current value
  target: string; // Desired value
  measurement_window: string; // e.g., "30 days post-launch"
  owner?: string; // Person responsible
}
```

### 10. `timeline` — Timeline

**Type:** Structured array (PRDMilestone[])

```typescript
interface PRDMilestone {
  id: string;
  title: string;
  date: string; // ISO 8601
  activity: string; // Activity description (default: '')
  deliverables: string[]; // Expected deliverables (default: [])
  pic?: string; // Person in charge
  status: 'planned' | 'in_progress' | 'completed' | 'delayed'; // Default: 'planned'
}
```

### 11. `risks` — Risks

**Type:** Structured array (PRDRisk[])

```typescript
interface PRDRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  owner?: string; // Person responsible (optional)
}
```

### 12. `references` — References

**Type:** Structured array (PRDReference[])

```typescript
interface PRDReference {
  id: string;
  type: 'document' | 'url' | 'figma' | 'jira' | 'slack' | 'other';
  url: string;
  title: string;
  description?: string;
}
```

### 13. `glossary` — Glossary

**Type:** Structured array (PRDGlossaryEntry[])

```typescript
interface PRDGlossaryEntry {
  term: string;
  definition: string;
}
```

### 14. `changelog` — Changelog

**Type:** Structured array (PRDChangelogEntry[])

```typescript
interface PRDChangelogEntry {
  version: number;
  date: string; // ISO 8601
  author: string;
  summary: string; // What changed
}
```

---

## Section Keys

The following keys are used throughout the codebase:

```
overview, problem_statement, objectives, darci, scope,
user_stories, functional_reqs, nfr, success_metrics,
timeline, risks, references, glossary, changelog
```

---

## Health Score

Each PRD has a computed health score (0–100) based on four dimensions stored in `prds.health_breakdown`:

| Dimension        | Description                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------- |
| **Completeness** | Percentage of sections that are filled in with meaningful content                        |
| **Specificity**  | Whether objectives, metrics, and requirements contain measurable values                  |
| **Structural**   | Correct use of IDs, valid references between sections, proper formatting                 |
| **Consistency**  | Alignment between objectives, user stories, functional requirements, and success metrics |

The health score is computed by `src/lib/prd/health-score.ts` and updated on every save.

---

## Storage

- **`prds.tiptap_content`** (JSONB): The canonical PRD document following this schema.
- **`prd_versions.content`** (JSONB): Full snapshot of the PRD document at each version.

## Factory

Use `createEmptyPRD(ownerId, title)` from `src/lib/prd/schema.ts` to create a blank PRD document with all sections initialized to their defaults.
