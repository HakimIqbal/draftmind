# DraftMind User Guide

A concise guide to using DraftMind for creating, editing, and managing Product Requirement Documents.

---

## 1. Login

1. Navigate to `/login` and sign in with email/password or OAuth provider.
2. New users without a workspace will be prompted to create one from the dashboard.
3. After login, you land on the **Dashboard**.

---

## 2. Dashboard

The dashboard (`/dashboard`) shows:

- **Recent PRDs** — Your most recently edited documents
- **Activity Feed** — Recent actions across the workspace
- **Quick Stats** — PRD count, health scores, AI usage

From here you can:

- Click **New PRD** to generate a new document
- Search PRDs with the global search bar or command palette (`Cmd/Ctrl+K`)
- Switch between list view and pipeline (Kanban) view

---

## 3. Creating a PRD

1. Click **New PRD** or navigate to `/prds/new`.
2. Fill in the generation form:
   - **Product Name** — The product or feature name
   - **Description** — A brief summary of what the product does
   - **Target Audience** — Who the product is for
   - **Template** — Select from predefined templates or start blank
3. Adjust AI settings:
   - **Provider** — Choose from configured AI providers
   - **Model** — Select the specific model variant
   - **Temperature** — Control creativity vs. precision (0.0 to 1.0)
   - **Tone** — Formal, casual, technical, etc.
   - **Length** — Short, medium, or detailed
4. Click **Generate** to start AI generation.

---

## 4. Using the Editor

### Basic Editing

The editor (`/prds/[prdId]`) is a rich-text block editor powered by Tiptap. Type directly, use keyboard shortcuts (Cmd+B for bold, Cmd+I for italic), and drag blocks to reorder.

### Slash Menu

Type `/` at the start of any line to open the slash command menu:

- `/heading` — Insert heading (H1, H2, H3)
- `/bullet` — Bullet list
- `/numbered` — Numbered list
- `/checklist` — Checklist with checkboxes
- `/table` — Insert a table
- `/code` — Code block
- `/divider` — Horizontal rule
- `/quote` — Block quote

### Editor Panels

The editor has several panels accessible from the toolbar:

| Panel          | Description                                 |
| -------------- | ------------------------------------------- |
| **Outline**    | Document structure with section navigation  |
| **Comments**   | Inline comments with threads and resolution |
| **History**    | Version history with restore capability     |
| **AI Copilot** | Chat-based AI assistant for PRD questions   |

### AI Copilot

The AI Copilot is a chat panel on the right side of the editor. You can:

- Ask questions about your PRD content
- Request reviews and feedback
- Get suggestions for improvements
- Chat history is preserved per PRD

### AI Assist (Inline)

Select text in the editor to open the AI Assist panel with:

**Quick Actions:**

- **Rewrite** — Clearer & more direct
- **Expand** — Add detail & context
- **Summarize** — Condense to key points
- **Shorter** — Cut 40-60%
- **More formal** — Professional tone
- **Fix grammar** — Fix spelling & syntax

**More Actions:**

- **Translate** — Auto-detect language and translate (ID↔EN)
- **Add examples** — Concrete examples
- **Make actionable** — Convert to action items
- **Add metrics** — Add KPIs & targets
- **Simplify jargon** — Plain language
- **To table** — Table format
- **To list** — Bullet list format

**Custom Instruction** — Type any free-text instruction for the AI.

Each action generates 3 suggestion variants (conservative, balanced, creative) that you can insert or copy.

### Comments

- Select text and use the comment action to add an inline comment.
- Comments are visible in the Comments panel and support threads.
- Team members can reply and resolve comments.

### Health Score

Each PRD has a health score (0–100) displayed in the editor, based on completeness, specificity, structure, and consistency.

---

## 5. AI Review

1. Open a PRD and click **AI Review** in the toolbar (or navigate to `/prds/[prdId]/ai-review`).
2. The AI analyzes your document and provides:
   - An overall quality **score** (0–100)
   - Section-by-section feedback
   - Specific **improvement suggestions**
3. Review results appear in a dedicated page. Click any suggestion to see details.

---

## 6. Exporting

1. Open a PRD and click **Export** (or navigate to `/prds/[prdId]/export`).
2. Choose a format:
   - **PDF** — Formatted document with headers and styling
   - **DOCX** — Microsoft Word compatible
   - **Markdown** — Plain Markdown text
   - **HTML** — Styled HTML document
   - **Slack** — Slack message blocks
   - **Jira** — Jira ADF format
3. PDF generation may take a few seconds (uses headless Chromium).

---

## 7. Version History

1. Navigate to `/prds/[prdId]/version-history` or use the History panel in the editor.
2. View all saved versions with timestamps and authors.
3. Restore any previous version if needed.

---

## 8. PRD Management

From the PRD list (`/prds`):

- **Pipeline view** (`/prds/pipeline`) — Kanban board with status columns
- **Duplicate** — Create a copy of an existing PRD
- **Archive** — Soft-delete a PRD
- **Pin** — Pin important PRDs to the top
- **Status** — Update PRD status (draft, in_review, approved, etc.)

---

## 9. Workspace

### Members (`/workspace/members`)

- Invite new members by email (they receive an invitation link)
- Assign roles: **Admin** (full access), **Editor** (can edit PRDs), **Viewer** (read-only)
- Remove members or change roles

### Settings (`/workspace/settings`)

- **Workspace name** and description
- **Default template** for new PRDs

### Activity (`/workspace/activity`)

- View an audit trail of all workspace actions

### Invitations (`/workspace/invite/[id]`)

- Accept or decline workspace invitations

---

## 10. User Settings

| Page                      | Description                                 |
| ------------------------- | ------------------------------------------- |
| `/settings/profile`       | Display name, email, avatar                 |
| `/settings/providers`     | Personal AI provider API keys               |
| `/settings/notifications` | Notification preferences                    |
| `/settings/preferences`   | UI preferences (theme, font, density, etc.) |
| `/settings/api-keys`      | API key management                          |
| `/settings/audit`         | Personal activity log                       |

---

## 11. Templates (`/templates`)

Browse and manage PRD templates. Templates provide pre-filled section structures for common document types.

---

## 12. Search (`/search`)

Global search across all PRDs in your workspace. Also accessible via the command palette (`Cmd/Ctrl+K`).

---

## 13. AI Runs (`/ai-runs`)

View history of all AI operations (generation, review, suggestions) with status, duration, and token usage.

---

## 14. Admin Panel (`/admin`)

Available only to super admins (`is_super_admin = true`):

| Page                   | Description                       |
| ---------------------- | --------------------------------- |
| `/admin`               | Dashboard with system stats       |
| `/admin/users`         | User management                   |
| `/admin/workspaces`    | Workspace management              |
| `/admin/prds`          | All PRDs across workspaces        |
| `/admin/providers`     | Global AI provider configuration  |
| `/admin/ai-runs`       | All AI runs across workspaces     |
| `/admin/templates`     | Template management               |
| `/admin/activity`      | System-wide activity log          |
| `/admin/analytics`     | Usage analytics                   |
| `/admin/settings`      | System settings                   |
| `/admin/announcements` | System announcements              |
| `/admin/system-logs`   | Error logs and system diagnostics |
