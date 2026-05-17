# Workflow User — DraftMind

Dokumentasi lengkap semua workflow dari perspektif **user biasa** (bukan super admin). Berdasarkan kode yang benar-benar ada di codebase — tidak ada asumsi fitur yang tidak ada.

---

## Daftar Isi

1. [Cara Masuk (Login)](#1-cara-masuk-login)
2. [Invite Flow End-to-End](#2-invite-flow-end-to-end)
3. [Onboarding Pertama Kali](#3-onboarding-pertama-kali)
4. [Dashboard & Navigasi](#4-dashboard--navigasi)
5. [Membuat PRD Baru](#5-membuat-prd-baru)
6. [PRD Editor — Lengkap](#6-prd-editor--lengkap)
7. [Pipeline Board](#7-pipeline-board)
8. [Templates](#8-templates)
9. [Analytics](#9-analytics)
10. [Workspace](#10-workspace)
11. [Notifikasi](#11-notifikasi)
12. [Profile](#12-profile)
13. [Search](#13-search)

---

## 1. Cara Masuk (Login)

### URL & File

- Halaman: `/login`
- File: `src/app/(auth)/login/page.tsx`, `src/components/auth/login-page-client.tsx`, `src/app/(auth)/login/actions.ts`

### Alur Login

1. Buka `/login`. Server component mengecek apakah user sudah login:
   - Jika sudah login dan super admin → redirect ke `/admin`
   - Jika sudah login dan user biasa → redirect ke `/dashboard`
2. Jika belum login, render form login.
3. User masukkan **email** dan **password**.
4. Klik **Sign In** (atau tekan Enter).
5. Sistem memanggil `supabase.signInWithPassword()`.

### Jika Login Gagal

- Sistem cek `checkBannedStatus(email)` via Supabase admin API:
  - Jika akun **dinonaktifkan** (`banned_until` di masa depan): tampil banner merah "Akun Anda telah dinonaktifkan oleh administrator..."
  - Jika bukan banned: tampil toast "Invalid email or password"

### Jika Login Berhasil

1. Sistem fetch profile untuk cek `is_super_admin` dan `force_password_change`.
2. Fire-and-forget `checkUserRole()` untuk mencatat aktivitas login ke `activity_log`.
3. Redirect berdasarkan kondisi:
   - Jika `force_password_change = true` → `/dashboard?force_password_change=true`
   - Jika `is_super_admin = true` → `/admin`
   - Default → `/dashboard`

### Remember Me

- Checkbox **Remember Me** di form login:
  - Dicentang: Set cookie `remember_me=true` dengan expiry 30 hari
  - Tidak dicentang: Set cookie `remember_me=false` (session duration — hilang saat browser ditutup)

### Session Expired

- Jika middleware mendeteksi cookie Supabase ada tapi user null (sesi kedaluwarsa/diblokir):
  - Semua cookie `sb-*` dihapus
  - Redirect ke `/login?reason=session_expired`
  - Banner amber "Session expired" tampil di form login

### Middleware Protection

- File: `src/middleware.ts`
- Semua route `/dashboard`, `/prds`, `/templates`, `/workspace`, `/ai-runs`, `/invite` memerlukan autentikasi
- User biasa yang mencoba akses route `/admin` → redirect ke `/dashboard`
- Super admin yang mencoba akses route user → redirect ke `/admin`

### OAuth / Magic Link Callback

- File: `src/app/api/auth/callback/route.ts`
- Endpoint: `/api/auth/callback`
- Digunakan jika ada magic link / OAuth flow
- Parameter `next=/auto` → sistem auto-detect role dari profile dan redirect ke `/admin` atau `/dashboard`
- Jika tidak ada `code` di query params → redirect ke `/login?error=missing_code`
- Jika exchange gagal → redirect ke `/login?error=auth_failed`

### Edge Cases

- Jika profile query gagal saat callback → fallback redirect ke `/dashboard`
- Tidak ada self-service "Forgot Password" — teks di form: "Forgot password? Contact your admin."

---

## 2. Invite Flow End-to-End

### File

- Pengirim (admin): `src/app/(app)/workspace/members/actions.ts`
- Halaman penerima: `src/app/(app)/invite/[invitationId]/page.tsx`
- Client component: `src/app/(app)/invite/[invitationId]/invite-response.tsx`

### Alur dari Sisi Admin (Mengundang)

1. Admin buka `/workspace/members`.
2. Klik tombol **Invite Member**.
3. **InviteModal** muncul:
   - Search user berdasarkan nama/email (hanya non-member, non-super-admin)
   - Pilih role: Admin / Editor / Commenter / Viewer
4. Klik **Send Invitation**.
5. Server action `inviteMember()`:
   - Buat record di `workspace_invitations` dengan expiry **7 hari**
   - Generate token unik
   - Kirim notifikasi tipe `workspace_invite` ke user (jika sudah terdaftar)
   - Log aktivitas `member_invited`
6. Invitation muncul di tabel "Pending Invitations".

### Alur dari Sisi User (Menerima)

1. User menerima notifikasi bell icon bertipe `workspace_invite`.
2. Klik notifikasi → navigasi ke `/invite/{invitationId}`.
3. Server component validasi secara berurutan:
   - Invitation tidak ditemukan → error state
   - Sudah diterima → error state
   - Sudah dicabut → error state
   - Sudah kedaluwarsa → error state
   - Email invitation tidak cocok dengan akun yang login → error state
4. Jika valid: tampil UI dengan nama workspace dan nama pengundang.
5. User pilih:
   - **Accept & Join** → `acceptInvitation()`:
     - Cek user belum menjadi member
     - Tambah ke `workspace_members` dengan role yang ditentukan
     - Update `accepted_at` di invitation
     - Kirim notifikasi ke semua admin workspace
     - Log aktivitas `member_joined`
     - Redirect ke `/dashboard`
   - **Decline** → `rejectInvitation()`:
     - Set `revoked_at`
     - Hapus notifikasi invite dari bell icon
     - Kirim notifikasi `invitation_declined` ke pengundang
     - Redirect ke `/dashboard`

### Admin Mengelola Invitation Pending

- **Resend**: Perpanjang expiry 7 hari → log `member_invited` (dengan metadata action: 'resent')
- **Revoke**: Set `revoked_at` → log `member_invitation_revoked`

---

## 3. Onboarding Pertama Kali

### Force Password Change

- Field: `profiles.force_password_change = true`
- Terpicu saat admin reset password user via panel admin
- Setelah login → redirect ke `/dashboard?force_password_change=true`
- User harus ganti password sebelum bisa melanjutkan

### Onboarding Status

- Field: `profiles.onboarding_completed_at` — timestamp pertama kali user menyelesaikan onboarding
- Status user di admin: "Pending" jika null, "Active" jika sudah diisi

### Workspace Kosong

- Jika user login tapi belum punya workspace → dashboard menampilkan **empty state**:
  - Welcome message dengan nama user
  - SVG icon
  - Tombol "Create Workspace" → link ke `/workspace/settings`

---

## 4. Dashboard & Navigasi

### URL & File

- Halaman: `/dashboard`
- File: `src/app/(app)/dashboard/page.tsx`

### Data yang Ditampilkan

Dashboard memuat **6 query paralel**:

1. **Dashboard stats**: total PRD + breakdown per status
2. **Continue working**: 4 PRD terbaru milik user (ordered by updated_at)
3. **Activity feed**: 6 aktivitas terbaru di workspace
4. **Needs attention**: PRD yang butuh perhatian
5. **Built-in templates**: 4 template paling populer (ordered by use_count)
6. **User profile**: data dari Supabase auth

Komponen `<HomeFeed>` menerima: user name, workspace ID, stats, activities, templates.

### Navigasi Sidebar

File: `src/components/layout/sidebar.tsx`

**Menu utama:**

- Dashboard `/dashboard`
- My PRDs `/prds`
- Templates `/templates`
- Analytics `/analytics`

**Menu workspace (bawah main nav):**

- Members `/workspace/members`
- Settings `/workspace/settings` (admin only)
- Activity `/workspace/activity` (admin only)

**Bagian bawah sidebar:**

- Recent PRDs (list terbaru, jika ada)
- Workspace Switcher
- User menu (avatar, nama, email, Logout)

### Topbar

File: `src/components/layout/topbar.tsx`

- **Search** (`⌘K`): Input search PRDs
- **Notifications bell**: Badge jumlah unread, polling 10 detik, refresh saat tab aktif
- **New PRD** button: navigasi ke `/prds/new`

### Sidebar Collapsed (Rail)

File: `src/components/layout/sidebar-collapsed-rail.tsx`

- Sidebar bisa di-collapse menjadi rail ikon dengan tooltips
- Logo transform menjadi expand arrow saat hover
- User popover tetap tersedia di bagian bawah

### Workspace Switcher

File: `src/components/layout/workspace-switcher.tsx`

- Dropdown menampilkan semua workspace user beserta role
- Checkmark pada workspace aktif
- Tombol **"Create workspace"** → modal dengan field: Name (wajib), Industry, Team Size
- Submit → `createWorkspace()`: auto-generate slug, tambah creator sebagai admin, log `workspace_created`

---

## 5. Membuat PRD Baru

### URL & File

- Halaman: `/prds/new`
- File: `src/app/(app)/prds/new/page.tsx`, `src/app/(app)/prds/new/actions.ts`

### Form Generate PRD

Komponen `<GenerateForm>` menerima: user ID, workspace ID, user name, brief (pre-fill dari URL `?brief=`), providers aktif.

**Field form:**
| Field | Keterangan |
|-------|------------|
| Title | Nama PRD (wajib) |
| Project Tag | Tag/kategori project |
| Brief | Deskripsi singkat masalah (bisa pre-fill dari URL) |
| Start Date | Tanggal mulai |
| End Date | Tanggal selesai |
| Stakeholders | Daftar stakeholder |
| Team Members | Pilih dari member workspace |
| Constraints | Batasan/constraint project |
| Platform | Web/mobile/dll |
| Priority | Tingkat prioritas |
| Tech Stack | Stack teknologi |
| Design Link | Link Figma/design |
| Template | Pilih template dari library (opsional) |
| AI Provider | Pilih provider AI jika tersedia lebih dari satu |

**Pilih dari template:**

- Opsi template muncul dari `getTemplates()`: semua built-in + custom workspace
- Diurutkan berdasarkan `use_count` descending

### Alur Submit

1. User klik **Generate PRD**.
2. Server action `createPRDAndGenerate()`:
   - Buat PRD record di DB (status: `draft`)
   - Jika template dipilih: fetch struktur template + increment `use_count`
   - Insert record `ai_runs` (type: `generate_prd`, status: `queued`)
   - Metadata: start_date, end_date, stakeholders, team info, platform, priority, tech stack, design link
   - Log aktivitas `prd_created`
3. Redirect ke `/prds/{prdId}?generating=true`

### Loading Screen Generasi

- File: `src/app/(app)/prds/[prdId]/generation-actions.ts`
- Editor page mendeteksi `?generating=true` → cek ai_run aktif (queued/running)
- Jika ada ai_run aktif: tampilkan `<GenerationLoading>` screen
- Polling `pollAIRunStatus(aiRunId)` hingga status `success` atau `error`
- Setelah sukses: halaman load editor normal

---

## 6. PRD Editor — Lengkap

### URL & File

- Halaman: `/prds/{prdId}`
- File server: `src/app/(app)/prds/[prdId]/page.tsx`
- Komponen utama: `src/components/editor/editor-shell.tsx`

### Data yang Diload

- PRD penuh dari DB: id, title, project_tag, status, version, health score, word count, tiptap_content
- User info: nama, email, avatar
- Last editor info: nama, email, avatar
- AI providers aktif (untuk model selector)
- Permission flags: `canChangeStatus` (hanya owner PRD atau workspace admin)

Page menggunakan `force-dynamic` — selalu data fresh, tidak di-cache.

UUID prdId divalidasi format-nya sebelum query DB.

### Layout Editor

3 panel utama:

```
[Panel Kiri]     [Panel Tengah]        [Panel Kanan]
OutlinePanel  |  TiptapEditor        |  AIAssistPanel
Tabs:         |  + BubbleToolbar     |  atau
- Outline     |  + InlineComment     |  AICopilotPanel
- Comments    |    Popover           |
- Info        |                      |
```

Panel bisa di-collapse. Di mobile (<768px) semua panel auto-collapse.

---

### 6.1 Panel Kiri — Outline

File: `src/components/editor/outline-panel.tsx`

**Tab Outline:**

- Menampilkan semua heading H1–H3 dari konten editor secara live
- Scan ulang setiap update, retry setiap 500ms sampai heading ditemukan
- Klik heading → smooth scroll editor ke section tersebut
- Heading aktif di-highlight (threshold 65% dari viewport)
- **Eye icon** di setiap heading → toggle section visibility (sembunyikan/tampilkan di editor via `updateHiddenSections()`)

**Tab Comments:**

- Menampilkan semua thread comment PRD ini
- Filter: **Open** / **Resolved** / **@Me**
- Thread visualization: comment induk + reply bersarang
- Aksi per comment:
  - Reply: inline reply composition
  - Resolve/Reopen: toggle `resolved_at`
  - Edit: hanya milik sendiri
  - Delete: hanya milik sendiri (cascade ke reply)
- Section badge menunjukkan di section mana comment dibuat
- Quoted text dari selection range ditampilkan
- Waktu relatif ("2m ago")
- Keyboard: `Cmd+Enter` submit reply, `Esc` cancel

**Tab Info:**

- Title PRD
- Status saat ini
- Versi saat ini
- Word count & Read time
- Tanggal terakhir update
- Health score (circular ring + breakdown)
- "Run AI Review" CTA link

---

### 6.2 Panel Tengah — Editor

File: `src/components/editor/tiptap-editor.tsx`

**Extensions aktif:** StarterKit, Placeholder, Link, TextAlign, Underline, TaskList, TaskItem, Table, CommentMark, SectionVisibility

**Auto-save:**

- Debounce 300ms setelah user berhenti mengetik
- Server action `savePRDContent()` menyimpan `tiptap_content`, `word_count`, `read_time_minutes`
- Footer menampilkan status: Saving... / Saved / Error / Idle
- `isSavingRef` lock: satu save in-flight sekaligus; save berikutnya masuk `pendingContentRef` queue
- Timestamp "last edit" update di footer dan header tanpa perlu reload halaman

**Auto-versioning:**

- Version snapshot otomatis saat idle 3 detik
- Version snapshot periodik setiap 5 menit

**Slash Menu (/ command):**
Ketik `/` di editor untuk membuka command palette:

| Command       | Shortcut |
| ------------- | -------- |
| Heading 1     | `#`      |
| Heading 2     | `##`     |
| Heading 3     | `###`    |
| Bullet List   | `-`      |
| Numbered List | `1.`     |
| Checklist     | `[]`     |
| Divider       | `---`    |
| Table         | —        |
| Code Block    | ` ``` `  |
| Quote         | `>`      |

Navigasi: Arrow Up/Down, Enter execute, Esc tutup. Search by command name.

**Bubble Toolbar (text selection):**
File: `src/components/editor/bubble-toolbar.tsx`
Muncul float saat user memilih teks:

| Aksi          | Keterangan                               |
| ------------- | ---------------------------------------- |
| Text Style    | Dropdown: Normal / H1 / H2 / H3          |
| Bold          | Toggle bold                              |
| Italic        | Toggle italic                            |
| Strikethrough | Toggle strikethrough                     |
| Underline     | Toggle underline                         |
| Link          | Mode input URL (Apply / Remove / Cancel) |
| Alignment     | Left / Center / Right / Justify          |
| Comment       | Buka InlineCommentPopover                |
| AI Assist     | Buka AIAssistPanel dengan teks terpilih  |

---

### 6.3 Panel Kanan — AI Assist

File: `src/components/editor/ai-assist-panel.tsx`

**Cara membuka:** Klik AI Assist di bubble toolbar saat ada teks terpilih.

**Quick Actions (1 klik):**
Rewrite, Expand, Summarize, Shorter, Grammar, Formal

**More Actions:**
Translate, Add examples, Make actionable, Add metrics, Simplify jargon, To table, To list

**Custom Instruction:**
Input teks bebas + `Cmd+Enter` untuk submit

**Cara kerja:**

1. Pilih aksi atau tulis custom instruction
2. POST ke `/api/prd/ai-suggest` dengan: action, selectedText, sectionKey, providerId
3. Tampilkan **3 suggestions** (conservative, balanced, creative)
4. Per suggestion:
   - **Insert**: Replace teks terpilih di editor langsung
   - **Copy**: Salin ke clipboard
   - **Compare**: Tampilkan diff dengan original
5. Tombol **Retry** untuk regenerate semua suggestion

**Provider dropdown** tersedia jika ada lebih dari satu AI provider aktif.

---

### 6.4 Panel Kanan — AI Copilot

File: `src/components/editor/ai-copilot-panel.tsx`

**Fitur:**

- Chat multi-turn (percakapan berlanjut dalam satu sesi)
- Riwayat chat disimpan di **localStorage** (max 50 pesan, persist antar sesi)
- **Suggested prompts**: "Review PRD", "What's missing", "Improve overview", "Suggest risks"
- Edit/regenerate pesan sebelumnya
- Provider selection dropdown (jika multiple provider)
- Copy message, regenerate response
- Rendering markdown lengkap: heading, list, bold, italic, code block

**Posisi panel:** Dapat diubah via Tweaks (right / left / bottom).

---

### 6.5 Inline Comment

File: `src/components/editor/inline-comment-popover.tsx`, `src/components/editor/comments-actions.ts`

**Alur menambah comment:**

1. Pilih teks di editor
2. Klik tombol **Comment** di bubble toolbar
3. Popover muncul menampilkan quoted text
4. Ketik comment → `Cmd/Ctrl+Enter` atau klik Submit
5. Server action `addComment()`:
   - Buat record di `comments` dengan: body, section_key, selection_range (from/to + quoted text)
   - CommentMark diterapkan ke range teks di editor (highlight)
   - Notifikasi dikirim ke owner PRD (`comment_added`)
   - Notifikasi dikirim ke user yang di-@mention (`mention`)

**Reply:**

- Di CommentsPanel → klik Reply pada thread → ketik → `Cmd+Enter` submit
- Reply tersimpan dengan `parent_id` yang menunjuk ke comment induk
- Notifikasi `comment_reply` dikirim ke author comment induk

**Resolve:**

- Klik Resolve → `resolved_at` di-set → pindah ke tab "Resolved"
- Reopen: klik Reopen → `resolved_at` di-clear → kembali ke tab "Open"

**Edit:** Hanya bisa edit comment milik sendiri (update `body`, update `updated_at`)

**Delete:** Hanya bisa hapus comment milik sendiri — cascade ke semua reply

**@Mention:** Tulis `@nama` di body comment → deteksi via regex → notifikasi `mention` dikirim ke user tersebut

---

### 6.6 Version History

File: `src/components/editor/history-panel.tsx`

**Cara akses:** Klik tombol **History** di editor header.

**Fitur:**

- Timeline versi dikelompokkan per tanggal, lalu per kedekatan waktu (<5 menit = satu grup)
- Expand grup untuk melihat versi individual
- **Diff view**: Toggle "Highlight changes":
  - Teks yang ditambah: hijau
  - Teks yang dihapus: merah + strikethrough
  - Level karakter (character-level diff)
- Preview format: heading, tabel, list, code block di-render
- **Rename version**: Edit `change_summary` (nama display versi), server action `renameVersion()`
- **Restore version** (`restoreVersion()`):
  1. Simpan kondisi PRD saat ini sebagai versi baru
  2. Update `tiptap_content` PRD ke konten versi yang dipilih
  3. Increment `current_version`
  4. Log aktivitas `prd_version_restored`
  5. Revalidate cache `/prds/{prdId}` dan `/prds/{prdId}/version-history`

---

### 6.7 Export PRD

Diakses dari header editor (tombol **Export**). Implementasi sebagai modal/action di dalam editor.

**Format tersedia:**

- Markdown
- HTML
- PDF
- Word (.docx)
- Slack (format untuk paste)
- Jira (format untuk paste)

Catatan: Route `/prds/{prdId}/export` hanya melakukan redirect balik ke editor — export dihandle di dalam editor itu sendiri.

---

### 6.8 Share PRD

Diakses dari header editor (tombol **Share**).

1. Klik Share → sistem generate public share link
2. Record di tabel `prd_shares`: share_token, expires_at, view_count, is_active
3. Public URL: `/share/{share_token}` — dapat diakses **tanpa login**
4. `view_count` increment setiap kali link dibuka
5. Link bisa dinonaktifkan (`is_active = false`)
6. Log aktivitas `public_share_created`

Route `/share/*` dikonfigurasi sebagai **public route** di middleware (tidak memerlukan autentikasi).

---

### 6.9 Status PRD

Dropdown di editor header. File: `src/app/(app)/prds/[prdId]/actions.ts`

**Semua status yang tersedia:**
`draft` → `in_review` → `reviewed` → `refined` → `approved` / `final` / `blocked` / `shipped` / `archived`

**Permission:** Hanya **owner PRD** atau **workspace admin** (`canChangeStatus` flag dari server).

**Notifikasi status change:**
Saat status berubah (kecuali ke `draft`), semua member workspace menerima notifikasi — kecuali user yang mengubah:

| Status      | Pesan notifikasi                      |
| ----------- | ------------------------------------- |
| `in_review` | "[Nama] moved '[title]' to In Review" |
| `reviewed`  | "[Nama] marked '[title]' as Reviewed" |
| `refined`   | "[Nama] marked '[title]' as Refined"  |
| `approved`  | "[Nama] approved '[title]' 🎉"        |
| `final`     | "[Nama] marked '[title]' as Final 🎉" |

Log aktivitas: `prd_status_changed`

---

### 6.10 Duplicate PRD

Dari menu header editor → **Duplicate**.

Server action `duplicatePRD()`:

- Buat copy PRD dengan suffix " (copy)"
- Clone: content, tiptap_content, health_score, health_breakdown, word_count, read_time_minutes, hidden_sections, brief, project_tag
- Reset: version = 1, status = `draft`, owner = user yang menduplikasi
- Kirim notifikasi `prd_duplicated` ke owner PRD asli (jika bukan diri sendiri)
- Log aktivitas `prd_duplicated`
- Revalidate cache `/prds`
- Return ID PRD baru

---

### 6.11 Delete PRD

Dari menu header editor → **Delete**.

Server action `deletePRD()`:

- Hapus notifikasi yang mereferensikan PRD ini (menggunakan admin client)
- Hapus record PRD dari DB
- Log aktivitas `prd_deleted`
- Revalidate `/prds` dan `/dashboard`
- Redirect ke `/prds`

---

### 6.12 Save as Template

Dari menu header editor → **Save as Template**.
Menyimpan struktur PRD saat ini sebagai template custom untuk workspace.

---

### 6.13 Kolaborasi Real-time

File: `src/hooks/use-prd-presence.ts`, `src/components/editor/presence-avatars.tsx`, `src/components/editor/cursor-overlay.tsx`, `src/components/editor/section-badge.tsx`

**Fitur:**

- **Presence avatars** di footer editor: tampilkan siapa saja online di PRD ini
  - Hover avatar → popover: nama, email, section aktif
  - User sendiri ditandai "You" dengan border putus-putus
  - Animated fade saat user leave
  - Color-coded per userId (deterministik dari hash)
- **Remote cursors**: posisi kursor kolaborator tampil sebagai panah berwarna + label nama (CSS transform, easing 80ms)
- **Section badges**: badge di samping heading menampilkan siapa sedang edit section tersebut
- **Save broadcast**: saat user save, notifikasi "X saved the document" tampil ke kolaborator lain
- Cursor broadcast: debounce 50ms
- Channels: Presence channel (online users) + Broadcast channel (cursor/section/saves)

---

### 6.14 AI Review

URL: `/prds/{prdId}/ai-review`

File: `src/app/(app)/prds/[prdId]/ai-review/page.tsx`

- Tampilkan findings dari AI review terbaru yang berhasil
- Findings diurutkan per severity: **high** → **medium** → **low**
- Setiap finding: judul, deskripsi, suggested fix, section terkait
- Tracking: apakah fix sudah diterapkan (`fix_applied_at`) atau di-dismiss (`dismissed_at`)
- Data dari tabel `ai_review_findings` dan `ai_runs`

---

### 6.15 Health Score

File: `src/components/editor/health-score-display.tsx`

- Circular progress ring menampilkan score 0–100
- Grade berdasarkan score:
  - "Excellent" (≥90)
  - "Good shape" (≥70)
  - "Needs work" (≥50)
  - "Poor" (<50)
- Breakdown 4 dimensi: **Completeness**, **Specificity**, **Structural**, **Consistency**
- "N/A" jika belum ada score
- Link "Run AI Review" sebagai CTA

---

### 6.16 Markdown Mode

File: `src/components/editor/markdown-view.tsx`

- Toggle dari toolbar editor untuk switch ke mode markdown raw
- Textarea menampilkan konten sebagai markdown
- Convert TipTap JSON → Markdown saat masuk mode
- Convert Markdown → HTML saat blur (kembali ke rich text)
- Sinkronisasi otomatis jika konten eksternal berubah

---

### 6.17 Customization (Tweaks)

Store: `src/stores/tweaks-store.ts` — disimpan di localStorage key `draftmind-tweaks`.

| Preferensi       | Pilihan                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Theme            | `dark` / `light`                                                                                      |
| Font             | `fraunces-inter` / `playfair-inter` / `sans-inter` / `sans-geist` / `sans-ibmplex` / `dmserif-dmsans` |
| Density          | `compact` / `cozy`                                                                                    |
| Accent Color     | `ember` / `forest` / `deep-blue` / `plum` / `charcoal`                                                |
| Border Radius    | `sharp` / `default` / `rounded`                                                                       |
| Copilot Position | `right` / `left` / `bottom`                                                                           |

Action `reset()` mengembalikan semua preferensi ke default.

---

### 6.18 List PRD

URL: `/prds`

File: `src/app/(app)/prds/page.tsx`, `src/app/(app)/prds/client.tsx`

**Filter & search** via URL search params:

- `status` (default: "all") — filter berdasarkan status PRD
- `q` (default: "") — search query
- `sort` (default: "updated_at") — urutan sort

Komponen `<PRDListPageClient>` mengelola filter UI + update URL.
Komponen `<PRDListTable>` menampilkan tabel.

**Empty state**: Jika workspace belum punya PRD, tampil empty state dengan template count dan CTA buat PRD pertama.

---

## 7. Pipeline Board

### URL & File

- Halaman: `/prds/pipeline`
- File: `src/app/(app)/prds/pipeline/page.tsx`

### Tampilan

Kanban board view — semua PRD workspace dalam kolom status (max 200 PRD):

| Kolom     | Status PRD yang masuk   |
| --------- | ----------------------- |
| Draft     | `draft`                 |
| In Review | `in_review`, `reviewed` |
| Refined   | `refined`, `final`      |
| Approved  | `approved`              |
| Shipped   | `shipped`               |

Komponen `<PRDPipelineBoard>` menerima objek columns dari server.

---

## 8. Templates

### URL & File

- Halaman: `/templates`
- File: `src/app/(app)/templates/page.tsx`, `src/app/(app)/templates/actions.ts`

### Melihat Template Library

- **Built-in templates**: Global (`workspace_id IS NULL`), tidak bisa diedit/dihapus user
- **Custom workspace templates**: Milik workspace saat ini (`workspace_id = current workspace`)
- Diurutkan: built-in dulu, lalu berdasarkan `use_count` descending
- Komponen `<TemplatesLibrary>` menampilkan kartu per template dengan: icon, nama, deskripsi, category badge, use count

### Membuat Template Custom

Server action `createTemplate(data: TemplateFormData)`:

- Field: name, description, category, sections[], guidelines{}
- Struktur sections menyimpan section keys dan guidelines per section
- Log aktivitas `template_created`

### Edit Template Custom

Server action `updateTemplate(templateId, data)`:

- Validasi: template harus ada, **bukan built-in** (`is_built_in = false`), harus milik workspace sendiri
- Update: name, description, category, sections/guidelines
- Log aktivitas `template_updated`

### Hapus Template Custom

Server action `deleteTemplate(templateId)`:

- Validasi sama dengan update (tidak bisa hapus built-in)
- Log aktivitas `template_deleted`

---

## 9. Analytics

### URL

- Halaman: `/analytics`
- File: `src/app/(app)/analytics/`

Halaman analytics tersedia di sidebar navigasi user. Menampilkan data usage dan statistik PRD untuk workspace aktif user.

---

## 10. Workspace

### URL & File

- Root: `/workspace` → redirect otomatis ke `/workspace/members`
- Layout: `src/app/(app)/workspace/layout.tsx` → `<WorkspaceLayoutShell>` (tab navigation)
- File: `src/app/(app)/workspace/`

### 10.1 Tab Members

URL: `/workspace/members`

**Melihat daftar member:**

- Kolom: Avatar + Nama + Email, Role, Status (Online/Last active), Joined date
- **Status online**: `last_active_at` < 5 menit = "Online now" (titik hijau)
- Search member (client-side, filter nama/email)

**Invite member (admin only):**

1. Klik **Invite Member** → InviteModal muncul
2. Search user berdasarkan nama/email (hanya non-member, non-super-admin)
3. Pilih role: Admin / Editor / Commenter / Viewer
4. Send → `inviteMember()` action (lihat bagian 2)

**Ubah role (admin only):**

- Dropdown role di baris member
- Server action `changeRole()` → log `member_role_changed`

**Hapus member (admin only):**

- Server action `removeMember()`:
  - Hapus dari `workspace_members`
  - Kirim notifikasi `member_removed`
  - Log aktivitas `member_removed`

**Pending Invitations:**

- List di bawah member table
- Kolom: Email, Role, Sent date, Expires date
- Tombol **Resend** dan **Revoke** per invitation

**Realtime:** Tab ini subscribe ke perubahan `workspace_members` dan `workspace_invitations` via Supabase Realtime.

**Refresh on focus:** Tab refresh data saat window kembali aktif (`useRefreshOnFocus` hook, throttle 1s).

---

### 10.2 Tab Settings (Admin Only)

URL: `/workspace/settings`

Permission: Redirect ke `/workspace/members` jika role bukan admin.

**Field yang bisa diubah (server action `updateWorkspaceSettings()`):**

- Workspace name (wajib)
- Industry
- Team size

**Workspace photo:**

- Upload gambar (JPG/PNG/WebP, max 2MB)
- Crop circular dengan AvatarEditor
- Revalidate `/workspace/settings`, `/dashboard`, root layout

**Workspace slug:** Read-only (tidak bisa diubah dari UI)

**Danger Zone:**

- **Leave Workspace** (non-owner): server action `leaveWorkspace()`, log `workspace_left`
- **Delete Workspace** (owner only): konfirmasi dengan mengetik nama workspace, server action `deleteWorkspace()`, log `workspace_deleted`
- **Transfer Ownership** (owner only): pilih member → `transferOwnership()`:
  - Update `workspaces.owner_id`
  - Jadikan new owner sebagai admin
  - Log `workspace_ownership_transferred`

---

### 10.3 Tab Activity (Admin Only)

URL: `/workspace/activity`

Permission: Redirect ke `/workspace/members` jika bukan admin.

- Server action `getWorkspaceActivity()`: 50 aktivitas terbaru di workspace
- Exclude: login, logout events
- Setiap entri: avatar actor, nama, verb (30+ tipe di-mapping ke kalimat), waktu relatif
- Retry button jika gagal load

---

## 11. Notifikasi

### Cara Melihat

- **Bell icon** di topbar kanan atas
- Badge angka = jumlah notifikasi unread
- Klik bell → popover daftar notifikasi
- **Polling**: setiap 10 detik untuk update unread count
- **Refresh on focus**: update saat tab browser aktif kembali

### Mark as Read

- `read_at` di-set saat notifikasi diklik/dibaca
- Notifikasi dengan `read_at` tidak dihitung di badge

### Action URL

Setiap notifikasi memiliki `action_url` — klik notifikasi langsung navigasi ke resource terkait (PRD, workspace, dll.)

### Semua Tipe Notifikasi

| Tipe                  | Kapan dikirim                              | Pengirim             |
| --------------------- | ------------------------------------------ | -------------------- |
| `mention`             | User di-@mention dalam comment             | Comment actions      |
| `comment_reply`       | Ada reply ke comment milik user            | Comment actions      |
| `comment_added`       | Ada comment baru di PRD yang dimiliki user | Comment actions      |
| `workspace_invite`    | Diundang ke workspace                      | `inviteMember()`     |
| `member_joined`       | Member baru bergabung                      | `acceptInvitation()` |
| `member_removed`      | User dihapus dari workspace                | `removeMember()`     |
| `prd_duplicated`      | PRD milik user diduplikasi oleh orang lain | `duplicatePRD()`     |
| `status_changed`      | Status PRD berubah (ke semua member)       | `updatePRDStatus()`  |
| `integration_event`   | Announcement dari super admin              | Admin panel          |
| `ai_suggestion_ready` | AI selesai generate suggestion             | AI pipeline          |
| `approval_needed`     | Persetujuan diperlukan                     | —                    |
| `review_request`      | (Legacy — tidak aktif dipakai)             | —                    |
| `invitation_declined` | Undangan yang dikirim user ditolak         | `rejectInvitation()` |

Semua notifikasi disimpan di tabel `notifications`. Realtime update via Supabase Realtime subscription.

---

## 12. Profile

### Cara Akses

- Klik nama/avatar di bagian bawah sidebar → popup user menu
- Klik "Profile" atau "Edit Profile"

File: `src/components/settings/profile-modal.tsx`, `src/lib/actions/profile.ts`

### Ganti Nama

1. Klik field nama di modal
2. Edit → tombol Save / Cancel muncul
3. Server action `updateProfile()`:
   - Update `profiles.full_name`
   - Optimistic update via `useUserStore.setName()` → semua komponen update langsung (EditorHeader, sidebar, presence avatars)

### Upload/Ganti Foto Profil

1. Klik area avatar → file picker muncul
2. Pilih file: **JPG / PNG / WebP**, max **2MB**
3. Crop editor circular muncul untuk crop foto
4. Konfirmasi upload
5. Server action `uploadAvatar()`:
   - Upload ke Supabase Storage bucket `avatars`
   - Path: `/avatars/{user_id}/{filename}`
   - Public URL di-update di `profiles.avatar_url`
6. Optimistic update via `useUserStore.setAvatarUrl()` → EditorHeader, sidebar, presence avatars update tanpa reload

### Ganti Password

1. Di profile modal, toggle section "Change Password" (hidden by default)
2. Isi: Current password, New password, Confirm password
3. Server action `changePassword()`:
   - Verify current password
   - Update password via Supabase auth
   - Log aktivitas `password_changed`

### Data Read-only

- **Email**: Tidak bisa diubah dari UI (hanya admin yang bisa)
- **Job title / workspace role**: Display dari data profile

---

## 13. Search

### Cara Akses

- Topbar → search input atau shortcut **`⌘K`**
- Membuka command palette (Zustand: `command-palette-store.ts`)

### Cara Kerja

File: `src/lib/actions/search.ts`

Server action `searchPRDs(query)` — strategi 2 tahap:

1. **Tahap 1**: Search berdasarkan **title** (ILIKE, case-insensitive, limit 20)
2. **Tahap 2**: Jika hasil < 20, search di **konten** (`tiptap_content`)
3. Gabungkan hasil (max 20 total, tidak ada duplikat)
4. Extract snippet: 120 karakter di sekitar kata yang match

**Field yang dikembalikan per hasil:**
| Field | Keterangan |
|-------|------------|
| `id` | PRD ID untuk navigasi |
| `title` | Judul PRD |
| `status` | Status PRD saat ini |
| `project_tag` | Tag project |
| `updated_at` | Terakhir diupdate |
| `match_source` | `'title'` atau `'content'` |
| `content_snippet` | 120 karakter konteks (hanya jika match di content) |

Search hanya mencari PRD di **workspace user yang sedang aktif**.
