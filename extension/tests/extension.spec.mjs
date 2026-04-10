import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { test as base, expect, chromium } from "@playwright/test";

const EXTENSION_PATH = path.resolve(process.cwd(), "dist");
const PLAYWRIGHT_CACHE_DIR = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
const SAMPLE_FORM_PATH = path.resolve(process.cwd(), "..", "fixtures", "sample-form.html");

function getCachedPlaywrightExecutables() {
  if (!fs.existsSync(PLAYWRIGHT_CACHE_DIR)) {
    return [];
  }

  return fs
    .readdirSync(PLAYWRIGHT_CACHE_DIR)
    .filter(entry => entry.startsWith("chromium-"))
    .sort()
    .reverse()
    .map(entry =>
      path.join(
        PLAYWRIGHT_CACHE_DIR,
        entry,
        "chrome-mac",
        "Chromium.app",
        "Contents",
        "MacOS",
        "Chromium"
      )
    )
    .filter(candidate => fs.existsSync(candidate));
}

function resolveChromiumExecutable() {
  const executablePath = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    ...getCachedPlaywrightExecutables(),
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ]
    .filter(Boolean)
    .find(candidate => fs.existsSync(candidate));

  if (!executablePath) {
    throw new Error(
      "No Chromium executable found. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE or install Chromium."
    );
  }
  return executablePath;
}

function makeAliasProfile(overrides = {}) {
  return {
    id: "alias-profile",
    label: "Quick Alias",
    category: "custom",
    fields: {
      fullName: "Alex Traveler",
      firstName: "Alex",
      lastName: "Traveler",
      email: "alias@example.com",
      phone: "+1 555 111 2222",
      city: "Brooklyn"
    },
    alias: {
      enabled: true,
      aliasEmail: "alias@example.com",
      generatedAt: "2026-04-08T21:00:00.000Z",
      fields: {
        fullName: "Alex Traveler",
        firstName: "Alex",
        lastName: "Traveler",
        email: "alias@example.com"
      }
    },
    ...overrides
  };
}

const test = base.extend({
  context: async ({}, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "quickfill-playwright-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      executablePath: resolveChromiumExecutable(),
      headless: true,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ]
    });

    try {
      await use(context);
    } finally {
      await context.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  },

  serviceWorker: async ({ context }, use) => {
    const existing = context.serviceWorkers();
    const serviceWorker =
      existing[0] ?? (await context.waitForEvent("serviceworker", { timeout: 15_000 }));
    await use(serviceWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },

  sampleServerUrl: async ({}, use) => {
    const html = fs.readFileSync(SAMPLE_FORM_PATH, "utf8");
    const server = http.createServer((request, response) => {
      if (request.url === "/" || request.url === "/sample-form.html") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(html);
        return;
      }

      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
    });

    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to determine sample server address.");
    }

    try {
      await use(`http://127.0.0.1:${address.port}`);
    } finally {
      if (typeof server.closeAllConnections === "function") {
        server.closeAllConnections();
      }
      await new Promise(resolve => server.close(resolve));
    }
  }
});

async function clearExtensionState(page) {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
  });
}

async function seedExtensionState(page, {
  profiles,
  activeProfileId = null,
  autofillMode = "manual"
}) {
  await page.evaluate(async ({ profiles, autofillMode, activeProfileId }) => {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();

    await chrome.runtime.sendMessage({
      type: "INITIALIZE_VAULT",
      payload: {
        profiles,
        autofillMode
      }
    });

    if (activeProfileId) {
      await chrome.runtime.sendMessage({
        type: "SET_ACTIVE_PROFILE",
        payload: { profileId: activeProfileId }
      });
    }
  }, { profiles, autofillMode, activeProfileId });
}

async function readStoredState(page) {
  return page.evaluate(async () => chrome.storage.local.get(["swiftFillVault", "swiftFillSettings"]));
}

async function openPopup(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`, {
    waitUntil: "domcontentloaded"
  });
  return page;
}

test.describe("QuickFill extension", () => {
  test("shows onboarding when no vault exists", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await clearExtensionState(page);
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Welcome to QuickFill" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Use fake info" })).toBeVisible();
  });

  test("fake-info onboarding saves locally with no password prompt", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await clearExtensionState(page);
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Use fake info" }).click();
    await expect(page.getByRole("heading", { name: "Generated identity" })).toBeVisible();
    await page.getByPlaceholder("throwaway@example.com").fill("burner@example.com");
    await page.getByRole("button", { name: "Save & start filling" }).click();

    await expect(page.getByText("Profiles saved locally. You can start auto-filling forms.")).toBeVisible();
    await expect(page.getByText("Quick Alias")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);

    const storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles).toHaveLength(1);
    expect(storedState.swiftFillVault.profiles[0].label).toBe("Quick Alias");
    expect(storedState.swiftFillVault.profiles[0].alias.enabled).toBe(true);
    expect(storedState.swiftFillVault.profiles[0].alias.aliasEmail).toBe("burner@example.com");
  });

  test("real-info onboarding lets users add custom fields", async ({ context, extensionId, sampleServerUrl }) => {
    const page = await openPopup(context, extensionId);
    await clearExtensionState(page);
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Use my real info" }).click();
    await page.getByPlaceholder("Jane Q. Doe").fill("Femi Builder");
    await page.getByPlaceholder("jane@example.com").fill("femi@example.com");

    const customFieldsSection = page.locator("fieldset").filter({ hasText: "Custom Fields" });
    await customFieldsSection.getByPlaceholder("New field name").fill("Favorite airline");
    await customFieldsSection.getByPlaceholder("Value").fill("Air Peace");
    await customFieldsSection.getByRole("button", { name: "Add", exact: true }).click();

    await page.getByRole("button", { name: "Save & start filling" }).click();
    await expect(page.getByText("Profiles saved locally. You can start auto-filling forms.")).toBeVisible();

    const storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles[0].customFields["Favorite airline"]).toBe("Air Peace");

    const formPage = await context.newPage();
    await formPage.goto(`${sampleServerUrl}/sample-form.html`, {
      waitUntil: "domcontentloaded"
    });
    await formPage.bringToFront();

    await page.evaluate(async () => {
      await chrome.runtime.sendMessage({ type: "TRIGGER_AUTOFILL" });
    });

    await expect(formPage.locator('input[name="favorite_airline"]')).toHaveValue("Air Peace");

    await formPage.close();
  });

  test("renaming an alias profile persists after save and reopen", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await seedExtensionState(page, {
      profiles: [makeAliasProfile()],
      activeProfileId: "alias-profile"
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByText("Quick Alias")).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByLabel("Use alias data")).not.toBeChecked();
    await expect(page.getByText("Alias settings already exist for this profile. Toggle this on only if you want to change them.")).toBeVisible();

    const profileLabelInput = page.getByLabel("Profile label");
    await expect(profileLabelInput).toHaveValue("Quick Alias");
    await profileLabelInput.fill("My Saved Alias");

    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Saved!")).toBeVisible();
    await expect(page.getByRole("button", { name: "My Saved Alias" })).toBeVisible();

    const storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles).toBeTruthy();
    expect(storedState.swiftFillVault.profiles[0].label).toBe("My Saved Alias");
    expect(storedState.swiftFillSettings.activeProfileId).toBe("alias-profile");

    await page.getByRole("button", { name: "Back to controls" }).click();
    await expect(page.getByText("My Saved Alias")).toBeVisible();

    await page.close();

    const reopenedPage = await openPopup(context, extensionId);
    await expect(reopenedPage.getByText("My Saved Alias")).toBeVisible();
  });

  test("profiles remain available after reload without any unlock step", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await seedExtensionState(page, {
      profiles: [makeAliasProfile()],
      activeProfileId: "alias-profile"
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("Quick Alias")).toBeVisible();

    await page.evaluate(async () => {
      await chrome.storage.session.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByText("Quick Alias")).toBeVisible();
  });

  test("main fake-info toggle persists after save and reload", async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await seedExtensionState(page, {
      profiles: [makeAliasProfile()],
      activeProfileId: "alias-profile"
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByText("Using fake info")).toBeVisible();
    await page.getByRole("button", { name: /Using fake info/i }).click();
    await expect(page.getByText("Using your info")).toBeVisible();
    await expect(page.getByText("Profile saved.")).toBeVisible();

    let storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles[0].alias.enabled).toBe(false);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText("Using your info")).toBeVisible();

    await page.getByRole("button", { name: /Using your info/i }).click();
    await expect(page.getByText("Using fake info")).toBeVisible();

    storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles[0].alias.enabled).toBe(true);
  });

  test("custom fields added by the user are saved and autofilled", async ({ context, extensionId, sampleServerUrl }) => {
    const page = await openPopup(context, extensionId);
    await seedExtensionState(page, {
      profiles: [makeAliasProfile()],
      activeProfileId: "alias-profile"
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.getByRole("button", { name: "Edit" }).click();
    const customFieldsSection = page.locator("fieldset").filter({ hasText: "Custom Fields" });
    await customFieldsSection.getByPlaceholder("New field name").fill("Favorite airline");
    await customFieldsSection.getByPlaceholder("Value").fill("Air Peace");
    await customFieldsSection.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: "Save profile" }).click();

    await expect(page.getByText("Saved!")).toBeVisible();

    const storedState = await readStoredState(page);
    expect(storedState.swiftFillVault.profiles[0].customFields.favorite_airline).toBeUndefined();
    expect(storedState.swiftFillVault.profiles[0].customFields["Favorite airline"]).toBe("Air Peace");

    const formPage = await context.newPage();
    await formPage.goto(`${sampleServerUrl}/sample-form.html`, {
      waitUntil: "domcontentloaded"
    });
    await formPage.bringToFront();

    await page.evaluate(async () => {
      await chrome.runtime.sendMessage({ type: "TRIGGER_AUTOFILL" });
    });

    await expect(formPage.locator('input[name="favorite_airline"]')).toHaveValue("Air Peace");

    await formPage.close();
  });

  test("autofills the sample form when triggered from the extension", async ({ context, extensionId, sampleServerUrl }) => {
    const popupPage = await openPopup(context, extensionId);
    await seedExtensionState(popupPage, {
      profiles: [
        makeAliasProfile({
          fields: {
            fullName: "Jordan Pilot",
            firstName: "Jordan",
            lastName: "Pilot",
            email: "jordan@example.com",
            workEmail: "jp@company.test",
            phone: "+1 555 333 4444",
            dateOfBirth: "1988-03-14",
            gender: "Non-binary",
            nationality: "Canadian",
            passportNumber: "P12345678",
            knownTravelerNumber: "998877665",
            addressLine1: "123 Orchard Ave",
            addressLine2: "Unit 5A",
            city: "Toronto",
            state: "Ontario",
            postalCode: "M5V 2T6",
            country: "Canada",
            company: "SkyNorth",
            jobTitle: "Operations Lead"
          },
          alias: {
            enabled: true,
            aliasEmail: "jordan@example.com",
            generatedAt: "2026-04-08T21:00:00.000Z",
            fields: {
              fullName: "Jordan Pilot",
              firstName: "Jordan",
              lastName: "Pilot",
              email: "jordan@example.com",
              workEmail: "jp@company.test",
              phone: "+1 555 333 4444",
              dateOfBirth: "1988-03-14",
              gender: "Non-binary",
              nationality: "Canadian",
              passportNumber: "P12345678",
              knownTravelerNumber: "998877665",
              addressLine1: "123 Orchard Ave",
              addressLine2: "Unit 5A",
              city: "Toronto",
              state: "Ontario",
              postalCode: "M5V 2T6",
              country: "Canada",
              company: "SkyNorth",
              jobTitle: "Operations Lead"
            }
          }
        })
      ],
      activeProfileId: "alias-profile",
      autofillMode: "manual"
    });
    await popupPage.reload({ waitUntil: "domcontentloaded" });
    await expect(popupPage.getByText("Quick Alias")).toBeVisible();

    const formPage = await context.newPage();
    await formPage.goto(`${sampleServerUrl}/sample-form.html`, {
      waitUntil: "domcontentloaded"
    });
    await formPage.bringToFront();

    await popupPage.evaluate(async () => {
      await chrome.runtime.sendMessage({ type: "TRIGGER_AUTOFILL" });
    });

    await expect(formPage.locator('input[name="full_name"]')).toHaveValue("Jordan Pilot");
    await expect(formPage.locator('input[name="first_name"]')).toHaveValue("Jordan");
    await expect(formPage.locator('input[name="last_name"]')).toHaveValue("Pilot");
    await expect(formPage.locator('input[name="emailAddress"]')).toHaveValue("jordan@example.com");
    await expect(formPage.locator('input[name="work_email"]')).toHaveValue("jp@company.test");
    await expect(formPage.locator('input[name="phoneNumber"]')).toHaveValue("+1 555 333 4444");
    await expect(formPage.locator('input[name="dateOfBirth"]')).toHaveValue("1988-03-14");
    await expect(formPage.locator('select[name="gender"]')).toHaveValue("non-binary");
    await expect(formPage.locator('input[name="nationality"]')).toHaveValue("Canadian");
    await expect(formPage.locator('input[name="passportNumber"]')).toHaveValue("P12345678");
    await expect(formPage.locator('input[name="knownTravelerNumber"]')).toHaveValue("998877665");
    await expect(formPage.locator('input[name="addressLine1"]')).toHaveValue("123 Orchard Ave");
    await expect(formPage.locator('input[name="addressLineTwo"]')).toHaveValue("Unit 5A");
    await expect(formPage.locator('input[name="city"]')).toHaveValue("Toronto");
    await expect(formPage.locator('input[name="state"]')).toHaveValue("Ontario");
    await expect(formPage.locator('input[name="postalcode"]')).toHaveValue("M5V 2T6");
    await expect(formPage.locator('input[name="country"]')).toHaveValue("Canada");
    await expect(formPage.locator('input[name="company"]')).toHaveValue("SkyNorth");
    await expect(formPage.locator('input[name="jobtitle"]')).toHaveValue("Operations Lead");

    await popupPage.close();
    await formPage.close();
  });
});
