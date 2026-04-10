# QuickFill

> Auto-fill any form in one click. Save your info once, skip tedious sign-ups forever.

QuickFill is a free, open-source Chrome extension that lets you save profile
information locally and auto-fill matching forms on any website. It also
generates randomized fake identities for sign-ups you don't want to hand
real information to.

**100% local.** No server, no tracking, no analytics, no remote code.

## Features

- **Save once, use everywhere** — Enter your name, email, address, passport,
  and any custom fields once. QuickFill handles every form after that.
- **Fake identities for junk sign-ups** — One click generates a random name,
  address, and phone. Perfect for untrusted services.
- **100% local** — Your data stays in your browser. Open the source to verify.

## Install

Chrome Web Store listing coming soon. For now, load the unpacked extension:

```bash
cd extension
npm install
npm run build
```

Then in Chrome: `chrome://extensions` → enable Developer mode → Load unpacked
→ select the `extension/dist` folder.

## Development

```bash
cd extension
npm install
npm run dev        # vite dev server
npm run build      # production build
npm run typecheck  # typescript check
```

## Repository layout

```
.
├── extension/        Chrome extension source (React + Vite + Manifest V3)
│   ├── src/
│   ├── dist/         Build output (gitignored)
│   ├── store-assets/ Chrome Web Store screenshots and icons
│   └── manifest.json
├── landing/          Marketing landing page (deployed to GitHub Pages)
│   ├── index.html
│   ├── privacy.html
│   └── assets/
├── fixtures/         Sample form for development
├── generate-screenshots.mjs  Automated store screenshot generator
└── .github/workflows/        Pages deploy workflow
```

## Privacy

See [landing/privacy.html](./landing/privacy.html) or the live page at
`/privacy` on the GitHub Pages site.

## License

MIT
