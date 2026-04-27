# Phase 1 — Foundation

> **Prerequisite**: `00_MASTER_BRIEF.md` sudah dibaca dan di-load sebagai context. Semua decision (tech stack, folder structure, database schema, design system, deployment) sudah di-lock di master brief. Phase prompt ini fokus ke eksekusi task, bukan re-discuss decision.

> **Estimasi durasi**: 2 minggu kerja solo, ~6 jam/hari.

> **Output Phase 1**: empty app yang bisa di-clone, install, run di local. Auth flow shell jalan (route protection working). Layout shell render (sidebar + topbar). Tweaks panel skeleton render dan apply ke 7 parameter. Database migrations applied dengan RLS active. Empty data, no business logic yet.

---

## Cara Pakai Phase Prompt Ini

1. Pastikan `MASTER_BRIEF.md` ada di `.claude/MASTER_BRIEF.md` di root project, atau attach sebagai context di Claude Code session
2. Attach file ini sebagai task instruction
3. Claude Code akan eksekusi 12 task berurutan di bawah
4. **Setelah setiap task complete, Claude Code WAJIB stop dan tunggu user verify** — jangan auto-lanjut ke task berikutnya. User akan run check command yang di-list di Definition of Done, kalau pass, baru bilang "lanjut" atau "next"
5. Kalau ada blocker, Claude Code STOP dan tanya user — jangan invent solution di luar master brief
6. Kalau task ada conflict dengan master brief, user diberitahu dulu, bukan deviate diam-diam

---

## Task List Phase 1

### Task 1.1 — Repo Init + Tooling

**Goal**: Empty Next.js 15 + TypeScript + pnpm + ESLint + Prettier + Husky pre-commit hook ready.

**Steps**:

1. `pnpm create next-app@latest draftmind --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm` — pilih default options selain yang di-flag
2. Update `package.json` dengan versions exact dari MASTER_BRIEF Section 2 — install all dependencies via `pnpm add`
3. Setup `.nvmrc` dengan `20.11.0`
4. Setup `.prettierrc` dan `prettier.config.js` (2 spaces, 100 char, single quote, trailing comma all, plugin tailwindcss)
5. Setup `eslint.config.mjs` flat config dengan `next/core-web-vitals` + `@typescript-eslint/recommended-strict`
6. Setup `tsconfig.json` strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `forceConsistentCasingInFileNames: true`)
7. Setup Husky + lint-staged: pre-commit run `pnpm typecheck && pnpm lint --fix`
8. Setup `.gitignore` lengkap (Next.js + Supabase + node + IDE)
9. Setup `package.json` scripts:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "typecheck": "tsc --noEmit",
       "lint": "next lint",
       "format": "prettier --write .",
       "test": "vitest",
       "test:e2e": "playwright test",
       "db:start": "supabase start",
       "db:stop": "supabase stop",
       "db:reset": "supabase db reset",
       "db:migrate": "supabase migration up",
       "db:seed": "tsx scripts/seed.ts",
       "db:types": "tsx scripts/generate-types.ts"
     }
   }
   ```
10. Setup README.md awal dengan Quick Start (Local dev only untuk sekarang)
11. Init git, first commit "chore: initial project setup"

**Definition of Done**:

- [ ] `pnpm install` complete tanpa error
- [ ] `pnpm typecheck` pass
- [ ] `pnpm lint` pass
- [ ] `pnpm dev` start, default Next.js page render di http://localhost:3000
- [ ] Pre-commit hook trigger saat git commit dengan file change

---

### Task 1.2 — Folder Structure Scaffolding

**Goal**: Buat seluruh folder structure dari MASTER_BRIEF Section 3, isi dengan placeholder file (export empty atau "TODO" comment).

**Steps**:

1. Create semua folder di `src/` sesuai master brief Section 3
2. Untuk setiap route page yang nanti akan implemented, buat placeholder `page.tsx` dengan content:
   ```tsx
   // src/app/(app)/home/page.tsx
   export default function HomePage() {
     return (
       <div className="p-md">
         <h1>A006 Dashboard — Home Feed</h1>
         <p className="text-ink-secondary">Placeholder. Will be implemented in Phase 2.</p>
       </div>
     );
   }
   ```
3. Untuk semua API route, buat placeholder `route.ts` dengan 501 Not Implemented:
   ```typescript
   // src/app/api/prd/generate/route.ts
   import { NextResponse } from 'next/server';
   export async function POST() {
     return NextResponse.json({ error: 'Not implemented yet (Phase 3)' }, { status: 501 });
   }
   ```
4. Buat `src/components/`, `src/lib/`, `src/hooks/`, `src/stores/`, `src/types/`, `src/styles/` folders dengan `.gitkeep` atau index file
5. Buat `docs/` folder dengan placeholder ARCHITECTURE.md, DATABASE.md, DESIGN_SYSTEM.md, DEPLOYMENT.md, PRD_SCHEMA.md, API.md (cuma title + "TBD")
6. Verify struktur match MASTER_BRIEF Section 3 dengan `tree -L 4 src/` output

**Definition of Done**:

- [ ] Semua route placeholder render saat di-akses (kasih dummy auth bypass dulu untuk test)
- [ ] `pnpm build` succeed (no broken imports, no missing files)
- [ ] Folder structure 1:1 match master brief

---

### Task 1.3 — Design Tokens + Tailwind Config

**Goal**: CSS variables Section 5 implemented, Tailwind config bridged, fonts loaded, theme switching working via `data-*` attributes.

**Steps**:

1. Download self-hosted fonts ke `public/fonts/`:
   - Fraunces (Variable, latin subset)
   - Inter Tight (Variable, latin subset)
   - IBM Plex Mono (400, 500, 600)
   - Geist + Geist Mono (Variable)
   - Playfair Display (Variable)
   - DM Serif Display + DM Sans + DM Mono
2. Buat `src/styles/fonts.css` dengan `@font-face` declarations + `font-display: swap`
3. Buat `src/styles/tokens.css` dengan SEMUA CSS variables dari MASTER_BRIEF Section 5.1 (theme dark/light, density compact/cozy, radius 3 variants, font 6 pairings)
4. Buat `src/styles/editor.css` placeholder untuk Tiptap content styles (akan diisi Phase 3)
5. Update `src/app/globals.css`:

   ```css
   @import './styles/fonts.css';
   @import './styles/tokens.css';
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* Base resets */
   html,
   body {
     @apply bg-bg-canvas font-body text-ink-primary;
   }
   * {
     border-color: var(--border-default);
   }
   ```

6. Update `tailwind.config.ts` sesuai MASTER_BRIEF Section 5.3 — bridge semua CSS variables ke Tailwind utilities
7. Implement `src/lib/utils/cn.ts` (clsx + tailwind-merge wrapper)
8. Test theme switching manual via DevTools: set `<html data-theme="light">` → bg + text harus invert. Test density, radius, font pairing juga.

**Definition of Done**:

- [ ] `<html>` element render dengan default `data-theme="dark" data-density="compact" data-radius="default" data-font="fraunces-inter"` attributes
- [ ] Inspect DOM: bg color = `#16130F`, text color = `#F2EFE8`
- [ ] Set `data-theme="light"` via DevTools → bg = `#FAF7F2`, text = `#1A1A1A`
- [ ] Custom classes work: `<div className="bg-bg-surface text-ink-secondary p-card-padding rounded-md">` render correctly
- [ ] Font Fraunces load di display elements, Inter Tight di body, IBM Plex Mono di mono elements

---

### Task 1.4 — Tweaks Store + Provider

**Goal**: Zustand store dengan 7 parameter, persist ke localStorage, apply ke `<html data-*>` attributes pada mount.

**Steps**:

1. Buat `src/stores/tweaks-store.ts` (Zustand + persist middleware) sesuai MASTER_BRIEF Section 5.2
2. Default values: theme=dark, font=fraunces-inter, density=compact, accent=ember, radius=default, copilotPosition=right, panelState=expanded
3. Buat `src/components/tweaks/tweaks-provider.tsx`:
   - Client component
   - Subscribe ke store
   - useEffect: apply semua state ke `document.documentElement.dataset.*`
   - Return children
4. Buat `src/components/tweaks/tweaks-button.tsx`:
   - Floating button bottom-right (only visible kalau `process.env.NODE_ENV === 'development'` ATAU env flag `NEXT_PUBLIC_TWEAKS_ENABLED=true`)
   - Icon Lucide `Sliders` 16px, monochrome
   - Click open Tweaks panel
5. Buat `src/components/tweaks/tweaks-panel.tsx`:
   - Radix Dialog atau Popover anchored ke button
   - 7 select dropdown sesuai master brief Section 5
   - Each dropdown: label mono uppercase 11px ink-tertiary, Radix Select component dengan options
   - Reset button outline ink-secondary "Reset to defaults"
   - Footer mono ink-tertiary: "Tweaks apply globally · stored in localStorage"
6. Wire ke root `src/app/layout.tsx`:
   ```tsx
   <html lang="en" suppressHydrationWarning>
     <body>
       <TweaksProvider>
         {children}
         {process.env.NODE_ENV === 'development' && <TweaksButton />}
       </TweaksProvider>
     </body>
   </html>
   ```
7. Setup `Toaster` dari sonner di root layout juga

**Definition of Done**:

- [ ] Tweaks button visible bottom-right di dev mode
- [ ] Click button → panel open dengan 7 dropdown
- [ ] Change Theme dari Dark → Light: instant re-render, page color invert
- [ ] Change Font dari Fraunces+Inter → DM Serif+DM Sans: text re-render dengan font baru
- [ ] Change Density Compact → Cozy: spacing visibly increase
- [ ] Refresh browser: state persist (localStorage)
- [ ] No FOUC (flash of unstyled content) — gunakan `suppressHydrationWarning` di `<html>`

---

### Task 1.5 — Base UI Components Library

**Goal**: Build SEMUA primitive components di `src/components/ui/` sesuai MASTER_BRIEF Section 3 + design tenets.

**Components yang harus dibuat (urut prioritas)**:

1. **`button.tsx`** — variants: `primary-fill` (rare, ember filled), `outline` (default), `ghost`, `link`, `destructive` (red-muted outline). Sizes: `sm`, `md`, `lg`. Pakai `class-variance-authority`.
2. **`input.tsx`** — bg-surface, 1px border-default, focus ring border-strong, padding sesuai density var, font-body
3. **`textarea.tsx`** — same as input but multi-line, default 4 rows, resize-vertical
4. **`select.tsx`** — Radix Select wrapper, dropdown styled match design tenets
5. **`checkbox.tsx`** — Radix Checkbox, 16×16, border-default, checked = ember
6. **`radio-card.tsx`** — horizontal card group untuk onboarding + export modal. Selected = border ember + bg sedikit lighter
7. **`chip.tsx`** — text-only filter chip, active state = underline 2px ember (Tenet 2)
8. **`pill.tsx`** — Status pill EXACT Tenet 3 format:
   ```tsx
   interface PillProps {
     status:
       | 'draft'
       | 'in_review'
       | 'reviewed'
       | 'refined'
       | 'final'
       | 'blocked'
       | 'approved'
       | 'shipped'
       | 'archived';
     label?: string; // override default label
   }
   ```
   Rendering: `<span className="inline-flex items-center gap-2 px-2.5 py-1 border border-subtle rounded-sm text-xs"><span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />{label}</span>`
   Dot color mapping ke status sesuai master brief.
9. **`card.tsx`** — bg-surface, border-subtle, padding card var, radius md
10. **`dialog.tsx`** — Radix Dialog wrapper. Backdrop dim halus rgba(0,0,0,0.5), max-width variants (sm 480, md 560, lg 720), padding 24px, NO heavy shadow
11. **`popover.tsx`** — Radix Popover wrapper, bg-elevated
12. **`dropdown-menu.tsx`** — Radix DropdownMenu wrapper
13. **`tabs.tsx`** — Radix Tabs, underline-style ONLY (active tab = 2px ember underline-bottom). NO filled pill tabs.
14. **`tooltip.tsx`** — Radix Tooltip, mono text 11px ink-secondary, bg-elevated
15. **`avatar.tsx`** — initial-based:
    ```tsx
    interface AvatarProps {
      name: string; // "Maya Reyes"
      size?: 'sm' | 'md' | 'lg'; // 20 / 24 / 32
      seed?: string; // optional override untuk color
    }
    ```
    Generate 2-letter initials + deterministic gradient subtle (mono with ember accent)
16. **`progress-bar.tsx`** — thin 2px height, ember fill, ink 6% bg
17. **`progress-ring.tsx`** — SVG circle, stroke ember 2-3px untuk completed portion, sisanya stroke ink 6% bg. Props: `value`, `max`, `size` (64 / 96 / 120)
18. **`skeleton.tsx`** — placeholder shimmer halus, bg ink 6%
19. **`separator.tsx`** — hairline 1px border-subtle
20. **`sigil.tsx`** — mono uppercase 11px:
    ```tsx
    <Sigil section={4} sectionName="Editor" artboardId="A012" artboardName="Editor — Default" />
    // renders: § 04 Editor · A012 Editor — Default
    ```
21. **`kbd.tsx`** — keyboard shortcut hint mono 11px ink-tertiary, bg ink 6% padding 2px 6px

**Setiap component WAJIB**:

- Named export (no default)
- TypeScript props interface exported
- Forward ref support
- `className` prop yang merge dengan default via `cn()`
- Accessible (ARIA labels where needed)
- Storybook NOT required Phase 1 (skip), tapi setiap component ada test file `*.test.tsx` minimal "renders without error"

**Definition of Done**:

- [ ] Semua 21 component file ada di `src/components/ui/`
- [ ] `pnpm typecheck` pass
- [ ] Buat `src/app/(app)/playground/page.tsx` (dev only) yang render semua component sebagai showcase, untuk visual verify
- [ ] Verify visual di playground: semua component render sesuai design tenets (compact density default, dark mode, ember accent budget enforced)
- [ ] Test theme switch via Tweaks: semua component adaptive ke light mode tanpa break
- [ ] Pill component test: render 9 status, verify dot color masing-masing match master brief

---

### Task 1.6 — Layout Shell (Sidebar + Topbar)

**Goal**: Sidebar persistent, Topbar slim, layout shell untuk authenticated app.

**Steps**:

1. Buat `src/components/layout/sidebar.tsx`:
   - Width 240px, full height, bg-canvas (sama dengan page bg, no separate panel feel)
   - Top section: Logo Tier 2 + workspace switcher dropdown chevron
   - Search input mono "Search or ask AI ⌘K" — keyboard shortcut hint right
   - Nav list (Lucide icons, 20px ink-secondary):
     - Home (`Home` icon)
     - My PRDs (`FileText`) + count chip ink-tertiary
     - Templates (`LayoutTemplate`)
     - Team (`Users`)
     - Integrations (`Plug`)
     - Analytics (`BarChart3`)
     - Settings (`Settings`)
   - Active nav item: ember underline-left 2px + bg sedikit lighter
   - Section header mono uppercase 11px "WORKSPACES" → list workspaces dengan dot 6px per workspace
   - Section header "PINNED" → list pinned PRDs dengan mono pin glyph (Lucide `Pin`)
   - Bottom: user avatar + name + email mono + settings gear icon
2. Buat `src/components/layout/sidebar-collapsed-rail.tsx`:
   - Width 56px, icon-only, tooltip on hover
   - Collapse trigger: button di sidebar header
3. Buat `src/components/layout/topbar.tsx`:
   - Height 48px, slim
   - Left: empty (breadcrumb akan diisi per page)
   - Right:
     - Notifications bell icon Lucide `Bell` 20px (badge thin ember dot kalau unread)
     - Button "+ New PRD" outline ember (Tenet 2: max 1 ember CTA per artboard, this is the one)
4. Buat `src/components/layout/workspace-switcher.tsx`:
   - Radix Popover anchored ke workspace name di sidebar
   - Width 320px, bg-elevated
   - Header mono uppercase "YOUR WORKSPACES" + list workspaces
   - Section "INVITED" + pending invitations dengan Accept/Decline buttons kecil
   - Footer "+ Create workspace" outline + "Manage workspaces" text-link
   - Phase 1: render dengan dummy data (workspace "Algo Network · Product"), real fetch di Phase 2
5. Buat `src/app/(app)/layout.tsx`:

   ```tsx
   import { Sidebar } from '@/components/layout/sidebar';
   import { Topbar } from '@/components/layout/topbar';

   export default function AppLayout({ children }: { children: React.ReactNode }) {
     return (
       <div className="flex h-screen">
         <Sidebar />
         <div className="flex flex-1 flex-col">
           <Topbar />
           <main className="flex-1 overflow-auto">{children}</main>
         </div>
       </div>
     );
   }
   ```

6. Buat `src/app/(auth)/layout.tsx` minimal — auth pages tidak punya sidebar (kecuali Login pakai split layout sendiri)
7. Buat `src/app/share/[shareToken]/layout.tsx` minimal — public share tidak punya app chrome

**Definition of Done**:

- [ ] Akses `/home` → redirect ke `/login` (middleware belum ada, manual untuk sekarang) ATAU render layout shell dengan placeholder content
- [ ] Sidebar render full di kiri, topbar render di atas
- [ ] Click "+ New PRD" → console.log (no action yet)
- [ ] Click workspace switcher → popover open dengan dummy workspace
- [ ] Theme switch via Tweaks → sidebar + topbar adaptive

---

### Task 1.7 — Supabase Setup (Local + Cloud)

**Goal**: Supabase project ready, migrations applied, RLS enabled, types generated.

**Steps**:

1. Install Supabase CLI: `pnpm dlx supabase init` di root project
2. `pnpm db:start` → local Supabase running (port 54321 API, 54322 Postgres)
3. Buat `supabase/migrations/0001_init_schema.sql` dengan SEMUA tabel + enums + indexes dari MASTER_BRIEF Section 4 (4.1, 4.2, 4.3, 4.4)
4. Buat `supabase/migrations/0002_rls_policies.sql` dengan policies:
   - profiles: select for workspace members, update own profile only
   - workspaces: select for members, insert authenticated, update/delete admin only
   - workspace_members: select for members, insert/update admin only
   - prds, prd_sections, prd_versions: select for workspace members, write based on role (use helper function `has_workspace_role(workspace_id, role[])`)
   - comments: select members, insert editor+commenter+admin, update author or admin
   - prd_shares: bypass RLS for public via Edge Function
   - providers: select admin, write admin, api_key_encrypted NEVER returned in select (use view `providers_safe` yang exclude api_key_encrypted)
   - ai_runs, activity_log: select members, insert via service role only
   - notifications: select+update own only
5. Buat helper function:
   ```sql
   create or replace function public.has_workspace_role(_workspace_id uuid, _roles workspace_role[])
   returns boolean
   language sql security definer set search_path = '' as $$
     select exists(
       select 1 from public.workspace_members wm
       where wm.workspace_id = _workspace_id
       and wm.user_id = (select auth.uid())
       and wm.role = any(_roles)
     );
   $$;
   ```
6. Buat trigger `auth.users` insert → create `public.profiles` row otomatis
7. Buat `scripts/generate-types.ts` yang call `supabase gen types typescript --local > src/types/database.ts`
8. Run `pnpm db:migrate` + `pnpm db:types` → types generated
9. Buat `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts` sesuai pattern `@supabase/ssr` Next.js App Router (lihat https://supabase.com/docs/guides/auth/server-side/nextjs)
10. Setup `.env.example` dengan template, `.env.local` dengan local Supabase credentials
11. Setup `src/env.ts` dengan @t3-oss/env-nextjs validation sesuai MASTER_BRIEF Section 8.4
12. Document setup steps di `docs/DEPLOYMENT.md` untuk Local section
13. Setup encryption helper untuk provider API keys:
    ```typescript
    // src/lib/utils/crypto.ts
    // AES-256-GCM dengan ENCRYPTION_KEY env var
    export function encryptApiKey(plaintext: string): string;
    export function decryptApiKey(encrypted: string): string;
    ```
14. Document database schema di `docs/DATABASE.md` (ERD diagram in mermaid + RLS policy table)

**Definition of Done**:

- [ ] `pnpm db:start` works
- [ ] `pnpm db:migrate` applies all migrations clean
- [ ] `pnpm db:types` generates `src/types/database.ts` tanpa error
- [ ] Connect ke Supabase Studio (http://localhost:54323), verify all 17 tables exist dengan RLS enabled badge
- [ ] Test RLS manual via Supabase Studio: insert dummy user, dummy workspace, dummy prd. Try select dengan user yang bukan member → 0 rows. Try select dengan member → see row.
- [ ] Document complete di `docs/DATABASE.md`

---

### Task 1.8 — Auth Middleware + Route Protection

**Goal**: Middleware enforce auth pada protected routes, redirect ke `/login` kalau unauthenticated.

**Steps**:

1. Implement `src/middleware.ts`:

   ```typescript
   import { createServerClient } from '@/lib/supabase/middleware';

   export async function middleware(request: NextRequest) {
     const { supabase, response } = createServerClient(request);
     const {
       data: { user },
     } = await supabase.auth.getUser();

     const isAuthRoute =
       request.nextUrl.pathname.startsWith('/login') ||
       request.nextUrl.pathname.startsWith('/onboarding');
     const isPublicRoute =
       request.nextUrl.pathname.startsWith('/share/') ||
       request.nextUrl.pathname === '/' ||
       request.nextUrl.pathname.startsWith('/api/webhooks/');

     if (!user && !isAuthRoute && !isPublicRoute) {
       return NextResponse.redirect(new URL('/login', request.url));
     }

     if (user && isAuthRoute && !request.nextUrl.pathname.includes('/onboarding')) {
       return NextResponse.redirect(new URL('/home', request.url));
     }

     return response;
   }

   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
   };
   ```

2. Buat utility `src/lib/auth/permissions.ts`:
   ```typescript
   export async function requireUser() {
     /* ... */
   }
   export async function requireWorkspaceMember(workspaceId: string) {
     /* ... */
   }
   export async function requireWorkspaceRole(workspaceId: string, roles: WorkspaceRole[]) {
     /* ... */
   }
   ```
3. Apply ke server components/actions yang butuh auth:
   ```tsx
   // src/app/(app)/home/page.tsx
   import { requireUser } from '@/lib/auth/permissions';
   export default async function HomePage() {
     const user = await requireUser();
     return <div>Welcome {user.email}</div>;
   }
   ```
4. Buat sample login page sederhana untuk test (real implementation di Phase 2):

   ```tsx
   // src/app/(auth)/login/page.tsx — Phase 1 minimal
   'use client';
   import { useState } from 'react';
   import { createClient } from '@/lib/supabase/client';

   export default function LoginPage() {
     const [email, setEmail] = useState('');
     async function handleMagicLink() {
       const supabase = createClient();
       await supabase.auth.signInWithOtp({ email });
       alert('Check email');
     }
     return (
       <form
         onSubmit={(e) => {
           e.preventDefault();
           handleMagicLink();
         }}
       >
         <input value={email} onChange={(e) => setEmail(e.target.value)} />
         <button type="submit">Send magic link</button>
       </form>
     );
   }
   ```

5. Test full flow: visit `/home` → redirect `/login` → submit email → check inbucket (http://localhost:54324) → click link → redirect `/home` authenticated

**Definition of Done**:

- [ ] Visit `/home` while logged out → redirect ke `/login`
- [ ] Visit `/login` while logged in → redirect ke `/home`
- [ ] Visit `/share/dummy-token` works without auth (public)
- [ ] Server component bisa call `requireUser()` dan dapat user object
- [ ] Test magic link auth flow end-to-end (local Supabase + inbucket)

---

### Task 1.9 — Logo Components

**Goal**: SVG logo Tier 1 dan Tier 2 inline component, ready dipakai di Login + sidebar.

**Steps**:

1. Buat `public/logo/` folder, taruh raw asset:
   - `tier1-full.svg` — halftone brain illustration full color (ember orange backdrop + brain halftone monochrome). User akan provide via Imagine output atau manual asset. Phase 1 placeholder OK pakai existing v2.1 reference.
   - `tier1-full.png` — PNG fallback @2x
   - `tier2-mark.svg` — circle ember 28×28 dengan inisial serif "D" cream center
   - `favicon.ico` — generated dari tier2 mark
2. Buat React component `src/components/icons/logo-tier1.tsx`:
   ```tsx
   interface LogoTier1Props {
     size?: number;
     className?: string;
   }
   export function LogoTier1({ size = 280, className }: LogoTier1Props) {
     return (
       <Image
         src="/logo/tier1-full.svg"
         width={size}
         height={size}
         alt="DraftMind"
         className={className}
       />
     );
   }
   ```
3. Buat `src/components/icons/logo-tier2.tsx` — inline SVG yang adaptive ke theme:
   ```tsx
   export function LogoTier2({ size = 28 }: { size?: number }) {
     // SVG circle bg=ember, text "D" center, color=cream di dark / ink-primary di light
     // Pakai currentColor untuk inisial, biar follow theme via CSS
   }
   ```
4. Buat `src/components/icons/logo-with-wordmark.tsx`:
   ```tsx
   // Tier 2 logo + "DraftMind" wordmark Inter Tight bold 14px
   // Untuk dipakai di sidebar
   ```
5. Update sidebar (Task 1.6) untuk pakai `<LogoWithWordmark />` di top
6. Buat `src/components/icons/sparkle.tsx` — ✦ AI sigil glyph
7. Setup metadata di `src/app/layout.tsx`:
   ```typescript
   export const metadata: Metadata = {
     title: 'DraftMind — Think Less. Draft Smarter.',
     description: 'AI-powered Product Requirement Document generator for product teams.',
     icons: { icon: '/logo/favicon.ico' },
   };
   ```

**Definition of Done**:

- [ ] Sidebar render dengan LogoTier2 + wordmark di top
- [ ] Favicon visible di browser tab
- [ ] Logo Tier 2 adaptive: di dark mode "D" cream, di light mode "D" ink
- [ ] Test placeholder Tier 1 render — final asset bisa diganti nanti

---

### Task 1.10 — Vitest + Playwright Setup

**Goal**: Testing infrastructure ready dengan example tests.

**Steps**:

1. Setup `vitest.config.ts`:

   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       setupFiles: './tests/setup.ts',
       coverage: { reporter: ['text', 'html'] },
     },
     resolve: { alias: { '@': './src' } },
   });
   ```

2. Buat `tests/setup.ts` dengan @testing-library/jest-dom matchers
3. Buat sample test `src/components/ui/pill.test.tsx`:
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { Pill } from './pill';
   describe('Pill', () => {
     it('renders status label', () => {
       render(<Pill status="in_review" />);
       expect(screen.getByText(/in review/i)).toBeInTheDocument();
     });
     it('renders dot with correct color for each status', () => {
       const statuses = ['draft', 'in_review', 'final', 'blocked'] as const;
       statuses.forEach(s => { /* assert dot color */ });
     });
   });
   ```
4. Setup Playwright `playwright.config.ts`:
   ```typescript
   import { defineConfig } from '@playwright/test';
   export default defineConfig({
     testDir: './tests/e2e',
     use: { baseURL: 'http://localhost:3000' },
     projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
     webServer: { command: 'pnpm dev', port: 3000, reuseExistingServer: !process.env.CI },
   });
   ```
5. Buat sample E2E `tests/e2e/auth.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';
   test('redirects unauthenticated user to login', async ({ page }) => {
     await page.goto('/home');
     await expect(page).toHaveURL(/\/login/);
   });
   ```
6. Setup GitHub Actions `.github/workflows/ci.yml`:
   - Trigger on PR
   - Run `pnpm install --frozen-lockfile`
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test --run`
7. Setup `.github/workflows/e2e.yml`:
   - Trigger on push to main
   - Run Supabase local + migrations + seed
   - `pnpm test:e2e`

**Definition of Done**:

- [ ] `pnpm test` run unit + component tests, all pass
- [ ] `pnpm test:e2e` run Playwright, auth.spec passes
- [ ] CI workflow green di GitHub (push branch + open PR untuk verify)

---

### Task 1.11 — Deployment Configs

**Goal**: 3 deployment target ready (Vercel + VPS + Local), each documented.

**Steps**:

1. Buat `vercel.json` sesuai MASTER_BRIEF Section 8.2
2. Buat `Dockerfile` sesuai MASTER_BRIEF Section 8.3
3. Buat `docker-compose.yml` dengan optional bundled Postgres
4. Update `next.config.mjs`:
   ```javascript
   export default {
     output: 'standalone',
     images: { remotePatterns: [...] },
     experimental: { serverActions: { bodySizeLimit: '5mb' } },
   };
   ```
5. Document 3 deployment guide di `docs/DEPLOYMENT.md`:
   - **Local**: nvm install, pnpm install, supabase start, db migrate, db seed, dev server
   - **Vercel**: connect GitHub, env vars setup, deploy hook, custom domain
   - **VPS**: server requirements (4GB RAM minimum, Ubuntu 22.04+), docker install, clone repo, build image, run with docker-compose, nginx reverse proxy + SSL via Let's Encrypt
6. Setup Vercel preview deploy untuk PR (optional kalau user mau)

**Definition of Done**:

- [ ] `pnpm build` succeed di local
- [ ] Docker build succeed: `docker build -t draftmind .`
- [ ] Docker compose up local: `docker compose up -d` → app accessible di port 3000
- [ ] (Optional, kalau user mau test) Vercel preview deploy dari PR berhasil
- [ ] `docs/DEPLOYMENT.md` complete dengan command yang bisa di-copy-paste

---

### Task 1.12 — README + Docs Bootstrap

**Goal**: Public README usable, docs/ folder structured.

**Steps**:

1. Update `README.md`:
   - Project intro + tagline
   - Tech stack list
   - Quick Start Local section
   - Links ke docs/
   - Contributing (untuk solo dev FYP, ini placeholder)
   - License (MIT atau pilih user)
2. Update `docs/ARCHITECTURE.md` dengan high-level diagram (mermaid):
   - Browser → Next.js (Vercel/VPS) → Supabase (Auth + DB)
   - Next.js API → Vercel AI SDK → 6 Provider
3. Update `docs/PRD_SCHEMA.md` dengan 14 sections detail
4. Update `docs/API.md` dengan endpoint inventory
5. Update `docs/DESIGN_SYSTEM.md` dengan token reference + 10 tenets reprint
6. Setup commit message convention (Conventional Commits): docs/CONTRIBUTING.md

**Definition of Done**:

- [ ] README readable, Quick Start instructions work end-to-end
- [ ] Semua docs file ada dengan content awal (bukan placeholder kosong)
- [ ] User baru clone repo, follow Quick Start, app jalan di local dalam < 15 menit

---

## Phase 1 — Final Acceptance Checklist

Sebelum lanjut ke Phase 2, semua hal di bawah harus ✅:

**Functional**:

- [ ] Repo cloneable, `pnpm install && pnpm dev` jalan di local
- [ ] Auth middleware enforce: protected route redirect ke login, login redirect ke home kalau authenticated
- [ ] Magic link auth working (test via inbucket di local)
- [ ] Sidebar + Topbar render di authenticated pages
- [ ] Tweaks panel functional di dev mode, 7 parameter switching real-time

**Quality**:

- [ ] `pnpm typecheck` zero error
- [ ] `pnpm lint` zero warning
- [ ] `pnpm test` all passing (unit + component)
- [ ] `pnpm test:e2e` all passing (auth flow E2E)
- [ ] CI green di GitHub Actions

**Database**:

- [ ] All 17 tables created dengan RLS enabled
- [ ] Helper function `has_workspace_role` working
- [ ] Trigger auth.users → profiles working
- [ ] Encryption helper for provider API keys tested (encrypt → decrypt round-trip)

**Deployment**:

- [ ] Local: documented + verified
- [ ] Vercel: config ready, dokumentasi guide ada (deploy aktual optional)
- [ ] VPS Docker: image build success, compose up success

**Design System**:

- [ ] Semua 21 base UI components di `src/components/ui/`
- [ ] Playground page render semua component
- [ ] Theme switching (dark ↔ light) working without break
- [ ] Font pairing 6 options switching working
- [ ] Density compact ↔ cozy switching working
- [ ] Border radius 3 options switching working

**Docs**:

- [ ] README, DEPLOYMENT, DATABASE, DESIGN_SYSTEM, ARCHITECTURE, API, PRD_SCHEMA all populated
- [ ] Folder structure documented match master brief

---

## Komunikasi Antar Task

**Setelah setiap task complete**, Claude Code stop dan output:

```
✅ Task 1.X complete.

Files modified:
- src/...
- supabase/migrations/...

To verify:
1. pnpm <command>
2. <check>

Definition of Done status: [X/Y items checked]

Ready to proceed to Task 1.X+1? (yes/lanjut/next to continue, or specify changes)
```

User akan reply `yes` / `lanjut` / `next` untuk lanjut, atau kasih revision instruction.

**Kalau ada blocker**, Claude Code stop dan output:

```
⚠️ Blocker at Task 1.X.

Issue: <description>
Reason: <why this is a blocker>
Options:
A) <option 1 with tradeoff>
B) <option 2 with tradeoff>
C) Defer to later phase

Awaiting decision before proceeding.
```

**Strict rule**: tidak boleh deviate dari master brief tanpa explicit user approval. Kalau di tengah jalan ada hal yang ternyata kurang spesifik di master brief, FLAG ke user dulu, propose update ke master brief, baru lanjut.

---

**END OF PHASE 1**

Next: `02_PHASE2_AUTH_DASHBOARD.md` — Auth flow real (Login + 4-step Onboarding) + Dashboard 3 view (home/list/pipeline) + Empty State.
