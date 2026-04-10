import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, ProfileAliasConfig, ProfileCategory, ProfileFieldKey } from "@/types";
import { generateAliasFields } from "@/aliasGenerator";
import { ShuffleIcon } from "./Icons";

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => Promise<void> | void;
  onSaveProfile: (profile: Profile) => Promise<void> | void;
}

type FieldState = Partial<Record<ProfileFieldKey, string>>;

const FIELD_LABELS: Partial<Record<ProfileFieldKey, string>> = {
  fullName: "Full name",
  firstName: "First name",
  middleName: "Middle name",
  lastName: "Last name",
  namePrefix: "Prefix (Mr/Ms/Dr)",
  nameSuffix: "Suffix (Jr/Sr)",
  nickname: "Nickname",
  email: "Primary email",
  secondaryEmail: "Secondary email",
  workEmail: "Work email",
  phone: "Phone",
  secondaryPhone: "Secondary phone",
  mobilePhone: "Mobile phone",
  workPhone: "Work phone",
  website: "Website",
  linkedinUrl: "LinkedIn",
  githubUrl: "GitHub",
  twitterHandle: "Twitter / X",
  instagramHandle: "Instagram",
  portfolioUrl: "Portfolio URL",
  addressLine1: "Address line 1",
  addressLine2: "Address line 2",
  city: "City",
  state: "State / Province",
  postalCode: "ZIP / Postal code",
  country: "Country",
  shippingAddressLine1: "Shipping address",
  shippingAddressLine2: "Shipping line 2",
  shippingCity: "Shipping city",
  shippingState: "Shipping state",
  shippingPostalCode: "Shipping ZIP",
  shippingCountry: "Shipping country",
  billingAddressLine1: "Billing address",
  billingAddressLine2: "Billing line 2",
  billingCity: "Billing city",
  billingState: "Billing state",
  billingPostalCode: "Billing ZIP",
  billingCountry: "Billing country",
  dateOfBirth: "Date of birth",
  gender: "Gender",
  pronouns: "Pronouns",
  maritalStatus: "Marital status",
  nationality: "Nationality",
  citizenshipCountry: "Citizenship country",
  passportNumber: "Passport number",
  passportCountry: "Passport country",
  passportIssueDate: "Passport issue date",
  passportExpiryDate: "Passport expiry date",
  driverLicenseNumber: "Driver's license #",
  driverLicenseState: "License state",
  ssn: "SSN",
  taxId: "Tax ID",
  knownTravelerNumber: "Known Traveler Number",
  redressNumber: "Redress number",
  company: "Company",
  jobTitle: "Job title",
  department: "Department",
  employmentStatus: "Employment status",
  yearsOfExperience: "Years of experience",
  annualIncome: "Annual income",
  businessName: "Business name",
  schoolName: "School / University",
  degree: "Degree",
  major: "Major / Field of study",
  graduationDate: "Graduation date",
  studentId: "Student ID",
  frequentFlyerNumber: "Frequent flyer #",
  hotelLoyaltyNumber: "Hotel loyalty #",
  seatPreference: "Seat preference",
  mealPreference: "Meal / Dietary preference",
  cardholderName: "Name on card",
  cardNumber: "Card number",
  cardExpiryMonth: "Expiry month",
  cardExpiryYear: "Expiry year",
  cardSecurityCode: "CVV",
  bankAccountNumber: "Bank account #",
  routingNumber: "Routing number",
  insuranceProvider: "Insurance provider",
  insuranceMemberId: "Insurance member ID",
  emergencyContactName: "Emergency contact name",
  emergencyContactPhone: "Emergency contact phone",
  emergencyContactRelationship: "Emergency contact relationship",
  bloodType: "Blood type",
  allergies: "Allergies",
  spouseName: "Spouse / Partner name",
  dependentCount: "Dependents",
};

const FIELD_GROUPS: Array<{ title: string; fields: ProfileFieldKey[] }> = [
  {
    title: "Identity",
    fields: ["fullName", "firstName", "middleName", "lastName", "namePrefix", "nameSuffix", "nickname", "dateOfBirth", "gender", "pronouns", "maritalStatus"]
  },
  {
    title: "Contact",
    fields: ["email", "secondaryEmail", "workEmail", "phone", "secondaryPhone", "mobilePhone", "workPhone"]
  },
  {
    title: "Social & Links",
    fields: ["website", "linkedinUrl", "githubUrl", "twitterHandle", "instagramHandle", "portfolioUrl"]
  },
  {
    title: "Home Address",
    fields: ["addressLine1", "addressLine2", "city", "state", "postalCode", "country"]
  },
  {
    title: "Shipping Address",
    fields: ["shippingAddressLine1", "shippingAddressLine2", "shippingCity", "shippingState", "shippingPostalCode", "shippingCountry"]
  },
  {
    title: "Billing Address",
    fields: ["billingAddressLine1", "billingAddressLine2", "billingCity", "billingState", "billingPostalCode", "billingCountry"]
  },
  {
    title: "Employment",
    fields: ["company", "jobTitle", "department", "employmentStatus", "yearsOfExperience", "annualIncome", "businessName"]
  },
  {
    title: "Education",
    fields: ["schoolName", "degree", "major", "graduationDate", "studentId"]
  },
  {
    title: "Travel",
    fields: ["passportNumber", "passportCountry", "passportIssueDate", "passportExpiryDate", "nationality", "citizenshipCountry", "frequentFlyerNumber", "hotelLoyaltyNumber", "seatPreference", "mealPreference"]
  },
  {
    title: "Payment",
    fields: ["cardholderName", "cardNumber", "cardExpiryMonth", "cardExpiryYear", "cardSecurityCode", "bankAccountNumber", "routingNumber"]
  },
  {
    title: "Medical & Emergency",
    fields: ["insuranceProvider", "insuranceMemberId", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship", "bloodType", "allergies"]
  },
  {
    title: "Household",
    fields: ["spouseName", "dependentCount"]
  }
];

const inputClasses = "rounded-lg border border-cream-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ProfileManager({
  profiles,
  activeProfileId,
  onSaveProfile,
  onSelectProfile
}: ProfileManagerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    activeProfileId ?? profiles[0]?.id ?? null
  );
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<ProfileCategory>("personal");
  const [fields, setFields] = useState<FieldState>({});
  const [aliasEnabled, setAliasEnabled] = useState(false);
  const [aliasTouched, setAliasTouched] = useState(false);
  const [aliasEmail, setAliasEmail] = useState("");
  const [aliasFields, setAliasFields] = useState<FieldState>({});
  const [aliasGeneratedAt, setAliasGeneratedAt] = useState<string | undefined>(undefined);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([]);
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((title: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const selectedProfile = useMemo(() => {
    if (!selectedProfileId) {
      return null;
    }
    return profiles.find(profile => profile.id === selectedProfileId) ?? null;
  }, [selectedProfileId, profiles]);

  useEffect(() => {
    if (activeProfileId && activeProfileId !== selectedProfileId) {
      setSelectedProfileId(activeProfileId);
    }
  }, [activeProfileId, selectedProfileId]);

  useEffect(() => {
    if (selectedProfile) {
      setLabel(selectedProfile.label);
      setCategory(selectedProfile.category);
      setFields(selectedProfile.fields ?? {});
      setAliasEnabled(false);
      setAliasTouched(false);
      setAliasEmail(selectedProfile.alias?.aliasEmail ?? "");
      setAliasFields(selectedProfile.alias?.fields ?? {});
      setAliasGeneratedAt(selectedProfile.alias?.generatedAt);
      // Load custom fields
      const cf = selectedProfile.customFields ?? {};
      setCustomFields(Object.entries(cf).map(([k, v]) => ({ key: k, value: v ?? "" })));
    } else {
      setLabel("New profile");
      setCategory("custom");
      setFields({});
      setAliasEnabled(false);
      setAliasTouched(false);
      setAliasEmail("");
      setAliasFields({});
      setAliasGeneratedAt(undefined);
      setCustomFields([]);
    }
  }, [selectedProfile]);

  const handleFieldChange = (key: ProfileFieldKey, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const aliasPreview = useMemo(
    () => [
      { label: "Name", value: aliasFields.fullName },
      { label: "Company", value: aliasFields.company },
      { label: "Phone", value: aliasFields.phone },
      { label: "Address", value: aliasFields.addressLine1 },
      { label: "City", value: aliasFields.city },
      { label: "Alias email", value: aliasEmail || undefined }
    ].filter(item => Boolean(item.value)),
    [aliasFields, aliasEmail]
  );

  const ensureAliasFields = () => {
    if (Object.keys(aliasFields).length === 0) {
      const generated = generateAliasFields();
      setAliasFields(generated);
      setAliasGeneratedAt(new Date().toISOString());
    }
  };

  const handleAliasToggle = (enabled: boolean) => {
    setAliasTouched(true);
    setAliasEnabled(enabled);
    if (enabled) {
      ensureAliasFields();
    }
  };

  const handleRegenerateAlias = () => {
    const generated = generateAliasFields();
    setAliasFields(generated);
    setAliasGeneratedAt(new Date().toISOString());
  };

  const handleSave = async () => {
    const trimmedFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => Boolean(value && value.trim()))
    ) as Profile["fields"];

    const trimmedAliasFields = Object.fromEntries(
      Object.entries(aliasFields).filter(([, value]) => Boolean(value && value.trim()))
    ) as Profile["fields"];

    const effectiveAliasEnabled = aliasTouched
      ? aliasEnabled
      : Boolean(selectedProfile?.alias?.enabled);

    let nextAliasGeneratedAt = aliasGeneratedAt;
    if (effectiveAliasEnabled && Object.keys(trimmedAliasFields).length === 0) {
      const generated = generateAliasFields();
      Object.assign(trimmedAliasFields, generated);
      setAliasFields(generated);
      nextAliasGeneratedAt = new Date().toISOString();
      setAliasGeneratedAt(nextAliasGeneratedAt);
    }

    if (effectiveAliasEnabled && !nextAliasGeneratedAt) {
      nextAliasGeneratedAt = new Date().toISOString();
      setAliasGeneratedAt(nextAliasGeneratedAt);
    }

    let aliasConfig: ProfileAliasConfig | undefined;
    if (effectiveAliasEnabled || selectedProfile?.alias) {
      aliasConfig = {
        enabled: effectiveAliasEnabled,
        aliasEmail: aliasEmail.trim() || undefined,
        generatedAt: nextAliasGeneratedAt,
        fields: trimmedAliasFields
      };
    }

    // Build custom fields map and merge into fields for autofill
    const customFieldsMap: Record<string, string> = {};
    for (const cf of customFields) {
      const k = cf.key.trim();
      const v = cf.value.trim();
      if (k && v) {
        customFieldsMap[k] = v;
        // Also add to fields so contentScript can match them
        trimmedFields[k] = v;
      }
    }

    const profileToPersist: Profile = {
      id: selectedProfile?.id ?? generateId("profile"),
      label: label || "Untitled profile",
      category,
      fields: trimmedFields,
      fieldMetadata: selectedProfile?.fieldMetadata,
      collections: selectedProfile?.collections,
      customFields: Object.keys(customFieldsMap).length > 0 ? customFieldsMap : undefined,
      alias: aliasConfig
    };
    setSaveStatus(null);
    try {
      await onSaveProfile(profileToPersist);
      await onSelectProfile(profileToPersist.id);
      setSelectedProfileId(profileToPersist.id);
      setSaveStatus("Saved!");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus("Failed to save.");
    }
  };

  const handleCreateNew = () => {
    const newId = generateId("profile");
    setSelectedProfileId(newId);
    setLabel("New profile");
    setCategory("custom");
    setFields({});
    setAliasEnabled(false);
    setAliasTouched(false);
    setAliasEmail("");
    setAliasFields({});
    setAliasGeneratedAt(undefined);
  };

  return (
    <section className="grid min-w-0 gap-3 rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-warm-800">Profiles</h2>
          <p className="text-xs text-warm-500">Switch profiles or edit details before autofilling.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-cream-300 bg-white px-3 py-1.5 text-xs font-medium text-warm-600 transition hover:border-primary/40 hover:text-primary"
            type="button"
            onClick={handleCreateNew}
          >
            New profile
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {profiles.map(profile => {
          const isActive = profile.id === activeProfileId;
          const isSelected = profile.id === selectedProfileId;
          const className = `rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isActive
              ? "border-primary bg-primary/10 text-primary"
              : isSelected
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-cream-300 bg-white text-warm-600 hover:border-primary/40 hover:text-primary"
          }`;
          return (
            <button
              key={profile.id}
              className={className}
              type="button"
              onClick={() => setSelectedProfileId(profile.id)}
            >
              {profile.label}
            </button>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-3">
        <div className="grid gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-warm-600">Profile label</span>
            <input
              className={inputClasses}
              value={label}
              onChange={event => setLabel(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5 text-xs text-warm-600">
            Category
            <select
              className={inputClasses}
              value={category}
              onChange={event => setCategory(event.target.value as ProfileCategory)}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="travel">Travel</option>
              <option value="custom">Custom</option>
            </select>
          </label>
        </div>

        <div className="grid gap-2">
          {FIELD_GROUPS.map(group => {
            const filledCount = group.fields.filter(k => fields[k]?.trim()).length;
            const isExpanded = expandedSections.has(group.title);
            return (
              <div key={group.title} className="rounded-lg border border-cream-300 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(group.title)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-cream-100 transition"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-warm-500">{group.title}</span>
                  <div className="flex items-center gap-2">
                    {filledCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {filledCount}
                      </span>
                    )}
                    <svg className={`w-3.5 h-3.5 text-warm-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="grid gap-2 border-t border-cream-200 px-3 py-3">
                    {group.fields.map(fieldKey => (
                      <label key={fieldKey} className="grid gap-1">
                        <span className="text-xs font-medium text-warm-600">{FIELD_LABELS[fieldKey] ?? fieldKey}</span>
                        <input
                          className={inputClasses}
                          value={fields[fieldKey] ?? ""}
                          onChange={event => handleFieldChange(fieldKey, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom fields — user-defined */}
        <fieldset className="grid gap-2 rounded-lg border border-cream-300 bg-white p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-warm-500">
            Custom Fields
          </legend>
          <p className="text-[11px] text-warm-500">
            Add any field you need. The field name is used to match form inputs.
          </p>

          {customFields.map((cf, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                className={inputClasses + " flex-1"}
                placeholder="Field name"
                value={cf.key}
                onChange={e => {
                  const updated = [...customFields];
                  updated[idx] = { ...cf, key: e.target.value };
                  setCustomFields(updated);
                }}
              />
              <input
                className={inputClasses + " flex-1"}
                placeholder="Value"
                value={cf.value}
                onChange={e => {
                  const updated = [...customFields];
                  updated[idx] = { ...cf, value: e.target.value };
                  setCustomFields(updated);
                }}
              />
              <button
                type="button"
                onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                className="rounded-lg border border-accent-red/30 px-2 py-2 text-xs text-accent-red transition hover:bg-accent-red/5"
              >
                &times;
              </button>
            </div>
          ))}

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              className={inputClasses + " flex-1"}
              placeholder="New field name"
              value={newCustomKey}
              onChange={e => setNewCustomKey(e.target.value)}
            />
            <input
              className={inputClasses + " flex-1"}
              placeholder="Value"
              value={newCustomValue}
              onChange={e => setNewCustomValue(e.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                if (newCustomKey.trim()) {
                  setCustomFields([...customFields, { key: newCustomKey.trim(), value: newCustomValue.trim() }]);
                  setNewCustomKey("");
                  setNewCustomValue("");
                }
              }}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-dark"
            >
              Add
            </button>
          </div>
        </fieldset>

        <section className="grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <header className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">Alias generator</h3>
              <p className="text-xs text-warm-600">
                Generate convincing dummy details for sign-ups while keeping sensitive info untouched. Provide your own burner email and regenerate anytime.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-warm-600">
              <input
                checked={aliasEnabled}
                className="accent-primary"
                onChange={event => handleAliasToggle(event.currentTarget.checked)}
                type="checkbox"
              />
              Use alias data
            </label>
          </header>

          {!aliasEnabled && selectedProfile?.alias?.enabled && !aliasTouched && (
            <p className="text-[11px] text-warm-500">
              Alias settings already exist for this profile. Toggle this on only if you want to change them.
            </p>
          )}

          {aliasEnabled && (
            <div className="grid gap-3 rounded-lg border border-primary/20 bg-white p-3 text-xs">
              <label className="grid gap-1.5 text-warm-600">
                Alias email (you control this inbox)
                <input
                  className={inputClasses}
                  placeholder="burner@example.com"
                  value={aliasEmail}
                  onChange={event => setAliasEmail(event.target.value)}
                />
              </label>
              <div className="grid gap-1 rounded-lg border border-cream-300 bg-cream-100 p-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Current alias snapshot</span>
                {aliasPreview.length > 0 ? (
                  <ul className="grid gap-1">
                    {aliasPreview.map(item => (
                      <li key={item.label} className="flex justify-between gap-2 text-[11px] text-warm-600">
                        <span className="font-medium text-warm-500">{item.label}</span>
                        <span className="truncate text-right text-warm-700">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-warm-500">Alias data will be generated once you save.</p>
                )}
              </div>
              <button
                className="justify-self-start rounded-lg border border-primary/30 px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary/10"
                type="button"
                onClick={() => handleRegenerateAlias()}
              >
                <ShuffleIcon className="w-3.5 h-3.5 inline mr-1" />
                Regenerate alias data
              </button>
              {aliasGeneratedAt && (
                <span className="text-[11px] text-warm-500">Generated {new Date(aliasGeneratedAt).toLocaleString()}</span>
              )}
            </div>
          )}
        </section>

        <div className="flex justify-end gap-2">
          {selectedProfile && (
            <button
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                selectedProfile.id === activeProfileId
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-cream-300 bg-white text-warm-600 hover:border-primary/40 hover:text-primary"
              }`}
              disabled={selectedProfile.id === activeProfileId}
              type="button"
              onClick={() => onSelectProfile(selectedProfile.id ?? "")}
            >
              {selectedProfile.id === activeProfileId ? "Active profile" : "Set active"}
            </button>
          )}
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-dark"
            type="button"
            onClick={() => handleSave()}
          >
            Save profile
          </button>
        </div>
        {saveStatus && (
          <div className={`rounded-lg px-3 py-2 text-xs font-medium text-center ${
            saveStatus === "Saved!" ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
          }`}>
            {saveStatus}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProfileManager;
