/* ==========================================================================
   DEMO MODE configuration — single source of truth
   --------------------------------------------------------------------------
   This file is the ONLY place that defines the difference between:
     - CLIENT_BUSINESS  → the real Columbia HVAC Co. facts (unchanged, as
       they already appear across index.html, about.html, contact.html,
       services/*.html, and netlify/functions/business-data.js).
     - DEMO_BUSINESS    → a fictional, industry-appropriate stand-in used
       ONLY inside the generated demo/ output.

   HOW SWITCHING WORKS (single toggle, non-destructive):
     - The real site (this project's root: index.html, about.html, css/,
       js/, netlify/, etc.) is NEVER modified by the demo build. It is
       always the "CLIENT MODE" version — nothing to restore, because
       nothing here is ever touched.
     - Running `npm run build:demo` (see scripts/build-demo.js) reads this
       config and generates a completely separate `demo/` folder containing
       a sanitized copy of the whole site with every real business fact,
       contact mechanism, and photo swapped for the DEMO_BUSINESS
       equivalents below. Real values are replaced in the text itself
       before any file is written — nothing is hidden via CSS/JS while
       still shipping the real value in the markup.
     - To go back to "CLIENT MODE," you simply serve/deploy the untouched
       project root again (or delete the demo/ folder — it is 100%
       regenerable from this config + the real source files at any time).

   Set DEMO_MODE below only to control whether `npm run build:demo`
   actually performs the sanitized build (true) or refuses to run (false),
   as an extra safety rail against accidentally publishing the demo/ folder
   with stale/half-applied settings.
   ========================================================================== */

const DEMO_MODE = true;

const CLIENT_BUSINESS = {
  name: 'Columbia HVAC Co.', // NOTE: trailing "." is part of the real name (abbreviation for "Company")
  shortName: 'Columbia HVAC',
  tagline: 'HVAC Columbia MO',
  phoneDisplay: '573-204-6161',
  phoneHref: 'tel:5732046161',
  phoneDigits: '5732046161',
  address: '1403 W Ash St, Columbia, MO 65203',
  addressShort: 'Columbia, MO',
  city: 'Columbia',
  cityState: 'Columbia, MO',
  zip: '65203',
  facebook: 'https://www.facebook.com/profile.php?id=100080658311644',
  mapsEmbedSrc:
    'https://maps.google.com/maps?q=1403%20W%20Ash%20St%2C%20Columbia%2C%20MO%2065203&t=&z=14&ie=UTF8&iwloc=&output=embed',
  logo: 'assets/logo/columbia-hvac-logo.png',
  logoAlt: 'Columbia HVAC Co. logo',
  serviceAreas: [
    'Columbia',
    'Prathersville',
    'Stevens',
    'Shaw',
    'Harg',
    'Pierpoint',
    'Huntsdale',
    'McBaine'
  ]
};

/* Fictional, industry-appropriate (HVAC) demo identity. Deliberately still
   an HVAC company so every page's content/services/imagery stays coherent
   — only the identity and contact mechanisms are fictional. */
const DEMO_BUSINESS = {
  name: 'Summit Home Services',
  shortName: 'Summit Home',
  tagline: 'HVAC Rivertown MO',
  phoneDisplay: '(555) 010-0000',
  phoneHref: '#demo-disabled',
  phoneDigits: '5550100000',
  address: '100 Main St, Rivertown, MO 65000',
  addressShort: 'Rivertown, MO',
  city: 'Rivertown',
  cityState: 'Rivertown, MO',
  zip: '65000',
  facebook: '#demo-disabled',
  /* Generic, non-identifying map view (does not point at any real address). */
  mapsEmbedSrc:
    'https://maps.google.com/maps?q=Rivertown%2C%20MO&t=&z=10&ie=UTF8&iwloc=&output=embed',
  logo: 'assets/logo/summit-home-services-logo.svg',
  logoAlt: 'Summit Home Services logo (demo placeholder)',
  serviceAreas: [
    'Rivertown',
    'Fairview',
    'Millbrook',
    'Oakdale',
    'Bridgeport',
    'Elmhurst',
    'Cedar Falls',
    'Westgate'
  ]
};

/* Real photo path (as referenced in the HTML source, relative to each
   page — the build script normalizes leading "../") → demo replacement
   path. All demo images are original flat-illustration SVGs generated for
   this project (see scripts/generate-demo-images.js) — not photographs,
   so there is no licensing question. Originals are never deleted. */
const IMAGE_MAP = {
  'assets/images/home/home-hero-technician-servicing-outdoor-ac.jpg':
    'assets/images/home/home-hero-technician-servicing-outdoor-ac.svg',
  'assets/images/home/home-ac-repair-service.jpg':
    'assets/images/home/home-ac-repair-service.svg',
  'assets/images/home/home-affordable-furnace-and-ac-repair.jpg':
    'assets/images/home/home-affordable-furnace-and-ac-repair.svg',
  'assets/images/home/home-nest-thermostat.jpg':
    'assets/images/home/home-nest-thermostat.svg',
  'assets/images/home/home-rooftop-hvac-units.jpg':
    'assets/images/home/home-rooftop-hvac-units.svg',
  'assets/images/home/home-technician-servicing-furnace.jpg':
    'assets/images/home/home-technician-servicing-furnace.svg',
  'assets/images/air-duct-cleaning/air-duct-cleaning-main.jpg':
    'assets/images/air-duct-cleaning/air-duct-cleaning-main.svg',
  'assets/images/emergency-hvac/emergency-hvac-main.jpg':
    'assets/images/emergency-hvac/emergency-hvac-main.svg',
  'assets/images/air-conditioning-contractor/air-conditioning-contractor-columbia-mo.jpg':
    'assets/images/air-conditioning-contractor/air-conditioning-contractor-columbia-mo.svg',
  'assets/logo/columbia-hvac-logo.png': DEMO_BUSINESS.logo
};

module.exports = { DEMO_MODE, CLIENT_BUSINESS, DEMO_BUSINESS, IMAGE_MAP };
