# DraftMind — Feature Overview

> Versi: 1.0.0 | Tanggal: 13 Mei 2026
> Stack: Next.js 15 (App Router), Supabase (PostgreSQL + Auth + Storage + Realtime), Tiptap, Vercel AI SDK, LangSmith

## Tentang DraftMind

DraftMind adalah platform kolaboratif untuk membuat, mengedit, dan mengelola _Product Requirements Document_ (PRD). Sistem ini menggabungkan rich-text editor berbasis Tiptap dengan fitur AI generatif (generate, review, refine, suggest) sehingga tim produk dapat memproduksi PRD berkualitas tinggi lebih cepat. DraftMind mendukung multi-workspace, role-based access control, real-time collaboration dengan presence awareness, dan observabilitas AI via LangSmith.

---

## Akun & Role

| Role                    | Deskripsi                                                                                   | Akses Utama                           |
| ----------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Super Admin**         | Administrator platform — akses penuh ke semua workspace dan sistem                          | Panel `/admin/*`                      |
| **Workspace Admin**     | Pemilik/admin satu workspace — bisa manage member, settings, semua PRD di workspace         | Semua fitur user + workspace settings |
| **Workspace Editor**    | Anggota aktif — bisa membuat dan mengedit PRD, menggunakan AI, komentar                     | PRD CRUD + AI + comments              |
| **Workspace Commenter** | Reviewer — bisa membaca PRD dan berkomentar, tapi tidak bisa membuat/mengedit/menghapus PRD | Read + comments only                  |
| **Workspace Viewer**    | Read-only — hanya bisa membaca PRD dan komentar, tidak bisa berinteraksi                    | Read only                             |

> Role ditentukan per-workspace. Satu user bisa punya role berbeda di workspace yang berbeda.

---

## 1. Fitur Super Admin (`/admin`)

Super Admin diidentifikasi via flag `is_super_admin = true` di tabel `profiles`. Semua halaman admin menggunakan `createAdminClient()` yang mem-bypass Row Level Security Supabase.

### 1.1 Dashboard Overview (`/admin`)

Ringkasan kesehatan dan aktivitas seluruh platform, dimuat paralel dengan `Promise.allSettled` (dashboard tetap jalan meski satu query gagal).

- **4 stat card utama:** Total Users, Total Workspaces, Total PRDs, Total AI Runs — masing-masing linkable ke halaman detail
- **System Health Strip:** status Database (Connected/Error), jumlah AI Provider aktif, error 24 jam terakhir, warning 24 jam terakhir, jumlah user aktif hari ini
- **System Health gauge:** error rate (%) dengan status Healthy / Warning / Critical dan progress bar visual
- **AI Usage:** token yang dikonsumsi hari ini dan 7 hari terakhir, jumlah AI runs hari ini dan minggu ini
- **LangSmith Observability:** total traced runs, success count, error count, avg latency (detik), total tokens — ditampilkan hanya jika LangSmith dikonfigurasi dan ada data
- **Provider Status:** kartu per AI provider — nama, status aktif/nonaktif, total requests, avg latency, success rate
- **Top 5 PRDs by Health Score:** ranking PRD dengan health score tertinggi beserta nama owner dan badge skor berwarna
- **Recently Active Users:** 5 user terakhir aktif beserta avatar, nama, email, dan waktu relatif last active
- **Recent Activity feed:** 6 aktivitas terakhir dari `activity_log` (siapa melakukan apa)
- **Recent Errors:** 3 error terbaru dari `system_logs` dengan source tag dan pesan

### 1.2 User Management (`/admin/users`)

Tabel semua user di platform dengan pagination 20 per halaman.

- Kolom: nama, email, role yang dilaporkan sendiri (self-reported), status Super Admin, tanggal bergabung, status akun (aktif/dinonaktifkan)
- Mendeteksi status ban dari Supabase Auth (`banned_until`) dan menampilkan badge "Disabled"
- Navigasi halaman (Prev/Next) dengan counter halaman

### 1.3 Workspace Management (`/admin/workspaces`)

Monitoring semua workspace yang ada di platform.

- Daftar workspace beserta nama, slug, industri, ukuran tim, dan tanggal dibuat
- Diakses via link dari stat card "Workspaces" di dashboard

### 1.4 PRD Monitoring (`/admin/prds`)

Monitoring semua PRD di seluruh workspace.

- Daftar PRD dengan judul, workspace, owner, status, health score, dan tanggal diupdate
- Diakses via link dari stat card "PRDs" di dashboard

### 1.5 AI Runs Monitoring (`/admin/ai-runs`)

Monitoring semua penggunaan AI di seluruh platform.

- Daftar AI runs dengan tipe (generate_prd, ai_review, refine_section, inline_suggest), status, workspace, user, token digunakan, dan waktu
- Diakses via link dari stat card "AI Runs" di dashboard

### 1.6 Analytics (`/admin/analytics`)

Statistik penggunaan platform secara agregat.

- **5 stat card:** Total Users, Total Workspaces, Total PRDs, Total AI Runs, New Users 7 hari terakhir
- **PRDs by Status:** bar chart horizontal — distribusi PRD berdasarkan status (draft, in_review, reviewed, refined, approved, final) dengan persentase
- **AI Runs by Type:** bar chart horizontal — distribusi penggunaan AI berdasarkan tipe operasi dengan persentase

### 1.7 Templates Management (`/admin/templates`)

Tampilan baca (monitoring) library template PRD.

- **Built-in templates:** template bawaan sistem — ditampilkan sebagai kartu dengan nama, deskripsi, kategori, badge "built-in", jumlah penggunaan (`use_count`)
- **Custom templates:** template yang dibuat oleh workspace — format kartu serupa tanpa badge built-in
- Tidak ada aksi edit/hapus dari panel admin; template dikelola melalui fitur user

### 1.8 Announcements (`/admin/announcements`)

Kirim notifikasi broadcast ke user.

- **Form kirim:** judul, pesan teks, target penerima (All users / By role / Specific user)
- Target "All users": kirim ke semua user terdaftar
- Target "By role": pilih role self-reported dari dropdown yang diisi dinamis
- Target "Specific user": pilih user dari dropdown nama/email
- Preview jumlah penerima sebelum mengirim
- **History:** riwayat announcement yang pernah dikirim — judul, isi, jumlah penerima, waktu kirim — dengan pagination 10 per halaman

### 1.9 AI Providers (`/admin/providers`)

Manajemen AI provider dengan sistem routing prioritas.

- **Tabel provider aktif:** priority (dapat diubah naik/turun), nama provider + ikon, use_for (All/Fallback), status (active/inactive), total requests, success rate, avg latency
- **Routing logic:** request dikirim ke Priority 1 dulu; jika gagal, otomatis fallback ke Priority 2, lalu 3, dst.
- **Aksi per provider:** Disconnect (nonaktifkan), Activate (aktifkan kembali), Delete
- **Add Provider (4-step wizard):**
  1. Pilih provider dari registry (OpenAI, Anthropic, Sumopod, dll.)
  2. Isi Base URL (untuk provider yang membutuhkan, seperti Sumopod)
  3. Isi API Key (dengan toggle show/hide) + pilih model + pilih use_for
  4. Test connection — tampilkan hasil (success/error + latency); jika berhasil, simpan provider
- Polling setiap 10 detik untuk update Requests & Latency real-time

### 1.10 Activity Log (`/admin/activity`)

Log semua aktivitas yang dilakukan user di seluruh platform.

- Feed aktivitas dari tabel `activity_log`: aktor, tipe aksi (prd_created, comment_added, member_invited, dll.), resource, waktu
- Difilter dan dipaginasi

### 1.11 System Logs (`/admin/system-logs`)

Log sistem untuk debugging dan monitoring error.

- **Filter chip:** All / Error / Warning / Info
- **Stats header:** jumlah unresolved errors, unresolved warnings, total log hari ini
- **List log:** setiap entri menampilkan level badge (ERROR/WARNING/INFO) berwarna, source, message, timestamp relatif, dan tombol "Resolve" (tandai sebagai handled)
- **Expand detail:** klik entri untuk melihat metadata JSON lengkap
- **Mark All Resolved:** resolve semua log unresolved sekaligus (dengan konfirmasi dialog); tombol disabled jika tidak ada error unresolved
- **Download:** unduh semua log unresolved sebagai file `.txt`; tombol disabled jika tidak ada error unresolved
- **Copy:** salin isi log ke clipboard; fallback ke modal textarea jika Clipboard API tidak tersedia (misal Safari); modal auto-focus + auto-select teks; tombol disabled jika tidak ada error unresolved
- Polling otomatis setiap 5 detik

### 1.12 Settings (`/admin/settings`)

Tampilan konfigurasi sistem (read-only, informatif).

- **AI Configuration:** default provider, jumlah provider aktif, total AI runs, total tokens digunakan, status LangSmith tracing (Active/Not configured), nama LangSmith project
- **Security:** CSP Headers, Rate Limiting, enkripsi API Key (AES-256-GCM), auth provider, Row Level Security, password policy
- **Email:** layanan email (Resend), status API key, from address, status pengiriman
- **Storage:** jenis database (Supabase PostgreSQL), hosting (Cloud/Self-hosted), status bucket avatar, Supabase URL

---

## 2. Fitur Workspace Admin & Editor

### 2.1 Dashboard (`/dashboard`)

Halaman utama setelah login. Refresh otomatis saat tab difokuskan kembali dan saat ada perubahan PRD via Supabase Realtime.

- **Greeting dinamis:** "Good morning/afternoon/evening, [Nama]" berdasarkan jam lokal
- **4 stat card:** Active PRDs, In Queue (status draft/in_review), Avg Health Score (%), Cycle Time rata-rata (hari dari draft ke approved)
- **Continue working:** hingga 4 PRD yang terakhir diedit user — kartu dengan judul, status pill, health score, waktu terakhir diedit
- **Needs attention:** PRD yang perlu perhatian (health score rendah, lama tidak diedit, dll.)
- **Activity feed:** 6 aktivitas terakhir di workspace (siapa melakukan apa pada PRD mana)
- **Empty state:** jika workspace baru (belum ada PRD/aktivitas), tampilkan 3 action card (Blank PRD, From Template, Invite Team) dan grid template populer

### 2.2 PRD Management

#### 2.2.1 Buat PRD Baru (`/prds/new`)

Form untuk membuat PRD baru dengan bantuan AI.

- **Input form:** nama produk/fitur, deskripsi singkat (brief), target pengguna, tujuan bisnis
- **Pilihan AI provider:** jika ada lebih dari satu provider aktif, user bisa memilih model yang akan digunakan
- **Generate:** kirim ke `POST /api/prd/generate` → streaming response via Vercel AI SDK → PRD dibuat di background sebagai `ai_run` dengan status `queued/running`
- **Loading screen:** halaman `/prds/[id]?generating=true` menampilkan GenerationLoading component yang polling status AI run sampai selesai, lalu redirect ke editor
- **Dari template:** akses via `/prds/new?template=[id]` — konten template diprakisi sebagai starting point

#### 2.2.2 PRD List (`/prds`)

Daftar semua PRD di workspace.

- Tabel dengan kolom: judul, project tag, status, health score, kata, waktu edit, owner
- Filter dan sort tersedia

#### 2.2.3 PRD Editor (`/prds/[id]`)

Editor utama berbasis Tiptap dengan layout 3 panel:

- **Panel kiri (Outline Panel):** navigasi dokumen, comments, info PRD — dapat di-collapse ke rail
- **Panel tengah (Editor):** konten PRD dalam paper-style (kertas putih di atas background abu)
- **Panel kanan (AI Copilot Panel):** chatbot AI — dapat di-collapse ke rail

**Fitur editor:**

- **Rich text editing:** heading, bold, italic, bullet list, ordered list, blockquote, code block via Tiptap
- **Slash menu:** ketik `/` untuk memunculkan menu insert (heading, list, dll.)
- **Bubble toolbar:** toolbar muncul saat teks diseleksi — tombol Bold, Italic, Link, AI Assist, Add Comment
- **Auto-save:** konten di-save otomatis setiap kali ada perubahan (`handleUpdate` → `savePRDContent`)
- **Save status indicator:** footer bar menampilkan status Saving... / Saved / Error dengan dot berwarna
- **Toggle sections:** setiap section PRD bisa disembunyikan dari Outline Panel (toggle eye icon); section tersembunyi dikirim ke server dan dikecualikan dari share link publik
- **Markdown mode:** toggle antara rich editor dan raw markdown via tombol di footer
- **Outline navigation (tab Outline):** daftar section dan sub-section PRD — klik untuk scroll ke section; active section disorot sesuai posisi scroll
- **Info PRD (tab Info):** judul, status, versi, word count, tanggal update terakhir
- **Draft Stats:** word count real-time, read time estimasi, health score dengan breakdown per dimensi
- **History:** tombol "History" membuka panel riwayat versi dalam mode fullscreen (ganti seluruh editor)

**Aksi dari header editor:**

- **Status change:** klik status pill → dropdown pilih status (Draft → In Review → Reviewed → Refined → Approved → Final); hanya admin atau owner PRD yang bisa mengubah status
- **Project tag:** ditampilkan sebagai badge mono jika ada
- **History:** toggle panel version history
- **Share:** buat share link publik read-only; tampilkan dialog dengan URL yang bisa di-copy
- **More menu (⋯):**
  - AI Review → navigasi ke `/prds/[id]/ai-review`
  - Download / Export → dialog pilih format
  - Save as template → dialog nama + deskripsi template
  - Duplicate → salin PRD ke PRD baru di workspace yang sama
  - Delete → konfirmasi dialog sebelum hapus

#### 2.2.4 Export PRD

Dialog export muncul dari header editor. Format yang didukung:

| Format      | Ekstensi                       |
| ----------- | ------------------------------ |
| Markdown    | `.md`                          |
| HTML        | `.html`                        |
| PDF         | `.pdf`                         |
| Word (DOCX) | `.docx`                        |
| Slack       | `.txt` (format Slack-friendly) |
| Jira        | `.txt` (format Jira-friendly)  |

File langsung diunduh via `Blob + URL.createObjectURL`.

#### 2.2.5 AI Features di Editor

**AI Generate PRD** (`POST /api/prd/generate`):

- Input form di `/prds/new` — dikirim ke API → streaming generation → PRD disimpan ke DB
- Status ditampilkan via loading page

**AI Review** (`/prds/[id]/ai-review` + `POST /api/prd/ai-review`):

- Analisis PRD secara menyeluruh → menghasilkan temuan (_findings_) per severity (critical, major, minor, suggestion)
- Hasil disimpan ke tabel `ai_review_findings`
- Halaman review menampilkan: health score keseluruhan, daftar temuan dengan severity badge, rekomendasi perbaikan
- Health score: angka 0–100 dengan breakdown per dimensi (completeness, clarity, specificity, dll.)

**AI Refine Section** (`POST /api/prd/refine`):

- Dari AI Copilot panel — pilih section, AI menyarankan perbaikan konten section tersebut
- Hasil bisa langsung di-insert ke editor

**AI Suggest / Inline Suggest** (`POST /api/prd/ai-suggest`):

- Dari Bubble Toolbar saat teks diseleksi → tombol AI Assist → buka AI Assist Panel di sisi kanan
- User menulis instruksi (misal "make this more concise")
- AI menghasilkan teks pengganti → user bisa preview dan insert ke editor (menggantikan seleksi)
- Setelah insert, save otomatis dipicu dan versi snapshot dibuat

**AI Copilot Panel** (panel kanan):

- Chat interface — tanya-jawab tentang PRD
- Pemilihan AI provider/model jika ada lebih dari satu provider aktif
- History percakapan dalam sesi

#### 2.2.6 Comments System

Sistem komentar terintegrasi dengan editor dan Supabase Realtime.

- **Tambah komentar dengan seleksi:** seleksi teks di editor → klik tombol "Comment" di Bubble Toolbar → popover inline muncul → tulis komentar → simpan
  - Teks yang dikomentari otomatis di-highlight dengan warna `comment-highlight` (CommentMark Tiptap extension)
  - Range posisi teks (`from`, `to`, `quotedText`) disimpan bersama komentar
- **Tambah komentar tanpa seleksi:** form di bagian bawah Comments Panel (tab Comments di panel kiri)
- **Thread & Reply:** komentar bisa dibalas → reply tampil sebagai thread bersarang (indented); tombol "Reply" muncul inline di bawah setiap komentar; textarea reply muncul langsung di dalam thread (bukan footer)
- **Resolve:** tandai komentar sebagai selesai → komentar hilang dari filter "Open" → highlight di editor dihapus otomatis
- **Reopen:** buka kembali komentar yang sudah resolved → highlight dikembalikan ke editor
- **Edit:** edit isi komentar milik sendiri (inline textarea)
- **Delete:** hapus komentar milik sendiri → reply ikut terhapus → highlight di editor dihapus
- **Filter:** chip Open / Resolved / @Me (komentar milik user sendiri)
- **Reverse navigation (S6):** klik area highlight di editor → panel kiri otomatis terbuka ke tab Comments → scroll sidebar ke komentar yang bersangkutan → di-highlight sementara (ring accent selama 2 detik)
- **Forward navigation:** klik komentar di sidebar → editor scroll ke range teks yang dikomentari
- **Real-time sync (S7):** menggunakan Supabase Realtime (`postgres_changes` pada tabel `comments` filter `prd_id`) — komentar dari user lain muncul secara instan tanpa reload
- **Notifikasi:** pemilik PRD mendapat notifikasi saat ada komentar baru; penulis komentar mendapat notifikasi saat ada reply; user mendapat notifikasi saat di-mention via `@nama`
- **Permission:** Viewer tidak bisa menambah komentar; Commenter, Editor, dan Admin bisa; edit/delete hanya untuk komentar milik sendiri

#### 2.2.7 Version History

Riwayat versi PRD yang dibuat secara otomatis.

- **Auto-versioning:** snapshot dibuat setiap 3 detik idle setelah edit, dan setiap 5 menit selama editing aktif
- **Halaman version history** (`/prds/[id]/version-history`): daftar semua versi dengan nomor versi, author (avatar + nama), waktu, summary
- **Panel history dalam editor:** toggle via tombol "History" di header → fullscreen view dalam editor; pilih versi untuk preview konten
- **Restore versi:** kembalikan PRD ke konten versi yang dipilih

#### 2.2.8 Pipeline Board (`/prds/pipeline`)

Tampilan kanban status PRD.

- Kolom sesuai status: Draft, In Review, Reviewed, Refined, Approved, Final
- Kartu PRD di setiap kolom dengan judul, tag, health score, nama owner

### 2.3 Collaboration — Presence Awareness

Fitur real-time untuk kolaborasi multi-user dalam satu PRD secara bersamaan, menggunakan Supabase Realtime channel per PRD.

- **Presence avatars:** avatar user yang sedang membuka PRD yang sama ditampilkan di footer editor; tooltip nama saat hover
- **Cursor overlay:** posisi kursor editing user lain ditampilkan sebagai dot berwarna di atas editor
- **Section badge:** label section yang sedang diedit user lain ditampilkan di dekat kursor mereka
- **Content sync:** jika user lain menyimpan konten saat kita sedang mengetik, muncul notifikasi "X saved changes — Update now"; jika kita sedang idle, editor auto-refresh via `router.refresh()`

### 2.4 Workspace Features

#### 2.4.1 Members (`/workspace/members`)

Halaman manajemen anggota workspace (diakses oleh admin dan member).

- **Tabel member:** avatar, nama, email, role self-reported, role di workspace, tanggal bergabung, last active; badge "Disabled" jika akun di-ban
- **Tabel pending invitations:** email, role yang ditawarkan, tanggal undangan, tanggal expired; tombol Revoke (admin only)
- **Invite member (admin only):** tombol "Invite" → modal dengan input email + pilih role (admin/editor/commenter/viewer) → kirim undangan via email (Resend) → link undangan ke `/invite/[invitationId]`
- **Ubah role (admin only):** dropdown role per member
- **Remove member (admin only):** hapus member dari workspace

#### 2.4.2 Activity Log Workspace (`/workspace/activity`)

Riwayat aktivitas dalam workspace saat ini.

- Feed aktivitas dengan filter per tipe aksi
- Ditampilkan per-workspace (bukan seluruh platform)

#### 2.4.3 Settings Workspace (`/workspace/settings`)

Konfigurasi workspace — hanya dapat diakses oleh Workspace Admin.

- **Ubah nama workspace** dan slug
- **Ubah industri** dan ukuran tim
- **Upload avatar workspace:** klik tombol avatar → dialog muncul dengan AvatarEditor (drag untuk reposisi, slider untuk zoom) → crop → upload ke Supabase Storage → URL disimpan ke `icon_custom_url`
- **Danger zone (owner only):** hapus workspace (dengan konfirmasi)

### 2.5 Templates (`/templates`)

Library template PRD yang bisa digunakan sebagai starting point.

- **Built-in templates:** template bawaan DraftMind (Feature PRD, API Documentation, Go-to-Market Plan, dll.) — tersedia untuk semua workspace
- **Custom templates:** template yang dibuat dari PRD existing via "Save as template" di editor — hanya tampil di workspace yang membuatnya
- Setiap kartu template: nama, deskripsi, kategori, jumlah penggunaan (`use_count`)
- Klik template → redirect ke `/prds/new?template=[id]` → form generate diisi berdasarkan template

### 2.6 AI Runs History (`/ai-runs`)

Riwayat semua penggunaan fitur AI oleh user di workspace saat ini.

- Tabel dengan kolom: tipe operasi (generate_prd, ai_review, refine_section, inline_suggest), status (queued, running, success, error), PRD terkait, token input/output/total, waktu selesai
- Pagination 20 per halaman

### 2.7 Search

Pencarian PRD di workspace.

- Cari berdasarkan judul PRD
- Diakses via search input di navigation bar

### 2.8 Notifications

Sistem notifikasi real-time untuk event penting.

- **Bell icon** di navbar dengan badge jumlah notifikasi unread
- **Jenis notifikasi:**
  - `comment_added` — ada komentar baru di PRD milik user
  - `comment_reply` — ada reply pada komentar user
  - `mention` — user di-mention via `@nama` dalam komentar
  - `member_invited` — user diundang ke workspace
  - `announcement` — pengumuman dari admin
  - `member_removed` — user dihapus dari workspace
  - `invitation_declined` — undangan ditolak
- **Real-time:** update via Supabase Realtime subscription pada tabel `notifications` filter `recipient_id`
- **Mark as read:** klik notifikasi → tandai terbaca + navigasi ke resource terkait

### 2.9 Profile

Pengaturan profil personal user.

- **Ubah nama lengkap**
- **Upload foto profil:** tombol avatar → dialog dengan AvatarEditor (drag reposisi + slider zoom) → crop ke lingkaran → upload ke Supabase Storage bucket `avatars` (max 2MB, format JPG/PNG/WebP) → URL disimpan ke `profiles.avatar_url`
- **Avatar fallback:** jika belum upload foto, avatar dihasilkan dari inisial nama dengan warna pastel deterministik berdasarkan `avatar_color_seed`
- **Self-reported role:** field opsional (Product Manager, Engineer, dll.) untuk personalisasi pengalaman

---

## 3. Fitur Workspace Commenter

Role Commenter mendapatkan subset dari fitur Editor.

### Yang BISA dilakukan:

- Membaca semua PRD di workspace
- Menambah komentar baru (dengan seleksi teks atau tanpa seleksi)
- Membalas komentar (thread reply)
- Mengedit dan menghapus komentar **milik sendiri**
- Meresolve dan me-reopen komentar
- Melihat version history PRD (read-only)
- Melihat member workspace
- Menggunakan share link untuk berbagi
- Menerima notifikasi (mention, reply)
- Mengatur profil pribadi

### Yang TIDAK BISA dilakukan:

- Membuat PRD baru (tidak ada akses ke `/prds/new`)
- Mengedit konten PRD
- Menghapus PRD
- Menggunakan fitur AI (generate, review, refine, suggest, copilot)
- Mengubah status PRD
- Mengundang atau menghapus member workspace
- Mengakses workspace settings
- Membuat atau menghapus template

> Penegakan permission dilakukan di server via `requireWorkspaceRole(['admin', 'editor', 'commenter'])` untuk aksi komentar, dan via RLS Supabase untuk akses data.

---

## 4. Fitur Workspace Viewer

Role Viewer hanya bisa membaca.

### Yang BISA dilakukan:

- Membaca semua PRD di workspace
- Melihat version history (read-only)
- Melihat komentar yang sudah ada
- Melihat member workspace
- Mengatur profil pribadi

### Yang TIDAK BISA dilakukan:

- Semua hal yang tidak bisa dilakukan Commenter, ditambah:
- Menambah atau membalas komentar (server action menolak dengan role check)
- Meresolve atau menghapus komentar siapapun

---

## 5. Fitur Public (Share Link)

Akses baca PRD tanpa login via URL publik.

- **Buat share link:** dari editor → tombol "Share" → sistem membuat record di tabel `prd_shares` dengan `share_token` unik → URL format `/share/[token]`
- **Akses publik:** halaman `/share/[token]` tidak memerlukan autentikasi
- **Validasi:** token diperiksa aktif (`is_active = true`) dan belum expired (`expires_at`); jika tidak valid, tampilkan halaman error yang informatif
- **Konten:** PRD ditampilkan sebagai read-only dengan tiptap content renderer — termasuk filter section tersembunyi (section yang di-hide oleh owner tidak muncul di share link)
- **View counter:** setiap akses share link menginkremen `view_count` via RPC `increment_share_view_count` (fire-and-forget)
- **Tidak ada:** akses komentar, edit, fitur AI, atau navigasi ke halaman app lain

---

## 6. Fitur Cross-cutting

### 6.1 Authentication

- **Login:** email + password via Supabase Auth; OAuth callback di `/api/auth/callback`
- **Session management:** JWT + Refresh Token; session divalidasi server-side di setiap Server Component via `requireUser()`
- **Role-based access control (RBAC):**
  - Platform level: `is_super_admin` flag untuk akses `/admin`
  - Workspace level: tabel `workspace_members` dengan kolom `role`; divalidasi via `requireWorkspaceRole()` dan Supabase RLS
- **Logout:** sesi dihapus via Supabase Auth signOut

### 6.2 Real-time Features

Semua fitur real-time menggunakan Supabase Realtime (`postgres_changes` subscription):

| Fitur              | Tabel               | Filter                     |
| ------------------ | ------------------- | -------------------------- |
| Dashboard refresh  | `prds`              | `workspace_id=eq.[id]`     |
| Comments sync      | `comments`          | `prd_id=eq.[id]`           |
| Notifications      | `notifications`     | `recipient_id=eq.[userId]` |
| Presence & cursors | `workspace_members` | (custom channel per PRD)   |

### 6.3 AI Integration

- **Provider:** sistem multi-provider dengan routing prioritas dan auto-fallback
  - Provider utama: Sumopod (OpenAI-compatible, GPT-4o)
  - Provider lain: OpenAI, Anthropic (dapat dikonfigurasi dari `/admin/providers`)
- **Operasi AI:**
  - `generate_prd` — generate PRD lengkap dari brief
  - `ai_review` — review dan scoring PRD
  - `refine_section` — perbaikan section tertentu
  - `inline_suggest` — saran inline dari teks yang diseleksi
- **Observabilitas:** setiap AI run otomatis di-trace ke LangSmith (jika dikonfigurasi) dengan metadata: tipe operasi, token input/output, latency, status
- **Rate limiting:** per-user, per-endpoint untuk mencegah abuse
- **Token tracking:** jumlah token per run disimpan ke tabel `ai_runs`

### 6.4 Logging & Monitoring

- **System logs:** setiap error dan warning di backend dicatat ke tabel `system_logs` via `logError()` / `logWarn()` / `logInfo()`
- **Activity log:** setiap aksi user yang signifikan (create/edit/delete PRD, komentar, invite member) dicatat ke tabel `activity_log` via `logActivity()`
- **API logging:** endpoint `POST /api/log` untuk log dari client-side

---

## 7. Tech Stack Summary

| Layer              | Teknologi                                                  |
| ------------------ | ---------------------------------------------------------- |
| Frontend Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Editor             | Tiptap (ProseMirror-based rich text editor)                |
| Database           | Supabase (PostgreSQL)                                      |
| Auth               | Supabase Auth (JWT + Refresh Token)                        |
| Storage            | Supabase Storage (bucket `avatars`, max 2MB)               |
| Real-time          | Supabase Realtime (`postgres_changes`)                     |
| AI Framework       | Vercel AI SDK (streaming)                                  |
| AI Provider        | Sumopod (OpenAI-compatible, GPT-4o)                        |
| AI Observability   | LangSmith (run tracing, latency, token tracking)           |
| Email              | Resend                                                     |
| Styling            | Tailwind CSS v4                                            |
| Image Processing   | react-avatar-editor (crop + zoom)                          |
| Deployment         | VPS + Caddy (reverse proxy)                                |
| Package Manager    | pnpm                                                       |

---

## 8. Struktur Route

```
/                           → Landing page
/login                      → Halaman login
/dashboard                  → User dashboard (workspace overview)
/prds                       → Daftar PRD
/prds/new                   → Form create PRD baru (+ AI generate)
/prds/[id]                  → PRD Editor
/prds/[id]/ai-review        → Halaman AI Review & findings
/prds/[id]/version-history  → Riwayat versi PRD
/prds/pipeline              → Kanban pipeline board
/templates                  → Library template PRD
/ai-runs                    → Riwayat penggunaan AI
/workspace                  → Workspace hub
/workspace/members          → Manajemen member
/workspace/activity         → Activity log workspace
/workspace/settings         → Pengaturan workspace (admin only)
/invite/[id]                → Halaman terima undangan workspace
/share/[token]              → PRD publik read-only (tanpa login)
/admin                      → Super admin dashboard
/admin/users                → Manajemen user platform
/admin/workspaces           → Monitoring workspace
/admin/prds                 → Monitoring PRD platform-wide
/admin/ai-runs              → Monitoring AI runs platform-wide
/admin/analytics            → Statistik penggunaan
/admin/templates            → Monitoring template
/admin/announcements        → Kirim broadcast notifikasi
/admin/providers            → Konfigurasi AI provider
/admin/activity             → Activity log platform-wide
/admin/system-logs          → Log error/warning/info sistem
/admin/settings             → Konfigurasi sistem (read-only)
```
