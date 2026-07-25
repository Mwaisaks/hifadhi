import type { Localized } from "./i18n";

export interface FormField {
  key: string;
  label: Localized;
  fillableFromWallet: boolean;
}

export interface FormSchema {
  id: string;
  title: Localized;
  /** Who issues the form — shown on the picker to make the demo concrete. */
  issuer: Localized;
  description: Localized;
  fields: FormField[];
}

export const BUSINESS_PERMIT_FORM: FormSchema = {
  id: "business-permit",
  title: {
    en: "Single Business Permit Application",
    sw: "Maombi ya Kibali Kimoja cha Biashara",
  },
  issuer: {
    en: "County Government · via eCitizen",
    sw: "Serikali ya Kaunti · kupitia eCitizen",
  },
  description: {
    en: "Modeled on the eCitizen Single Business Permit form — the kind of application a citizen currently re-types identity details into every time.",
    sw: "Imeundwa kwa mfano wa fomu ya Kibali Kimoja cha Biashara ya eCitizen — aina ya maombi ambayo mwananchi huandika taarifa zake za utambulisho upya kila mara.",
  },
  fields: [
    {
      key: "full_name",
      label: { en: "Applicant full name", sw: "Jina kamili la mwombaji" },
      fillableFromWallet: true,
    },
    {
      key: "national_id_number",
      label: { en: "National ID number", sw: "Namba ya kitambulisho cha kitaifa" },
      fillableFromWallet: true,
    },
    {
      key: "date_of_birth",
      label: { en: "Date of birth", sw: "Tarehe ya kuzaliwa" },
      fillableFromWallet: true,
    },
    {
      key: "kra_pin",
      label: { en: "KRA PIN", sw: "PIN ya KRA" },
      fillableFromWallet: true,
    },
    {
      key: "id_expiry_date",
      label: { en: "ID expiry date", sw: "Tarehe ya kuisha ya kitambulisho" },
      fillableFromWallet: true,
    },
    {
      key: "business_name",
      label: { en: "Business name", sw: "Jina la biashara" },
      fillableFromWallet: false,
    },
    {
      key: "business_location",
      label: {
        en: "Business location / county",
        sw: "Mahali pa biashara / kaunti",
      },
      fillableFromWallet: false,
    },
    {
      key: "phone_number",
      label: { en: "Phone number", sw: "Namba ya simu" },
      fillableFromWallet: false,
    },
  ],
};

/**
 * Second template, deliberately built with *different field keys* to the permit
 * form (`member_name` not `full_name`, `birth_date` not `date_of_birth`). That
 * proves the auto-fill mapping is semantic — Claude matches on meaning, not on
 * a hardcoded key-to-key table — which is the whole point of showing a second
 * form at all.
 */
export const HEALTH_INSURANCE_FORM: FormSchema = {
  id: "health-insurance",
  title: {
    en: "Health Insurance Member Registration",
    sw: "Usajili wa Mwanachama wa Bima ya Afya",
  },
  issuer: {
    en: "NHIF / SHA · national health scheme",
    sw: "NHIF / SHA · mfuko wa afya wa kitaifa",
  },
  description: {
    en: "Modeled on the NHIF member registration form (now administered under SHA). Note the field names differ from the permit form — nothing here is hardcoded to one schema.",
    sw: "Imeundwa kwa mfano wa fomu ya usajili wa mwanachama wa NHIF (sasa inasimamiwa chini ya SHA). Majina ya sehemu ni tofauti na yale ya fomu ya kibali — hakuna kitu kilichofungwa kwa fomu moja.",
  },
  fields: [
    {
      key: "member_name",
      label: { en: "Member's full name", sw: "Jina kamili la mwanachama" },
      fillableFromWallet: true,
    },
    {
      key: "id_number",
      label: {
        en: "Identification number (ID or passport)",
        sw: "Namba ya utambulisho (kitambulisho au pasipoti)",
      },
      fillableFromWallet: true,
    },
    {
      key: "birth_date",
      label: { en: "Date of birth", sw: "Tarehe ya kuzaliwa" },
      fillableFromWallet: true,
    },
    {
      key: "tax_pin",
      label: { en: "KRA PIN (if employed)", sw: "PIN ya KRA (kama umeajiriwa)" },
      fillableFromWallet: true,
    },
    {
      key: "employment_status",
      label: {
        en: "Employment status (formal / informal / self-employed)",
        sw: "Hali ya kazi (rasmi / isiyo rasmi / kujiajiri)",
      },
      fillableFromWallet: false,
    },
    {
      key: "employer_name",
      label: { en: "Employer name (if any)", sw: "Jina la mwajiri (kama yupo)" },
      fillableFromWallet: false,
    },
    {
      key: "sub_county",
      label: { en: "Sub-county of residence", sw: "Kata unayoishi" },
      fillableFromWallet: false,
    },
    {
      key: "mobile_number",
      label: { en: "M-Pesa / mobile number", sw: "Namba ya M-Pesa / simu" },
      fillableFromWallet: false,
    },
    {
      key: "next_of_kin",
      label: { en: "Next of kin full name", sw: "Jina kamili la jamaa wa karibu" },
      fillableFromWallet: false,
    },
  ],
};

/** Display order on the form picker. */
export const FORM_LIST: FormSchema[] = [
  BUSINESS_PERMIT_FORM,
  HEALTH_INSURANCE_FORM,
];

export const FORMS: Record<string, FormSchema> = Object.fromEntries(
  FORM_LIST.map((form) => [form.id, form])
);

export function getForm(formId: string): FormSchema | undefined {
  return FORMS[formId];
}

export function walletFillableCount(form: FormSchema): number {
  return form.fields.filter((field) => field.fillableFromWallet).length;
}
