export const LOCALES = ["en", "sw"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Locale lives in a plain (non-httpOnly) cookie so the toggle can flip it
 * client-side and `router.refresh()` re-renders the server components with the
 * new value. It is a display preference, not a credential — nothing is
 * authorised on the basis of it, so client-writable is fine.
 */
export const LOCALE_COOKIE = "hifadhi_locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  sw: "Kiswahili",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "sw";
}

/** A string that exists in both languages — used for form schemas. */
export type Localized = Record<Locale, string>;

export function localized(value: Localized, locale: Locale): string {
  return value[locale] || value[DEFAULT_LOCALE];
}

const EN = {
  nav: {
    autofillDemo: "Auto-fill demo",
    uploadDocument: "Upload document",
    logout: "Log out",
    backToWallet: "← Back to wallet",
    backToForms: "← Back to forms",
    language: "Language",
  },
  landing: {
    eyebrow: "Hifadhi · Safekeeping",
    headlineLine1: "Scan your documents once.",
    headlineLine2: "Never queue at a cyber café again.",
    body: "Upload your ID, KRA PIN, or certificates once. Hifadhi encrypts and stores them, then lets you share a specific document with a specific person — with a full audit trail of who saw what, and when.",
    createWallet: "Create your wallet",
    login: "Log in",
    footer:
      "No biometrics collected. Consent-scoped sharing. Every access logged.",
  },
  auth: {
    loginTitle: "Log in to Hifadhi",
    loginSubtitle: "Your documents, safely kept.",
    signupTitle: "Create your Hifadhi wallet",
    signupSubtitle: "Store your documents once. Share them on your terms.",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    loginFailed: "Login failed",
    signupFailed: "Signup failed",
    loggingIn: "Logging in...",
    login: "Log in",
    creatingAccount: "Creating account...",
    createAccount: "Create account",
    needAccount: "Need an account?",
    signUp: "Sign up",
    haveAccount: "Already have an account?",
  },
  dashboard: {
    welcome: (name: string) => `Welcome, ${name}`,
    yourWallet: "Your wallet",
    emptyState: "No documents yet.",
    uploadFirst: "Upload your first one",
    share: "Share",
    uploadedAt: (when: string) => `uploaded ${when}`,
    extractionPending: "Extraction pending —",
    confirmFields: "confirm fields",
    document: "document",
  },
  renewals: {
    heading: (count: number) =>
      count === 1
        ? "1 document needs your attention"
        : `${count} documents need your attention`,
    intro:
      "Hifadhi watches the expiry dates it extracted, so a lapsed ID doesn't surprise you at a service counter.",
    expiredAgo: (days: number) =>
      days === 0
        ? "Expired today"
        : days === 1
          ? "Expired yesterday"
          : `Expired ${days} days ago`,
    expiresToday: "Expires today",
    expiresIn: (days: number) =>
      days === 1 ? "Expires tomorrow" : `Expires in ${days} days`,
    dismissNote: "This alert clears itself once you upload a renewed copy.",
  },
  upload: {
    title: "Upload a document",
    subtitle:
      "Scan or photograph it once. Hifadhi encrypts it and, next, extracts the fields for you to confirm.",
    docTypeLabel: "Document type",
    fileLabel: "File or photo",
    selected: (name: string) => `Selected: ${name}`,
    chooseFile: "Choose a file or photo to upload",
    uploadFailed: "Upload failed",
    checking: "Checking the document...",
    submitting: "Encrypting & uploading...",
    submit: "Upload document",
    tryAgain: "Choose another file",
    rejectedTitle: "That file wasn't stored",
    notADocumentBody:
      "This doesn't look like an official document, so it hasn't been added to your wallet. Upload a clear photo or scan of the document itself.",
    notADocumentSaw: (summary: string) => `What we saw: ${summary}.`,
    wrongTypeBody: (declared: string, detected: string) =>
      `You selected ${declared}, but this looks like ${detected}. Nothing was saved.`,
    wrongTypeFix: (declared: string, detected: string) =>
      `Upload your ${declared} instead, or change "Document type" to ${detected} and try again.`,
    rejectedFootnote:
      "Hifadhi checks the file before storing it, so your wallet only ever holds the document you meant to keep.",
  },
  confirm: {
    title: "Confirm extracted fields",
    subtitle:
      "Claude read your document. Check the fields below, fix anything that's wrong, then save. Nothing is stored to your wallet until you confirm.",
    extracting: "Extracting fields with Claude…",
    extractionFailed:
      "Automatic extraction failed. Enter the details manually below.",
    confidence: (percent: number) => `Claude's confidence: ${percent}%`,
    notDetected: "Not detected",
    saveFailed: "Save failed",
    saving: "Saving...",
    save: "Confirm & save to wallet",
    fields: {
      full_name: "Full name",
      id_number: "ID / document number",
      dob: "Date of birth",
      issue_date: "Issue date",
      expiry_date: "Expiry date",
    },
  },
  share: {
    subtitle:
      "Share this document with a specific person, for a limited time. Every view is logged below.",
    createTitle: "Create a share link",
    whoFor: "Who is this for?",
    whoForPlaceholder: "e.g. Landlord — Kilimani flat",
    validFor: "Valid for",
    oneHour: "1 hour",
    twentyFourHours: "24 hours",
    sevenDays: "7 days",
    generate: "Generate share link",
    generating: "Creating...",
    createFailed: "Could not create share link",
    copy: "Copy",
    copied: "Copied!",
    copyLink: "Copy link",
    revoke: "Revoke",
    linksTitle: "Share links",
    noLinks: "No share links yet.",
    statusActive: "Active",
    statusExpired: "Expired",
    statusRevoked: "Revoked",
    expiresOn: (when: string) => `expires ${when}`,
    auditTitle: "Audit trail — who accessed this document",
    noActivity: "No activity yet.",
    showQr: "Show QR",
    hideQr: "Hide QR",
    scanToView: "Scan to view",
    qrHint:
      "Point a phone camera at this code to open the same consent-scoped, revocable link.",
    qrAlt: "QR code for this share link",
  },
  autofill: {
    pickerTitle: "Auto-fill a government form",
    pickerSubtitle:
      "Pick a form. Hifadhi maps the fields it already holds in your wallet, so you only type what it genuinely doesn't know.",
    fieldsCount: (n: number) => `${n} fields`,
    fromWalletCount: (n: number) => `${n} fillable from your wallet`,
    openForm: "Open form",
    button: "Auto-fill from Hifadhi",
    buttonLoading: "Filling from your wallet...",
    failed: "Auto-fill failed",
    clearForm: "Clear form",
    fromWalletBadge: "from your wallet",
    notYetFilled: "Not yet filled",
    enterManually: "Enter manually — not stored in your wallet",
    submit: "Submit application",
    submittedTitle: "Application submitted",
    submittedBody: (filled: number, total: number) =>
      `${filled} of ${total} fields were filled automatically from your Hifadhi wallet — no retyping your ID or KRA PIN.`,
    startOver: "Start over",
    backToWallet: "Back to wallet",
    otherForms: "Other forms",
  },
  verify: {
    notFoundTitle: "Link not found",
    notFoundBody:
      "This share link doesn't exist. Ask the document owner to send a new one.",
    revokedTitle: "Access revoked",
    revokedBody:
      "The document owner has revoked this share link. It can no longer be viewed.",
    justRevokedBody:
      "The document owner has just revoked this share link. It can no longer be viewed.",
    expiredTitle: "Link expired",
    expiredBody:
      "This share link has expired. Ask the document owner to send a new one.",
    invalidTitle: "Link no longer valid",
    invalidBody: "This share link is no longer valid.",
    unavailableTitle: "Document unavailable",
    unavailableBody: "This document is no longer available.",
    sharedWith: (label: string) =>
      `Shared with: ${label} · view-only · this view has been logged for the document owner`,
    documentAlt: "Shared document",
    footer: (when: string) =>
      `This link expires ${when}. The owner can revoke access at any time.`,
  },
  docTypes: {
    national_id: "National ID",
    kra_pin: "KRA PIN Certificate",
    passport: "Passport",
    certificate: "Certificate",
    other: "Other",
  },
  auditActions: {
    uploaded: "Uploaded",
    viewed: "Viewed",
    shared: "Share link created",
    revoked: "Share revoked",
    autofill_used: "Used for auto-fill",
  },
  expiry: {
    expired: "Expired",
    renewSoon: "Renew soon",
  },
};

export type Dictionary = typeof EN;

const SW: Dictionary = {
  nav: {
    autofillDemo: "Onyesho la kujaza fomu",
    uploadDocument: "Pakia hati",
    logout: "Toka",
    backToWallet: "← Rudi kwenye pochi",
    backToForms: "← Rudi kwenye fomu",
    language: "Lugha",
  },
  landing: {
    eyebrow: "Hifadhi · Kuweka salama",
    headlineLine1: "Skani hati zako mara moja.",
    headlineLine2: "Usisimame kwenye mstari wa cyber tena.",
    body: "Pakia kitambulisho, PIN ya KRA, au vyeti vyako mara moja. Hifadhi inavisimba kwa siri na kuvihifadhi, kisha inakuwezesha kushiriki hati moja na mtu mmoja maalum — pamoja na kumbukumbu kamili ya nani aliona nini, na lini.",
    createWallet: "Fungua pochi yako",
    login: "Ingia",
    footer:
      "Hakuna alama za kibaiolojia zinazokusanywa. Kushiriki kwa ruhusa yako. Kila ufikiaji unaandikwa.",
  },
  auth: {
    loginTitle: "Ingia kwenye Hifadhi",
    loginSubtitle: "Hati zako, zimewekwa salama.",
    signupTitle: "Fungua pochi yako ya Hifadhi",
    signupSubtitle: "Hifadhi hati zako mara moja. Zishiriki kwa masharti yako.",
    fullName: "Jina kamili",
    email: "Barua pepe",
    password: "Nenosiri",
    loginFailed: "Kuingia kumeshindikana",
    signupFailed: "Kujisajili kumeshindikana",
    loggingIn: "Inaingia...",
    login: "Ingia",
    creatingAccount: "Inafungua akaunti...",
    createAccount: "Fungua akaunti",
    needAccount: "Unahitaji akaunti?",
    signUp: "Jisajili",
    haveAccount: "Una akaunti tayari?",
  },
  dashboard: {
    welcome: (name: string) => `Karibu, ${name}`,
    yourWallet: "Pochi yako",
    emptyState: "Hakuna hati bado.",
    uploadFirst: "Pakia hati yako ya kwanza",
    share: "Shiriki",
    uploadedAt: (when: string) => `ilipakiwa ${when}`,
    extractionPending: "Uchambuzi unasubiri —",
    confirmFields: "thibitisha taarifa",
    document: "hati",
  },
  renewals: {
    heading: (count: number) =>
      count === 1
        ? "Hati 1 inahitaji uangalizi wako"
        : `Hati ${count} zinahitaji uangalizi wako`,
    intro:
      "Hifadhi inafuatilia tarehe za kuisha zilizochambuliwa, ili kitambulisho kilichopitwa na wakati kisikushtue ukiwa kwenye dirisha la huduma.",
    expiredAgo: (days: number) =>
      days === 0
        ? "Ilikwisha leo"
        : days === 1
          ? "Ilikwisha jana"
          : `Ilikwisha siku ${days} zilizopita`,
    expiresToday: "Inaisha leo",
    expiresIn: (days: number) =>
      days === 1 ? "Inaisha kesho" : `Inaisha baada ya siku ${days}`,
    dismissNote: "Taarifa hii itaondoka yenyewe ukipakia nakala mpya.",
  },
  upload: {
    title: "Pakia hati",
    subtitle:
      "Iskani au ipige picha mara moja. Hifadhi inaisimba kwa siri, kisha inachambua taarifa zake ili uzithibitishe.",
    docTypeLabel: "Aina ya hati",
    fileLabel: "Faili au picha",
    selected: (name: string) => `Umechagua: ${name}`,
    chooseFile: "Chagua faili au picha ya kupakia",
    uploadFailed: "Kupakia kumeshindikana",
    checking: "Inahakiki hati...",
    submitting: "Inasimba na kupakia...",
    submit: "Pakia hati",
    tryAgain: "Chagua faili lingine",
    rejectedTitle: "Faili hilo halikuhifadhiwa",
    notADocumentBody:
      "Hii haionekani kama hati rasmi, kwa hivyo haijaongezwa kwenye pochi yako. Pakia picha au skani iliyo wazi ya hati yenyewe.",
    notADocumentSaw: (summary: string) => `Tuliona: ${summary}.`,
    wrongTypeBody: (declared: string, detected: string) =>
      `Umechagua ${declared}, lakini hii inaonekana kama ${detected}. Hakuna kilichohifadhiwa.`,
    wrongTypeFix: (declared: string, detected: string) =>
      `Pakia ${declared} yako, au badilisha "Aina ya hati" kuwa ${detected} na ujaribu tena.`,
    rejectedFootnote:
      "Hifadhi inahakiki faili kabla ya kulihifadhi, ili pochi yako ihifadhi tu hati uliyokusudia.",
  },
  confirm: {
    title: "Thibitisha taarifa zilizochambuliwa",
    subtitle:
      "Claude imesoma hati yako. Angalia taarifa hapa chini, sahihisha lolote lisilo sawa, kisha hifadhi. Hakuna kinachohifadhiwa kwenye pochi yako hadi uthibitishe.",
    extracting: "Claude inachambua taarifa…",
    extractionFailed:
      "Uchambuzi wa kiotomatiki umeshindikana. Jaza taarifa mwenyewe hapa chini.",
    confidence: (percent: number) => `Uhakika wa Claude: ${percent}%`,
    notDetected: "Haikupatikana",
    saveFailed: "Kuhifadhi kumeshindikana",
    saving: "Inahifadhi...",
    save: "Thibitisha na uhifadhi kwenye pochi",
    fields: {
      full_name: "Jina kamili",
      id_number: "Namba ya kitambulisho / hati",
      dob: "Tarehe ya kuzaliwa",
      issue_date: "Tarehe ya kutolewa",
      expiry_date: "Tarehe ya kuisha",
    },
  },
  share: {
    subtitle:
      "Shiriki hati hii na mtu maalum, kwa muda maalum. Kila mara inapotazamwa inaandikwa hapa chini.",
    createTitle: "Tengeneza kiungo cha kushiriki",
    whoFor: "Ni kwa nani?",
    whoForPlaceholder: "mf. Mwenye nyumba — Kilimani",
    validFor: "Inatumika kwa",
    oneHour: "Saa 1",
    twentyFourHours: "Saa 24",
    sevenDays: "Siku 7",
    generate: "Tengeneza kiungo",
    generating: "Inatengeneza...",
    createFailed: "Imeshindikana kutengeneza kiungo",
    copy: "Nakili",
    copied: "Imenakiliwa!",
    copyLink: "Nakili kiungo",
    revoke: "Ondoa ruhusa",
    linksTitle: "Viungo vya kushiriki",
    noLinks: "Hakuna viungo bado.",
    statusActive: "Inatumika",
    statusExpired: "Imeisha",
    statusRevoked: "Ruhusa imeondolewa",
    expiresOn: (when: string) => `inaisha ${when}`,
    auditTitle: "Kumbukumbu — ni nani alifikia hati hii",
    noActivity: "Hakuna shughuli bado.",
    showQr: "Onyesha QR",
    hideQr: "Ficha QR",
    scanToView: "Skani ili kuona",
    qrHint:
      "Elekeza kamera ya simu kwenye msimbo huu ili kufungua kiungo kile kile chenye ruhusa yako, kinachoweza kuondolewa.",
    qrAlt: "Msimbo wa QR wa kiungo hiki",
  },
  autofill: {
    pickerTitle: "Jaza fomu ya serikali kiotomatiki",
    pickerSubtitle:
      "Chagua fomu. Hifadhi inaoanisha taarifa zilizo kwenye pochi yako, ili uandike tu kile ambacho haijui.",
    fieldsCount: (n: number) => `Sehemu ${n}`,
    fromWalletCount: (n: number) => `${n} zinaweza kujazwa kutoka pochi yako`,
    openForm: "Fungua fomu",
    button: "Jaza kutoka Hifadhi",
    buttonLoading: "Inajaza kutoka pochi yako...",
    failed: "Kujaza kumeshindikana",
    clearForm: "Futa fomu",
    fromWalletBadge: "kutoka pochi yako",
    notYetFilled: "Haijajazwa",
    enterManually: "Jaza mwenyewe — haihifadhiwi kwenye pochi yako",
    submit: "Tuma maombi",
    submittedTitle: "Maombi yametumwa",
    submittedBody: (filled: number, total: number) =>
      `Sehemu ${filled} kati ya ${total} zilijazwa kiotomatiki kutoka pochi yako ya Hifadhi — hukuandika tena kitambulisho au PIN ya KRA.`,
    startOver: "Anza upya",
    backToWallet: "Rudi kwenye pochi",
    otherForms: "Fomu zingine",
  },
  verify: {
    notFoundTitle: "Kiungo hakipatikani",
    notFoundBody:
      "Kiungo hiki hakipo. Muulize mmiliki wa hati akutumie kiungo kipya.",
    revokedTitle: "Ruhusa imeondolewa",
    revokedBody:
      "Mmiliki wa hati ameondoa ruhusa ya kiungo hiki. Haiwezi kutazamwa tena.",
    justRevokedBody:
      "Mmiliki wa hati ameondoa ruhusa ya kiungo hiki hivi punde. Haiwezi kutazamwa tena.",
    expiredTitle: "Kiungo kimeisha",
    expiredBody:
      "Muda wa kiungo hiki umeisha. Muulize mmiliki wa hati akutumie kiungo kipya.",
    invalidTitle: "Kiungo hakitumiki tena",
    invalidBody: "Kiungo hiki hakitumiki tena.",
    unavailableTitle: "Hati haipatikani",
    unavailableBody: "Hati hii haipatikani tena.",
    sharedWith: (label: string) =>
      `Imeshirikiwa na: ${label} · kutazama tu · kutazama huku kumeandikwa kwa mmiliki wa hati`,
    documentAlt: "Hati iliyoshirikiwa",
    footer: (when: string) =>
      `Kiungo hiki kinaisha ${when}. Mmiliki anaweza kuondoa ruhusa wakati wowote.`,
  },
  docTypes: {
    national_id: "Kitambulisho cha Kitaifa",
    kra_pin: "Cheti cha PIN ya KRA",
    passport: "Pasipoti",
    certificate: "Cheti",
    other: "Nyingine",
  },
  auditActions: {
    uploaded: "Ilipakiwa",
    viewed: "Ilitazamwa",
    shared: "Kiungo cha kushiriki kilitengenezwa",
    revoked: "Ruhusa iliondolewa",
    autofill_used: "Ilitumika kujaza fomu",
  },
  expiry: {
    expired: "Imeisha",
    renewSoon: "Fanya upya karibuni",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en: EN, sw: SW };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export function docTypeLabel(docType: string, dict: Dictionary): string {
  return (
    dict.docTypes[docType as keyof Dictionary["docTypes"]] ??
    dict.docTypes.other
  );
}

export function auditActionLabel(action: string, dict: Dictionary): string {
  return dict.auditActions[action as keyof Dictionary["auditActions"]] ?? action;
}
