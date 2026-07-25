# Hifadhi — Q&A Talking Points

## "How is this different from Huduma Namba?"

Huduma Namba was struck down for compulsory biometric capture with no Data
Protection Impact Assessment, and for building a single mandatory central
registry citizens couldn't opt out of.

Hifadhi is the deliberate opposite on every one of those axes:

- **Opt-in, not mandatory.** A citizen creates a wallet because they want
  one. Nothing about eCitizen or any government service requires it.
- **Zero biometric data, by design.** No face, fingerprint, or iris capture
  anywhere in this system — not "not yet," a hard constraint.
- **No central registry.** Each citizen's documents are encrypted and scoped
  to their own account. There is no unified database service providers can
  query directly — the only path in is a consent-scoped share link the
  citizen personally creates and can revoke.
- **Consent is structural, not policy.** A document is never reachable by a
  raw file path or ID. The only viewing path is `/verify/[token]`, which
  checks the token is valid, not revoked, and not expired on every single
  request — and every one of those checks is logged.

## "What happens if your server is breached?"

- **Document files are encrypted at rest** with AES-256-GCM, a random IV per
  file. The decryption key lives only in a server-side environment variable,
  never in the database and never alongside the ciphertext. A leak of
  `/storage` alone yields unreadable bytes.
- **Passwords are bcrypt-hashed** (cost factor 10) — never stored, logged, or
  transmitted in plaintext.
- **Session tokens are signed JWTs** in an `httpOnly`, `sameSite=lax` cookie —
  not readable by client-side JS, not replayable across sites.
- **Honest gap, said proactively:** extracted structured fields
  (`extracted_fields`) are currently stored as plaintext JSON in SQLite for
  demo speed — the file itself is encrypted, but that metadata table is not
  yet. Field-level encryption of `extracted_fields` is the very next
  hardening step post-hackathon, and we'd say so unprompted.

## "Why should I trust an AI extracted my ID correctly?"

- **Nothing is auto-saved.** Claude's extraction is shown back to the citizen
  on an editable confirm screen before a single byte reaches the wallet. The
  citizen is always the final check on their own identity data.
- **The response is schema-validated**, not trusted blindly — Claude is asked
  for strict JSON, and that JSON is validated against a `zod` schema
  server-side before it's ever rendered. Malformed or unexpected output fails
  loudly instead of silently corrupting a record.
- **This is a design principle, not a limitation we ran out of time to fix.**
  Every serious identity-document product (DigiLocker included) keeps a
  human confirm step for exactly this reason.

## Known limitations (say these before you're asked)

- No real eCitizen integration — this sits *around* eCitizen as citizen-side
  infrastructure, not a replacement.
- No production-grade PKI/digital signatures — encryption + structural
  consent checks simulate the pattern; real government-grade signing is a
  post-hackathon concern.
- `extracted_fields` metadata is not yet field-level encrypted (see above).
- Single demo form for auto-fill (Single Business Permit) — the mapping
  pattern generalizes to any form schema, we just hardcoded one for tonight.
