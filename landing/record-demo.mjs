/**
 * Record a demo video of QuickFill auto-filling a form.
 * Produces landing/assets/demo.webm
 *
 * Approach: complete onboarding, load test form, then drive the fill
 * directly from the background service worker (via serviceWorker.evaluate)
 * since we can't click the real extension icon in Playwright.
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const EXT = path.resolve("extension/dist");
const OUT_DIR = path.resolve("landing/assets");
const VIDEO_DIR = path.resolve("landing/.video-tmp");
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const VIEW_W = 1280;
const VIEW_H = 720;

async function main() {
  console.log("Launching Chromium with extension...");

  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      "--no-first-run",
      "--disable-default-apps",
      `--window-size=${VIEW_W},${VIEW_H}`,
    ],
    viewport: { width: VIEW_W, height: VIEW_H },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: VIEW_W, height: VIEW_H },
    },
  });

  // Get extension service worker
  let sw;
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    sw = ctx.serviceWorkers().find(w => w.url().includes("chrome-extension://"));
    if (sw) break;
    await new Promise(r => setTimeout(r, 200));
  }
  if (!sw) throw new Error("Extension service worker not found");
  const extId = new URL(sw.url()).hostname;
  console.log("Extension ID:", extId);

  // --- STEP 1: Complete onboarding via the popup ---
  console.log("Onboarding...");
  const setupPage = await ctx.newPage();
  await setupPage.goto(`chrome-extension://${extId}/popup.html`, { waitUntil: "networkidle" });
  await setupPage.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
  // Use REAL info with recognizable sample data
  await setupPage.click('text="Use my real info"');
  await setupPage.waitForSelector('text="Your info"', { timeout: 5000 });

  const sample = {
    'Jane Q. Doe': 'Jordan Blake',         // fullName
    'jane@example.com': 'jordan@blake.io', // email
    '+1 555-123-4567': '+1 415-555-0198',  // phone
    '1990-04-28': '1992-07-15',            // dob
    'Female': 'Non-binary',                // gender
    '123 Main St': '2200 Mission St',      // address
    'Apt 4B': 'Suite 410',                 // address2
    'Acme Corp': 'Parallax Studio',        // company
    'Product Manager': 'Design Lead',      // job
    'K1234567': 'P8827431',                // passport
    '123456789': 'KTN44827',               // ktn
    'American': 'Canadian',                // nationality
  };
  for (const [ph, val] of Object.entries(sample)) {
    const inp = setupPage.locator(`input[placeholder="${ph}"]`).first();
    if (await inp.isVisible().catch(() => false)) await inp.fill(val);
  }
  // Also need to fill fields without placeholders (grid halves)
  // Fill first/middle/last name by querying by label text
  const nameFields = [
    ['First name', 'Jordan'],
    ['Middle name', 'R.'],
    ['Last name', 'Blake'],
    ['City', 'San Francisco'],
    ['State / Province', 'CA'],
    ['ZIP / Postal code', '94110'],
    ['Country', 'USA'],
  ];
  for (const [label, val] of nameFields) {
    const inp = setupPage.locator(`label:has-text("${label}") >> input`).first();
    if (await inp.isVisible().catch(() => false)) await inp.fill(val);
  }

  await setupPage.click('text="Save & start filling"');
  await setupPage.waitForSelector('text="Fill this page"', { timeout: 8000 });
  await setupPage.close();

  // --- STEP 2: Open the test form — this becomes the recording subject ---
  console.log("Loading test form...");
  const formPath = "file://" + path.resolve("test-form.html");
  const page = await ctx.newPage();
  await page.setViewportSize({ width: VIEW_W, height: VIEW_H });
  await page.goto(formPath, { waitUntil: "networkidle" });
  await page.bringToFront();
  await page.waitForTimeout(1500); // Let viewer see empty form

  // Get the tab ID of the form page via service worker
  const formTabId = await sw.evaluate(async (urlPart) => {
    const tabs = await chrome.tabs.query({});
    const found = tabs.find(t => t.url && t.url.includes(urlPart));
    return found ? found.id : null;
  }, "test-form.html");

  if (!formTabId) throw new Error("Couldn't find test form tab");
  console.log("Form tab ID:", formTabId);

  // --- STEP 3: Trigger the fill via the service worker ---
  console.log("Triggering autofill...");
  await sw.evaluate(async (tabId) => {
    // Load the stored vault and settings directly
    const { swiftFillVault: vault, swiftFillSettings: settings } = await new Promise(r =>
      chrome.storage.local.get(["swiftFillVault", "swiftFillSettings"], r)
    );
    if (!vault?.profiles?.length) throw new Error("No vault");
    const activeId = settings?.activeProfileId ?? vault.profiles[0].id;
    const profile = vault.profiles.find(p => p.id === activeId) ?? vault.profiles[0];

    // Build the same shape the content script expects
    chrome.tabs.sendMessage(tabId, {
      type: "APPLY_PROFILE",
      payload: { profile, mode: "manual" }
    });
  }, formTabId);

  // Let the content script populate the fields
  await page.waitForTimeout(800);

  // --- STEP 4: Slow scroll through the filled form ---
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollableHeight = Math.max(0, totalHeight - VIEW_H);
  const steps = 50;
  const stepY = scrollableHeight / steps;
  const scrollMs = 4500;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(y => window.scrollTo(0, y), Math.round(i * stepY));
    await page.waitForTimeout(scrollMs / steps);
  }
  await page.waitForTimeout(600);
  // Scroll back smoothly
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1200);

  console.log("Closing and finalizing video...");
  await page.close();
  await ctx.close();

  // Move video out of tmp
  const files = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith(".webm"));
  if (!files.length) throw new Error("No video file produced");
  let best = files[0], size = 0;
  for (const f of files) {
    const s = fs.statSync(path.join(VIDEO_DIR, f)).size;
    if (s > size) { best = f; size = s; }
  }
  const target = path.join(OUT_DIR, "demo.webm");
  fs.copyFileSync(path.join(VIDEO_DIR, best), target);
  console.log(`Saved: ${target} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
}

main().catch(e => { console.error(e); process.exit(1); });
