# DEMO MODE — how it works

This project can be shown two ways:

- **CLIENT MODE** — the real Columbia HVAC Co. site. This is just the project root as it already exists (`index.html`, `about.html`, `css/`, `js/`, `netlify/`, etc.). Nothing about it changed as part of this work — there is nothing to "turn on," it's simply always there.
- **DEMO MODE** — a sanitized, fictional-business copy for showing this as a portfolio/design sample, generated into a separate `demo/` folder.

## The switch

One command:

```bash
npm run build:demo
```

This reads `demo.config.js` and regenerates the `demo/` folder from scratch every time. To "restore" the original, you don't need to do anything — the real project root was never modified in the first place. To pull the demo folder out of the picture, just delete it (`rm -rf demo`); it's fully disposable and 100% regenerable.

`demo.config.js` has a top-level `DEMO_MODE` flag as a safety rail — if it's `false`, `npm run build:demo` refuses to run. It's `true` by default so the command works out of the box.

Serve whichever one you want people to see:
- CLIENT MODE: serve/deploy the project root as usual (`npm run dev`, or your existing Netlify site).
- DEMO MODE: serve/deploy the `demo/` folder. Locally, `cd demo && npx netlify dev` (or point a second Netlify site's publish directory at `demo`, with build command `npm run build:demo` run from the repo root so the demo site always rebuilds fresh from source instead of going stale).

`demo/` is gitignored — it's a build artifact, not something to hand-edit or commit.

## What the audit found (before any changes)

Real business info appeared in these places:

| Item | Where | Occurrences |
|---|---|---|
| Phone (`573-204-6161` / `tel:5732046161`) | All 9 HTML pages, `js/main.js`, `js/ai-assistant.js`, `netlify/functions/business-data.js`, `netlify/functions/chat.js`, `netlify/functions/contact.js` | ~130+ |
| Address (`1403 W Ash St, Columbia, MO 65203`) | `index.html`, `about.html`, `contact.html`, all 6 service pages, `business-data.js`, Google Maps iframe in `contact.html` | 10+ |
| Business name ("Columbia HVAC Co." / "Columbia HVAC") | All 9 HTML pages (titles, headers, footer copyright, OG tags), `main.js`, `ai-assistant.js`, `business-data.js`, all Netlify function file headers | 20+ files |
| Facebook page (real profile URL) | `index.html`, `about.html`, `contact.html`, all 6 service pages, `business-data.js` | 9 files |
| Service-area town names (Prathersville, Stevens, Shaw, Harg, Pierpoint, Huntsdale, McBaine) | `index.html` service-area list, `business-data.js` | 2 files |
| Real photos (9 JPGs) + real logo (1 PNG with the business name baked into the artwork) | `assets/images/**`, `assets/logo/` | 10 files |

Checked and **not found** (nothing to sanitize):
- No real email address anywhere (only the literal placeholder text `you@example.com` in form-field placeholders and `.env.example`)
- No WhatsApp/SMS/booking links
- No JSON-LD/schema.org structured data
- No canonical `<link>` tags
- No testimonials naming the real business

## What DEMO MODE does

Identity: **"Summit Home Services"** (fictional, still an HVAC company), phone `(555) 010-0000`, address `100 Main St, Rivertown, MO 65000` — real facts and their fictional replacements both live in `demo.config.js`.

- **Text & metadata** — every phone number, address, business name, town name, `<title>`, meta description, and OG description is replaced with the fictional equivalent before any file is written. Real values are never present in the shipped output (not hidden via CSS/JS).
- **Contact links** — the real `tel:` link and the real Facebook link are replaced with `href="#demo-disabled"` — fully inert, not just visually relabeled.
- **Google Maps** — the embed is swapped for a generic map view (Rivertown, MO) that doesn't point at the real address.
- **Contact form** — client-side, submitting shows an honest "This is a portfolio demo — form submissions are disabled here" message and **never calls the network**. Server-side, `netlify/functions/contact.js`'s demo copy fails closed on the very first line of the handler (before any parsing/validation/emailing) with the same honest message — so even a hand-crafted direct POST to the API can't be tricked into looking like it worked, and nothing is silently discarded while pretending to succeed.
- **AI assistant** — `netlify/functions/business-data.js` is fully regenerated (not patched) so the assistant's entire knowledge base is the fictional Summit Home Services identity. It keeps all the original's guardrails (won't reveal its system prompt, won't follow instructions embedded in a visitor's message) and adds one more: it will say plainly this is a non-functional demo if asked whether it can actually be booked/reached. It never has access to the real business's facts in this build.
- **SEO** — every demo page gets `<meta name="robots" content="noindex, nofollow">` so it can't be indexed or mistaken for the real business's site by search engines.
- **Images** — all 9 real photos and the real logo (which has "Columbia HVAC Co." baked into the artwork) are replaced with original flat-illustration SVGs generated for this project (`scripts/generate-demo-images.js`) — not stock photos, not scraped images, so there's no licensing question. Originals are untouched in `assets/images/` and `assets/logo/`; the demo sources live in `assets/demo-images/`.
- **Visual design** — unchanged. `demo/css/*.css` is byte-for-byte identical to the real site's CSS (verified with `diff`). Only text content, a handful of href/src values, and image bytes differ.

## Files added (nothing existing was modified)

- `demo.config.js` — the single config: real facts, fictional facts, image map.
- `scripts/build-demo.js` — the generator.
- `scripts/generate-demo-images.js` — generates the placeholder SVG artwork.
- `assets/demo-images/*.svg` — the generated placeholder artwork (source).
- `.gitignore` — added a `demo/` entry.
- `package.json` — added `build:demo` and `generate:demo-images` scripts.

Every file that existed before this (`index.html`, `about.html`, `contact.html`, all service pages, `css/`, `js/main.js`, `js/ai-assistant.js`, `netlify/functions/business-data.js`, `netlify/functions/chat.js`, `netlify/functions/contact.js`, etc.) is untouched — confirmed with `git diff --stat`, which shows zero changes to any of them from this work.

## Verified

- `demo/` contains zero occurrences of the real phone number, address, business name, Facebook ID, or town names (checked with grep across every `.html` and `.js` file).
- Zero real photo files (`.jpg`/the real logo `.png`) exist anywhere in `demo/`.
- `demo/css/*.css` is byte-identical to the real site's CSS.
- Every `.js` file in `demo/` passes `node --check` (no syntax errors from the automated patching).
- Directly invoked `demo/netlify/functions/contact.js`'s handler with a realistic POST body — it returns the honest demo-disabled message without touching validation, logging, or email code.
- Directly invoked `demo/netlify/functions/business-data.js` — confirmed the AI system prompt only contains the fictional Summit Home Services identity.

## What wasn't fully automated / worth a manual look

- The demo images are original placeholder illustrations, not photos — good for legal safety, but you may want to swap in nicer artwork later. `demo.config.js`'s `IMAGE_MAP` is the only place you'd need to touch to point at replacement files (same filenames/paths would just work).
- I didn't add a visible "this is a demo" banner anywhere, since the brief was explicit that the visual design must not change. The `noindex` meta tag, fictional identity, and inert contact links are the non-visual safeguards instead.
- I haven't run this through an actual browser click-through (same sandbox limitation as earlier in this project — `netlify dev` can't fully boot here). Worth a manual pass once you deploy or run it locally: open `demo/index.html` pages, click the (now inert) phone/Facebook links, submit the contact form, and try the AI assistant.
