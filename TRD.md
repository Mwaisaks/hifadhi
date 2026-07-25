# Technical Requirements Document — Hifadhi

Built with Claude Code (terminal). Prototype deadline: 6:00 AM.

---

## 1. Design Principles for an Overnight Build

- **Boring and working beats clever and broken.** Every choice below optimizes for "runs reliably live on stage," not "impresses other engineers."
- **Monolith, not microservices.** One deployable app. No separate services to keep alive overnight.
- **SQLite over Postgres unless Postgres is already trivial for you.** Zero setup, zero connection headaches, file-based, good enough for a demo dataset of a handful of users.
- **Local encrypted file storage, not cloud storage.** No bucket/IAM setup burning time at 2am. Encrypt on disk.
- **Claude API does the "smart" work**, not a self-hosted model — you already have $100 of Claude credits, use them: document field extraction (vision), and the auto-fill/guidance chat.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind | Athena's strongest stack, fast to scaffold, Claude Code handles it well |
| Backend | Next.js API routes (same app) | Avoids running two servers overnight; one `npm run dev` |
| Database | SQLite (via `better-sqlite3` or Prisma+SQLite) | Zero-config, file-based, trivial backup (copy the .db file) |
| File storage | Local filesystem, encrypted at rest | See Section 5 |
| Document intelligence | Claude API (vision-capable model) via Messages API | Extracts structured fields from an uploaded photo/PDF of a document |
| Auth | Simple email/password or magic-link stub — NOT a full OAuth build | Judges care about the wallet/consent pattern, not your login page |
| Hosting for demo | Local machine (localhost) or a single free-tier deploy (Vercel) as backup | Local avoids live-demo network risk; deploy only if time allows |

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
│                                                                    │
│  ┌───────────────┐   ┌────────────────┐   ┌───────────────────┐ │
│  │  Citizen UI    │   │  Verifier UI    │   │  Auto-fill Demo   │ │
│  │  (wallet,      │   │  (view shared   │   │  (sample gov      │ │
│  │  upload,       │   │  doc via link)  │   │  form pre-filled  │ │
│  │  share, log)   │   │                 │   │  from wallet)     │ │
│  └───────┬────────┘   └────────┬────────┘   └─────────┬─────────┘ │
│          │                     │                        │          │
│          ▼                     ▼                        ▼          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    API Routes (Next.js)                      │  │
│  │  /api/documents/upload    /api/shares/create                 │  │
│  │  /api/documents/extract   /api/shares/[token]                │  │
│  │  /api/documents/list      /api/audit/log                     │  │
│  │  /api/autofill/[formId]                                      │  │
│  └───────┬───────────────────────────────────┬───────────────────┘  │
│          │                                   │                      │
│          ▼                                   ▼                      │
│  ┌───────────────────┐            ┌────────────────────────┐       │
│  │  Claude API        │            │  SQLite DB              │       │
│  │  (vision extract    │            │  users, documents,      │       │
│  │  + form-fill assist)│            │  shares, audit_log       │       │
│  └───────────────────┘            └────────────────────────┘       │
│                                              │                       │
│                                              ▼                       │
│                                    ┌────────────────────────┐       │
│                                    │  Encrypted file store    │       │
│                                    │  /storage/{userId}/*.enc │       │
│                                    └────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## 4. Data Model

```sql
-- users
id TEXT PRIMARY KEY
name TEXT
email TEXT UNIQUE
password_hash TEXT
created_at DATETIME

-- documents
id TEXT PRIMARY KEY
user_id TEXT REFERENCES users(id)
doc_type TEXT           -- 'national_id' | 'kra_pin' | 'passport' | 'certificate' | 'other'
file_path TEXT          -- path to encrypted file on disk
extracted_fields JSON    -- { full_name, id_number, dob, issue_date, expiry_date, ... }
extraction_confidence REAL
uploaded_at DATETIME
expires_at DATETIME NULL -- from extracted_fields, surfaced for "renew soon" flag

-- shares
id TEXT PRIMARY KEY
document_id TEXT REFERENCES documents(id)
share_token TEXT UNIQUE   -- random token used in shareable link
shared_with_label TEXT    -- e.g. "Landlord - Kilimani flat"
permissions TEXT          -- 'view_only'
expires_at DATETIME        -- e.g. now + 24h
revoked BOOLEAN DEFAULT 0
created_at DATETIME

-- audit_log
id TEXT PRIMARY KEY
document_id TEXT REFERENCES documents(id)
share_id TEXT NULL REFERENCES shares(id)
action TEXT              -- 'uploaded' | 'viewed' | 'shared' | 'revoked' | 'autofill_used'
actor_label TEXT          -- 'owner' or the shared_with_label
occurred_at DATETIME
```

## 5. Security Design (this is what judges will probe — have this ready to explain, not just built)

1. **Encryption at rest.** Files are encrypted before writing to disk with AES-256-GCM, key derived from a server-side secret (env var) + per-file random IV. Even if `/storage` leaked, files aren't readable without the key.
2. **Consent is structural, not a checkbox.** A document is *never* viewable via a raw file path. The only way to view a document is through `/api/shares/[token]`, which checks: token exists, not revoked, not expired, then logs the view — mirroring DigiLocker's "API-level consent checks" pattern. There is no endpoint that returns a document without going through this check.
3. **Every access is logged and visible to the owner.** The wallet dashboard shows a live audit trail: what was accessed, by which share link, when. This is your answer to "how do you build trust" in the pitch.
4. **Revocation is immediate.** Setting `revoked = 1` on a share instantly kills that token's access — check this flag on every view.
5. **No biometric data collected, anywhere.** Explicitly a design constraint, not an oversight — this is your direct answer to the Huduma Namba/DPIA precedent. Say this in the pitch proactively.
6. **Least data principle for auto-fill.** Auto-fill only pulls the specific fields a form needs, not the whole document object, and logs an `autofill_used` audit event.
7. **Passwords hashed** (bcrypt/argon2), never stored plain — table stakes, but be ready to say it.

## 6. Claude API Integration Points

**A. Document field extraction (vision)**
- Endpoint: `/api/documents/extract`
- Send the uploaded image (base64) to the Claude Messages API with a vision-capable model, prompt: extract `doc_type`, `full_name`, `id_number`, `dob`, `issue_date`, `expiry_date` as strict JSON, return `null` for any field not visible.
- Store the raw JSON response in `extracted_fields`; show it to the user for a one-tap confirm/edit step before saving (never trust silent auto-extraction for identity data — this also doubles as a "we don't blindly trust AI output" talking point for judges).

**B. Auto-fill assistant**
- Endpoint: `/api/autofill/[formId]`
- Given a target form schema (a small hardcoded JSON describing field names/labels for your one demo form) and the citizen's stored `extracted_fields` across documents, ask Claude to map wallet fields → form fields and return a fill plan.
- This is the "India-style" payoff moment in the demo — walk in with fields empty, click "Auto-fill from Hifadhi," watch it populate.

**C. Optional stretch — guidance chatbot**
- If time allows post-Must-haves: a small RAG-free chat endpoint that answers "what documents do I need for X service" using a short hardcoded knowledge snippet (not a full RAG pipeline — no time for that tonight). This directly echoes the GovBot prior-art pattern from your research and is a good "we know the landscape" pitch line, but it is explicitly a Could-have.

## 7. Folder Structure

```
hifadhi/
├── app/
│   ├── (citizen)/
│   │   ├── dashboard/page.tsx
│   │   ├── upload/page.tsx
│   │   └── shares/page.tsx
│   ├── verify/[token]/page.tsx        # verifier-facing share view
│   ├── autofill/page.tsx              # demo form auto-fill
│   └── api/
│       ├── documents/
│       │   ├── upload/route.ts
│       │   ├── extract/route.ts
│       │   └── list/route.ts
│       ├── shares/
│       │   ├── create/route.ts
│       │   └── [token]/route.ts
│       ├── audit/log/route.ts
│       └── autofill/[formId]/route.ts
├── lib/
│   ├── db.ts               # SQLite connection/schema init
│   ├── crypto.ts           # encrypt/decrypt helpers
│   ├── claude.ts           # Claude API client wrapper
│   └── audit.ts            # log-write helper, called from every action
├── storage/                # encrypted document files (gitignored)
├── prisma/ (or migrations/)
├── PRD.md
├── TRD.md
└── PLAN.md
```

## 8. Environment Variables

```
ANTHROPIC_API_KEY=
ENCRYPTION_KEY=          # 32-byte key for AES-256-GCM, generate once, keep in .env only
DATABASE_URL=file:./storage/hifadhi.db
SESSION_SECRET=
```

## 9. Dependencies (indicative)

- `next`, `react`, `tailwindcss`
- `better-sqlite3` or `prisma` + `@prisma/client` (sqlite provider)
- `@anthropic-ai/sdk`
- `bcrypt` (or `argon2`)
- `zod` (validate API inputs/outputs, especially Claude's extracted JSON)
- `nanoid` (share tokens)

## 10. What "Done" Looks Like for the Prototype (6am)

A working local `npm run dev` instance where a single demo user can: sign up → upload a sample ID → see extracted fields → confirm/save → view it in the wallet dashboard → generate a scoped share link → open that link in a second browser/incognito window as the "verifier" → see the audit log update on the owner's dashboard → open the auto-fill demo form → click auto-fill → see fields populate from the wallet. That full loop, rehearsed, under 3 minutes, is the finish line — not additional features.
