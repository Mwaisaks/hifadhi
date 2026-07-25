# Product Requirements Document — Hifadhi

**Track:** Huduma — "One eCitizen service, end to end"
**Event:** AI Mashinani, Claude Community Kenya's first Impact Lab
**Working name:** Hifadhi (Swahili: safekeeping) — rename freely

---

## 1. Problem Statement

Kenyans accessing eCitizen and other government services repeatedly scan, re-upload, and re-submit the same identity documents (national ID, KRA PIN, passport, certificates) for every single service — often traveling to a cyber café each time because they don't own a scanner, don't have the document on their current device, or lost the file since the last application. This is a direct tax on time and money for a population eCitizen was supposed to make things easier for, and it's compounded by a platform that itself loses user data mid-session (documented, recurring complaint) and has no single verified source of truth for a citizen's documents.

**Root cause we're targeting:** there is no reusable, trusted, citizen-owned store of verified documents in the Kenyan government-services ecosystem. Every service re-asks for the same proof from scratch. India solved this with DigiLocker; Kenya hasn't.

## 2. Solution Summary

Hifadhi is a citizen-owned digital document wallet. A citizen scans/uploads each core document **once**, Hifadhi extracts and verifies its structured data, encrypts and stores it, and from then on the citizen can **share a specific document with a specific requester's consent**, or **auto-fill a service application** using the stored data — instead of digging through WhatsApp photos or driving to a cyber café.

This is explicitly **not** a rebuild of eCitizen and does not touch eCitizen's live authentication, payment, or transaction systems. It sits *around* the ecosystem as citizen-side infrastructure — safer to build reliably overnight, and a legitimate product on its own regardless of what eCitizen does.

## 3. Goals for Tonight (in scope)

1. A citizen can create an account and upload/scan a document (photo or file).
2. The system extracts structured fields from the document (name, ID number, document type, issue/expiry date) using Claude's vision capability.
3. Documents are stored encrypted, tied to the citizen's account only.
4. The citizen can view all their stored documents in one dashboard ("digital wallet").
5. The citizen can generate a **consent-scoped share** of a document (e.g., "share my ID with Landlord X, valid for 24 hours, view-only") and see a log of every time it's been accessed.
6. A demo flow shows **auto-fill**: simulating one real eCitizen-style form (e.g., a business permit or NHIF-style application) being pre-filled from stored documents instead of typed from scratch.
7. An audit trail screen — "who accessed what, when" — visible to the citizen at all times.

## 4. Explicitly Out of Scope for Tonight

- Actual integration with eCitizen's live login/payment/API (too fragile, and legally/technically out of reach in one night).
- Biometric capture (face/fingerprint) — this is exactly the feature that got Huduma Namba struck down without a DPIA; skip it entirely for this build.
- Real government-grade PKI/digital signatures — simulate the pattern (encryption + consent logs), don't attempt production-grade crypto infrastructure overnight.
- Multi-language support beyond English/Swahili labels — nice-to-have only if time allows.
- Payment processing of any kind.

## 5. Target User

Primary: an ordinary Kenyan citizen who has applied for at least one government service online and had to scan/upload documents more than once across different platforms. Secondary (for the business-model story): institutions that need to verify a citizen's document (landlords, employers, SACCOs, eventually government MDAs) with the citizen's consent.

## 6. User Stories

- *As a citizen*, I want to upload my ID once and never scan it again, so I don't have to keep visiting a cyber café.
- *As a citizen*, I want to see exactly who has viewed my documents and when, so I trust the system isn't leaking my data.
- *As a citizen*, I want to revoke access to a shared document at any time.
- *As a citizen filling out a government-style form*, I want my stored documents to pre-fill the form fields so I don't retype everything.
- *As a judge/verifier*, I want a straightforward story for why this doesn't repeat eCitizen's or Huduma Namba's mistakes.

## 7. Feature Priority (MoSCoW)

**Must have (build first, this is the demo spine):**
- Upload/scan a document
- Claude-powered extraction of structured fields
- Encrypted storage
- Wallet dashboard listing stored documents
- Consent-scoped sharing with an access log
- One auto-fill demo against a sample government-style form

**Should have (if Must-haves land before ~2am):**
- Document expiry tracking with a "renew soon" flag
- Revoke-access button on shared documents
- Simple verifier-side view (simulating a landlord/employer checking a shared doc)

**Could have (stretch, only if far ahead of schedule):**
- Swahili UI toggle
- Multiple form templates for auto-fill (not just one)
- QR-code based sharing (scan to view, time-limited)

**Won't have tonight:**
- Real eCitizen API integration
- Biometrics
- Payments
- Production PKI

## 8. Success Metrics for the Demo

- A judge can watch one person upload an ID, see it correctly extracted, share it with a "verifier," see the access log update in real time, and watch a form auto-fill from stored data — all in under 3 minutes, live, no crashes.
- The pitch can clearly answer "how is this different from Huduma Namba" and "how is this a startup, not just a feature" without hesitation.

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Judges ask about Huduma Namba/DPIA precedent | Explicitly address in pitch: opt-in, no biometrics, citizen controls consent, not a state mandate — cite this deliberately, don't wait to be asked |
| OCR/extraction fails live on stage | Pre-load 1–2 known-good sample documents as a fallback path in the demo script |
| Scope creep past Must-haves | Hard cutoff per Plan.md phase gates — anything not done by its phase deadline gets cut, not extended |
| "Isn't this just Google Drive with extra steps?" | Lead with consent-scoped sharing + audit log + auto-fill as the differentiator, not storage itself |

## 10. Competitive/Prior Art Reference

See `prior-art-huduma-ecitizen.md` for full detail. Key reference points to cite in the pitch: India's DigiLocker (consent-architecture model), Rwanda's Irembo (commission-on-completion business model), Smile Identity (African B2B verification-API business model), and the Auditor-General's own eCitizen audit (the structural gap this fills).

## 11. Business Model (for startup-track judges)

- **Free for citizens** — the wallet itself, uploading, storing, and sharing documents costs the citizen nothing. This drives adoption.
- **Paid API for verifiers** — institutions (landlords, employers, SACCOs, eventually MDAs) pay per consented verification check, same pattern as Smile Identity's B2B KYC API model.
- **Longer-term:** government/MDA partnership on a completion-commission basis (Irembo's model), positioning Hifadhi as the citizen-side "wallet" layer government services plug into rather than a competitor to eCitizen.
