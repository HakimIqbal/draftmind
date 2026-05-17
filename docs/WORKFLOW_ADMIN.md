# Workflow Admin — DraftMind Super Admin

Dokumentasi lengkap semua workflow dari perspektif **super admin** DraftMind. Berdasarkan kode yang benar-benar ada di codebase — tidak ada asumsi fitur yang tidak ada.

---

## Daftar Isi

1. [Login sebagai Admin & Akses /admin](#1-login-sebagai-admin--akses-admin)
2. [Overview Dashboard](#2-overview-dashboard)
3. [Analytics](#3-analytics)
4. [Manage Users](#4-manage-users)
5. [Manage Workspaces](#5-manage-workspaces)
6. [Manage PRDs](#6-manage-prds)
7. [Manage AI Runs](#7-manage-ai-runs)
8. [Templates (Admin View)](#8-templates-admin-view)
9. [Announcements](#9-announcements)
10. [Manage AI Providers](#10-manage-ai-providers)
11. [Activity Log](#11-activity-log)
12. [System Logs](#12-system-logs)
13. [Settings (Admin)](#13-settings-admin)
14. [Navigasi Admin & Self-Protection](#14-navigasi-admin--self-protection)

---

## 1. Login sebagai Admin & Akses /admin

### Persyaratan

- Field `profiles.is_super_admin = true` — satu-satunya kondisi yang diperlukan
- Tidak ada akun admin terpisah; menggunakan akun Supabase yang sama dengan user biasa

### Alur Login

1. Buka `/login` (atau subdomain yang dikonfigurasi)
2. Masukkan email dan password akun super admin
3. Setelah `signInWithPassword()` berhasil:
   - Sistem fetch `profiles.is_super_admin` dan `force_password_change`
   - Fire-and-forget `checkUserRole()` mencatat login ke `activity_log`
   - Redirect ke `/admin` (bukan `/dashboard`)

### Proteksi Route Admin

File: `src/app/(admin)/layout.tsx`

Server component ini berjalan di setiap halaman admin:

```
1. Ambil user dari Supabase auth
2. Query profiles.is_super_admin
3. Jika false atau null → redirect('/dashboard')
4. Jika true → render admin layout
```

Proteksi **berlapis dua**:

- Route-level: `layout.tsx` di atas
- Action-level: `requireSuperAdmin()` di setiap server action

### Revoke Akses Admin

Jika flag `is_super_admin` dicabut saat sesi aktif → request server action berikutnya langsung ditolak dengan "Not authorized".

### Navigasi Admin Sidebar

File: `src/components/admin/admin-shell.tsx`

```
DASHBOARD
  ├── Overview        /admin
  └── Analytics       /admin/analytics

MANAGE
  ├── Users           /admin/users
  ├── Workspaces      /admin/workspaces
  ├── PRDs            /admin/prds
  └── AI Runs         /admin/ai-runs

CONTENT
  ├── Templates       /admin/templates
  └── Announcements   /admin/announcements

SYSTEM
  ├── AI Providers    /admin/providers
  ├── Activity Log    /admin/activity
  ├── System Logs     /admin/system-logs
  └── Settings        /admin/settings
```

**Bottom sidebar**: Avatar + nama + email admin. Klik → popup dengan:

- Info profil (nama, email, badge "Admin")
- Session started time (update setiap menit)
- Tombol Logout (merah)

---

## 2. Overview Dashboard

### URL & File

- Halaman: `/admin`
- File: `src/app/(admin)/admin/page.tsx`
- Cache: ISR **60 detik** (`revalidate: 60`)

### Cara Kerja Data Loading

Dashboard memuat **15 query paralel** menggunakan `Promise.allSettled()` — partial failure tidak merusak halaman, data yang berhasil tetap tampil.

Setelah query selesai, sistem build **profileMap** (satu query untuk semua profiles, digunakan via O(1) lookup untuk resolve actor/owner ID → nama).

---

### 2.1 System Health Strip (5 Metrik)

| Metrik       | Sumber Data                                                | Indikator Warna |
| ------------ | ---------------------------------------------------------- | --------------- |
| Database     | `profiles.count`                                           | Null = DB down  |
| AI Providers | Count `providers` aktif                                    | Jumlah provider |
| Errors 24h   | `system_logs` level=error, 24 jam                          | Jumlah error    |
| Warnings 24h | `system_logs` level=warn, 24 jam                           | Jumlah warning  |
| Active Today | `workspace_members.last_active_at` hari ini (unique users) | Jumlah user     |

**Database down detection**: Jika `usersR.count === null` → sistem menampilkan status error di metrik Database.

---

### 2.2 Stats Cards (4 Kartu Clickable)

| Kartu      | Tabel              | Link                |
| ---------- | ------------------ | ------------------- |
| Users      | `profiles.count`   | `/admin/users`      |
| Workspaces | `workspaces.count` | `/admin/workspaces` |
| PRDs       | `prds.count`       | `/admin/prds`       |
| AI Runs    | `ai_runs.count`    | `/admin/ai-runs`    |

---

### 2.3 System Health Panel

- **Error rate** = `errors_24h / total_logs_24h * 100`
- Ditampilkan sebagai progress bar berwarna:
  - **Emerald (Healthy)**: error rate < 5%
  - **Amber (Warning)**: 5% ≤ error rate < 15%
  - **Red (Critical)**: error rate ≥ 15%

---

### 2.4 AI Usage

- Token terpakai **hari ini** dan **minggu ini** (aggregated dari `ai_runs.total_tokens`)
- Jumlah run AI **hari ini** dan **minggu ini**

---

### 2.5 LangSmith Observability

Hanya tampil jika LangSmith dikonfigurasi di environment variables.

- Timeout: **3 detik** untuk external API call
- Cache: **10 menit**
- Jika gagal / timeout: section disembunyikan (tidak crash halaman)
- Data: total runs, success rate, errors, avg latency

---

### 2.6 Provider Status

Grid kartu per AI provider aktif:

- Nama provider + default model
- Jumlah request total
- Persentase sukses (hanya tampil jika `total_requests > 0`)
- Rata-rata latensi (hanya tampil jika `avg_latency_ms > 0`)

---

### 2.7 Top 5 PRDs by Health Score

- 5 PRD dengan `health_score` tertinggi di seluruh sistem
- Setiap baris: judul PRD, health score, nama owner (dari profileMap)

---

### 2.8 Recently Active Users

- Max 5 user dengan `last_active_at` terbaru (7 hari terakhir)
- Didedup berdasarkan `user_id` dari `workspace_members`
- Join ke profileMap untuk nama + avatar
- Tampil: avatar, nama, waktu relatif

---

### 2.9 Recent Activity Feed

- 6 entri aktivitas terbaru dari `activity_log`
- Nama aktor dari profileMap, tipe aktivitas, waktu relatif

---

### 2.10 Recent Errors

- 3 error terbaru dari `system_logs` level=error
- Source badge (monospace), pesan (truncated), waktu relatif

---

## 3. Analytics

### URL & File

- Halaman: `/admin/analytics`
- File: `src/app/(admin)/admin/analytics/page.tsx`

### KPI Cards (5)

- Total Users
- Total Workspaces
- Total PRDs
- Total AI Runs
- New users (7 hari terakhir)

### Charts

**PRDs by Status** — Horizontal bar chart:

- Setiap bar = satu status (draft, in_review, reviewed, refined, approved, final)
- Tampilkan count + persentase dari total

**AI Runs by Type** — Horizontal bar chart:

- Setiap bar = satu tipe run (generate_prd, ai_review, refine_section, inline_suggest)
- Tampilkan count + persentase dari total

Tidak ada real-time update — data statis dari query saat halaman dimuat.

---

## 4. Manage Users

### URL & File

- Halaman: `/admin/users`
- File: `src/app/(admin)/admin/users/page.tsx`, `src/components/admin/admin-users-table.tsx`
- Server actions: `src/app/(admin)/admin/users/actions.ts`

### Melihat Daftar User

- **Pagination**: 20 user per halaman
- **Search**: Client-side filter by `full_name` atau `email` (case-insensitive, real-time)
- Jika tidak ada hasil pencarian: tampil "No users found"

**Kolom tabel:**
| Kolom | Data |
|-------|------|
| User | Avatar + nama + email |
| Role | `role_self_reported` atau "—" |
| Type | Badge: "Admin" (accent) atau "User" (gray) berdasarkan `is_super_admin` |
| Status | Dot + label (lihat tabel status di bawah) |
| Joined | Tanggal bergabung |
| Actions | 3 tombol ikon |

**Status user:**
| Status | Kondisi | Indikator |
|--------|---------|-----------|
| **Active** | `onboarding_completed_at` tidak null | Titik hijau |
| **Pending** | `onboarding_completed_at` null, tidak disabled | Titik amber |
| **Disabled** | `is_disabled = true` | Titik merah + label "Disabled" |

---

### Membuat User Baru

1. Klik tombol **"Add user"** (kanan atas tabel)
2. Modal muncul dengan field:
   - **Full name** (wajib)
   - **Email** (wajib)
   - **Password** (wajib, min 6 karakter; toggle show/hide dengan ikon Eye)
   - **Role** — dropdown 8 pilihan preset + "Other" → jika "Other", muncul field input role kustom
   - **Set as admin system** — checkbox untuk memberi flag `is_super_admin`
3. Tombol Submit disabled jika ada field wajib kosong atau `isPending`
4. Server action `createUser()`:
   - Buat user di Supabase auth
   - Insert ke `profiles` dengan `onboarding_completed_at = now()` (langsung Active)
   - Log aktivitas `user_created_by_admin`
5. Setelah berhasil: toast sukses, form reset, modal tutup, daftar user refresh

---

### Toggle Admin Status

1. Klik ikon **Shield** (beri admin) atau **ShieldOff** (cabut admin) di kolom aksi
2. Server action `toggleSuperAdmin(userId)`:
   - Flip `profiles.is_super_admin`
   - Log aktivitas `super_admin_toggled`
3. Toast: "Admin status updated"

**Batasan (self-protection):** Admin tidak bisa toggle admin status dirinya sendiri.

---

### Reset Password

1. Klik ikon **KeyRound** di kolom aksi
2. Server action `resetUserPassword(userId)`:
   - Set password ke **default password**: `DraftMind2026!`
   - Set `force_password_change = true` di profiles
   - Log aktivitas `password_reset` dengan metadata
3. Toast: "Password reset to default. User will be forced to change on next login."

**Batasan:** Admin tidak bisa reset password diri sendiri.

**Efek ke user:** Saat login berikutnya → redirect ke `/dashboard?force_password_change=true`.

---

### Nonaktifkan / Aktifkan User

1. Klik ikon **UserX** (nonaktifkan) atau ikon aktifkan di kolom aksi
2. Server action `toggleUserStatus(userId)`:
   - Deteksi status ban saat ini dari `auth.users.banned_until`
   - **Ban**: `admin.auth.admin.updateUserById()` dengan `ban_duration: '876000h'` (100 tahun = effectively permanent)
   - **Unban**: `ban_duration: 'none'`
   - Log aktivitas `user_banned` atau `user_unbanned`
3. Toast: "User disabled" atau "User enabled"

**Batasan:** Admin tidak bisa disable diri sendiri.

**Efek ke user:** User yang di-ban tidak bisa login. Jika sedang login dan sesi masih aktif, request berikutnya akan gagal.

---

## 5. Manage Workspaces

### URL & File

- Halaman: `/admin/workspaces`
- File: `src/app/(admin)/admin/workspaces/page.tsx`, `src/app/(admin)/admin/workspaces/workspaces-client.tsx`

### Melihat Daftar Workspace

Server component `page.tsx` memuat:

- Semua workspace dari `workspaces`
- Member count per workspace (dari `workspace_members`)
- PRD count per workspace (dari `prds`)
- Owner profile per workspace (dari `profiles`)

Client component `workspaces-client.tsx` menampilkan **grid kartu**:

- Nama workspace + slug
- Member count + ikon
- PRD count + ikon
- Avatar, nama, email owner
- Tanggal dibuat

Rendering `force-dynamic` — tidak di-cache, selalu data terbaru.

---

### Detail Modal Workspace

1. Klik kartu workspace → modal detail muncul
2. Header: nama workspace, slug
3. Stats bar: jumlah member, jumlah PRD, industri (jika diset)
4. **Tabel member workspace**:
   - Loading state saat fetch member
   - Kolom: Avatar + nama + email, Role (badge), Joined date
   - Data di-fetch dari `/api/workspace/members?workspaceId={id}`
5. Tutup modal: klik backdrop atau tekan Esc

**Tidak ada aksi edit/hapus** — halaman ini bersifat view-only untuk observability super admin.

---

## 6. Manage PRDs

### URL & File

- Halaman: `/admin/prds`
- File: `src/app/(admin)/admin/prds/page.tsx`

### Melihat Daftar PRD

- **Pagination**: 20 PRD per halaman
- **View-only**: Tidak ada aksi edit atau hapus

**Kolom tabel:**
| Kolom | Data |
|-------|------|
| Title | Judul PRD atau "Untitled" |
| Status | Badge status (draft/in_review/reviewed/refined/approved/final) |
| Health | Persentase atau "—" |
| Owner | Nama / email atau "—" |
| Workspace | Nama workspace atau "—" |
| Updated | Waktu relatif ("2h ago") |

Data mencakup **semua PRD di semua workspace** — bukan per workspace tertentu.

---

## 7. Manage AI Runs

### URL & File

- Halaman: `/admin/ai-runs`
- File: `src/app/(admin)/admin/ai-runs/page.tsx`

### Summary Stats (6 Kartu)

- Runs hari ini
- Runs minggu ini
- Token terpakai hari ini
- Token terpakai minggu ini
- Rata-rata latensi hari ini
- Error hari ini + success rate

### LangSmith Section

Hanya tampil jika LangSmith aktif dan ada runs:

- Total runs, success rate %, token terpakai
- **Breakdown by Operation** (grid kartu per operasi):
  - Nama operasi (badge)
  - Success rate % dengan warna: hijau (≥90%), amber (≥70%), merah (<70%)
  - Runs count, errors, avg latency, tokens

### Breakdown by Type (Internal)

Grid kartu per tipe run:

- `generate_prd`, `ai_review`, `refine_section`, `inline_suggest`
- Per kartu: nama tipe, runs, errors, avg latency, tokens

### Recent Runs Table

- **Pagination**: 20 runs per halaman
- Diurutkan: terbaru dulu
- **Kolom**: Type, Status (dot), Model, Tokens, Duration (ms), Workspace, Time
- Status colors: hijau (success), merah (error), amber (queued/running)

---

## 8. Templates (Admin View)

### URL & File

- Halaman: `/admin/templates`
- File: `src/app/(admin)/admin/templates/page.tsx`

### Melihat Templates

**Built-in Templates:**

- Grid kartu dengan icon, nama, deskripsi, category badge, use count
- Accent styling untuk built-in indicator

**Custom Templates:**

- Same card layout
- Empty state jika tidak ada

**Read-only** — tidak ada aksi edit/hapus dari halaman admin ini.
Admin note: "Manage via user settings" (custom templates dikelola dari UI user biasa di `/templates`).

---

## 9. Announcements

### URL & File

- Halaman: `/admin/announcements`
- File: `src/app/(admin)/admin/announcements/page.tsx`, `src/app/(admin)/admin/announcements/actions.ts`

### Cara Kerja

Announcements dikirim sebagai **notifikasi bell icon** ke user yang ditarget, bertipe `integration_event`.

### Membuat Announcement Baru

**Form field:**

- **Title** (wajib)
- **Message** (wajib, textarea 3 baris)
- **Target selector:**
  - **All users** — semua user non-admin
  - **By role** — dropdown pilih `role_self_reported` tertentu
  - **Specific user** — dropdown pilih satu user

Preview helper text: "Will notify X users" sebelum publish.

Tombol **Publish** disabled sampai title + message + target valid.

**Server action `publishAnnouncement(data)`:**

1. Require `requireSuperAdmin()`
2. Resolve target user IDs berdasarkan mode:
   - `all`: Semua user di `profiles` dengan `is_super_admin = false`
   - `role`: User dengan `role_self_reported` yang cocok
   - `user`: Satu user spesifik by ID
3. Jika tidak ada user yang cocok → return error
4. Insert notifikasi (`type: 'integration_event'`) per recipient
5. Log ke `system_logs` via `logWarn('admin.announcement', ...)` dengan: title, target, recipient_count
6. Revalidate cache `/admin/announcements`
7. Return `recipient_count`

---

### Melihat Riwayat Announcement

**Server action `getAnnouncementHistory()`:**

- Fetch 500 notifikasi terakhir bertipe `integration_event`
- **Grouping**: Notifikasi dengan title + message sama yang dikirim dalam window **1 menit** (slice `[0:16]` dari ISO timestamp) dikelompokkan
- Return: title, body, created_at, recipient_count (per grup)

**Pagination history**: 10 grup per halaman, dengan tombol Prev/Next dan nomor halaman.

---

### Mendapatkan Daftar User untuk Target

**Server action `getUsers()`:**

- Semua user non-admin (`is_super_admin = false`)
- Fields: id, full_name, email, role_self_reported
- Ordered by full_name

---

### Edge Cases

- Target `role` yang tidak ada user-nya → error, tidak ada notifikasi terkirim
- Announcement **tidak bisa di-recall/dihapus** setelah terkirim ke bell icon
- Grouping berbasis string comparison: judul + pesan harus identik persis untuk di-group

---

## 10. Manage AI Providers

### URL & File

- Halaman: `/admin/providers`
- File: `src/app/(admin)/admin/providers/page.tsx`, `src/app/(admin)/admin/providers/actions.ts`

### Cara Kerja Priority Routing

- Sistem selalu coba provider dengan **priority 1** terlebih dahulu
- Jika gagal → auto-fallback ke priority 2, 3, dst.
- Provider dengan `use_for = 'fallback'` hanya dipakai sebagai fallback saat provider lain gagal
- Provider priority 1 otomatis dijadikan `is_default = true`

### Melihat Daftar Provider

Data polling setiap **10 detik** untuk memperbarui statistik real-time.

**Kolom tabel** (sorted by priority):
| Kolom | Data |
|-------|------|
| Priority | Angka + tombol ▲▼ untuk reorder |
| Provider | Nama + ikon + default model |
| Use For | Dropdown: "All" atau "Fallback" |
| Status | Titik hijau (active) / abu (disconnected) |
| Requests | Count total |
| Success % | Persentase sukses (hanya jika requests > 0) |
| Avg Latency | Ms (hanya jika avg_latency_ms > 0) |
| Actions | Toggle aktif/nonaktif, Hapus |

**Empty state**: "No providers" jika belum ada provider.

---

### Menambah Provider Baru (4-Step Wizard)

**Step 1 — Select Provider:**

- Grid kartu dari provider registry
- Pilih tipe: Anthropic, OpenAI, Gemini, Groq, SumoPod, GANRouter, Custom

**Step 2 — Base URL (jika diperlukan provider):**

- Input base URL kustom
- Validasi format URL (harus `http://` atau `https://`, hostname valid)
- Tidak bisa lanjut ke step 3 jika URL tidak valid

**Step 3 — Konfigurasi:**

- **API Key** (password field, toggle show/hide dengan ikon Eye)
- **Model** — dropdown model yang tersedia untuk provider tersebut
- **Use For** — dropdown: "All" (semua request) atau "Fallback" (hanya backup)

**Step 4 — Test Koneksi:**

- Sistem kirim test request ke provider menggunakan API key yang dimasukkan
- Tampil hasil: pesan sukses/error + latensi test
- Setelah test sukses, klik **Save**:
  - API key dienkripsi dengan **AES-256-GCM** sebelum disimpan ke DB
  - Priority otomatis = jumlah provider existing + 1
  - Log aktivitas `provider_added`
  - Modal tutup, daftar provider refresh

**Catatan keamanan:** API key tidak pernah dikembalikan ke UI setelah disimpan (tidak ada endpoint untuk retrieve).

---

### Mengubah Priority

- Klik ▲ (naik) atau ▼ (turun) di kolom Priority
- Server action `updateProviderPriority()`:
  - Update priority + `is_default` (priority 1 = default)
  - Log aktivitas `provider_priority_changed`

### Mengubah Use For

- Dropdown "All" / "Fallback" di kolom Use For
- Server action `updateProviderUseFor()`
- Log aktivitas `provider_use_for_changed`

### Disconnect / Activate Provider

- Ikon **WifiOff** → disconnect: set `status = 'disconnected'`, log `provider_disconnected`
- Ikon **Wifi** → activate: set `status = 'active'`, log `provider_activated`

### Hapus Provider

- Tombol hapus di kolom aksi
- Server action `deleteProvider()`: hapus dari DB, log `provider_deleted`

---

## 11. Activity Log

### URL & File

- Halaman: `/admin/activity`
- File: `src/app/(admin)/admin/activity/page.tsx`, `src/app/(admin)/admin/activity/activity-log-table.tsx`

### Data Loading

Server component `page.tsx`:

- 200 aktivitas terbaru dari `activity_log`
- Build **actorMap** (profile lookup: actor_id → nama)
- Build **wsMap** (workspace lookup: workspace_id → nama)
- Pass ke client component `<ActivityLogTable>`

### Real-time & Polling

Client component memiliki **auto-refresh setiap 10 detik** via `fetchActivityLog()`.

Live indicator di header: animasi + jumlah aktivitas yang ditampilkan.

### Filter

- **Category buttons**: All | Error (merah) | Warning (amber) | Info (biru)
- **User filter**: Klik avatar actor di baris manapun → toggle filter "hanya tampilkan aktivitas user ini"

**Kategorisasi aktivitas:**

- **ERROR**: `review_rejected`, `provider_disconnected`, `workspace_deleted`
- **WARNING**: login_failed, `member_invitation_revoked`, `workspace_ownership_transferred`
- **INFO**: semua tipe lainnya (50+ tipe mapped di VERB_MAP)

### Melihat Detail Aktivitas

Klik baris aktivitas → expand detail panel:

- Grid: Actor, Activity Type, Workspace, Resource, Timestamp, Category
- Metadata JSON display (jika ada)

### Format Baris Aktivitas

- Titik berwarna (kategori)
- Avatar actor (klik = filter)
- Deskripsi: "{Nama Actor} {VERB}" → contoh: "Alice created a PRD"
- Category badge
- Waktu relatif ("2h ago")
- Expand arrow

---

## 12. System Logs

### URL & File

- Halaman: `/admin/system-logs`
- File: `src/app/(admin)/admin/system-logs/page.tsx`, `src/app/(admin)/admin/system-logs/actions.ts`

### Polling & Stats

- **Auto-refresh: setiap 5 detik**
- Header stats:
  - Unresolved errors (badge merah, animasi pulse jika ada)
  - Unresolved warnings
  - Total log hari ini

### Filter

Chip filter: **All** | **Error** | **Warning** | **Info** (dengan count masing-masing)

### Format Baris Log

| Elemen  | Keterangan                                    |
| ------- | --------------------------------------------- |
| Dot     | Merah (error) / Amber (warning) / Biru (info) |
| Level   | Badge: ERROR / WARNING / INFO                 |
| Source  | Tag monospace (nama modul/komponen)           |
| Message | Pesan (truncated)                             |
| Time    | Waktu relatif ("5s", "3m", "2h", "1d")        |
| Expand  | Chevron untuk detail                          |

### Detail Log (Expanded)

Klik baris → expand panel:

- Source, Timestamp lengkap
- User ID (jika ada)
- Workspace ID (jika ada)
- Metadata JSON (dalam dark code block, hanya jika `Object.keys(metadata).length > 0`)
- Pesan lengkap
- Tombol **"Mark as resolved"** (disabled jika sudah resolved)

### Resolve Log

**Resolve satu log:**

1. Expand log
2. Klik "Mark as resolved"
3. Server action `resolveLog(logId)`: set `resolved_at = now()`

**Resolve semua:**

1. Klik "Mark All Resolved" (merah, di header)
2. Dialog konfirmasi muncul
3. Konfirmasi → server action `resolveAllLogs()`: update semua log dengan `resolved_at IS NULL`

### Export Log

**Download JSON:**

1. Klik tombol Download (disabled jika tidak ada unresolved)
2. Server action `getUnresolvedLogs()`: fetch semua error unresolved
3. Bungkus dalam JSON: `{ exported_at, total_unresolved, errors: [...] }`
4. Setiap error: id, source, message, level, created_at
5. Browser download file: `draftmind-errors-{timestamp}.json`

**Copy to Clipboard:**

1. Klik tombol Copy
2. Coba `navigator.clipboard.writeText()`
3. Jika clipboard API tidak tersedia (Safari / non-HTTPS): **fallback modal** muncul
   - Textarea readonly dengan konten JSON
   - Instruksi: "Tekan Cmd+A lalu Cmd+C untuk menyalin"

### Server Actions

| Action                          | Fungsi                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| `fetchSystemLogs(level, limit)` | Fetch logs by level, ordered by created_at desc              |
| `resolveLog(id)`                | Mark satu log resolved                                       |
| `resolveAllLogs()`              | Mark semua unresolved logs resolved                          |
| `getUnresolvedLogs()`           | Fetch unresolved error logs untuk export                     |
| `getLogStats()`                 | Get counts: unresolvedErrors, unresolvedWarnings, totalToday |

Semua action require `requireSuperAdmin()`.

### Edge Cases

- Polling error diabaikan silently (halaman tidak crash)
- `suppressHydrationWarning` pada date renders (client-side time formatting)
- `resolved_at` check: tombol "Mark as resolved" disabled jika sudah ada nilai

---

## 13. Settings (Admin)

### URL & File

- Halaman: `/admin/settings`
- File: `src/app/(admin)/admin/settings/page.tsx`, `src/components/admin/admin-settings-content.tsx`

**Read-only display** — tidak ada aksi dari halaman ini. Pure observability.

### Tab 1 — AI Configuration

- Default Provider (nama + model)
- Active Providers count
- Total AI Runs
- Total Tokens Used
- LangSmith Tracing (Active / Not configured)
- LangSmith Project name

### Tab 2 — Security

| Item               | Status                                   |
| ------------------ | ---------------------------------------- |
| CSP Headers        | Enabled                                  |
| Rate Limiting      | Enabled                                  |
| API Key Encryption | AES-256-GCM                              |
| Auth Provider      | Supabase Auth                            |
| Row Level Security | Enabled                                  |
| Password Policy    | Min 6 chars, force change on admin reset |

### Tab 3 — Email

- Email Service: Resend
- API Key: Configured / Not configured
- From Address
- Status: Active / Inactive

### Tab 4 — Storage

- Database: Supabase PostgreSQL
- Hosting: Cloud / Self-hosted
- File Storage: Active + specs (max 2MB, JPEG/PNG/WebP)
- Supabase URL

---

## 14. Navigasi Admin & Self-Protection

### Pembatasan Tindakan pada Diri Sendiri

Super admin **tidak dapat** melakukan hal berikut pada akun diri sendiri:

- Toggle admin status sendiri
- Disable akun sendiri
- Reset password sendiri

Ini di-enforce di setiap server action dengan pengecekan `if (userId === currentUser.id) return { error: '...' }`.

### Audit Trail

Semua aksi admin dicatat di `activity_log` dan `system_logs`:

**`activity_log` entries (dari admin panel):**
| Tipe | Kapan |
|------|-------|
| `super_admin_toggled` | Toggle admin status user |
| `user_banned` | Nonaktifkan user |
| `user_unbanned` | Aktifkan kembali user |
| `user_created_by_admin` | Buat user baru |
| `password_reset` | Reset password user |
| `provider_added` | Tambah AI provider |
| `provider_disconnected` | Disconnect provider |
| `provider_activated` | Aktifkan provider |
| `provider_deleted` | Hapus provider |
| `provider_priority_changed` | Ubah priority provider |
| `provider_use_for_changed` | Ubah use_for provider |

**`system_logs` entries:**

- `admin.announcement` (level: warn) — saat publish announcement, dengan recipient_count
- Semua error dari server actions yang catch error

### Pola Permission (Berlapis Dua)

```
1. Route level → src/app/(admin)/layout.tsx
   Cek: profiles.is_super_admin → redirect /dashboard jika false

2. Action level → requireSuperAdmin() di setiap server action
   Cek ulang: profiles.is_super_admin → throw 'Not authorized' jika false
```

Bahkan jika seseorang berhasil bypass route check, action-level check tetap memblokir.

### Performance Optimizations

- **Batch queries**: `Promise.allSettled()` untuk parallel loading
- **Profile/workspace maps**: Satu query, digunakan via O(1) Map lookup (menghindari N+1)
- **Caching**: Overview dashboard di-cache 60 detik
- **Pagination**: 20 items/halaman di semua list (users, PRDs, AI runs, announcements)
- **Polling intervals**: 5 detik (system logs), 10 detik (activity log, providers)
- **LangSmith**: External API dengan 3s timeout + 10 menit cache
