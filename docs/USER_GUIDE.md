# DraftMind User Guide

A concise guide to using DraftMind for creating, editing, and managing Product Requirement Documents.

---

## 1. Login & Onboarding

1. Navigate to `/login` and sign in with your email and password (or OAuth provider).
2. First-time users are redirected to `/onboarding` where you:
   - Set your display name and role
   - Create or join a workspace
   - Optionally configure an AI provider API key
3. After onboarding, you land on the **Home** dashboard.

---

## 2. Creating a PRD (Generate Form)

1. From the dashboard, click **New PRD** or navigate to `/prds/new`.
2. Fill in the generation form:
   - **Product Name** — The product or feature name
   - **Description** — A brief summary of what the product does
   - **Target Audience** — Who the product is for
   - **Template** — Select from predefined PRD templates or start blank
3. Open the **Tweaks Panel** (gear icon) to adjust:
   - **AI Provider** — Choose from Anthropic, OpenAI, Gemini, Groq, Sumopod, or GaNRouter
   - **Model** — Select the specific model variant
   - **Temperature** — Control creativity vs. precision (0.0 to 1.0)
   - **Tone** — Formal, casual, technical, etc.
   - **Length** — Short, medium, or detailed
4. Click **Generate** to start AI generation. Progress is streamed in real time.

---

## 3. Using the Editor

### Basic Editing

The editor is a rich-text block editor powered by Tiptap. You can type directly, use keyboard shortcuts (Ctrl/Cmd+B for bold, etc.), and drag blocks to reorder them.

### Slash Menu

Type `/` at the start of any line to open the slash command menu:

- `/heading` — Insert heading (H1, H2, H3)
- `/bullet` — Bullet list
- `/numbered` — Numbered list
- `/table` — Insert a table
- `/image` — Insert an image
- `/code` — Code block
- `/divider` — Horizontal rule
- `/quote` — Block quote

### AI Copilot

- Select text and click the AI icon (or use the keyboard shortcut) to:
  - **Expand** — Add more detail to the selected section
  - **Simplify** — Make the text more concise
  - **Rewrite** — Rephrase for clarity
  - **Continue** — Generate the next section based on context
- The AI copilot uses your configured provider and respects tweaks settings.

### Comments

- Select text and click the comment icon to add an inline comment.
- Comments are visible in the right sidebar and support threads.
- Team members can reply and resolve comments.

---

## 4. AI Review

1. Open a PRD in the editor and click **AI Review** in the toolbar.
2. The AI analyzes your document and provides:
   - An overall quality **score** (0-100)
   - Section-by-section feedback
   - Specific **improvement suggestions** you can apply with one click
3. Review results appear in a side panel. Click any suggestion to jump to the relevant section.

---

## 5. Exporting

1. Open a PRD and click the **Export** button in the toolbar.
2. Choose a format:
   - **PDF** — Formatted document with headers and styling
   - **DOCX** — Microsoft Word compatible
   - **Markdown** — Plain Markdown text
   - **HTML** — Styled HTML document
   - **JSON** — Structured data (for integrations)
   - **Plain Text** — Unformatted text
3. The file downloads automatically. PDF generation may take a few seconds as it renders via headless Chromium.

---

## 6. Managing Workspace

### Members

- Navigate to **Settings > Workspace > Members**.
- **Invite** new members by email (they receive an invitation link).
- Assign roles: **Admin** (full access), **Editor** (can edit PRDs), **Viewer** (read-only).
- Remove members or change roles as needed.

### AI Providers

- Navigate to **Settings > Workspace > Providers**.
- Add API keys for each AI provider your team uses.
- Keys are encrypted at rest using AES-256-GCM.
- Set a **default provider** that applies to all new PRDs.

### General Settings

- **Workspace name** and **description**
- **Default template** for new PRDs
- **Activity log** — View an immutable audit trail of all workspace actions

---

## 7. Tweaks Panel

The Tweaks Panel is accessible from the generate form and the editor toolbar. It controls AI behavior:

| Setting     | Options                                             | Description                                  |
| ----------- | --------------------------------------------------- | -------------------------------------------- |
| Provider    | Anthropic, OpenAI, Gemini, Groq, Sumopod, GaNRouter | Which AI service to use                      |
| Model       | Varies by provider                                  | Specific model version                       |
| Temperature | 0.0 - 1.0                                           | Lower = more focused, higher = more creative |
| Tone        | Formal, Casual, Technical, Friendly                 | Writing style                                |
| Length      | Short, Medium, Detailed                             | Output verbosity                             |
| Max Tokens  | 1000 - 16000                                        | Maximum output length                        |

Changes in the Tweaks Panel apply immediately to the next AI operation (generate, copilot, or review).
