// Shared type definitions across background, popup, and content script contexts.
export type ProfileCategory = "personal" | "work" | "travel" | "custom";

/**
 * Exhaustive built-in field catalog used by QuickFill's matcher and UI.
 * Keep this organized by category so new form domains can be added without
 * refactoring every consumer.
 */
export type KnownProfileFieldKey =
  /** Identity */
  | "fullName"
  | "preferredName"
  | "firstName"
  | "middleName"
  | "lastName"
  | "namePrefix"
  | "nameSuffix"
  | "nickname"
  | "dateOfBirth"
  | "placeOfBirth"
  | "gender"
  | "pronouns"
  | "maritalStatus"
  | "nationality"
  | "citizenshipCountry"
  | "passportNumber"
  | "passportCountry"
  | "passportIssueDate"
  | "passportExpiryDate"
  | "passportIssuingAuthority"
  | "driverLicenseNumber"
  | "driverLicenseState"
  | "driverLicenseExpiryDate"
  | "nationalIdNumber"
  | "ssn"
  | "ssnLast4"
  | "taxId"
  | "itin"
  | "visaNumber"
  | "visaType"
  | "alienRegistrationNumber"
  | "knownTravelerNumber"
  | "redressNumber"
  | "studentId"
  /** Contact */
  | "email"
  | "secondaryEmail"
  | "workEmail"
  | "phone"
  | "secondaryPhone"
  | "mobilePhone"
  | "workPhone"
  | "homePhone"
  | "fax"
  | "website"
  | "linkedinUrl"
  | "githubUrl"
  | "portfolioUrl"
  | "twitterHandle"
  | "instagramHandle"
  | "tiktokHandle"
  | "facebookProfile"
  | "contactPreference"
  /** Legacy address */
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode"
  | "country"
  /** Home address */
  | "homeAddressLine1"
  | "homeAddressLine2"
  | "homeCity"
  | "homeState"
  | "homePostalCode"
  | "homeCountry"
  /** Work address */
  | "workAddressLine1"
  | "workAddressLine2"
  | "workCity"
  | "workState"
  | "workPostalCode"
  | "workCountry"
  /** Billing address */
  | "billingAddressLine1"
  | "billingAddressLine2"
  | "billingCity"
  | "billingState"
  | "billingPostalCode"
  | "billingCountry"
  /** Shipping address */
  | "shippingAddressLine1"
  | "shippingAddressLine2"
  | "shippingCity"
  | "shippingState"
  | "shippingPostalCode"
  | "shippingCountry"
  /** Employment and freelance */
  | "company"
  | "companyWebsite"
  | "jobTitle"
  | "department"
  | "employmentStatus"
  | "workAuthorization"
  | "yearsOfExperience"
  | "annualIncome"
  | "monthlyIncome"
  | "businessName"
  | "businessType"
  /** Education */
  | "schoolName"
  | "degree"
  | "major"
  | "graduationDate"
  /** Travel and booking */
  | "origin"
  | "destination"
  | "departureDate"
  | "returnDate"
  | "arrivalDate"
  | "seatPreference"
  | "mealPreference"
  | "frequentFlyerNumber"
  | "hotelLoyaltyNumber"
  | "rentalCarLoyaltyNumber"
  /** Billing and finance */
  | "cardholderName"
  | "nameOnCard"
  | "cardNumber"
  | "cardExpiryMonth"
  | "cardExpiryYear"
  | "cardExpiryDate"
  | "cardSecurityCode"
  | "bankAccountNumber"
  | "routingNumber"
  | "iban"
  | "swiftBic"
  /** Government, medical, insurance, household */
  | "insuranceProvider"
  | "insuranceMemberId"
  | "insuranceGroupNumber"
  | "medicalRecordNumber"
  | "bloodType"
  | "allergies"
  | "currentMedications"
  | "emergencyContactName"
  | "emergencyContactPhone"
  | "emergencyContactRelationship"
  | "spouseName"
  | "dependentCount"
  | "householdIncome"
  /** Applications, rental, warranty, events */
  | "resumeUrl"
  | "coverLetterText"
  | "referenceName"
  | "referencePhone"
  | "referenceEmail"
  | "landlordName"
  | "landlordPhone"
  | "vehicleMake"
  | "vehicleModel"
  | "vehicleYear"
  | "licensePlate"
  | "purchaseDate"
  | "productSerialNumber"
  | "eventName"
  | "ticketType"
  | "attendeeName"
  | "attendeeEmail"
  /** Pets */
  | "petName"
  | "petType"
  | "petBreed"
  | "petDateOfBirth"
  | "veterinarianName";

/**
 * Extensible field key wrapper. Existing components that use
 * `Record<ProfileFieldKey, string>` keep compiling, while the app still gets a
 * rich built-in catalog through `KnownProfileFieldKey`.
 */
export type ProfileFieldKey =
  | KnownProfileFieldKey
  | (string & { readonly __profileFieldKeyBrand?: never });

export interface ProfileField {
  key: ProfileFieldKey;
  label: string;
  placeholder?: string;
}

export type ProfileFieldValueMap = Partial<Record<ProfileFieldKey, string>>;

/**
 * Sensitivity tiers control display, clipboard, and operational handling.
 * They let the UI and fill engine differentiate routine values from highly
 * sensitive identifiers.
 */
export type SensitivityTier = "standard" | "personal" | "sensitive" | "critical";

export type DisplayMaskStrategy = "none" | "partial" | "last4" | "full";

export type ClipboardPolicy = "allow" | "confirm" | "block";

export interface SensitiveFieldPolicy {
  tier: SensitivityTier;
  displayMask: DisplayMaskStrategy;
  clipboard: ClipboardPolicy;
  redactInLogs?: boolean;
}

export interface ProfileFieldMetadata {
  sensitivity?: SensitiveFieldPolicy;
  sourceEntityType?: ProfileCollectionKey | "field";
  sourceEntityId?: string;
  notes?: string;
}

export type ProfileFieldMetadataMap = Partial<Record<ProfileFieldKey, ProfileFieldMetadata>>;

export type AddressKind = "home" | "work" | "billing" | "shipping" | "temporary" | "other";

export interface AddressRecord {
  id: string;
  label?: string;
  kind: AddressKind;
  recipientName?: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface PaymentCardRecord {
  id: string;
  label?: string;
  brand?: string;
  cardholderName?: string;
  nameOnCard?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  expiryDate?: string;
  securityCode?: string;
  billingAddressId?: string;
  isPrimary?: boolean;
}

export interface EducationEntry {
  id: string;
  schoolName: string;
  degree?: string;
  major?: string;
  graduationDate?: string;
  studentId?: string;
  isPrimary?: boolean;
}

export interface EmploymentEntry {
  id: string;
  company: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: string;
  workAuthorization?: string;
  yearsOfExperience?: string;
  annualIncome?: string;
  monthlyIncome?: string;
  workAddressId?: string;
  isPrimary?: boolean;
}

export interface InsuranceRecord {
  id: string;
  provider?: string;
  memberId?: string;
  groupNumber?: string;
  policyHolderName?: string;
  isPrimary?: boolean;
}

export interface EmergencyContactRecord {
  id: string;
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface PetRecord {
  id: string;
  name: string;
  type?: string;
  breed?: string;
  dateOfBirth?: string;
  veterinarianName?: string;
  isPrimary?: boolean;
}

export interface VehicleRecord {
  id: string;
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  vin?: string;
  isPrimary?: boolean;
}

export interface ReferenceRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface CustomEntityRecord {
  id: string;
  type: string;
  label?: string;
  values: ProfileFieldValueMap;
  metadata?: Record<string, string>;
  isPrimary?: boolean;
}

export type ProfileCollectionKey =
  | "addresses"
  | "paymentCards"
  | "education"
  | "employment"
  | "insurance"
  | "emergencyContacts"
  | "pets"
  | "vehicles"
  | "references"
  | "customEntities";

export interface ProfileCollections {
  addresses?: AddressRecord[];
  paymentCards?: PaymentCardRecord[];
  education?: EducationEntry[];
  employment?: EmploymentEntry[];
  insurance?: InsuranceRecord[];
  emergencyContacts?: EmergencyContactRecord[];
  pets?: PetRecord[];
  vehicles?: VehicleRecord[];
  references?: ReferenceRecord[];
  customEntities?: CustomEntityRecord[];
}

/**
 * Hybrid storage model:
 * - `fields` remains the canonical flat map used by the current autofill flow.
 * - `collections` adds typed repeatable entities for richer form domains.
 * - `customFields` leaves room for one-off vendor-specific fields.
 */
export interface Profile {
  id: string;
  label: string;
  category: ProfileCategory;
  fields: ProfileFieldValueMap;
  fieldMetadata?: ProfileFieldMetadataMap;
  collections?: ProfileCollections;
  customFields?: ProfileFieldValueMap;
  alias?: ProfileAliasConfig;
}

export interface ProfileAliasConfig {
  enabled: boolean;
  aliasEmail?: string;
  generatedAt?: string;
  fields: ProfileFieldValueMap;
  fieldMetadata?: ProfileFieldMetadataMap;
  collections?: Pick<ProfileCollections, "addresses">;
}

export interface VaultPayload {
  version: number;
  profiles: Profile[];
  createdAt: string;
  updatedAt: string;
}

export type AutofillMode = "manual" | "auto";

export interface ExtensionSettings {
  activeProfileId: string | null;
  autofillMode: AutofillMode;
}

export interface ExtensionState {
  hasVault: boolean;
  needsOnboarding: boolean;
  profiles: Profile[];
  activeProfileId: string | null;
  autofillMode: AutofillMode;
  lastUpdatedAt?: string;
}

export interface RuntimeState {
  decryptedVault: VaultPayload | null;
  activeProfileId: string | null;
  autofillMode: AutofillMode;
}

export const LEGACY_PROFILE_FIELD_KEYS = [
  "fullName",
  "firstName",
  "middleName",
  "lastName",
  "email",
  "secondaryEmail",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
  "passportNumber",
  "nationality",
  "dateOfBirth",
  "gender",
  "company",
  "jobTitle",
  "knownTravelerNumber"
] as const satisfies readonly KnownProfileFieldKey[];

export const PROFILE_FIELD_CATEGORIES = {
  identity: [
    "fullName",
    "preferredName",
    "firstName",
    "middleName",
    "lastName",
    "namePrefix",
    "nameSuffix",
    "nickname",
    "dateOfBirth",
    "placeOfBirth",
    "gender",
    "pronouns",
    "maritalStatus",
    "nationality",
    "citizenshipCountry",
    "passportNumber",
    "passportCountry",
    "passportIssueDate",
    "passportExpiryDate",
    "passportIssuingAuthority",
    "driverLicenseNumber",
    "driverLicenseState",
    "driverLicenseExpiryDate",
    "nationalIdNumber",
    "ssn",
    "ssnLast4",
    "taxId",
    "itin",
    "visaNumber",
    "visaType",
    "alienRegistrationNumber",
    "knownTravelerNumber",
    "redressNumber",
    "studentId"
  ],
  contact: [
    "email",
    "secondaryEmail",
    "workEmail",
    "phone",
    "secondaryPhone",
    "mobilePhone",
    "workPhone",
    "homePhone",
    "fax",
    "website",
    "linkedinUrl",
    "githubUrl",
    "portfolioUrl",
    "twitterHandle",
    "instagramHandle",
    "tiktokHandle",
    "facebookProfile",
    "contactPreference"
  ],
  address: [
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
    "country",
    "homeAddressLine1",
    "homeAddressLine2",
    "homeCity",
    "homeState",
    "homePostalCode",
    "homeCountry",
    "workAddressLine1",
    "workAddressLine2",
    "workCity",
    "workState",
    "workPostalCode",
    "workCountry",
    "billingAddressLine1",
    "billingAddressLine2",
    "billingCity",
    "billingState",
    "billingPostalCode",
    "billingCountry",
    "shippingAddressLine1",
    "shippingAddressLine2",
    "shippingCity",
    "shippingState",
    "shippingPostalCode",
    "shippingCountry"
  ],
  employment: [
    "company",
    "companyWebsite",
    "jobTitle",
    "department",
    "employmentStatus",
    "workAuthorization",
    "yearsOfExperience",
    "annualIncome",
    "monthlyIncome",
    "businessName",
    "businessType"
  ],
  education: ["schoolName", "degree", "major", "graduationDate"],
  travel: [
    "origin",
    "destination",
    "departureDate",
    "returnDate",
    "arrivalDate",
    "seatPreference",
    "mealPreference",
    "frequentFlyerNumber",
    "hotelLoyaltyNumber",
    "rentalCarLoyaltyNumber"
  ],
  billing: [
    "cardholderName",
    "nameOnCard",
    "cardNumber",
    "cardExpiryMonth",
    "cardExpiryYear",
    "cardExpiryDate",
    "cardSecurityCode",
    "bankAccountNumber",
    "routingNumber",
    "iban",
    "swiftBic"
  ],
  medical: [
    "insuranceProvider",
    "insuranceMemberId",
    "insuranceGroupNumber",
    "medicalRecordNumber",
    "bloodType",
    "allergies",
    "currentMedications",
    "emergencyContactName",
    "emergencyContactPhone",
    "emergencyContactRelationship"
  ],
  household: ["spouseName", "dependentCount", "householdIncome"],
  applications: [
    "resumeUrl",
    "coverLetterText",
    "referenceName",
    "referencePhone",
    "referenceEmail",
    "landlordName",
    "landlordPhone",
    "vehicleMake",
    "vehicleModel",
    "vehicleYear",
    "licensePlate",
    "purchaseDate",
    "productSerialNumber",
    "eventName",
    "ticketType",
    "attendeeName",
    "attendeeEmail"
  ],
  pets: ["petName", "petType", "petBreed", "petDateOfBirth", "veterinarianName"]
} as const satisfies Record<string, readonly KnownProfileFieldKey[]>;

export const DEFAULT_SENSITIVITY_POLICIES = {
  passportNumber: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  driverLicenseNumber: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  nationalIdNumber: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  ssn: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  ssnLast4: { tier: "sensitive", displayMask: "full", clipboard: "confirm", redactInLogs: true },
  taxId: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  itin: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  visaNumber: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  alienRegistrationNumber: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  insuranceMemberId: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  insuranceGroupNumber: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  medicalRecordNumber: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  cardNumber: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  cardSecurityCode: { tier: "critical", displayMask: "full", clipboard: "block", redactInLogs: true },
  bankAccountNumber: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  routingNumber: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true },
  iban: { tier: "critical", displayMask: "last4", clipboard: "block", redactInLogs: true },
  swiftBic: { tier: "sensitive", displayMask: "partial", clipboard: "confirm", redactInLogs: true }
} as const satisfies Partial<Record<KnownProfileFieldKey, SensitiveFieldPolicy>>;
