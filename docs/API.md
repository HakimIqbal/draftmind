# API Reference

DraftMind uses a hybrid approach: **Route Handlers** for AI operations, export, provider management, and webhooks; **Server Actions** for standard CRUD operations.

---

## Route Handler Endpoints

| Method | Path                          | Purpose                                       | Auth                   |
| ------ | ----------------------------- | --------------------------------------------- | ---------------------- |
| GET    | `/api/auth/callback`          | OAuth callback handler                        | Public                 |
| POST   | `/api/log`                    | Client-side error/warning logging             | Public                 |
| POST   | `/api/prd/generate`           | Generate full PRD from brief                  | Session                |
| POST   | `/api/prd/refine`             | Refine a specific section with AI             | Session                |
| POST   | `/api/prd/ai-review`          | Run AI quality review, return findings        | Session                |
| POST   | `/api/prd/ai-suggest`         | Inline suggestion or copilot chat             | Session                |
| POST   | `/api/prd/export`             | Export PRD to PDF/DOCX/MD/HTML/Slack/Jira     | Session                |
| GET    | `/api/prd/[prdId]/versions`   | List all versions of a PRD                    | Session                |
| POST   | `/api/prd/[prdId]/versions`   | Create a version snapshot                     | Session                |
| POST   | `/api/prd/[prdId]/share`      | Create/manage public share link               | Session (admin/editor) |
| GET    | `/api/workspace/members`      | List workspace members                        | Session                |
| POST   | `/api/workspace/invite`       | Send workspace invitation email               | Session (admin)        |
| GET    | `/api/providers`              | List workspace providers                      | Session (admin)        |
| POST   | `/api/providers`              | Add a new provider                            | Session (admin)        |
| POST   | `/api/providers/test`         | Validate an API key against provider          | Super admin            |
| PATCH  | `/api/providers/[providerId]` | Update provider config                        | Session (admin)        |
| DELETE | `/api/providers/[providerId]` | Remove a provider                             | Session (admin)        |
| POST   | `/api/webhooks/supabase`      | Handle auth events (signup -> create profile) | Service role           |

---

## Server Actions

Server Actions are colocated in `actions.ts` files next to the pages that use them.

| Domain         | Operations                                                     | Location                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------ |
| PRDs           | Create, update, delete, duplicate, archive, pin, change status | `src/app/(app)/prds/[prdId]/actions.ts`          |
| PRD Generate   | Create PRD + AI run, start generation                          | `src/app/(app)/prds/new/actions.ts`              |
| Comments       | Create, update, delete, resolve                                | `src/components/editor/comments-actions.ts`      |
| Search         | Search PRDs                                                    | `src/app/(app)/search/actions.ts`                |
| Notifications  | Mark as read, mark all as read, delete                         | `src/app/(app)/notifications/actions.ts`         |
| Templates      | List, create, update, delete templates                         | `src/app/(app)/templates/actions.ts`             |
| Profile        | Update profile, change password, upload avatar                 | `src/app/(app)/settings/profile/actions.ts`      |
| Providers      | User-level provider management                                 | `src/app/(app)/settings/providers/actions.ts`    |
| Workspace      | Update workspace settings                                      | `src/app/(app)/workspace/settings/actions.ts`    |
| Members        | Invite, update role, remove members                            | `src/app/(app)/workspace/members/actions.ts`     |
| Dashboard      | Fetch dashboard data, workspace switching                      | `src/app/(app)/actions.ts`                       |
| Login          | Email/password login, signup                                   | `src/app/(auth)/login/actions.ts`                |
| Admin          | Dashboard stats, system management                             | `src/app/(admin)/admin/actions.ts`               |
| Admin Activity | Activity log queries                                           | `src/app/(admin)/admin/activity/actions.ts`      |
| Admin Announce | Create, update, delete announcements                           | `src/app/(admin)/admin/announcements/actions.ts` |
| Admin Provider | Global provider management                                     | `src/app/(admin)/admin/providers/actions.ts`     |
| Admin Logs     | System log queries, resolve errors                             | `src/app/(admin)/admin/system-logs/actions.ts`   |

---

## Authentication

All endpoints (except public ones) require an authenticated Supabase session. The session is validated via:

1. **Middleware** (`src/middleware.ts`): Refreshes auth tokens and redirects unauthenticated users to `/login`.
2. **Server-side**: Route handlers and Server Actions create a Supabase server client that reads the session from cookies.

### Auth Levels

| Level                  | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| Public                 | No authentication required                                 |
| Session                | Any authenticated user who is a member of the workspace    |
| Session (admin)        | Workspace member with `admin` role                         |
| Session (admin/editor) | Workspace member with `admin` or `editor` role             |
| Super admin            | User with `is_super_admin = true` in profiles              |
| Service role           | Server-only, authenticated via `SUPABASE_SERVICE_ROLE_KEY` |

---

## AI Endpoints Detail

### POST `/api/prd/generate`

Generates a complete 14-section PRD.

**Request body:**

```json
{
  "prdId": "uuid — PRD record to populate",
  "aiRunId": "uuid — AI run record to track progress"
}
```

**Response:** JSON with generated PRD content.

**Side effects:**

- Updates the `ai_runs` record (status transitions: queued → running → success/error).
- Updates the `prds` record with generated content.
- Creates a `prd_versions` snapshot.

### POST `/api/prd/refine`

Refines a specific section of an existing PRD.

**Request body:**

```json
{
  "prdId": "uuid",
  "sectionKey": "string — section to refine",
  "instruction": "string — refinement instruction",
  "providerId": "uuid (optional)"
}
```

**Response:** JSON with refined section content.

### POST `/api/prd/ai-review`

Runs an AI quality review on a PRD.

**Request body:**

```json
{
  "prdId": "uuid",
  "providerId": "uuid (optional)"
}
```

**Response:** JSON with overall score and array of findings.

### POST `/api/prd/ai-suggest`

Dual-mode endpoint: inline suggestions or copilot chat.

**Inline mode** (13 actions: rewrite, expand, summarize, shorter, formal, grammar, translate, add_examples, make_actionable, add_metrics, simplify_jargon, to_table, to_list, custom):

```json
{
  "prdId": "uuid",
  "action": "rewrite",
  "selectedText": "string",
  "sectionKey": "string",
  "providerId": "uuid (optional)",
  "customInstruction": "string (for action: custom)"
}
```

**Copilot mode:**

```json
{
  "prdId": "uuid",
  "action": "copilot",
  "instruction": "string — user's question",
  "chatHistory": "string — conversation context",
  "sectionKey": "string (optional)",
  "providerId": "uuid (optional)"
}
```

**Response:** JSON with suggestions array.

### POST `/api/prd/export`

Exports a PRD to the specified format.

**Request body:**

```json
{
  "prdId": "uuid",
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

AI endpoints are rate-limited per user to prevent abuse. Limits are enforced at the API route level via `src/lib/utils/rate-limit.ts`.
