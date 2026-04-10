import {
  AddressRecord,
  DEFAULT_SENSITIVITY_POLICIES,
  Profile,
  ProfileAliasConfig,
  ProfileFieldKey,
  ProfileFieldMetadataMap
} from "./types";

// ~80 first names → 80 options
const FIRST_NAMES = [
  "Avery","Jordan","Taylor","Riley","Morgan","Harper","Sydney","Elliot","Quinn","Rowan",
  "Cameron","Dakota","Finley","Hayden","Kennedy","Logan","Micah","Parker","Reese","Sawyer",
  "Alex","Blake","Casey","Devon","Emerson","Francis","Gray","Harley","Indigo","Jules",
  "Kai","Lane","Marley","Noel","Oakley","Peyton","Ray","Sage","Tatum","Val",
  "Wren","Arden","Brooks","Charlie","Drew","Eden","Flynn","Glenn","Hollis","Ira",
  "Jesse","Kit","Linden","Monroe","Nico","Onyx","Phoenix","Remy","Shay","Toby",
  "Uri","Winter","Zane","Aspen","Briar","Corin","Darcy","Ellis","Frankie","Greer",
  "Haven","Ivory","Jude","Kira","Lennox","Marlo","Nyx","Orion","Piper","Raven"
];

// ~60 middle names
const MIDDLE_NAMES = [
  "June","Kai","Sage","Reese","Blair","Skye","Lane","Faye","Vale","Drew",
  "Wynn","Reed","Sloan","Tate","Neve","Cole","Ash","Dell","Lux","Rue",
  "Beau","Ames","Fern","Hart","Lyric","Rain","West","Cove","Pax","Sol",
  "Lark","Shea","Cruz","Bryn","Jace","Zion","Rhys","Maren","Elin","Thea",
  "Nova","Rune","Opal","Pearl","Stone","Creek","Ridge","Storm","Jade","Ember",
  "Flint","Hawk","Cliff","Dale","Glen","Brook","Marsh","Frost","Heath","Dawn"
];

// ~80 last names
const LAST_NAMES = [
  "Hayes","Sterling","Calloway","Bennett","Ellison","Monroe","Ashford","Winslow","Kensington","Harlow",
  "Thornton","Whitfield","Prescott","Langley","Blackwell","Stratton","Carmichael","Fairbanks","Holloway","Beaumont",
  "Mercer","Aldridge","Pemberton","Sinclair","Lockwood","Whitmore","Davenport","Cromwell","Hartwell","Beauregard",
  "Sutherland","Kingsley","Crawford","Sheffield","Donovan","Ashworth","Blanchard","Covington","Drummond","Emsworth",
  "Gallagher","Harcourt","Jennings","Lancaster","Montague","Northcott","Pembroke","Ravenscroft","Stanhope","Townsend",
  "Underwood","Vandermeer","Wakefield","Yarborough","Abernathy","Breckenridge","Chandler","Dalrymple","Endicott","Foxworth",
  "Greenfield","Hawthorne","Ironwood","Jeffries","Kingsland","Livingston","Mayfield","Netherton","Osbourne","Pendleton",
  "Roswell","Stanwick","Treadwell","Vickers","Westbrook","Yarrow","Ashton","Bridgewater","Carrington","Dunmore"
];

// ~40 street names
const STREET_NAMES = [
  "Maple","Cedar","Lakeview","Silver","Sunset","Oak","Pinecrest","Hilltop","Ridgeview","Evergreen",
  "Birch","Aspen","Magnolia","Willow","Cherry","Cypress","Elm","Laurel","Hawthorn","Juniper",
  "Sycamore","Spruce","Chestnut","Redwood","Hickory","Alder","Poplar","Walnut","Hemlock","Dogwood",
  "Foxglove","Ironwood","Briarwood","Cloverfield","Stonebrook","Windmill","Millstone","Cobblestone","Ferndale","Rosewood"
];

const STREET_SUFFIXES = ["Dr","Ave","St","Ln","Way","Terrace","Court","Place","Blvd","Circle","Loop","Trail","Ridge","Path","Run","Crossing"];

// ~40 cities
const CITIES = [
  "Fairview","Brookstone","Riverdale","Crescent City","Northfield","Lakeside","Kingsport","Harborview","Meadowbrook","Grand Harbor",
  "Clearwater","Maplewood","Stonebridge","Greenfield","Silverton","Oakdale","Willowdale","Cedarville","Bridgeport","Foxborough",
  "Hawthorne","Millbrook","Pinehurst","Ridgewood","Sunnyvale","Thornbury","Westfield","Ashland","Bellmont","Castleton",
  "Dunmore","Easton","Fernwood","Glendale","Hillcrest","Ironside","Jamestown","Kenmore","Lexington","Monterey"
];

const STATES = [
  "CA","NY","WA","TX","CO","IL","VA","MA","OR","GA",
  "FL","OH","PA","NC","MI","AZ","MN","NJ","WI","MD",
  "TN","IN","MO","SC","CT","NV","UT","KY","AL","LA"
];

const COUNTRIES = [
  "United States","Canada","United Kingdom","Australia","New Zealand",
  "Ireland","Germany","Netherlands","Sweden","Denmark","Norway","Switzerland"
];

// ~50 companies
const COMPANIES = [
  "Nimbus Labs","Everbright Studio","North Coast Ventures","Deep Leaf Collective","Georgia Street Partners",
  "Signal & Co.","Marbleline Industries","Cobalt Research Group","Blue Mesa Works","Ironclad Systems",
  "Apex Dynamics","Bright Harbor Inc","Cascade Digital","Driftwood Media","Ember Analytics",
  "Falcon Ridge Corp","Greenline Solutions","Horizon Forge","Inlet Technologies","Jade Mountain LLC",
  "Keystone Innovations","Lunar Arc Studios","Meridian Works","Noble Creek Partners","Osprey Ventures",
  "Pinecone Labs","Quarry & Stone","Redshift Networks","Summit Path Group","Tidal Wave Systems",
  "Upland Digital","Vertex Point","Waystone Consulting","Xenith Corp","Yellowstone Analytics",
  "Zephyr Dynamics","Aether Solutions","Basecamp Industries","Cirrus Engineering","Delta Spark",
  "Echo Valley Labs","Fjord Design","Granite Peak Co","Helix Strategies","Indigo Wave",
  "Jetstream Media","Kinetic Studios","Lighthouse Data","Mosaic Ventures","Nexus Bridge"
];

// ~50 job titles
const JOB_TITLES = [
  "Product Strategist","Community Manager","Customer Advocate","Lifecycle Marketer","Research Analyst",
  "Solutions Designer","Support Lead","Technical Writer","Operations Specialist","Growth Consultant",
  "Data Analyst","Software Engineer","UX Researcher","Content Strategist","Business Analyst",
  "Project Coordinator","Marketing Associate","Account Executive","Quality Analyst","DevOps Engineer",
  "Frontend Developer","Backend Developer","Full Stack Engineer","Systems Architect","Security Analyst",
  "Product Manager","Design Lead","Engineering Manager","Scrum Master","QA Engineer",
  "Customer Success Manager","Sales Engineer","Integration Specialist","Platform Engineer","Cloud Architect",
  "Mobile Developer","AI Researcher","Machine Learning Engineer","Data Scientist","Analytics Lead",
  "Brand Strategist","Creative Director","Media Buyer","SEO Specialist","Compliance Officer",
  "HR Coordinator","Recruiter","Finance Analyst","Legal Counsel","Supply Chain Analyst"
];

// ~30 email domains for generating realistic usernames
const EMAIL_SEPARATORS = ["",".","-","_"];

const ALIAS_ENABLED_FIELDS: ProfileFieldKey[] = [
  "fullName","firstName","middleName","lastName","phone",
  "addressLine1","addressLine2","city","state","postalCode",
  "country","homeAddressLine1","homeAddressLine2","homeCity","homeState","homePostalCode","homeCountry",
  "shippingAddressLine1","shippingAddressLine2","shippingCity","shippingState","shippingPostalCode","shippingCountry",
  "company","jobTitle","nationality"
];

function buildAliasMetadata(fields: Partial<Record<ProfileFieldKey, string>>): ProfileFieldMetadataMap {
  const metadata: ProfileFieldMetadataMap = {};

  Object.keys(fields).forEach(key => {
    const fieldKey = key as ProfileFieldKey;
    const sensitivity = DEFAULT_SENSITIVITY_POLICIES[key as keyof typeof DEFAULT_SENSITIVITY_POLICIES];
    if (sensitivity) {
      metadata[fieldKey] = { sensitivity, sourceEntityType: "field" };
    }
  });

  return metadata;
}

function randomPick<T>(list: readonly T[]): T {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return list[buffer[0] % list.length];
}

function randomNumber(min: number, max: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const range = max - min + 1;
  return min + (buffer[0] % range);
}

function randomZip(): string {
  return `${randomNumber(10000, 99999)}`;
}

function randomPhone(): string {
  return `${randomNumber(200, 989)}-${randomNumber(200, 989)}-${randomNumber(1000, 9999)}`;
}

function randomAddress(): { line1: string; line2: string } {
  const houseNumber = randomNumber(1, 29999);
  const street = randomPick(STREET_NAMES);
  const suffix = randomPick(STREET_SUFFIXES);
  const hasUnit = randomNumber(1, 3) !== 1; // 66% chance of unit
  const unit = hasUnit ? `Apt ${randomNumber(1, 999)}` : `Suite ${randomNumber(100, 9999)}`;
  return {
    line1: `${houseNumber} ${street} ${suffix}`,
    line2: unit
  };
}

// Date of birth: random age between 21-65
function randomDOB(): string {
  const year = new Date().getFullYear() - randomNumber(21, 65);
  const month = randomNumber(1, 12);
  const day = randomNumber(1, 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Uniqueness calculation:
 * First names: 80
 * Middle names: 60
 * Last names: 80
 * = 384,000 name combos
 *
 * House numbers: 29,999
 * Streets: 40
 * Suffixes: 16
 * Units: ~10,898
 * = ~209 billion address combos
 *
 * Phone: 790 × 790 × 9,000 = ~5.6 billion
 * ZIP: 90,000
 * City: 40 × State: 30 = 1,200
 * Company: 50 × Job: 50 = 2,500
 * DOB: ~16,380
 *
 * Total unique identities:
 * 384,000 × 209B × 5.6B × 90,000 × 1,200 × 2,500 × 16,380
 * ≈ 1.7 × 10^40 (way more than 900 billion)
 */
export function generateAliasFields(): Partial<Record<ProfileFieldKey, string>> {
  const firstName = randomPick(FIRST_NAMES);
  const middleName = randomPick(MIDDLE_NAMES);
  const lastName = randomPick(LAST_NAMES);

  const address = randomAddress();
  const city = randomPick(CITIES);
  const state = randomPick(STATES);
  const country = randomPick(COUNTRIES);
  const postalCode = randomZip();

  const aliasFields: Partial<Record<ProfileFieldKey, string>> = {
    firstName,
    middleName,
    lastName,
    fullName: `${firstName} ${middleName} ${lastName}`,
    phone: randomPhone(),
    addressLine1: address.line1,
    addressLine2: address.line2,
    city,
    state,
    postalCode,
    country,
    homeAddressLine1: address.line1,
    homeAddressLine2: address.line2,
    homeCity: city,
    homeState: state,
    homePostalCode: postalCode,
    homeCountry: country,
    shippingAddressLine1: address.line1,
    shippingAddressLine2: address.line2,
    shippingCity: city,
    shippingState: state,
    shippingPostalCode: postalCode,
    shippingCountry: country,
    company: randomPick(COMPANIES),
    jobTitle: randomPick(JOB_TITLES),
    nationality: country,
    dateOfBirth: randomDOB(),
    gender: randomPick(["Male", "Female", "Non-binary", "Prefer not to say"]),
  };

  return aliasFields;
}

export function applyAlias(profile: Profile): Profile {
  if (!profile.alias?.enabled) {
    return profile;
  }

  const aliasFields = profile.alias.fields ?? {};
  const overlay: Partial<Record<ProfileFieldKey, string>> = {};

  for (const key of ALIAS_ENABLED_FIELDS) {
    if (aliasFields[key]) {
      overlay[key] = aliasFields[key];
    }
  }

  if (profile.alias.aliasEmail) {
    overlay.email = profile.alias.aliasEmail;
  }

  // Build final fields: start with alias overlay, then fill in any
  // non-sensitive keys from the real profile that alias doesn't cover.
  // Crucially, if alias is active and no alias email was provided,
  // strip the real email so it never leaks into fake-info fills.
  const merged = { ...profile.fields, ...overlay };
  if (!profile.alias.aliasEmail) {
    delete merged.email;
    delete merged.secondaryEmail;
    delete merged.workEmail;
  }

  return {
    ...profile,
    fields: merged,
    fieldMetadata: {
      ...profile.fieldMetadata,
      ...buildAliasMetadata(overlay)
    }
  };
}

export function updateAliasConfig(existing: ProfileAliasConfig | undefined): ProfileAliasConfig {
  const generatedFields = generateAliasFields();
  const addressRecord: AddressRecord = {
    id: "alias-home",
    label: "Alias home",
    kind: "home",
    line1: generatedFields.homeAddressLine1 ?? generatedFields.addressLine1 ?? "",
    line2: generatedFields.homeAddressLine2 ?? generatedFields.addressLine2,
    city: generatedFields.homeCity ?? generatedFields.city ?? "",
    state: generatedFields.homeState ?? generatedFields.state,
    postalCode: generatedFields.homePostalCode ?? generatedFields.postalCode,
    country: generatedFields.homeCountry ?? generatedFields.country,
    isPrimary: true
  };

  return {
    enabled: true,
    aliasEmail: existing?.aliasEmail,
    generatedAt: new Date().toISOString(),
    fields: generatedFields,
    fieldMetadata: buildAliasMetadata(generatedFields),
    collections: {
      addresses: [addressRecord]
    }
  };
}

export function clearAliasConfig(): ProfileAliasConfig {
  return {
    enabled: false,
    aliasEmail: undefined,
    generatedAt: undefined,
    fields: {}
  };
}
