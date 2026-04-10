import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(process.cwd());
const DIST_PATH = path.join(ROOT, "dist");
const OUTPUT_DIR = path.join(ROOT, "store-assets", "raw");
const SAMPLE_FORM_PATH = path.resolve(ROOT, "..", "fixtures", "sample-form.html");
const PLAYWRIGHT_CACHE_DIR = path.join(os.homedir(), "Library", "Caches", "ms-playwright");

function getCachedPlaywrightExecutables() {
  if (!fs.existsSync(PLAYWRIGHT_CACHE_DIR)) return [];
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
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ]
    .filter(Boolean)
    .find(candidate => fs.existsSync(candidate));

  if (!executablePath) {
    throw new Error("No Chromium executable found for store screenshot capture.");
  }
  return executablePath;
}

function makeProfile(fields, aliasEnabled = false) {
  return {
    id: "store-profile",
    label: aliasEnabled ? "Quick Alias" : "Travel Profile",
    category: "custom",
    fields,
    alias: aliasEnabled
      ? {
          enabled: true,
          aliasEmail: fields.email,
          generatedAt: "2026-04-09T12:00:00.000Z",
          fields
        }
      : undefined
  };
}

async function openPopup(context, extensionId) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 400, height: 580 });
  await page.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: "domcontentloaded" });
  return page;
}

async function seedState(page, { profiles, activeProfileId, autofillMode = "manual" }) {
  const timestamp = "2026-04-09T12:00:00.000Z";
  await page.evaluate(
    async ({ vault, settings }) => {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();
      await chrome.storage.local.set({
        swiftFillVault: vault,
        swiftFillSettings: settings
      });
    },
    {
      vault: {
        version: 1,
        profiles,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      settings: {
        activeProfileId,
        autofillMode,
        biometric: { enabled: false }
      }
    }
  );
}

async function startServer() {
  const html = fs.readFileSync(SAMPLE_FORM_PATH, "utf8");
  const server = http.createServer((req, res) => {
    if (req.url === "/" || req.url === "/sample-form.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to get HTTP server address.");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      if (typeof server.closeAllConnections === "function") server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  };
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "quickfill-store-shots-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    executablePath: resolveChromiumExecutable(),
    headless: true,
    args: [`--disable-extensions-except=${DIST_PATH}`, `--load-extension=${DIST_PATH}`]
  });

  const serviceWorker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker", { timeout: 15000 }));
  const extensionId = new URL(serviceWorker.url()).host;
  const server = await startServer();

  try {
    const profileFields = {
      fullName: "Lamin Quick",
      firstName: "Lamin",
      lastName: "Quick",
      email: "hello@quickfill.app",
      workEmail: "team@quickfill.app",
      phone: "+1 555 010 2026",
      dateOfBirth: "1995-07-01",
      gender: "Prefer not to say",
      nationality: "Nigerian",
      passportNumber: "A10992881",
      knownTravelerNumber: "990188221",
      addressLine1: "42 Orchard Lane",
      addressLine2: "Suite 8",
      city: "Brooklyn",
      state: "New York",
      postalCode: "11201",
      country: "United States",
      company: "Quickfill",
      jobTitle: "Founder"
    };

    const popupPage = await openPopup(context, extensionId);
    await seedState(popupPage, {
      profiles: [makeProfile(profileFields, true)],
      activeProfileId: "store-profile",
      autofillMode: "manual"
    });
    await popupPage.reload({ waitUntil: "domcontentloaded" });
    await popupPage.screenshot({ path: path.join(OUTPUT_DIR, "popup-controls.png") });

    await popupPage.getByRole("button", { name: "Edit" }).click();
    await popupPage.getByRole("button", { name: "IDENTITY" }).click();
    await popupPage.getByRole("button", { name: "CONTACT" }).click();
    await popupPage.screenshot({ path: path.join(OUTPUT_DIR, "profile-editor.png") });
    await popupPage.close();

    const onboardingPage = await openPopup(context, extensionId);
    await onboardingPage.evaluate(async () => {
      await chrome.storage.local.clear();
      await chrome.storage.session.clear();
    });
    await onboardingPage.reload({ waitUntil: "domcontentloaded" });
    await onboardingPage.screenshot({ path: path.join(OUTPUT_DIR, "onboarding.png") });
    await onboardingPage.close();
  } finally {
    await server.close();
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
