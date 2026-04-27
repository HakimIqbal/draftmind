# DraftMind — Claude Code Build Prompts

5 file prompt untuk build DraftMind FYP project dari nol sampai production-ready.

**Total scope**: 31 artboard fully functional, triple deployment (local + Vercel + VPS), 6 LLM provider support, full design system v2.1 implementation.

**Total estimasi durasi**: ~8 minggu solo developer @ 6-8 jam/hari.

---

## Cara Pakai

### Setup Awal (sekali)

1. **Buat repo GitHub** baru: `draftmind`
2. **Clone** ke local: `git clone https://github.com/youruser/draftmind.git`
3. **Buka di Claude Code** (terminal di folder draftmind, atau VSCode + Claude Code extension, atau JetBrains plugin)
4. **Letakkan file ini** di root project: `mkdir -p .claude && cp 00_MASTER_BRIEF.md .claude/MASTER_BRIEF.md`

### Eksekusi per Phase

Untuk setiap phase, lakukan workflow ini:

1. **Open Claude Code session** di terminal/IDE
2. **Pastikan `.claude/MASTER_BRIEF.md` ke-load sebagai context** (Claude Code auto-detect kalau di folder `.claude/`)
3. **Attach phase prompt** sebagai input:
   - Untuk Phase 1: paste isi `01_PHASE1_FOUNDATION.md` ke chat
   - Untuk Phase 2: paste isi `02_PHASE2_AUTH_DASHBOARD.md` setelah Phase 1 done
   - dst.
4. **Claude Code mulai eksekusi task by task**
5. **Review setiap task selesai** sebelum lanjut ke task berikutnya
6. **Test acceptance criteria** di akhir setiap phase
7. **Commit + push setiap milestone** ke GitHub

### Aturan Penting

- **Master brief read-only**: jangan modify isi `00_MASTER_BRIEF.md` selama build berjalan kecuali ada decision baru yang perlu di-propagate ke semua phase
- **Sequential execution**: Phase 2 butuh Phase 1 done. Phase 3 butuh 1+2 done. Phase 4 butuh 1+2+3 done
- **Acceptance criteria mandatory**: setiap task punya checklist. Jangan skip ke task berikutnya kalau belum pass
- **No scope creep**: kalau ada feature baru muncul di tengah jalan, document sebagai "Future Work" jangan masukin ke phase aktif

---

## File List

| #   | File                           | Isi                                                                                                                                                             | Estimasi      |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 0   | `00_MASTER_BRIEF.md`           | Single source of truth: tech stack, folder structure, database schema, design system, deployment config, code conventions                                       | Reference doc |
| 1   | `01_PHASE1_FOUNDATION.md`      | Bootstrap project, Supabase + RLS, base UI components, layout shell, Tweaks panel, env handling                                                                 | 2 minggu      |
| 2   | `02_PHASE2_AUTH_DASHBOARD.md`  | A001-A009: Login, Onboarding 4 step, Dashboard 3 view, Empty State, Workspace Switcher                                                                          | 1.5 minggu    |
| 3   | `03_PHASE3_GENERATE_EDITOR.md` | A010-A020: Generate, Loading, Editor + Tiptap + AI features, Comments, Refine, AI Review, Version History (**most complex**)                                    | 3 minggu      |
| 4   | `04_PHASE4_REMAINING.md`       | A021-A031: Templates, Members, Providers + Wizard, Export, Public Share, Activity Log, AI Run History, Notifications, Command Palette, polish, deployment guide | 1.5 minggu    |

**Total**: 8 minggu

---

## Reference Documents

Master brief reference desain dari:

- `draftmind_imagine_prompt_v2.1.md` (master prompt Imagine)
- `draftmind_imagine_prompt_v2.2.md` (Imagine PDF format upgrade)
- v2.1 generated PDF (33-page artboard preview yang sudah disetujui)

Master brief codify decisions dari diskusi panjang sebelumnya:

- Design tenets 1-10 (dark mode default, ember accent budget, status pill format, mono icons, no emoji UI, etc)
- Tech stack dengan version pinning
- Database schema 17 tabel dengan RLS
- 7 Tweaks parameter
- Triple deployment target

---

## Definition of Done — Project Complete

Setelah Phase 1-4 selesai semua:

✅ 31 artboards fully functional
✅ Triple deployment verified (local + Vercel + VPS)
✅ 6 AI providers configurable
✅ 6 export formats working (PDF/DOCX/MD/HTML/Slack/Jira)
✅ Real-time updates via Supabase
✅ Public share works (light mode)
✅ Tweaks panel switching real-time
✅ All design tenets enforced
✅ Performance budgets met (LCP < 2.5s)
✅ Security checklist complete (RLS, encryption, rate limiting)
✅ Lighthouse > 90
✅ FYP documentation complete

---

## Tips Eksekusi

1. **Gunakan Claude Code dengan plan mode** untuk task-task besar di awal phase — biar Claude break down dulu sebelum write code
2. **Commit per task**, bukan per phase. Granular commit history bagus untuk laporan FYP
3. **Test setelah setiap task**, jangan tunggu sampai phase end. Bug awal mahal kalau di-discover terlambat
4. **Backup database snapshot** setelah seed data masuk. Reset jadi lebih cepat kalau ada experiment yang gagal
5. **Document blocker di GitHub Issues** kalau ada Claude Code stuck — bisa jadi appendix laporan FYP "Lessons Learned"
6. **Demo recording**: shoot video walkthrough setelah setiap phase done. Compile jadi demo final

---

## Troubleshooting

**Claude Code seem confused / drifts off-task**:

- Re-attach master brief ke context
- Re-attach current phase prompt
- Specify task ID explicitly: "Continue Task 3.6 — A012 Editor Default"

**Test failures**:

- Check master brief Section 13 "Definition of Done"
- Verify environment vars set
- Run `pnpm db:reset && pnpm db:migrate && pnpm db:seed` untuk reset state

**Deployment failures**:

- Vercel: check function timeout limits (Master Brief Section 8.2)
- VPS: check Docker chromium binary (alpine-compatible)
- Both: verify env vars match `.env.example`

**Design drift dari spec**:

- Re-read 10 design tenets di Master Brief Section 5.4
- Compare dengan Imagine v2.1 PDF reference
- Run visual review per artboard

---

**Good luck dengan FYP-mu! 🎯**

Built with ❤️ untuk DraftMind project.
