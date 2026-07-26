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

## "What stops me uploading any random photo as my ID?"

An intake check, and it runs **before anything is stored**. When you upload,
Claude looks at the file and answers two questions: is this an official
document at all, and is it the type you said it was? Either answer being wrong
means a 422 and nothing written — no database row, no encrypted file on disk,
nothing to clean up.

Two things it catches, live, on stage:

- **Wrong type.** Select "National ID", upload a passport → *"You selected
  National ID, but this looks like a Passport. Nothing was saved."*
- **Not a document.** Upload a photo of scenery → *"This doesn't look like an
  official document."* plus what Claude actually saw, so the rejection is
  explainable rather than a shrug.

Two deliberate design choices worth defending:

- **It fails toward the citizen, not the rule.** We only override the citizen's
  own label when Claude is confident (≥0.5) about a *specific* conflicting
  type. A blurry photo of a real ID, or a genuine document Claude can't
  classify, is accepted — being turned away from your own documents is a worse
  failure than a mislabelled row. Likewise, if the Claude call itself fails,
  the upload proceeds: "we think this is wrong" and "we couldn't look" are
  different answers.
- **KRA PIN and "certificate" aren't policed against each other**, because a
  KRA PIN certificate genuinely is a certificate. That's a taxonomy overlap,
  not a user mistake.

**Say this before you're asked:** this validates *what kind of document* you
uploaded, not whether it's authentic. It is not forgery detection. Real
document authentication needs issuer verification against a government
registry — which is exactly what the paid B2B verification API would be built
on, and why the consent architecture matters more than the storage.

## "Isn't the auto-fill just hardcoded to your one demo form?"

No — and there are two forms in the build specifically so this is a
demonstration rather than a promise. The Single Business Permit and the
NHIF/SHA member registration form use **deliberately different field keys**:
the permit asks for `full_name` / `national_id_number` / `date_of_birth`, the
health form asks for `member_name` / `id_number` / `birth_date`.

Nothing maps those to each other. Claude receives the wallet contents and the
target form's field labels and matches on *meaning*, so adding a third form is
a new entry in `lib/forms.ts` — no new mapping code, no new prompt. Switch
between the two forms live if anyone asks.

## "Why does the QR code matter — isn't it just a link?"

It's the same consent-scoped, expiring, revocable share link, in the form a
person can actually hand over in a room. The point is that scanning it changes
nothing about the security model: the QR is generated for the *owner* only
(owner-authenticated route, ownership checked), it encodes the same
`/verify/[token]` path, and every scan lands on the same check-and-log code
path as a pasted link. Revoke while the phone is still on the page and it dies
within three seconds.

## "Is the Swahili real or is it a language switch that does nothing?"

Every citizen-facing screen is bilingual — landing, signup/login, wallet,
upload, the confirm step, sharing, and the verifier's view. The dictionary is
checked for structural parity, so an English string with no Swahili
counterpart is a build-time type error rather than a silent fallback. Share
links stay language-neutral by design: a landlord opening a link gets their
own language preference, not the sender's.

## "How is this a startup, not just a feature eCitizen could ship?"

Three answers, in order of how much they land:

1. **The citizen side is deliberately unmonetised.** Free wallet, free storage,
   free sharing. That's not generosity, it's the acquisition strategy — every
   document a citizen stores is inventory the verifier side sells access to,
   with their consent.
2. **The revenue is on the verification side**, where there is already a
   *legally mandated* budget. Under POCAMLA 2009, SACCOs are reporting
   institutions required to perform customer due diligence — verifying identity
   documents is a compliance obligation, not a nice-to-have.
3. **eCitizen shipping this wouldn't kill us — it would be our distribution.**
   We're citizen-side infrastructure that government services plug into
   (DigiLocker's relationship to India's services), not a competitor for
   eCitizen's transaction flow.

## "What does it actually cost you to run?"

Measured, not estimated — one Claude Sonnet vision call per document,
**1,191 input + 158 output tokens = $0.0059, about KSh 0.77 per document.**

The important structural point: **that cost is paid once per document, at
intake. Revenue is per verification, and one document gets verified many
times.** Sharing, revoking, and verifying are database reads — effectively zero
marginal cost. So gross margin *improves* every time a stored document is
reused, which is the opposite of most AI products, where every unit of usage
costs you again.

Honest caveat if pressed: that figure is from a demo-sized image. A
full-resolution phone photo is larger, so budget roughly KSh 1–1.50 per real
upload. It doesn't change the conclusion.

## "Why would a SACCO pay you instead of just using IPRS?"

This is the sharpest question in the pitch and the answer is pricing structure,
not technology.

Government IPRS charges **KSh 20 per verification plus a KSh 50,000 connection
fee**, with proposed annual subscriptions of **KSh 500,000 for public and
KSh 1,000,000 for private institutions.** For a small or mid-tier SACCO, a
seven-figure annual subscription to verify a few hundred members a month is
simply unaffordable — so they fall back to photocopies in a filing cabinet.

Hifadhi's offer to that SACCO:

- **KSh 20 per consented verification** — matching the government's own
  published rate, so nobody has to argue about whether it's fair
- **No connection fee and no annual minimum** — the entire barrier that locks
  small institutions out
- **Volume tiers down to ~KSh 10** per check at scale
- And critically, **IPRS confirms an ID number exists. Hifadhi delivers the
  document itself, with the citizen's consent and an audit trail** — that's a
  different, more useful product, and it's the part a photocopy can't do.

At KSh 20 revenue against KSh 0.77 marginal cost, gross margin is ~96%. Even at
the KSh 10 floor it's ~92%.

## "How big is the wedge you're starting with?"

Deliberately narrow and concrete, because "all Kenyans" is not a go-to-market:

- **176 licensed deposit-taking SACCOs** (SASRA's 2026 list), 357
  SASRA-regulated societies in total — a buyer list small enough for a
  two-person team to actually work through
- **7.8 million SACCO members** as of December 2025, sector assets over
  KSh 1 trillion — these are institutions with real money and real compliance
  exposure
- **A legal obligation** (POCAMLA) rather than a discretionary spend
- Citizen-side demand is already proven: eCitizen carries **22,500+ services
  across 583 agencies** and was processing **~120,000 transactions a day** as of
  late 2024 — every one of which can ask for the same documents again

**Illustrative, and label it as an assumption if you use it:** 50 SACCOs
(28% of the licensed deposit-takers) each running 500 verifications a month at
KSh 20 is KSh 500,000/month, ~KSh 6M/year. Not a unicorn — but it's revenue
from a segment that currently cannot buy this at all, and it's the beachhead
before employers, landlords, and eventually MDAs on Irembo-style
commission-on-completion.

## Known limitations (say these before you're asked)

- No real eCitizen integration — this sits *around* eCitizen as citizen-side
  infrastructure, not a replacement.
- No production-grade PKI/digital signatures — encryption + structural
  consent checks simulate the pattern; real government-grade signing is a
  post-hackathon concern.
- `extracted_fields` metadata is not yet field-level encrypted (see above).
- Intake validation checks document *type and category*, not authenticity — a
  well-made forgery of the right document type would pass.
- Expiry alerts are **in-app only**. We have the `expires_at` data and surface
  it as a dashboard banner plus a per-document badge, but there is no email or
  SMS push — that needs delivery infrastructure and a consent decision about
  contacting citizens, neither of which we'd fake for a demo.
- The two auto-fill forms are faithful in *shape*, not authoritative copies of
  the current official PDFs.
