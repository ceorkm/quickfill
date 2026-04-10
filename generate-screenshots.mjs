/**
 * Chrome Web Store HD screenshot generator for QuickFill.
 * Captures at 3x device pixel ratio, composites at 2x canvas (2560x1600),
 * then exports crisp 1280x800 PNGs.
 */

import { chromium } from "playwright";
import sharp from "sharp";
import path from "path";
import fs from "fs";

const EXTENSION_PATH = path.resolve("extension/dist");
const OUTPUT_DIR = path.resolve("extension/store-assets/final");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const STORE_W = 1280;
const STORE_H = 800;
const POPUP_W = 400;
const POPUP_H = 580;
const DPR = 3;

// Work at 2x for compositing, final downscale to 1x
const CW = STORE_W * 2; // 2560
const CH = STORE_H * 2; // 1600

const COLORS = {
  deepBlue: "#264653",
  teal: "#2A9D8F",
  coral: "#E76F51",
  primaryDark: "#9A4830",
};

const SLIDES = [
  {
    id: "welcome",
    bg: COLORS.deepBlue,
    headline: "Auto-fill any form\nin one click.",
    sub: "The fastest way to skip tedious sign-ups.",
    action: "welcome",
  },
  {
    id: "fake-identity",
    bg: COLORS.teal,
    headline: "Fake identities\nfor junk sign-ups.",
    sub: "Skip the spam with a randomized profile.",
    action: "fake-info",
  },
  {
    id: "real-info",
    bg: COLORS.coral,
    headline: "Save your real info\nonce. Use it forever.",
    sub: "Name, email, address, passport — all ready to go.",
    action: "real-info",
  },
  {
    id: "controls",
    bg: COLORS.primaryDark,
    headline: "Fill this page.\nOne button. Done.",
    sub: "Switch between real and fake profiles instantly.",
    action: "controls",
  },
];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a macOS-style window chrome SVG at exact pixel dimensions */
function windowChromeSvg(w, h) {
  const tb = 56;
  const T = h + tb;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${T}">
  <defs>
    <filter id="ds" x="-4%" y="-2%" width="108%" height="108%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000" flood-opacity="0.25"/>
    </filter>
    <clipPath id="rc"><rect width="${w}" height="${T}" rx="20"/></clipPath>
  </defs>
  <g filter="url(#ds)">
    <g clip-path="url(#rc)">
      <rect width="${w}" height="${T}" fill="#FAFAF9" rx="20"/>
      <rect width="${w}" height="${tb}" fill="#E8E2DB"/>
      <line x1="0" y1="${tb}" x2="${w}" y2="${tb}" stroke="#D4CBC0" stroke-width="1"/>
      <circle cx="28" cy="${tb/2}" r="9" fill="#FF5F57"/>
      <circle cx="56" cy="${tb/2}" r="9" fill="#FDBC40"/>
      <circle cx="84" cy="${tb/2}" r="9" fill="#33C748"/>
      <rect x="120" y="14" width="${Math.min(w - 150, 500)}" height="28" rx="8" fill="rgba(0,0,0,0.05)"/>
      <text x="${120 + Math.min(w - 150, 500)/2}" y="33" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13" fill="rgba(0,0,0,0.3)">QuickFill Extension</text>
    </g>
  </g>
</svg>`);
}

async function main() {
  console.log("Launching Chromium with extension...");

  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      "--no-first-run",
      "--disable-default-apps",
    ],
    deviceScaleFactor: DPR,
    viewport: { width: POPUP_W, height: POPUP_H },
  });

  // Find extension ID
  let extId;
  const t0 = Date.now();
  while (Date.now() - t0 < 10_000) {
    const sw = ctx.serviceWorkers().find(w => w.url().includes("chrome-extension://"));
    if (sw) { extId = new URL(sw.url()).hostname; break; }
    await new Promise(r => setTimeout(r, 200));
  }
  if (!extId) { console.error("Extension not found"); await ctx.close(); process.exit(1); }

  const popupUrl = `chrome-extension://${extId}/popup.html`;
  const shots = {};

  for (const slide of SLIDES) {
    console.log(`  Capturing: ${slide.id}`);
    const pg = await ctx.newPage();
    await pg.setViewportSize({ width: POPUP_W, height: POPUP_H });
    await pg.goto(popupUrl, { waitUntil: "networkidle" });
    await pg.waitForTimeout(600);

    try {
      if (slide.action === "welcome") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.waitForTimeout(300);
      } else if (slide.action === "fake-info") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use fake info"');
        await pg.waitForSelector('text="Generated identity"', { timeout: 5000 });
        await pg.waitForTimeout(400);
      } else if (slide.action === "real-info") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use my real info"');
        await pg.waitForSelector('text="Your info"', { timeout: 5000 });
        for (const [ph, val] of [
          ["Jane Q. Doe", "Jane Q. Doe"],
          ["jane@example.com", "jane@example.com"],
          ["+1 555-123-4567", "+1 555-123-4567"],
          ["1990-04-28", "1990-04-28"],
          ["Female", "Female"],
        ]) {
          const inp = pg.locator(`input[placeholder="${ph}"]`).first();
          if (await inp.isVisible().catch(() => false)) await inp.fill(val);
        }
        await pg.waitForTimeout(200);
      } else if (slide.action === "controls") {
        await pg.waitForSelector('text="Welcome to QuickFill"', { timeout: 5000 });
        await pg.click('text="Use fake info"');
        await pg.waitForSelector('text="Generated identity"', { timeout: 5000 });
        await pg.click('text="Save & start filling"');
        await pg.waitForSelector('text="Fill this page"', { timeout: 8000 });
        await pg.waitForTimeout(500);
      }
    } catch (err) {
      console.warn(`    ⚠ ${err.message.slice(0, 60)}`);
    }

    // 3x DPR = 1200x1740 pixel screenshot
    shots[slide.id] = await pg.screenshot({
      clip: { x: 0, y: 0, width: POPUP_W, height: POPUP_H },
    });
    await pg.close();
  }

  await ctx.close();
  console.log("Compositing...");

  const rawPxW = POPUP_W * DPR; // 1200
  const rawPxH = POPUP_H * DPR; // 1740

  for (const slide of SLIDES) {
    const raw = shots[slide.id];
    if (!raw) continue;

    // --- Build window frame at compositing size ---
    // Popup should fill ~85% of canvas height
    const popupTargetH = Math.round(CH * 0.82);
    const popupScale = popupTargetH / rawPxH;
    const popupTargetW = Math.round(rawPxW * popupScale);

    // Scale the raw screenshot
    const popupImg = await sharp(raw)
      .resize(popupTargetW, popupTargetH, { kernel: "lanczos3" })
      .png()
      .toBuffer();

    // Window chrome frame
    const TB = 56;
    const frameW = popupTargetW;
    const frameH = popupTargetH + TB;
    const frameSvg = windowChromeSvg(frameW, popupTargetH);
    const frameImg = await sharp(frameSvg).png().toBuffer();
    const frameMeta = await sharp(frameImg).metadata();

    // Composite popup into frame
    const windowImg = await sharp(frameImg)
      .composite([{ input: popupImg, top: TB, left: 0 }])
      .png()
      .toBuffer();

    // --- Build the full store screenshot ---
    const bgHex = slide.bg;
    const bg = await sharp({
      create: { width: CW, height: CH, channels: 3, background: hexToRgb(bgHex) },
    }).png().toBuffer();

    // Text SVG (left side)
    const textW = Math.round(CW * 0.48);
    const lines = slide.headline.split("\n");
    const fSize = 88;
    const lH = 105;
    const totalTextH = lines.length * lH;
    const textStartY = Math.round(CH / 2) - Math.round(totalTextH / 2);
    const headLines = lines.map((l, i) =>
      `<text x="${textW/2}" y="${textStartY + i * lH}" text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
        font-size="${fSize}" font-weight="800" fill="white" letter-spacing="-2">${esc(l)}</text>`
    ).join("");
    const subY = textStartY + lines.length * lH + 40;
    const subLine = slide.sub
      ? `<text x="${textW/2}" y="${subY}" text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, 'Inter', sans-serif"
          font-size="36" font-weight="400" fill="rgba(255,255,255,0.7)">${esc(slide.sub)}</text>`
      : "";
    const textSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${textW}" height="${CH}">${headLines}${subLine}</svg>`);
    const textImg = await sharp(textSvg).png().toBuffer();

    // Position window on the right, vertically centered
    const winX = CW - frameW - 120;
    const winY = Math.max(40, Math.round((CH - frameH) / 2));

    const composed = await sharp(bg)
      .composite([
        { input: windowImg, top: winY, left: winX },
        { input: textImg, top: 0, left: 80 },
      ])
      .png()
      .toBuffer();

    // Final downscale to 1280x800 with sharp Lanczos
    const final = await sharp(composed)
      .resize(STORE_W, STORE_H, { kernel: "lanczos3" })
      .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.3 })
      .png({ compressionLevel: 6 })
      .toBuffer();

    const out = path.join(OUTPUT_DIR, `screenshot-${slide.id}.png`);
    fs.writeFileSync(out, final);
    console.log(`  ${slide.id}: ${final.length >> 10}KB`);
  }

  // --- Marquee 1400x560 ---
  if (shots["welcome"]) {
    const mW2 = 2800, mH2 = 1120;
    const popH = Math.round(mH2 * 0.85);
    const popScale = popH / rawPxH;
    const popW = Math.round(rawPxW * popScale);
    const popImg = await sharp(shots["welcome"]).resize(popW, popH, { kernel: "lanczos3" }).png().toBuffer();
    const TB = 56;
    const fW = popW, fH = popH + TB;
    const fSvg = windowChromeSvg(fW, popH);
    const fImg = await sharp(fSvg).png().toBuffer();
    const winImg = await sharp(fImg).composite([{ input: popImg, top: TB, left: 0 }]).png().toBuffer();
    const bg = await sharp({ create: { width: mW2, height: mH2, channels: 3, background: hexToRgb(COLORS.deepBlue) } }).png().toBuffer();
    const txtW = Math.round(mW2 * 0.5);
    const txt = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${txtW}" height="${mH2}">
      <text x="${txtW/2}" y="430" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="100" font-weight="800" fill="white" letter-spacing="-2">QuickFill</text>
      <text x="${txtW/2}" y="510" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="40" font-weight="400" fill="rgba(255,255,255,0.75)">One-click autofill for every form.</text>
      <text x="${txtW/2}" y="570" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="400" fill="rgba(255,255,255,0.45)">Skip sign-ups. Generate fake identities. Done.</text>
    </svg>`);
    const txtImg = await sharp(txt).png().toBuffer();
    const wX = mW2 - fW - 100, wY = Math.max(20, Math.round((mH2 - fH) / 2));
    const comp = await sharp(bg).composite([
      { input: winImg, top: wY, left: wX },
      { input: txtImg, top: 0, left: 60 },
    ]).png().toBuffer();
    const final = await sharp(comp).resize(1400, 560, { kernel: "lanczos3" }).sharpen({ sigma: 0.5 }).png().toBuffer();
    fs.writeFileSync(path.join(OUTPUT_DIR, "marquee-promo-tile-1400x560.png"), final);
    console.log(`  marquee: ${final.length >> 10}KB`);
  }

  // --- Small tile 440x280 ---
  const stSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="880" height="560">
    <rect width="880" height="560" fill="${COLORS.deepBlue}"/>
    <text x="440" y="240" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="60" font-weight="800" fill="white">QuickFill</text>
    <text x="440" y="300" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="400" fill="rgba(255,255,255,0.75)">One-click autofill for every form.</text>
    <text x="440" y="340" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="400" fill="rgba(255,255,255,0.45)">Skip sign-ups with real or fake profiles.</text>
  </svg>`);
  const st = await sharp(stSvg).resize(440, 280, { kernel: "lanczos3" }).png().toBuffer();
  fs.writeFileSync(path.join(OUTPUT_DIR, "small-promo-tile-440x280.png"), st);
  console.log(`  small tile: ${st.length >> 10}KB`);

  console.log("\nDone!");
}

function hexToRgb(hex) {
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

main().catch(e => { console.error(e); process.exit(1); });
