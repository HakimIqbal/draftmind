# API Reference

DraftMind uses a hybrid approach: **Route Handlers** for AI streaming, export, provider management, and webhooks; **Server Actions** for standard CRUD operations on PRDs, comments, and notifications.

---

## Route Handler Endpoints

| Method | Path                          | Purpose                                       | Auth                   | Phase |
| ------ | ----------------------------- | --------------------------------------------- | ---------------------- | ----- |
| POST   | `/api/prd/generate`           | Generate full PRD from brief (streaming SSE)  | Session                | 3     |
| POST   | `/api/prd/refine`             | Refine a specific section with AI             | Session                | 3     |
| POST   | `/api/prd/regenerate`         | Regenerate entire PRD, creates new version    | Session                | 3     |
| POST   | `/api/prd/ai-review`          | Run AI quality review, return findings        | Session                | 3     |
| POST   | `/api/prd/ai-suggest`         | Inline suggestion based on text selection     | Session                | 3     |
| POST   | `/api/prd/[prdId]/export`     | Export to PDF/DOCX/MD/HTML/Slack/Jira         | Session                | 4     |
| GET    | `/api/prd/[prdId]/versions`   | List all versions of a PRD                    | Session                | 3     |
| POST   | `/api/prd/[prdId]/versions`   | Create a version snapshot                     | Session                | 3     |
| POST   | `/api/prd/[prdId]/share`      | Create public share link                      | Session (admin/editor) | 4     |
| POST   | `/api/workspace/members`      | List workspace members                        | Session                | 4     |
| POST   | `/api/workspace/invite`       | Send workspace invitation email               | Session (admin)        | 4     |
| GET    | `/api/providers`              | List workspace providers                      | Session (admin)        | 4     |
| POST   | `/api/providers`              | Add a new provider                            | Session (admin)        | 4     |
| POST   | `/api/providers/test`         | Validate an API key against provider          | Session                | 4     |
| PATCH  | `/api/providers/[providerId]` | Update provider config                        | Session (admin)        | 4     |
| DELETE | `/api/providers/[providerId]` | Remove a provider                             | Session (admin)        | 4     |
| POST   | `/api/webhooks/supabase`      | Handle auth events (signup -> create profile) | Service role           | 1     |

---

## Server Actions (Not REST)

The following operations use Next.js 15 Server Actions instead of REST endpoints. Server Actions are colocated in `actions.ts` files next to the pages that use them.

| Domain        | Operations                                                | Location                                |
| ------------- | --------------------------------------------------------- | --------------------------------------- |
| PRDs          | Create, read, update, delete, archive, pin, change status | `src/app/(app)/prds/.../actions.ts`     |
| Comments      | Create, update, delete, resolve, add reaction             | `src/app/(app)/prds/[prdId]/actions.ts` |
| Notifications | Mark as read, mark all as read, delete                    | `src/app/(app)/actions.ts`              |
| Workspace     | Update settings                                           | `src/app/(app)/workspace/actions.ts`    |
| Profile       | Update profile, complete onboarding                       | `src/app/(auth)/onboarding/actions.ts`  |

Server Actions use `revalidatePath` and `revalidateTag` for cache invalidation after mutations.

---

## Authentication

All endpoints (except webhooks) require an authenticated Supabase session. The session is validated via:

1. **Middleware** (`src/middleware.ts`): Refreshes auth tokens and redirects unauthenticated users to `/login`.
2. **Server-side**: Route handlers and Server Actions create a Supabase server client that reads the session from cookies.

Role-based access is enforced via:

- RLS policies at the database level.
- The `has_workspace_role()` helper function for checking workspace membership and role.

### Auth Levels

| Level                  | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| Session                | Any authenticated user who is a member of the workspace    |
| Session (admin)        | Workspace member with `admin` role                         |
| Session (admin/editor) | Workspace member with `admin` or `editor` role             |
| Service role           | Server-only, authenticated via `SUPABASE_SERVICE_ROLE_KEY` |

---

## AI Endpoints Detail

### POST `/api/prd/generate`

Generates a complete 14-section PRD from a user brief.

**Request body:**

```json
{
  "workspace_id": "uuid",
  "provider_id": "uuid",
  "template_id": "uuid (optional)",
  "brief": "string - user's product brief",
  "locale": "en | id | mixed"
}
```

**Response:** Server-Sent Events stream. Each event contains a partial PRD JSON chunk. The final event contains the complete PRD document.

**Side effects:**

- Creates an `ai_runs` record (status transitions: queued -> running -> success/error).
- Creates a new `prds` record with `current_version: 1`.
- Creates a `prd_versions` snapshot with `source: 'ai_generation'`.

### POST `/api/prd/refine`

Refines a specific section of an existing PRD.

**Request body:**

```json
{
  "prd_id": "uuid",
  "provider_id": "uuid",
  "section_key": "string",
  "instruction": "string - refinement instruction",
  "current_content": "object - current section content"
}
```

**Response:** SSE stream with the refined section content.

### POST `/api/prd/ai-review`

Runs an AI quality review on a PRD, producing findings with severity levels.

**Request body:**

```json
{
  "prd_id": "uuid",
  "provider_id": "uuid"
}
```

**Response:** JSON object with overall score and array of `ai_review_findings`.

### POST `/api/prd/ai-suggest`

Generates an inline suggestion based on selected text.

**Request body:**

```json
{
  "prd_id": "uuid",
  "provider_id": "uuid",
  "section_key": "string",
  "selected_text": "string",
  "instruction": "string (optional)"
}
```

**Response:** SSE stream with the suggested replacement text.

### POST `/api/prd/[prdId]/export`

Exports a PRD to the specified format.

**Request body:**

```json
{
  "format": "pdf | docx | markdown | html | slack | jira"
}
```

**Response:** Binary file download (PDF, DOCX) or JSON (Slack blocks, Jira ADF, Markdown, HTML).

---

## Input Validation

All endpoints validate input using Zod schemas. Invalid requests receive a `400` response with a structured error:

```json
{
  "error": "Validation error",
  "details": [{ "path": ["brief"], "message": "Required" }]
}
```

---

## Rate Limiting

AI endpoints are rate-limited per workspace and per user to prevent abuse. Limits are enforced at the API route level.
