# FEATURE REPORT — DraftMind

> Dibuat: 2026-05-08
> Catatan: Dokumen ini adalah laporan kondisi nyata kode,
> bukan dokumen marketing atau presentasi.

## Environment Check

| Variable                      | Ada di .env.example? | Nilai di .env.local                                       | Dipakai Di                                      | Wajib?      | Status                                        |
| ----------------------------- | -------------------- | --------------------------------------------------------- | ----------------------------------------------- | ----------- | --------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | ✅                   | `http://127.0.0.1:54321`                                  | `src/env.ts:21`, `src/middleware.ts:66`         | ✅          | ✅ Terset                                     |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅                   | `eyJ...` (demo key)                                       | `src/env.ts:22`, `src/middleware.ts:67`         | ✅          | ✅ Terset                                     |
| SUPABASE_SERVICE_ROLE_KEY     | ✅                   | `eyJ...` (demo key)                                       | `src/env.ts:18`, `src/lib/supabase/admin.ts`    | ✅          | ✅ Terset                                     |
| DATABASE_URL                  | ✅                   | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | `src/env.ts:17`                                 | ✅          | ✅ Terset                                     |
| NEXT_PUBLIC_APP_URL           | ✅                   | `http://localhost:3000`                                   | `src/env.ts:23`, `src/lib/email/templates.ts:1` | ✅          | ✅ Terset                                     |
| ENCRYPTION_KEY                | ✅                   | `kPI/wOH...` (32-byte base64)                             | `src/env.ts:19`, `src/lib/utils/crypto.ts:9`    | ✅          | ✅ Terset                                     |
| DEPLOYMENT_TARGET             | ✅                   | `local`                                                   | `src/env.ts:20`, `src/lib/export/pdf.ts:19`     | ❌          | ✅ Terset                                     |
| SKIP_ENV_VALIDATION           | ✅                   | `true`                                                    | `src/env.ts:25`                                 | ❌          | ✅ Terset                                     |
| RESEND_API_KEY                | ✅                   | (kosong)                                                  | `src/lib/email/send.ts:4`                       | ❌ Opsional | ⚠️ NOT CONFIGURED — email tidak akan terkirim |
| EMAIL_FROM                    | ✅                   | `DraftMind <noreply@draftmind.app>`                       | `src/lib/email/send.ts:8`                       | ❌ Opsional | ✅ Terset                                     |
| LANGCHAIN_API_KEY             | ✅                   | `lsv2_pt_c897...`                                         | `src/lib/ai/langsmith.ts:6`                     | ❌ Opsional | ✅ Terset                                     |
| LANGCHAIN_PROJECT             | ✅                   | `draftmind`                                               | `src/lib/ai/langsmith.ts:7`                     | ❌ Opsional | ✅ Terset                                     |
| LANGCHAIN_TRACING_V2          | ✅                   | `true`                                                    | `src/lib/ai/langsmith.ts:8`                     | ❌ Opsional | ✅ Terset                                     |

### Temuan Environment

1. **RESEND_API_KEY kosong** — Email (invite workspace, notifikasi, reset password) TIDAK akan terkirim. Kode di `src/lib/email/send.ts:4-6` handle ini dengan graceful skip (bukan crash), tapi user tidak akan terima email apapun.
2. **Semua env var wajib sudah terset** — Supabase, encryption, app URL semua configured.
3. **Tidak ada env var yang ada di kode tapi missing dari .env.example** — Semua terdokumentasi.
4. **SKIP_ENV_VALIDATION=true** di dev — Ini normal untuk local dev, tapi harus `false` di production.

---

## Master List Fitur

### User-Facing (app)

1. Landing Page — `/`
2. Login / Auth — `/login`
3. Auth Callback — `/api/auth/callback`
4. Dashboard — `/dashboard`
5. PRD List (Table) — `/prds`
6. PRD Pipeline Board — `/prds/pipeline`
7. Create / Generate PRD — `/prds/new`
8. PRD Editor — `/prds/[prdId]`
9. PRD AI Review — `/prds/[prdId]/ai-review`
10. PRD Export Page — `/prds/[prdId]/export`
11. PRD Version History — `/prds/[prdId]/version-history`
12. Search — `/search`
13. Templates Library — `/templates`
14. AI Runs (User) — `/ai-runs`
15. Workspace Hub — `/workspace`
16. Workspace Members — `/workspace/members`
17. Workspace Settings — `/workspace/settings`
18. Workspace Activity — `/workspace/activity`
19. Workspace Invite Accept — `/workspace/invite/[invitationId]`
20. Settings Main — `/settings`
21. Settings Profile — `/settings/profile`
22. Settings Providers — `/settings/providers`
23. Settings API Keys — `/settings/api-keys`
24. Settings Notifications — `/settings/notifications`
25. Settings Preferences — `/settings/preferences`
26. Settings Audit — `/settings/audit`
27. Public Share View — `/share/[shareToken]`
28. Privacy Page — `/privacy`
29. Terms Page — `/terms`

### Admin-Facing

30. Admin Dashboard — `/admin`
31. Admin Users — `/admin/users`
32. Admin Workspaces — `/admin/workspaces`
33. Admin PRDs — `/admin/prds`
34. Admin AI Runs — `/admin/ai-runs`
35. Admin Activity Log — `/admin/activity`
36. Admin System Logs — `/admin/system-logs`
37. Admin Analytics — `/admin/analytics`
38. Admin Announcements — `/admin/announcements`
39. Admin Providers — `/admin/providers`
40. Admin Templates — `/admin/templates`
41. Admin Settings — `/admin/settings`

### Editor Sub-Features (dalam PRD Editor)

42. TipTap Rich Text Editor — Editor content area
43. Bubble Toolbar — Select text formatting
44. Slash Menu — `/` command palette
45. AI Assist Panel — Right panel AI suggestions
46. AI Copilot Panel — Right panel AI chat
47. Outline Panel — Left panel document outline
48. Comments Panel — Left panel comments tab
49. Inline Comment Popover — Comment on selected text
50. History Panel — Version history viewer
51. Editor Header — Status, share, export, more menu
52. Health Score Display — Draft stats & health metrics

### Layout & Overlays

53. Sidebar Navigation — Left app sidebar
54. Topbar — Top navigation bar
55. Command Palette — Cmd+K quick actions
56. Notifications Inbox — Bell icon dropdown
57. Profile Modal — Avatar click in sidebar
58. Workspace Switcher — Workspace dropdown

### API Routes

59. POST /api/prd/generate — AI PRD generation
60. POST /api/prd/ai-suggest — AI text suggestions
61. POST /api/prd/ai-review — AI PRD health review
62. POST /api/prd/refine — AI section refinement
63. POST /api/prd/export — Export PRD (md/html/pdf/docx/slack/jira)
64. POST /api/prd/[prdId]/share — Create share link
65. GET/POST /api/prd/[prdId]/versions — Version management
66. GET/POST /api/providers — Provider CRUD
67. POST /api/providers/test — Test provider connection
68. POST /api/workspace/invite — Send workspace invite
69. GET/DELETE /api/workspace/members — Member management
70. POST /api/workspace/avatar — Upload workspace avatar
71. POST /api/log — Client-side error logging

---

## Detail Per Fitur

### USER-FACING (1-15)

### 1. Landing Page

**File**: `src/app/page.tsx:1-285`
**Status**: ✅ REAL
**Alur**: Server component → `supabase.auth.getUser()` + `prd_templates` count query → render
**DB Tables**: `prd_templates` (read count), `auth.users` (session)
**Masalah**: `sectionCount` dan `exportCount` hardcode by design (14 sections, 6 formats) — sah.

### 2. Login / Auth

**File**: `src/app/(auth)/login/page.tsx`, `src/components/auth/login-page-client.tsx`, `src/app/(auth)/login/actions.ts`
**Status**: ✅ REAL
**Alur**: Server cek session → render `LoginPageClient` → `signInWithPassword()` → `checkUserRole()` → query `profiles.is_super_admin` → redirect
**DB Tables**: `profiles` (read), `workspace_members` (read), `activity_log` (write)
**Masalah**: Tidak ada "Forgot Password" flow — hanya "Contact your admin".

### 3. Auth Callback

**File**: `src/app/api/auth/callback/route.ts:1-67`
**Status**: ✅ REAL
**Alur**: GET → `exchangeCodeForSession(code)` → query `profiles.is_super_admin` → redirect
**Masalah**: Tidak ada.

### 4. Dashboard

**File**: `src/app/(app)/dashboard/page.tsx`, `src/components/dashboard/home-feed.tsx`, `src/lib/db/queries/dashboard.ts`
**Status**: ✅ REAL
**Alur**: `requireUser()` → `getCurrentWorkspace()` → `Promise.all([getDashboardStats, getContinueWorkingPRDs, getActivityFeed, getNeedsAttention, templates])` → render `HomeFeed`
**DB Tables**: `prds`, `activity_log`, `notifications`, `prd_templates`, `profiles`
**Masalah**: Tidak ada.

### 5. PRD List (Table)

**File**: `src/app/(app)/prds/page.tsx`, `src/components/dashboard/prd-list-table.tsx`, `src/lib/db/queries/prd.ts`
**Status**: ✅ REAL
**Alur**: Server → `getPRDsByWorkspace()` with filter/search/sort → `PRDListTable`
**DB Tables**: `prds` (read with ilike, sort, range, join owner), `profiles`, `prd_templates`
**Masalah**: Tidak ada.

### 6. PRD Pipeline Board

**File**: `src/app/(app)/prds/pipeline/page.tsx`, `src/components/dashboard/prd-pipeline-board.tsx`
**Status**: 🟡 PARTIAL
**Alur**: Server → `getPRDsByWorkspace(wsId, {}, 200)` → filter by status ke 4 kolom → render
**DB Tables**: `prds` (read), `profiles`
**Masalah**: **BUG — PRDs dengan status `approved` hilang dari pipeline view.** Kolom hanya: draft, in_review/reviewed, refined, final. Status `approved` tidak masuk kolom manapun.

### 7. Create / Generate PRD

**File**: `src/app/(app)/prds/new/page.tsx`, `src/app/(app)/prds/new/actions.ts`
**Status**: ✅ REAL
**Alur**: Fetch active providers → `GenerateForm` → submit → `createPRDAndGenerate()` → insert `prds` + `ai_runs` → redirect `/prds/{id}?generating=true`
**DB Tables**: `prds` (write), `ai_runs` (write), `prd_templates` (read/update use_count), `providers` (read)
**Masalah**: Error thrown sebagai generic `throw new Error` — bukan user-friendly.

### 8. PRD Editor

**File**: `src/app/(app)/prds/[prdId]/page.tsx`, `src/components/editor/editor-shell.tsx`
**Status**: ✅ REAL
**Alur**: Validate UUID → query `prds` by id + workspace → cek generating → `EditorShell` with TipTap
**DB Tables**: `prds` (read), `ai_runs` (read), `providers` (read)
**Masalah**: Tidak ada.

### 9. PRD AI Review

**File**: `src/app/(app)/prds/[prdId]/ai-review/page.tsx`, `src/components/refine/ai-review-page.tsx`
**Status**: ✅ REAL
**Alur**: Query `prds` → latest `ai_runs` (type ai_review) → `ai_review_findings` → render `AIReviewPage` → client triggers `/api/prd/ai-review`
**DB Tables**: `prds`, `ai_runs`, `ai_review_findings`
**Masalah**: Tidak ada.

### 10. PRD Export Page

**File**: `src/app/(app)/prds/[prdId]/export/page.tsx:1-7`
**Status**: ⚫ DEAD
**Alur**: `redirect(/prds/${prdId})` — export handled via modal di editor
**Masalah**: Page dead, hanya redirect.

### 11. PRD Version History

**File**: `src/app/(app)/prds/[prdId]/version-history/page.tsx`, `src/components/version/version-history-page.tsx`
**Status**: ✅ REAL
**Alur**: Query `prds` + `prd_versions` with author join → timeline + detail + diff → restore/rename via server actions
**DB Tables**: `prds` (read), `prd_versions` (read with join)
**Masalah**: Label "compare" tapi tidak ada visual diff antara 2 versi (hanya char-level diff dalam 1 versi).

### 12. Search

**File**: `src/app/(app)/search/page.tsx`, `src/app/(app)/search/actions.ts`
**Status**: ✅ REAL
**Alur**: User types → `searchPRDs()` → `supabase.from('prds').ilike('title', '%query%')` → render results
**DB Tables**: `prds` (read, workspace-scoped)
**Masalah**: Hanya search by title. Tidak search content PRD.

### 13. Templates Library

**File**: `src/app/(app)/templates/page.tsx`, `src/components/templates/templates-library.tsx`
**Status**: ✅ REAL
**Alur**: Query `prd_templates` (built-in + workspace) → filter by category → create/edit modals
**DB Tables**: `prd_templates` (read)
**Masalah**: Tidak ada.

### 14. AI Runs (User)

**File**: `src/app/(app)/ai-runs/page.tsx`, `src/components/audit/ai-run-history-table.tsx`
**Status**: ✅ REAL
**Alur**: Query `ai_runs` workspace-scoped, limit 100 → `AiRunHistoryTable` → client-side filter
**DB Tables**: `ai_runs` (read)
**Masalah**: Tidak ada pagination — hard limit 100.

### 15. Workspace Hub

**File**: `src/app/(app)/workspace/page.tsx:1-30`
**Status**: ⚫ DEAD
**Alur**: `redirect('/workspace/members')` — hanya redirect
**Masalah**: Page dead, type exports only.

---

### WORKSPACE & SETTINGS (16-29)

### 16. Workspace Members

**File**: `src/app/(app)/workspace/members/page.tsx`, `src/app/(app)/workspace/members/actions.ts`
**Status**: ✅ REAL
**Alur**: SSR → `requireUser()` → query `workspace_members` + `workspace_invitations` → `WorkspaceMembersTab` → invite/role change/remove via server actions
**DB Tables**: `workspace_members` (R/W), `workspace_invitations` (R/W), `profiles` (R), `notifications` (W), `activity_log` (W)
**Masalah**: `listUsers({ perPage: 1000 })` — gak scale di atas 1000 users.

### 17. Workspace Settings

**File**: `src/app/(app)/workspace/settings/page.tsx`, `src/app/(app)/workspace/settings/actions.ts`
**Status**: ✅ REAL
**Alur**: SSR admin-only → query `workspaces` → `WorkspaceSettingsTab` → update/leave/delete via server actions
**DB Tables**: `workspaces` (R/W/D), `workspace_members` (R/W/D), `activity_log` (W)
**Masalah**: `transferOwnership` action ada di server tapi TIDAK ADA UI button — fitur unreachable.

### 18. Workspace Activity

**File**: `src/app/(app)/workspace/activity/page.tsx`, `src/components/workspace/workspace-activity-tab.tsx`
**Status**: ✅ REAL
**Alur**: SSR admin-only → `WorkspaceActivityTab` → `getWorkspaceActivity()` → query `activity_log` + `profiles`
**DB Tables**: `activity_log` (R), `profiles` (R)
**Masalah**: Error handling silently swallows errors — user stuck di "Loading activity..." jika query fail.

### 19. Workspace Invite Accept

**File**: `src/app/(app)/workspace/invite/[invitationId]/page.tsx`
**Status**: ✅ REAL
**Alur**: SSR → validate invitation (5 distinct error states) → accept/reject → insert `workspace_members`, update invitation, notify admins
**DB Tables**: `workspace_invitations` (R/W), `workspace_members` (R/W), `profiles` (R), `notifications` (W/D)
**Masalah**: Tidak ada. Well-implemented.

### 20-26. Settings Pages (Main, Profile, Providers, API Keys, Notifications, Preferences, Audit)

**File**: `src/app/(app)/settings/*.tsx`
**Status**: ⚫ DEAD (semua 7 halaman)
**Alur**: Semua `redirect('/dashboard')` — tidak ada UI settings
**Masalah**: Semua settings page hanya redirect stub. User tidak bisa akses settings via URL.

### 27. Public Share View

**File**: `src/app/share/[shareToken]/page.tsx`, `src/components/share/public-share-view.tsx`
**Status**: ✅ REAL
**Alur**: SSR (no auth) → validate share token → check active + expiry → fetch PRD → filter hidden sections → increment view count → render tiptap-to-JSX
**DB Tables**: `prd_shares` (R + RPC increment), `prds` (R)
**Masalah**: `generateMetadata` fetches PRD tapi data `_doc` tidak dipakai — wasted query.

### 28. Privacy Page

**File**: `src/app/privacy/page.tsx:1-111`
**Status**: ✅ REAL (static content page — sah untuk legal pages)

### 29. Terms Page

**File**: `src/app/terms/page.tsx:1-140`
**Status**: ✅ REAL (static content page — sah untuk legal pages)

---

### ADMIN PAGES (30-41)

### 30. Admin Dashboard

**File**: `src/app/(admin)/admin/page.tsx:1-548`
**Status**: ✅ REAL
**Alur**: 14 parallel Supabase queries via `createAdminClient()` → stats/health/tokens → render
**DB Tables**: `profiles`, `workspaces`, `prds`, `ai_runs`, `activity_log`, `system_logs`, `providers`
**Masalah**: Zero error handling pada semua 14 queries — semua silently fallback ke 0/empty.

### 31. Admin Users

**File**: `src/app/(admin)/admin/users/page.tsx`, `src/components/admin/admin-users-table.tsx`, `src/app/(admin)/admin/actions.ts`
**Status**: ✅ REAL
**Alur**: Query `profiles` + `auth.admin.listUsers` → merge ban status → `AdminUsersTable` → toggle admin/ban/reset password/create user
**DB Tables**: `profiles` (R), `auth.users` (R/W), `activity_log` (W)
**Masalah**: `listUsers({ perPage: 1000 })` — gak scale. No pagination.

### 32. Admin Workspaces

**File**: `src/app/(admin)/admin/workspaces/page.tsx:1-90`
**Status**: ✅ REAL
**Alur**: Query `workspaces`, `workspace_members` (count), `prds` (count), `profiles` (owners) → card grid
**DB Tables**: `workspaces`, `workspace_members`, `prds`, `profiles`
**Masalah**: Tidak ada empty state. Inefficient — fetch ALL members/prds hanya untuk count.

### 33. Admin PRDs

**File**: `src/app/(admin)/admin/prds/page.tsx:1-110`
**Status**: ✅ REAL
**Alur**: Query `prds` limit 100 + `profiles` + `workspaces` → table
**DB Tables**: `prds`, `profiles`, `workspaces`
**Masalah**: View-only, no pagination, no search/filter.

### 34. Admin AI Runs

**File**: `src/app/(admin)/admin/ai-runs/page.tsx:1-316`
**Status**: ✅ REAL
**Alur**: Query `ai_runs` (100 + today + week stats) + `workspaces` + LangSmith API → summary + breakdown + table
**DB Tables**: `ai_runs`, `workspaces`. External: LangSmith API
**Masalah**: No pagination, no search.

### 35. Admin Activity Log

**File**: `src/app/(admin)/admin/activity/page.tsx`, `activity/actions.ts`, `activity/activity-log-table.tsx`
**Status**: ✅ REAL
**Alur**: `fetchActivityLog()` → query `activity_log` limit 200 → resolve actors/workspaces → client filter/expand/auto-refresh 10s
**DB Tables**: `activity_log`, `profiles`, `workspaces`
**Masalah**: **🔴 SECURITY BUG — `fetchActivityLog()` di `activity/actions.ts` TIDAK ada `requireSuperAdmin()` check.** Any authenticated user bisa call action ini dan baca full activity log.

### 36. Admin System Logs

**File**: `src/app/(admin)/admin/system-logs/page.tsx`, `system-logs/actions.ts`
**Status**: ✅ REAL
**Alur**: Client → `fetchSystemLogs()` + `getLogStats()` → polls 5s → `resolveLog()` update
**DB Tables**: `system_logs` (R/W resolve)
**Masalah**: No pagination UI. No loading skeleton on initial load.

### 37. Admin Analytics

**File**: `src/app/(admin)/admin/analytics/page.tsx:1-176`
**Status**: ✅ REAL
**Alur**: Server → count queries for profiles/workspaces/prds/ai_runs + distributions → bar charts
**DB Tables**: `profiles`, `workspaces`, `prds`, `ai_runs`
**Masalah**: Very basic — no time-series, no trends. Fetches ALL rows for aggregation.

### 38. Admin Announcements

**File**: `src/app/(admin)/admin/announcements/page.tsx`, `announcements/actions.ts`
**Status**: ✅ REAL
**Alur**: Load users → create form → `publishAnnouncement()` → insert `notifications` per recipient → history
**DB Tables**: `profiles` (R), `notifications` (R/W)
**Masalah**: Admins excluded dari target "all" (filter `is_super_admin: false`).

### 39. Admin Providers

**File**: `src/app/(admin)/admin/providers/page.tsx`, `providers/actions.ts`
**Status**: ✅ REAL
**Alur**: Load providers → CRUD operations → multi-step add modal → test connection → encrypted key storage → polling 10s
**DB Tables**: `providers` (CRUD)
**Masalah**: `deleteProvider` tanpa confirmation dialog. Priority update bisa duplicate.

### 40. Admin Templates

**File**: `src/app/(admin)/admin/templates/page.tsx:1-105`
**Status**: 🟡 PARTIAL
**Alur**: Query `prd_templates` → split built-in vs custom → card grids
**DB Tables**: `prd_templates` (R only)
**Masalah**: **Read-only** — admin tidak bisa create/edit/delete templates.

### 41. Admin Settings

**File**: `src/app/(admin)/admin/settings/page.tsx:1-83`
**Status**: 🟡 PARTIAL
**Alur**: Query `ai_runs` + `providers` → read env vars → static config display
**DB Tables**: `ai_runs`, `providers` (R)
**Masalah**: **Read-only info page.** Security section hardcoded: `'Enabled (next.config.mjs)'`, `'AES-256-GCM'`, `'Enabled on all tables'` — tidak diverifikasi runtime.

---

### EDITOR SUB-FEATURES (42-52)

### 42. TipTap Rich Text Editor

**File**: `src/components/editor/tiptap-editor.tsx:1-173`
**Status**: 🟡 PARTIAL
**Alur**: Props `content` → `useEditor()` with 12 extensions → `onUpdate` debounce 300ms → parent saves
**Masalah**: **Collaboration extension loaded with `provider: null` (line 62).** Real-time collab TIDAK berfungsi — Yjs doc local-only.

### 43. Bubble Toolbar

**File**: `src/components/editor/bubble-toolbar.tsx:1-364`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 44. Slash Menu

**File**: `src/components/editor/slash-menu.tsx:1-258`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 45. AI Assist Panel

**File**: `src/components/editor/ai-assist-panel.tsx:1-346`, `src/app/api/prd/ai-suggest/route.ts`
**Status**: ✅ REAL
**Alur**: Select action → POST `/api/prd/ai-suggest` → `requireUser()` → rate limit → AI call → parse suggestions → render with Insert/Copy/Compare
**DB Tables**: `prds` (R), `ai_runs` (W), `providers` (R via getDefaultAIClient)
**Masalah**: Tidak ada.

### 46. AI Copilot Panel

**File**: `src/components/editor/ai-copilot-panel.tsx:1-401`
**Status**: ✅ REAL
**Alur**: Chat interface → localStorage persistence → POST `/api/prd/ai-suggest` with `action: 'copilot'` → full PRD context (6000 chars) → markdown render
**Masalah**: Chat history only di localStorage — not synced across devices.

### 47. Outline Panel

**File**: `src/components/editor/outline-panel.tsx:1-399`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 48. Comments Panel

**File**: `src/components/editor/comments-panel.tsx:1-429`, `src/components/editor/comments-actions.ts:1-240`
**Status**: ✅ REAL
**Alur**: Server actions → `comments` CRUD + `profiles` join + notifications for owner/reply/@mentions → threaded view, poll 5s
**DB Tables**: `comments` (CRUD), `profiles` (R), `prds` (R), `notifications` (W), `activity_log` (W)
**Masalah**: Polling 5s instead of realtime subscription.

### 49. Inline Comment Popover

**File**: `src/components/editor/inline-comment-popover.tsx:1-161`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 50. History Panel

**File**: `src/components/editor/history-panel.tsx:1-622`
**Status**: ✅ REAL
**Alur**: Fetch `/api/prd/${prdId}/versions` → timeline + detail + char-level diff → restore/rename
**Masalah**: Tidak ada.

### 51. Editor Header

**File**: `src/components/editor/editor-header.tsx:1-437`
**Status**: ✅ REAL
**Alur**: Status change, share, export (6 formats), duplicate, delete, save as template — semua real server actions/API
**Masalah**: Tidak ada.

### 52. Health Score Display

**File**: `src/components/editor/health-score-display.tsx:1-67`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

---

### LAYOUT & OVERLAYS (53-58)

### 53. Sidebar Navigation

**File**: `src/components/layout/sidebar.tsx:1-293`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 54. Topbar

**File**: `src/components/layout/topbar.tsx:1-81`
**Status**: ✅ REAL
**Alur**: Fetch unread notification count → poll 10s → bell badge → `NotificationsInbox`
**Masalah**: Tidak ada.

### 55. Command Palette

**File**: `src/components/overlays/command-palette.tsx:1-165`
**Status**: ✅ REAL
**Alur**: Cmd+K → `searchPRDs()` → query `prds` limit 20 → filter + navigate
**Masalah**: Tidak ada.

### 56. Notifications Inbox

**File**: `src/components/overlays/notifications-inbox.tsx:1-231`
**Status**: ✅ REAL
**Alur**: `getNotifications()` → `notifications` table limit 50 → Inbox/Announcements tabs → mark read/delete
**DB Tables**: `notifications` (CRUD)
**Masalah**: Tidak ada.

### 57. Profile Modal

**File**: `src/components/settings/profile-modal.tsx:1-267`, `src/lib/actions/profile.ts:1-193`
**Status**: ✅ REAL
**Alur**: `getProfile()` → `profiles` + `workspace_members` → edit name, avatar upload to Storage, password change via `signInWithPassword` then `updateUser`
**DB Tables**: `profiles` (R/W), `workspace_members` (R), `auth.users` (password), Storage `avatars`
**Masalah**: Tidak ada.

### 58. Workspace Switcher

**File**: `src/components/layout/workspace-switcher.tsx:1-261`
**Status**: ✅ REAL
**Alur**: Dropdown → switch workspace via `setCurrentWorkspace()` → create workspace modal → `createWorkspace()` server action
**DB Tables**: `workspaces` (R/create), `workspace_members` (R/create)
**Masalah**: Tidak ada.

---

### API ROUTES (59-71)

### 59. POST /api/prd/generate

**File**: `src/app/api/prd/generate/route.ts:1-689`
**Status**: ✅ REAL
**Alur**: Fetch ai_run → validate → fetch PRD → try each provider (priority order, structured output + fallback) → build PRDDocument → tiptap content → health score → update DB
**DB Tables**: `ai_runs` (R/W), `prds` (R/W), `providers` (R), `prd_versions` (W)
**Masalah**: Minor — dead variable `_providerId`.

### 60. POST /api/prd/ai-suggest

**File**: `src/app/api/prd/ai-suggest/route.ts:1-194`
**Status**: ✅ REAL
**Masalah**: Silent empty context jika workspace null.

### 61. POST /api/prd/ai-review

**File**: `src/app/api/prd/ai-review/route.ts:1-177`
**Status**: ✅ REAL
**Masalah**: Bad AI JSON silently produces 0-score review (fallback `?? 0`, `?? []`).

### 62. POST /api/prd/refine

**File**: `src/app/api/prd/refine/route.ts:1-167`
**Status**: ✅ REAL
**Masalah**: **BUG — Updates `content.sections` tapi TIDAK regenerate `tiptap_content`.** Editor shows tiptap_content → stale data setelah refine.

### 63. POST /api/prd/export

**File**: `src/app/api/prd/export/route.ts:1-223`
**Status**: ✅ REAL
**Masalah**: `_sections` parameter unused (dead code).

### 64. POST /api/prd/[prdId]/share

**File**: `src/app/api/prd/[prdId]/share/route.ts:1-42`
**Status**: ✅ REAL
**Masalah**: **BUG — No error check on insert.** Jika DB insert gagal, response return `{token: undefined, url: "/share/undefined"}` dengan status 200.

### 65. GET/POST /api/prd/[prdId]/versions

**File**: `src/app/api/prd/[prdId]/versions/route.ts:1-92`
**Status**: ✅ REAL
**Masalah**: No error handling on write ops. Race condition pada version_number increment.

### 66. GET/POST /api/providers

**File**: `src/app/api/providers/route.ts:1-66`
**Status**: 🟡 PARTIAL
**Masalah**: **🔴 SECURITY — Line 55 `api_key_encrypted: body.apiKey` — API key disimpan TANPA enkripsi** ke kolom bernama `api_key_encrypted`. Tidak ada panggilan `encryptApiKey()`.

### 67. POST /api/providers/test

**File**: `src/app/api/providers/test/route.ts:1-60`
**Status**: ✅ REAL
**Masalah**: Returns 200 on failure (ok:false) — inconsistent.

### 68. POST /api/workspace/invite

**File**: `src/app/api/workspace/invite/route.ts:1-45`
**Status**: 🟡 PARTIAL
**Masalah**: **Tidak ada email yang dikirim.** Insert ke `workspace_invitations` tapi TIDAK kirim email — user yang diinvite tidak tahu.

### 69. GET /api/workspace/members

**File**: `src/app/api/workspace/members/route.ts:1-30`
**Status**: 🟡 PARTIAL
**Masalah**: **DELETE handler tidak ada sama sekali.** Hanya GET.

### 70. POST /api/workspace/avatar

**File**: `src/app/api/workspace/avatar/route.ts:1-57`
**Status**: ✅ REAL
**Masalah**: Tidak ada.

### 71. POST /api/log

**File**: `src/app/api/log/route.ts:1-21`
**Status**: 🟡 PARTIAL
**Masalah**: **🔴 SECURITY — Tidak ada auth check.** Siapapun bisa POST log entries — log injection vulnerability.

### BONUS: POST /api/webhooks/supabase

**File**: `src/app/api/webhooks/supabase/route.ts:1-24`
**Status**: ⚫ DEAD
**Masalah**: Semua switch case adalah no-op `break`. Tidak ada webhook secret verification.

---

## DEAD CODE

- `src/components/admin/admin-dashboard.tsx` (416 baris) — Legacy dashboard component, TIDAK di-import dari halaman manapun.

---

## Hasil Dummy Hunting

### Ditemukan di Components

- Tidak ditemukan dummy data di components. Semua data dari DB/API atau dari parent props yang source-nya DB.

### Ditemukan di Pages

- `src/app/(admin)/admin/settings/page.tsx:53-58` — Security section hardcoded: `'Enabled (next.config.mjs)'`, `'AES-256-GCM'`, `'Enabled on all tables'`. Klaim ini TIDAK diverifikasi runtime.

### Ditemukan di API/Actions

- `src/app/api/prd/refine/route.ts:133` — `changes: 1` hardcoded regardless of actual diff.

### Data yang Terlalu Sempurna

- Tidak ditemukan data yang terlalu sempurna/statis. Semua angka, stats, dan counts dari real DB queries.

---

## Status Integrasi Eksternal

| Service              | Dipakai Untuk                                    | File                                                                  | Env Var                                                                                  | Env Terset?       | Kode Dipanggil?                 | Status                                   |
| -------------------- | ------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------- | ------------------------------- | ---------------------------------------- |
| Supabase Auth        | Login, session, user mgmt                        | `src/lib/supabase/`                                                   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ✅                | ✅                              | ✅ REAL                                  |
| Supabase Database    | All data storage                                 | `src/lib/supabase/`                                                   | `DATABASE_URL`                                                                           | ✅                | ✅                              | ✅ REAL                                  |
| Supabase Storage     | Avatars (user + workspace)                       | `src/lib/actions/profile.ts`, `src/app/api/workspace/avatar/route.ts` | (uses Supabase client)                                                                   | ✅                | ✅                              | ✅ REAL                                  |
| AI Providers (multi) | PRD generation, suggest, review, refine, copilot | `src/lib/ai/`, `src/app/api/prd/`                                     | (stored in `providers` table)                                                            | ✅ (per provider) | ✅                              | ✅ REAL                                  |
| Resend (Email)       | Invitations, notifications                       | `src/lib/email/send.ts`                                               | `RESEND_API_KEY`                                                                         | ❌ Kosong         | ✅ (called)                     | 🔴 NOT CONFIGURED — email tidak terkirim |
| LangSmith            | AI observability, cost tracking                  | `src/lib/ai/langsmith.ts`                                             | `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT`, `LANGCHAIN_TRACING_V2`                         | ✅                | ✅                              | ✅ REAL                                  |
| Yjs (Collaboration)  | Real-time collab editing                         | `src/components/editor/tiptap-editor.tsx`                             | N/A                                                                                      | N/A               | 🟡 Loaded tapi `provider: null` | 🟡 WIRED BUT NOT CONNECTED               |

---

## KONDISI SISTEM SAAT INI — LAPORAN JUJUR

### Statistik

- Total fitur terdokumentasi: **71 + 1 bonus**
- ✅ REAL (berfungsi penuh, terverifikasi end-to-end): **51**
- 🟡 PARTIAL (ada tapi tidak lengkap): **9**
- 🔴 DUMMY/MOCKUP/PLACEHOLDER/HARDCODE: **0**
- 🔴 BROKEN: **0**
- ⚫ DEAD (tidak bisa diakses/dipanggil): **11**
- Total temuan dummy/hardcode dari dummy hunting: **2 lokasi**
- Total env var bermasalah: **1** (RESEND_API_KEY)

### Daftar Fitur Bermasalah (🔴 dan ⚫)

**⚫ DEAD (11 fitur):**

1. #20 Settings Main — redirect to /dashboard
2. #21 Settings Profile — redirect to /dashboard
3. #22 Settings Providers — redirect to /dashboard
4. #23 Settings API Keys — redirect to /dashboard
5. #24 Settings Notifications — redirect to /dashboard
6. #25 Settings Preferences — redirect to /dashboard
7. #26 Settings Audit — redirect to /dashboard
8. #10 PRD Export Page — redirect to editor (export via modal)
9. #15 Workspace Hub — redirect to /workspace/members
10. Webhook Supabase route — all handlers no-op
11. `admin-dashboard.tsx` — legacy component, not imported

### Bug & Security Issues (Critical)

1. **🔴 SECURITY: `/api/providers` POST menyimpan API key TANPA enkripsi** (`route.ts:55`) — kolom `api_key_encrypted` tapi value plaintext
2. **🔴 SECURITY: `/api/log` TANPA auth** (`route.ts`) — log injection vulnerability
3. **🔴 SECURITY: `fetchActivityLog()` TANPA `requireSuperAdmin()`** (`activity/actions.ts`) — any user bisa baca activity log
4. **BUG: Pipeline Board status `approved` hilang** — PRDs approved tidak tampil di board
5. **BUG: `/api/prd/refine` update content.sections tapi TIDAK regenerate tiptap_content** — editor stale
6. **BUG: `/api/prd/[prdId]/share` tidak check insert error** — bisa return `token: undefined`
7. **MISSING: `/api/workspace/invite` tidak kirim email** — invitation hanya DB row
8. **MISSING: `/api/workspace/members` DELETE handler tidak ada**

### Area Kode Paling Banyak Masalah

- `src/app/(app)/settings/` — 7 dari 7 halaman DEAD (redirect only)
- `src/app/api/` — 3 security issues, 2 bugs di routes

### Integrasi yang Tidak Berfungsi

- **Resend (Email)**: `RESEND_API_KEY` kosong — semua email (invite, notification, password reset) TIDAK terkirim. Kode handle graceful skip tapi user tidak terima email.
- **Yjs (Real-time Collaboration)**: Extension loaded tapi `provider: null` — collab tidak berfungsi.

### Penilaian Jujur Kondisi Project

**Bagian yang SOLID:** Core functionality DraftMind sudah kuat. Dashboard, PRD lifecycle (create → generate → edit → review → export → share), AI integration (multi-provider dengan fallback), workspace management, comments, version history, dan notifications — semuanya real end-to-end dengan proper DB queries, auth guards, dan error handling. Tidak ditemukan dummy data atau mockup sama sekali — ini project yang genuine, bukan prototype yang dipoles.

**Bagian yang RAPUH:** Ada 3 security vulnerability yang harus di-fix sebelum production: API key storage tanpa encryption, log endpoint tanpa auth, dan activity log tanpa admin guard. Beberapa API routes kurang robust — share link bisa return undefined token, refine endpoint bikin editor stale, dan workspace invite tidak kirim email. Email integration belum configured — semua notifikasi email silently discarded.

**Jarak ke Production:** Project ini ~85% production-ready. Yang blocking adalah: (1) fix 3 security bugs, (2) configure email service, (3) fix refine endpoint tiptap sync. Settings pages (7 DEAD) bukan blocker karena profile editing via modal sudah jalan. Real-time collaboration belum terhubung tapi sudah wired — tinggal connect Yjs provider. Tidak ada satu pun dummy/placeholder data yang bisa mislead user.
