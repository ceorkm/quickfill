import type { Profile, ProfileFieldKey } from "./types";

/**
 * Map of profile field keys → common HTML attribute substrings (name, id,
 * placeholder, aria-label, data-* values, associated <label> text) used to
 * match form elements to the correct autofill value.
 */
const FIELD_HINTS: Record<string, readonly string[]> = {
  // Identity
  fullName: ["fullname", "full_name", "yourname", "your_name", "legalname"],
  preferredName: ["preferredname", "preferred_name", "displayname", "display_name"],
  firstName: ["firstname", "givenname", "forename", "first_name", "fname", "given_name"],
  middleName: ["middlename", "middle_name", "mname"],
  lastName: ["lastname", "surname", "familyname", "last_name", "lname", "family_name"],
  namePrefix: ["prefix", "salutation", "title", "honorific"],
  nameSuffix: ["suffix", "namesuffix"],
  nickname: ["nickname", "nick_name", "alias"],
  dateOfBirth: ["dob", "dateofbirth", "birthdate", "birthday", "birth_date", "date_of_birth"],
  placeOfBirth: ["placeofbirth", "birthplace", "birth_place"],
  gender: ["gender", "sex"],
  pronouns: ["pronouns", "pronoun"],
  maritalStatus: ["maritalstatus", "marital_status"],
  nationality: ["nationality", "citizenship"],
  citizenshipCountry: ["citizenshipcountry", "countryofcitizenship"],

  // Government IDs
  passportNumber: ["passport", "passportnumber", "passportno", "passport_number"],
  passportCountry: ["passportcountry", "issuingcountry", "passport_country"],
  passportIssueDate: ["passportissue", "passportissuedate"],
  passportExpiryDate: ["passportexpiry", "passportexpirydate", "passportexpiration"],
  driverLicenseNumber: ["driverlicense", "driverslicense", "licensenumber", "dlnumber", "driver_license"],
  driverLicenseState: ["licensestate", "dlstate"],
  nationalIdNumber: ["nationalid", "national_id"],
  ssn: ["ssn", "socialsecurity", "social_security"],
  ssnLast4: ["ssnlast4", "last4ssn", "ssn4"],
  taxId: ["taxid", "tax_id", "tin", "taxpayerid"],
  itin: ["itin"],
  visaNumber: ["visanumber", "visa_number"],
  visaType: ["visatype", "visa_type"],
  alienRegistrationNumber: ["alienregistration", "alien_registration", "aregnumber"],
  knownTravelerNumber: ["ktn", "knowntravelernumber", "fastpass", "trustedtraveler", "known_traveler"],
  redressNumber: ["redressnumber", "redress"],
  studentId: ["studentid", "student_id"],

  // Contact
  email: ["email", "emailaddress", "e-mail", "e_mail"],
  secondaryEmail: ["alternateemail", "backupemail", "secondary_email", "email2"],
  workEmail: ["workemail", "work_email", "businessemail", "corporate_email"],
  phone: ["phone", "phonenumber", "mobile", "tel", "telephone", "phone_number"],
  secondaryPhone: ["secondaryphone", "altphone", "phone2", "secondary_phone"],
  mobilePhone: ["mobilephone", "cellphone", "cell", "mobile_phone"],
  workPhone: ["workphone", "officephone", "businessphone", "work_phone"],
  homePhone: ["homephone", "home_phone"],
  fax: ["fax", "faxnumber"],
  website: ["website", "url", "homepage", "personalsite", "web_site"],
  linkedinUrl: ["linkedin", "linkedinurl", "linkedin_url"],
  githubUrl: ["github", "githuburl", "github_url"],
  portfolioUrl: ["portfolio", "portfoliourl", "portfolio_url"],
  twitterHandle: ["twitter", "twitterhandle", "xhandle", "twitter_handle"],
  instagramHandle: ["instagram", "instagramhandle", "instagram_handle"],
  tiktokHandle: ["tiktok", "tiktokhandle"],
  facebookProfile: ["facebook", "facebookprofile"],

  // Legacy address (generic)
  addressLine1: ["address1", "addressline1", "street", "streetaddress", "addresslineone", "address_line_1", "street_address"],
  addressLine2: ["address2", "addressline2", "addresslinetwo", "apt", "unit", "suite", "address_line_2"],
  city: ["city", "town", "locality"],
  state: ["state", "province", "region", "county"],
  postalCode: ["zipcode", "zip", "postal", "postalcode", "postcode", "postal_code", "zip_code"],
  country: ["country", "nation", "countrycode", "country_code"],

  // Home address
  homeAddressLine1: ["homeaddress1", "homestreet", "home_address_line_1"],
  homeAddressLine2: ["homeaddress2", "home_address_line_2"],
  homeCity: ["homecity", "home_city"],
  homeState: ["homestate", "home_state"],
  homePostalCode: ["homezip", "homepostalcode", "home_postal_code"],
  homeCountry: ["homecountry", "home_country"],

  // Work address
  workAddressLine1: ["workaddress1", "officeaddress", "work_address_line_1"],
  workAddressLine2: ["workaddress2", "work_address_line_2"],
  workCity: ["workcity", "work_city"],
  workState: ["workstate", "work_state"],
  workPostalCode: ["workzip", "work_postal_code"],
  workCountry: ["workcountry", "work_country"],

  // Billing address
  billingAddressLine1: ["billingaddress1", "billingstreet", "billing_address_line_1", "billaddr1"],
  billingAddressLine2: ["billingaddress2", "billing_address_line_2", "billaddr2"],
  billingCity: ["billingcity", "billing_city", "billcity"],
  billingState: ["billingstate", "billing_state", "billstate"],
  billingPostalCode: ["billingzip", "billingpostalcode", "billing_postal_code", "billzip"],
  billingCountry: ["billingcountry", "billing_country", "billcountry"],

  // Shipping address
  shippingAddressLine1: ["shippingaddress1", "shippingstreet", "shipping_address_line_1", "shipaddr1"],
  shippingAddressLine2: ["shippingaddress2", "shipping_address_line_2", "shipaddr2"],
  shippingCity: ["shippingcity", "shipping_city", "shipcity"],
  shippingState: ["shippingstate", "shipping_state", "shipstate"],
  shippingPostalCode: ["shippingzip", "shippingpostalcode", "shipping_postal_code", "shipzip"],
  shippingCountry: ["shippingcountry", "shipping_country", "shipcountry"],

  // Employment
  company: ["company", "employer", "organization", "organisation", "companyname", "company_name"],
  companyWebsite: ["companywebsite", "companyurl", "company_website"],
  jobTitle: ["jobtitle", "title", "role", "position", "job_title"],
  department: ["department", "dept"],
  employmentStatus: ["employmentstatus", "employment_status"],
  workAuthorization: ["workauthorization", "work_authorization", "workauth"],
  yearsOfExperience: ["yearsofexperience", "experience", "years_of_experience"],
  annualIncome: ["annualincome", "yearlyincome", "annual_income", "salary"],
  monthlyIncome: ["monthlyincome", "monthly_income"],
  businessName: ["businessname", "business_name", "dba"],
  businessType: ["businesstype", "business_type", "entitytype"],

  // Education
  schoolName: ["school", "schoolname", "university", "college", "institution", "school_name"],
  degree: ["degree", "degreetype", "degree_type"],
  major: ["major", "fieldofstudy", "field_of_study"],
  graduationDate: ["graduationdate", "graddate", "graduation_date"],

  // Travel
  frequentFlyerNumber: ["frequentflyer", "ffn", "frequent_flyer", "loyaltynumber"],
  hotelLoyaltyNumber: ["hotelloyalty", "hotel_loyalty"],
  seatPreference: ["seatpreference", "seat_preference"],
  mealPreference: ["mealpreference", "meal_preference", "dietaryrestriction", "dietary"],

  // Payment
  cardholderName: ["cardholdername", "cardholder_name", "ccname"],
  nameOnCard: ["nameoncard", "name_on_card"],
  cardNumber: ["cardnumber", "ccnumber", "card_number", "creditcard", "credit_card", "ccnum"],
  cardExpiryMonth: ["expirymonth", "expmonth", "ccexpmonth", "cc_exp_month"],
  cardExpiryYear: ["expiryyear", "expyear", "ccexpyear", "cc_exp_year"],
  cardExpiryDate: ["expirydate", "expdate", "ccexp", "cc_exp"],
  cardSecurityCode: ["cvv", "cvc", "securitycode", "cvv2", "csc", "security_code"],
  bankAccountNumber: ["accountnumber", "bankaccount", "bank_account", "acctnum"],
  routingNumber: ["routingnumber", "routing_number", "aba"],
  iban: ["iban"],
  swiftBic: ["swift", "bic", "swiftbic", "swift_bic"],

  // Medical / Insurance
  insuranceProvider: ["insuranceprovider", "insurance_provider", "insurer"],
  insuranceMemberId: ["insurancememberid", "memberid", "insurance_member_id", "subscriberId"],
  insuranceGroupNumber: ["groupnumber", "group_number", "insurancegroup"],
  bloodType: ["bloodtype", "blood_type"],
  allergies: ["allergies", "allergy"],
  currentMedications: ["medications", "currentmedications", "current_medications"],
  emergencyContactName: ["emergencycontactname", "emergency_contact_name", "emergencyname", "icename"],
  emergencyContactPhone: ["emergencycontactphone", "emergency_contact_phone", "emergencyphone", "icephone"],
  emergencyContactRelationship: ["emergencyrelationship", "emergency_relationship", "icerelationship"],

  // Household
  spouseName: ["spousename", "spouse_name", "partnername"],
  dependentCount: ["dependents", "dependentcount", "numberofdependents"],
  householdIncome: ["householdincome", "household_income"],

  // Applications
  resumeUrl: ["resumeurl", "resume_url", "cvurl"],
  landlordName: ["landlordname", "landlord_name"],
  landlordPhone: ["landlordphone", "landlord_phone"],

  // Vehicle
  vehicleMake: ["vehiclemake", "carmake", "vehicle_make"],
  vehicleModel: ["vehiclemodel", "carmodel", "vehicle_model"],
  vehicleYear: ["vehicleyear", "caryear", "vehicle_year"],
  licensePlate: ["licenseplate", "license_plate", "platenum"],

  // Pet
  petName: ["petname", "pet_name"],
  petBreed: ["petbreed", "pet_breed", "breed"],
};

const OBSERVER_CONFIG: MutationObserverInit = { childList: true, subtree: true };

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function collectSignals(element: Element): string[] {
  const raw: string[] = [];

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    raw.push(element.name, element.id, element.placeholder, element.getAttribute("aria-label") ?? "");
    raw.push(element.getAttribute("autocomplete") ?? "");
  }

  const labelText = findLabelText(element);
  if (labelText) raw.push(labelText);

  const dataValues = Object.values((element as HTMLElement).dataset ?? {});
  raw.push(...(dataValues as string[]));

  return raw.map(normalize).filter(Boolean);
}

function findLabelText(element: Element): string | null {
  if ((element as HTMLElement).id) {
    const label = document.querySelector(`label[for="${CSS.escape((element as HTMLElement).id)}"]`);
    if (label?.textContent) return label.textContent;
  }

  let el: Element | null = element;
  while (el) {
    if (el.tagName.toLowerCase() === "label" && el.textContent) return el.textContent;
    el = el.parentElement;
  }

  return null;
}

function detectFieldKey(element: Element): ProfileFieldKey | null {
  const signals = collectSignals(element);

  // Check autocomplete attribute first (most reliable)
  const autocomplete = (element.getAttribute("autocomplete") ?? "").toLowerCase().trim();
  const autocompleteMap: Record<string, ProfileFieldKey> = {
    "name": "fullName",
    "given-name": "firstName",
    "additional-name": "middleName",
    "family-name": "lastName",
    "honorific-prefix": "namePrefix",
    "honorific-suffix": "nameSuffix",
    "nickname": "nickname",
    "email": "email",
    "tel": "phone",
    "tel-national": "phone",
    "street-address": "addressLine1",
    "address-line1": "addressLine1",
    "address-line2": "addressLine2",
    "address-level2": "city",
    "address-level1": "state",
    "postal-code": "postalCode",
    "country": "country",
    "country-name": "country",
    "bday": "dateOfBirth",
    "sex": "gender",
    "organization": "company",
    "organization-title": "jobTitle",
    "cc-name": "cardholderName",
    "cc-number": "cardNumber",
    "cc-exp": "cardExpiryDate",
    "cc-exp-month": "cardExpiryMonth",
    "cc-exp-year": "cardExpiryYear",
    "cc-csc": "cardSecurityCode",
  };

  if (autocomplete && autocompleteMap[autocomplete]) {
    return autocompleteMap[autocomplete];
  }

  // Fall back to hint matching, preferring the most specific matching hint.
  let bestMatch: { fieldKey: ProfileFieldKey; score: number } | null = null;
  for (const [fieldKey, hints] of Object.entries(FIELD_HINTS)) {
    for (const hint of hints) {
      if (signals.some(sig => sig.includes(hint))) {
        const score = hint.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { fieldKey: fieldKey as ProfileFieldKey, score };
        }
      }
    }
  }

  return bestMatch?.fieldKey ?? null;
}

function setFieldValue(element: Element, value: string): void {
  if (!value) return;

  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (type === "checkbox" || type === "radio") {
      const normalValue = normalize(value);
      element.checked = normalize(element.value) === normalValue;
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    if (type !== "password" && type !== "hidden" && type !== "file") {
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return;
  }

  if (element instanceof HTMLTextAreaElement) {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (element instanceof HTMLSelectElement) {
    const normalValue = normalize(value);
    const match = Array.from(element.options).find(
      opt => normalize(opt.value) === normalValue || normalize(opt.textContent) === normalValue
    );
    if (match) {
      element.value = match.value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

function isEligible(element: Element): boolean {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (["password", "hidden", "file"].includes(type)) return false;
  }
  return true;
}

function tryMatchCustomKey(signals: string[], fieldKey: string): boolean {
  const normalKey = normalize(fieldKey);
  if (!normalKey) return false;
  return signals.some(sig => sig.includes(normalKey) || normalKey.includes(sig));
}

function fillForm(profile: Profile): void {
  const fields = {
    ...(profile.fields ?? {}),
    ...(profile.customFields ?? {})
  };
  if (!fields) return;

  // Collect all field keys that aren't in FIELD_HINTS (user-added custom fields).
  // Prefer the explicit custom field bag so older saved profiles still work even
  // if those keys were never merged into `fields`.
  const customKeys = Array.from(
    new Set([
      ...Object.keys(profile.customFields ?? {}),
      ...Object.keys(fields).filter(k => !(k in FIELD_HINTS))
    ])
  );

  document.querySelectorAll("input, textarea, select").forEach(element => {
    if (!isEligible(element)) return;
    if ((element as HTMLInputElement).value) return; // already has a value

    // Try known field matching first
    const fieldKey = detectFieldKey(element);
    if (fieldKey) {
      const value = fields[fieldKey];
      if (value) {
        setFieldValue(element, value);
        return;
      }
    }

    // Try custom field matching — match the custom key name against form signals
    const signals = collectSignals(element);
    for (const ck of customKeys) {
      if (tryMatchCustomKey(signals, ck)) {
        const value = fields[ck];
        if (value) {
          setFieldValue(element, value);
          return;
        }
      }
    }
  });
}

// --- Lifecycle ---

let currentProfile: Profile | null = null;

const observer = new MutationObserver(() => {
  if (currentProfile) fillForm(currentProfile);
});

function onContentReady(): void {
  chrome.runtime.sendMessage({ type: "CONTENT_READY" }, (response: any) => {
    const directive = response?.fillDirective;
    if (directive?.shouldFill && directive.profile) {
      currentProfile = directive.profile;
      fillForm(directive.profile);
      if (document.body) observer.observe(document.body, OBSERVER_CONFIG);
    }
  });
}

chrome.runtime.onMessage.addListener((message: any) => {
  if (message?.type === "APPLY_PROFILE" && message.payload?.profile) {
    currentProfile = message.payload.profile;
    fillForm(currentProfile!);
    if (document.body) observer.observe(document.body, OBSERVER_CONFIG);
  }
});

if (document.readyState === "complete" || document.readyState === "interactive") {
  onContentReady();
} else {
  window.addEventListener("DOMContentLoaded", onContentReady, { once: true });
}
