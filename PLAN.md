# PLAN.md — Hifadhi Build Plan

Structured by phase, not clock time — move to the next phase when the current one's exit criteria are met, not when a timer says so. If you're stuck past a phase's reasonable effort, cut scope rather than burn the night on it.

---

## Phase 0 — Foundations

**Goal:** A running skeleton app with the full request path wired end to end, even with fake data.

Tasks:
- Scaffold Next.js app (App Router, Tailwind), init git repo
- Set up SQLite + schema from TRD.md Section 4 (users, documents, shares, audit_log)
- Add `.env` with `ANTHROPIC_API_KEY`, `ENCRYPTION_KEY`, `SESSION_SECRET`
- Build `lib/db.ts`, `lib/crypto.ts` (encrypt/decrypt round-trip test), `lib/claude.ts` (basic ping to Claude API)
- Stub auth: simple email/password signup+login, one hardcoded demo user is fine as fallback

**Exit criteria:** You can sign up, log in, and hit a "hello world" API route that reads/writes SQLite and successfully calls the Claude API once. Nothing document-related needs to work yet.

---

## Phase 1 — Core Upload & Storage Loop

**Goal:** A citizen can upload a document and it lands encrypted on disk with a DB row.

Tasks:
- Build `/upload` page: file/photo input
- Build `/api/documents/upload`: receive file, encrypt via `lib/crypto.ts`, write to `/storage/{userId}/`, create `documents` row (fields empty for now)
- Build `/dashboard`: list documents for the logged-in user (even just filename + upload date)
- Write an `audit_log` entry on every upload (`action: 'uploaded'`)

**Exit criteria:** Upload a real photo of an ID, refresh dashboard, see it listed. Confirm the file on disk is not human-readable (open it in a text editor, confirm it's ciphertext).

---

## Phase 2 — Claude-Powered Extraction

**Goal:** Uploaded documents get structured fields extracted automatically, with a human confirm step.

Tasks:
- Build `/api/documents/extract`: send image to Claude vision, prompt for strict JSON (doc_type, full_name, id_number, dob, issue_date, expiry_date)
- Validate Claude's JSON response with `zod` before trusting it
- Add a confirm/edit UI step after upload: show extracted fields, let user correct them, then save to `documents.extracted_fields`
- Compute `expires_at` from extracted expiry date if present

**Exit criteria:** Upload a sample Kenyan ID or similar document, see plausible extracted fields shown back for confirmation, save successfully. Have at least one known-good sample document ready as a fallback if live extraction misbehaves on stage.

---

## Phase 3 — Consent-Scoped Sharing & Audit Trail

**Goal:** The actual differentiator — a citizen can share one document with a scoped, revocable, logged link.

Tasks:
- Build `/api/shares/create`: given a document id + label (e.g. "Landlord — Kilimani flat") + expiry window, generate a `share_token`, create `shares` row
- Build `/verify/[token]` page: public-facing, checks token valid/not revoked/not expired, shows the document, logs an `action: 'viewed'` audit entry
- Build a revoke button on the owner's dashboard (`revoked = 1`)
- Build the audit trail view on the dashboard: list of all `audit_log` entries per document, newest first, auto-refresh or manual refresh is fine

**Exit criteria:** Generate a share link, open it in an incognito window, confirm the doc is viewable there, confirm a new audit log entry appears on the owner's dashboard. Revoke it, confirm the incognito window can no longer view it.

---

## Phase 4 — Auto-Fill Demo

**Goal:** The "this is what India does" payoff moment.

Tasks:
- Hardcode one sample government-style form schema (pick something recognizable — e.g. a business permit application with ~6-8 fields)
- Build `/autofill` page: empty form + "Auto-fill from Hifadhi" button
- Build `/api/autofill/[formId]`: pull the logged-in user's `extracted_fields` across their documents, ask Claude to map wallet data → form fields, return fill plan
- Wire the button to populate the form fields client-side
- Log an `autofill_used` audit event

**Exit criteria:** Click the button on an empty form, watch fields populate correctly from previously uploaded/confirmed documents, without retyping anything.

---

## Phase 5 — Security Polish & Talking Points

**Goal:** Make sure the security story is airtight for Q&A, not just the demo.

Tasks:
- Double-check every document-viewing code path goes through the consent/share check — no direct file-serving route left exposed
- Confirm passwords are hashed, not plaintext, in the DB
- Write down (in a `NOTES.md` or in your head) a tight 30-second answer to: "how is this different from Huduma Namba," "what happens if your server is breached," "why should I trust an AI extracted my ID correctly"
- If time allows: add the "renew soon" expiry flag on the dashboard (Should-have)

**Exit criteria:** You can answer the three questions above out loud, confidently, without notes.

---

## Phase 6 — Demo Rehearsal & Pitch Prep

**Goal:** The full user journey runs clean, twice in a row, and the pitch narrative is tight.

Tasks:
- Run the full loop end to end (signup → upload → extract/confirm → dashboard → share → verify in second window → audit log updates → auto-fill) at least twice without errors
- Prepare 2-3 pre-loaded sample documents as fallback in case live scanning misbehaves
- Prepare the pitch structure: problem (cyber café/re-scanning pain, with the citizen complaints from your research) → solution (Hifadhi) → live demo → differentiation (consent architecture, not just storage) → business model (free citizen side, paid B2B verification API) → "we thought about Huduma Namba so you don't have to ask"
- Assign who drives the laptop, who talks, if team

**Exit criteria:** A rehearsed run-through that fits comfortably under 3 minutes, plus a pitch that doesn't need the demo to make sense on its own.

---

## Phase 7 — Buffer / Stretch (only if everything above is done early)

Pick from PRD.md's "Could have" list — Swahili UI toggle, second form template, QR-code sharing, expiry notifications. Do not start these before Phase 6 is genuinely done and rehearsed. A working, rehearsed Must-have demo beats an unrehearsed demo with extra features every time.
