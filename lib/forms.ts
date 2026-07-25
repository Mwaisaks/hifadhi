export interface FormField {
  key: string;
  label: string;
  fillableFromWallet: boolean;
}

export interface FormSchema {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
}

export const BUSINESS_PERMIT_FORM: FormSchema = {
  id: "business-permit",
  title: "Single Business Permit Application",
  description:
    "Modeled on the eCitizen Single Business Permit form — the kind of application a citizen currently re-types identity details into every time.",
  fields: [
    { key: "full_name", label: "Applicant full name", fillableFromWallet: true },
    { key: "national_id_number", label: "National ID number", fillableFromWallet: true },
    { key: "date_of_birth", label: "Date of birth", fillableFromWallet: true },
    { key: "kra_pin", label: "KRA PIN", fillableFromWallet: true },
    { key: "id_expiry_date", label: "ID expiry date", fillableFromWallet: true },
    { key: "business_name", label: "Business name", fillableFromWallet: false },
    { key: "business_location", label: "Business location / county", fillableFromWallet: false },
    { key: "phone_number", label: "Phone number", fillableFromWallet: false },
  ],
};

export const FORMS: Record<string, FormSchema> = {
  [BUSINESS_PERMIT_FORM.id]: BUSINESS_PERMIT_FORM,
};

export function getForm(formId: string): FormSchema | undefined {
  return FORMS[formId];
}
