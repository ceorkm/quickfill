import { useState } from "react";
import type { AddressRecord, AutofillMode, Profile, ProfileFieldKey, ProfileFieldMetadataMap } from "@/types";
import { DEFAULT_SENSITIVITY_POLICIES } from "@/types";
import { generateAliasFields } from "@/aliasGenerator";
import { ChevronLeftIcon, ShuffleIcon } from "./Icons";
import logoImg from "../quickfill-logo.png";

export interface OnboardingPayload {
  profiles: Profile[];
  autofillMode: AutofillMode;
}

interface OnboardingFormProps {
  onComplete: (payload: OnboardingPayload) => Promise<void> | void;
}

type FieldState = Partial<Record<ProfileFieldKey, string>>;
type CustomFieldEntry = { key: string; value: string };

type OnboardingStep = "welcome" | "real-info" | "fake-info";

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const inputClasses = "w-full rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-sm text-warm-800 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const REAL_FIELDS: Array<{ section: string; fields: Array<{ key: ProfileFieldKey; label: string; placeholder?: string; type?: string; half?: boolean }> }> = [
  {
    section: "Personal",
    fields: [
      { key: "fullName", label: "Full name", placeholder: "Jane Q. Doe" },
      { key: "firstName", label: "First name", half: true },
      { key: "middleName", label: "Middle name", half: true },
      { key: "lastName", label: "Last name" },
      { key: "email", label: "Email", placeholder: "jane@example.com", type: "email" },
      { key: "secondaryEmail", label: "Secondary email", placeholder: "work@example.com", type: "email" },
      { key: "phone", label: "Phone number", placeholder: "+1 555-123-4567" },
      { key: "dateOfBirth", label: "Date of birth", placeholder: "1990-04-28" },
      { key: "gender", label: "Gender", placeholder: "Female" },
    ]
  },
  {
    section: "Address",
    fields: [
      { key: "addressLine1", label: "Address line 1", placeholder: "123 Main St" },
      { key: "addressLine2", label: "Address line 2", placeholder: "Apt 4B" },
      { key: "city", label: "City", half: true },
      { key: "state", label: "State / Province", half: true },
      { key: "postalCode", label: "ZIP / Postal code", half: true },
      { key: "country", label: "Country", half: true },
    ]
  },
  {
    section: "Work",
    fields: [
      { key: "company", label: "Company", placeholder: "Acme Corp" },
      { key: "jobTitle", label: "Job title", placeholder: "Product Manager" },
    ]
  },
  {
    section: "Travel",
    fields: [
      { key: "passportNumber", label: "Passport number", placeholder: "K1234567" },
      { key: "nationality", label: "Nationality", placeholder: "American" },
    ]
  }
];

function buildFieldMetadata(fields: FieldState): ProfileFieldMetadataMap | undefined {
  const metadataEntries = Object.keys(fields)
    .map(key => {
      const policy = DEFAULT_SENSITIVITY_POLICIES[key as keyof typeof DEFAULT_SENSITIVITY_POLICIES];
      if (!policy) {
        return null;
      }
      return [key, { sensitivity: policy, sourceEntityType: "field" }] as const;
    })
    .filter((entry): entry is readonly [string, NonNullable<ProfileFieldMetadataMap[ProfileFieldKey]>] => Boolean(entry));

  if (metadataEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(metadataEntries) as ProfileFieldMetadataMap;
}

function buildPrimaryAddress(fields: FieldState): AddressRecord[] | undefined {
  if (!fields.addressLine1?.trim() || !fields.city?.trim()) {
    return undefined;
  }

  return [
    {
      id: "home-primary",
      label: "Home",
      kind: "home",
      recipientName: fields.fullName?.trim(),
      company: fields.company?.trim(),
      line1: fields.addressLine1.trim(),
      line2: fields.addressLine2?.trim() || undefined,
      city: fields.city.trim(),
      state: fields.state?.trim() || undefined,
      postalCode: fields.postalCode?.trim() || undefined,
      country: fields.country?.trim() || undefined,
      phone: fields.phone?.trim() || undefined,
      isPrimary: true
    }
  ];
}

function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [mode, setMode] = useState<"real" | "fake">("real");

  const [fields, setFields] = useState<FieldState>({});
  const [customFields, setCustomFields] = useState<CustomFieldEntry[]>([]);
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("");
  const [fakeFields, setFakeFields] = useState<FieldState>({});
  const [fakeEmail, setFakeEmail] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (key: ProfileFieldKey, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleChooseReal = () => {
    setMode("real");
    setStep("real-info");
  };

  const handleChooseFake = () => {
    setMode("fake");
    setFakeFields(generateAliasFields());
    setStep("fake-info");
  };

  const handleRegenerateFake = () => {
    setFakeFields(generateAliasFields());
  };

  const handleFinish = async () => {
    setError(null);

    if (mode === "real") {
      if (!fields.fullName?.trim() || !fields.email?.trim()) {
        setError("At least your full name and email are required.");
        return;
      }
    }

    const profiles: Profile[] = [];

    if (mode === "real") {
      const trimmed = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => Boolean(v && v.trim()))
      ) as FieldState;
      const customFieldsMap: Record<string, string> = {};

      for (const customField of customFields) {
        const key = customField.key.trim();
        const value = customField.value.trim();
        if (!key || !value) continue;
        customFieldsMap[key] = value;
        trimmed[key as ProfileFieldKey] = value;
      }

      profiles.push({
        id: generateId("personal"),
        label: "Personal",
        category: "personal",
        fields: trimmed,
        fieldMetadata: buildFieldMetadata(trimmed),
        collections: {
          addresses: buildPrimaryAddress(trimmed)
        },
        customFields: Object.keys(customFieldsMap).length > 0 ? customFieldsMap : undefined
      });
    } else {
      const aliasFields = { ...fakeFields };
      if (fakeEmail.trim()) {
        aliasFields.email = fakeEmail.trim();
      }
      profiles.push({
        id: generateId("alias"),
        label: "Quick Alias",
        category: "custom",
        fields: aliasFields,
        fieldMetadata: buildFieldMetadata(aliasFields),
        collections: {
          addresses: buildPrimaryAddress(aliasFields)
        },
        alias: {
          enabled: true,
          aliasEmail: fakeEmail.trim() || undefined,
          generatedAt: new Date().toISOString(),
          fields: fakeFields,
          fieldMetadata: buildFieldMetadata(fakeFields),
          collections: {
            addresses: buildPrimaryAddress(fakeFields)
          }
        }
      });
    }

    await onComplete({
      profiles,
      autofillMode: "manual"
    });
  };

  // Step: Welcome
  if (step === "welcome") {
    return (
      <div className="grid gap-5">
        <div className="text-center">
          <img src={logoImg} alt="QuickFill" className="mx-auto mb-3 h-14 w-14 rounded-2xl shadow-md" />
          <h2 className="text-base font-semibold text-warm-900">Welcome to QuickFill</h2>
          <p className="mt-1 text-xs text-warm-500">Auto-fill any form in one click. Choose how you want to start and keep your saved details locally on this device.</p>
        </div>

        <button
          type="button"
          onClick={handleChooseReal}
          className="grid gap-1 rounded-xl border border-cream-300 bg-cream-50 p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
          <span className="text-sm font-semibold text-warm-800">Use my real info</span>
          <p className="text-xs text-warm-500">
            Enter your name, email, address, and any details you want to keep handy. Stored locally on this device.
          </p>
        </button>

        <button
          type="button"
          onClick={handleChooseFake}
          className="grid gap-1 rounded-xl border border-cream-300 bg-cream-50 p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
        >
          <span className="text-sm font-semibold text-warm-800">Use fake info</span>
          <p className="text-xs text-warm-500">
            Auto-generate a random identity. Great for sign-ups you don't trust.
          </p>
        </button>
      </div>
    );
  }

  // Step: Real info — ALL fields
  if (step === "real-info") {
    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStep("welcome")} className="text-xs text-warm-500 hover:text-primary transition">
            <ChevronLeftIcon className="w-3.5 h-3.5 inline" /> Back
          </button>
          <h2 className="text-sm font-semibold text-warm-800">Your info</h2>
        </div>

        {REAL_FIELDS.map(section => (
          <div key={section.section} className="grid gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-warm-500">{section.section}</h3>
            <div className="grid gap-2.5">
              {(() => {
                const rows: JSX.Element[] = [];
                let i = 0;
                while (i < section.fields.length) {
                  const f = section.fields[i];
                  const next = section.fields[i + 1];
                  if (f.half && next?.half) {
                    rows.push(
                      <div key={f.key} className="grid grid-cols-2 gap-2">
                        <label className="grid gap-1">
                          <span className="text-xs font-medium text-warm-600">{f.label}</span>
                          <input className={inputClasses} type={f.type ?? "text"} placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={e => handleFieldChange(f.key, e.target.value)} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs font-medium text-warm-600">{next.label}</span>
                          <input className={inputClasses} type={next.type ?? "text"} placeholder={next.placeholder} value={fields[next.key] ?? ""} onChange={e => handleFieldChange(next.key, e.target.value)} />
                        </label>
                      </div>
                    );
                    i += 2;
                  } else {
                    rows.push(
                      <label key={f.key} className="grid gap-1">
                        <span className="text-xs font-medium text-warm-600">{f.label}</span>
                        <input className={inputClasses} type={f.type ?? "text"} placeholder={f.placeholder} value={fields[f.key] ?? ""} onChange={e => handleFieldChange(f.key, e.target.value)} />
                      </label>
                    );
                    i += 1;
                  }
                }
                return rows;
              })()}
            </div>
          </div>
        ))}

        <fieldset className="grid gap-2 rounded-xl border border-cream-300 bg-white p-4 shadow-sm">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-warm-500">
            Custom Fields
          </legend>
          <p className="text-[11px] text-warm-500">
            Add anything QuickFill does not already list. The field name is used to match form inputs later.
          </p>

          {customFields.map((customField, index) => (
            <div
              key={`${customField.key}-${index}`}
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <input
                className={inputClasses}
                placeholder="Field name"
                value={customField.key}
                onChange={event => {
                  const next = [...customFields];
                  next[index] = { ...customField, key: event.target.value };
                  setCustomFields(next);
                }}
              />
              <input
                className={inputClasses}
                placeholder="Value"
                value={customField.value}
                onChange={event => {
                  const next = [...customFields];
                  next[index] = { ...customField, value: event.target.value };
                  setCustomFields(next);
                }}
              />
              <button
                type="button"
                onClick={() => setCustomFields(customFields.filter((_, currentIndex) => currentIndex !== index))}
                className="rounded-lg border border-accent-red/30 px-2 py-2 text-xs text-accent-red transition hover:bg-accent-red/5"
              >
                &times;
              </button>
            </div>
          ))}

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              className={inputClasses}
              placeholder="New field name"
              value={newCustomKey}
              onChange={event => setNewCustomKey(event.target.value)}
            />
            <input
              className={inputClasses}
              placeholder="Value"
              value={newCustomValue}
              onChange={event => setNewCustomValue(event.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (!newCustomKey.trim()) return;
                setCustomFields([
                  ...customFields,
                  { key: newCustomKey.trim(), value: newCustomValue.trim() }
                ]);
                setNewCustomKey("");
                setNewCustomValue("");
              }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-dark"
            >
              Add
            </button>
          </div>
        </fieldset>

        {error && (
          <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 p-2.5 text-xs text-accent-red">{error}</div>
        )}

        <button
          type="button"
          onClick={handleFinish}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
        >
          Save &amp; start filling
        </button>
      </div>
    );
  }

  // Step: Fake info preview
  if (step === "fake-info") {
    const previewItems = [
      { label: "Name", value: fakeFields.fullName },
      { label: "Phone", value: fakeFields.phone },
      { label: "Address", value: fakeFields.addressLine1 },
      { label: "City", value: `${fakeFields.city}, ${fakeFields.state} ${fakeFields.postalCode}` },
      { label: "Company", value: fakeFields.company },
      { label: "Job title", value: fakeFields.jobTitle },
      { label: "DOB", value: fakeFields.dateOfBirth },
      { label: "Nationality", value: fakeFields.nationality },
    ];

    return (
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStep("welcome")} className="text-xs text-warm-500 hover:text-primary transition">
            <ChevronLeftIcon className="w-3.5 h-3.5 inline" /> Back
          </button>
          <h2 className="text-sm font-semibold text-warm-800">Generated identity</h2>
        </div>

        <div className="grid gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-sm">
          <div className="grid gap-1.5">
            {previewItems.map(item => (
              <div key={item.label} className="flex justify-between gap-3 rounded-lg border border-cream-200 bg-white px-3 py-2">
                <span className="text-xs font-medium text-warm-500">{item.label}</span>
                <span className="text-xs text-warm-800 text-right truncate">{item.value}</span>
              </div>
            ))}
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-warm-600">Your burner email (optional)</span>
            <input
              className={inputClasses}
              value={fakeEmail}
              onChange={e => setFakeEmail(e.target.value)}
              placeholder="throwaway@example.com"
            />
            <span className="text-[11px] text-warm-500">Provide an email you control, or leave blank.</span>
          </label>

          <button
            type="button"
            onClick={handleRegenerateFake}
            className="flex items-center gap-1.5 justify-self-start rounded-lg border border-primary/30 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/10"
          >
            <ShuffleIcon className="w-3.5 h-3.5" />
            Regenerate identity
          </button>
        </div>

        <button
          type="button"
          onClick={handleFinish}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
        >
          Save &amp; start filling
        </button>
      </div>
    );
  }

  // Should never reach here
  return null;
}

export default OnboardingForm;
