/**
 * Capture clean popup screenshots for the landing page.
 * Just the UI itself at 3x retina — no browser chrome, no colored backdrop.
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const EXT = path.resolve("extension/dist");
const OUT = path.resolve("landing/assets");
fs.mkdirSync(OUT, { recursive: true });

const POPUP_W = 400;
const POPUP_H = 580;
const DPR = 3;

const SHOTS = [
  { id: "popup-welcome", action: "welcome" },
  { id: "popup-fake", action: "fake" },
  { id: "popup-real", action: "real" },
  { id: "popup-controls", action: "controls" },
];

async function main() {
  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
    deviceScaleFactor: DPR,
    viewport: { width: POPUP_W, height: POPUP_H },
  });

  let extId;
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const sw = ctx.serviceWorkers().find(w => w.url().includes("chrome-extension://"));
    if (sw) { extId = new URL(sw.url()).hostname; break; }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!extId) throw new Error("Extension not loaded");

  const url = `chrome-extension://${extId}/popup.html`;

  for (const s of SHOTS) {
    console.log(`  ${s.id}`);
    const pg = await ctx.newPage();
    await pg.setViewportSize({ width: POPUP_W, height: POPUP_H });
    await pg.goto(url, { waitUntil: "networkidle" });
    await pg.waitForTimeout(500);

    try {
      if (s.action === "welcome") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
      } else if (s.action === "fake") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use fake info"');
        await pg.waitForSelector('text="Generated identity"', { timeout: 5000 });
        await pg.waitForTimeout(300);
      } else if (s.action === "real") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use my real info"');
        await pg.waitForSelector('text="Your info"', { timeout: 5000 });
        for (const [ph, val] of [
          ["Jane Q. Doe", "Jane Q. Doe"],
          ["jane@example.com", "jane@example.com"],
          ["+1 555-123-4567", "+1 555-123-4567"],
        ]) {
          const inp = pg.locator(`input[placeholder="${ph}"]`).first();
          if (await inp.isVisible().catch(() => false)) await inp.fill(val);
        }
        await pg.waitForTimeout(200);
      } else if (s.action === "controls") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use fake info"');
        await pg.waitForSelector('text="Generated identity"', { timeout: 5000 });
        await pg.click('text="Save & start filling"');
        await pg.waitForSelector('text="Fill this page"', { timeout: 8000 });
        await pg.waitForTimeout(400);
      }
    } catch (err) {
      console.warn(`    warn: ${err.message.slice(0, 60)}`);
    }

    const buf = await pg.screenshot({
      clip: { x: 0, y: 0, width: POPUP_W, height: POPUP_H },
    });
    fs.writeFileSync(path.join(OUT, `${s.id}.png`), buf);
    await pg.close();
  }

  await ctx.close();
  console.log("Done.");
}

main().catch(e => { console.error(e); process.exit(1); });
