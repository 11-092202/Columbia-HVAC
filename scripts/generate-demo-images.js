#!/usr/bin/env node
/* ==========================================================================
   Generates original, legally-safe placeholder artwork for DEMO MODE.
   --------------------------------------------------------------------------
   These are flat-illustration SVGs drawn from scratch for this project —
   not photographs, not sourced from Google Images or any third-party
   stock library, and not a reproduction of any of the real client photos.
   They exist purely so the demo build never has to ship (or lose) a real
   business photo. Originals in assets/images and assets/logo are never
   touched by this script.

   Run: node scripts/generate-demo-images.js
   Output: assets/demo-images/*.svg (source of truth for the demo build)
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'demo-images');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FLAME = '#f0983f';
const FLAME_DARK = '#e07d24';
const EMBER = '#d9481f';
const DARK = '#262626';
const TINT = '#fdf0e2';
const LIGHT_TINT = '#fff6ec';

function wrap(inner, w, h) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '">' +
    '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + LIGHT_TINT + '"/>' +
        '<stop offset="1" stop-color="' + TINT + '"/>' +
      '</linearGradient>' +
    '</defs>' +
    '<rect width="' + w + '" height="' + h + '" fill="url(#bg)"/>' +
    inner +
    '</svg>'
  );
}

function caption(text, w, h) {
  return (
    '<text x="' + (w / 2) + '" y="' + (h - 36) + '" text-anchor="middle" ' +
    'font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="1" fill="' + DARK + '" opacity="0.55">' +
    text.toUpperCase() + '</text>'
  );
}

/* Reusable simple line-icon glyphs, centered around (0,0), ~200px tall. */
const ICONS = {
  outdoorUnit:
    '<g transform="translate(-90,-70)">' +
      '<rect x="0" y="60" width="180" height="90" rx="10" fill="none" stroke="' + DARK + '" stroke-width="6"/>' +
      '<circle cx="45" cy="105" r="26" fill="none" stroke="' + FLAME + '" stroke-width="6"/>' +
      '<circle cx="135" cy="105" r="26" fill="none" stroke="' + FLAME + '" stroke-width="6"/>' +
      '<line x1="0" y1="150" x2="180" y2="150" stroke="' + DARK + '" stroke-width="6"/>' +
      '<line x1="20" y1="150" x2="20" y2="170" stroke="' + DARK + '" stroke-width="6"/>' +
      '<line x1="160" y1="150" x2="160" y2="170" stroke="' + DARK + '" stroke-width="6"/>' +
    '</g>',
  thermostat:
    '<g transform="translate(-60,-90)">' +
      '<circle cx="60" cy="90" r="80" fill="#ffffff" stroke="' + DARK + '" stroke-width="6"/>' +
      '<circle cx="60" cy="90" r="52" fill="none" stroke="' + FLAME + '" stroke-width="6"/>' +
      '<text x="60" y="100" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="' + EMBER + '">72°</text>' +
    '</g>',
  furnace:
    '<g transform="translate(-70,-100)">' +
      '<rect x="0" y="0" width="140" height="200" rx="12" fill="#ffffff" stroke="' + DARK + '" stroke-width="6"/>' +
      '<rect x="20" y="24" width="100" height="18" rx="4" fill="' + TINT + '" stroke="' + DARK + '" stroke-width="4"/>' +
      '<circle cx="40" cy="80" r="12" fill="none" stroke="' + FLAME + '" stroke-width="5"/>' +
      '<circle cx="100" cy="80" r="12" fill="none" stroke="' + FLAME + '" stroke-width="5"/>' +
      '<line x1="20" y1="120" x2="120" y2="120" stroke="' + DARK + '" stroke-width="4"/>' +
      '<line x1="20" y1="140" x2="120" y2="140" stroke="' + DARK + '" stroke-width="4"/>' +
      '<line x1="20" y1="160" x2="120" y2="160" stroke="' + DARK + '" stroke-width="4"/>' +
    '</g>',
  duct:
    '<g transform="translate(-110,-60)">' +
      '<rect x="0" y="20" width="220" height="60" rx="8" fill="#ffffff" stroke="' + DARK + '" stroke-width="6"/>' +
      '<line x1="30" y1="20" x2="30" y2="80" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<line x1="70" y1="20" x2="70" y2="80" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<line x1="110" y1="20" x2="110" y2="80" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<line x1="150" y1="20" x2="150" y2="80" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<line x1="190" y1="20" x2="190" y2="80" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<circle cx="20" cy="50" r="5" fill="' + EMBER + '"/>' +
    '</g>',
  technician:
    '<g transform="translate(-60,-110)">' +
      '<circle cx="60" cy="34" r="26" fill="none" stroke="' + DARK + '" stroke-width="6"/>' +
      '<path d="M20 200 L20 120 Q20 90 60 90 Q100 90 100 120 L100 200" fill="none" stroke="' + DARK + '" stroke-width="6"/>' +
      '<rect x="6" y="120" width="28" height="60" rx="6" fill="' + FLAME + '" opacity="0.85"/>' +
      '<circle cx="60" cy="20" r="3" fill="' + EMBER + '"/>' +
    '</g>',
  rooftop:
    '<g transform="translate(-120,-60)">' +
      '<rect x="0" y="70" width="240" height="10" fill="' + DARK + '" opacity="0.5"/>' +
      '<rect x="20" y="20" width="60" height="50" rx="6" fill="#ffffff" stroke="' + DARK + '" stroke-width="5"/>' +
      '<rect x="100" y="10" width="60" height="60" rx="6" fill="#ffffff" stroke="' + DARK + '" stroke-width="5"/>' +
      '<rect x="180" y="28" width="50" height="42" rx="6" fill="#ffffff" stroke="' + DARK + '" stroke-width="5"/>' +
      '<circle cx="50" cy="45" r="14" fill="none" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<circle cx="130" cy="40" r="16" fill="none" stroke="' + FLAME + '" stroke-width="4"/>' +
      '<circle cx="205" cy="49" r="12" fill="none" stroke="' + FLAME + '" stroke-width="4"/>' +
    '</g>',
  emergency:
    '<g transform="translate(-50,-100)">' +
      '<path d="M55 0 L100 0 L60 90 L100 90 L15 200 L45 105 L0 105 Z" fill="' + FLAME + '" opacity="0.9"/>' +
    '</g>',
  wrench:
    '<g transform="translate(-90,-70)">' +
      '<rect x="0" y="55" width="180" height="30" rx="15" fill="none" stroke="' + DARK + '" stroke-width="6" transform="rotate(-18 90 70)"/>' +
      '<circle cx="30" cy="35" r="26" fill="none" stroke="' + FLAME + '" stroke-width="6"/>' +
      '<circle cx="150" cy="105" r="26" fill="none" stroke="' + FLAME + '" stroke-width="6"/>' +
    '</g>'
};

const IMAGES = [
  { file: 'home-hero-technician-servicing-outdoor-ac.svg', icon: 'technician', label: 'HVAC Service', w: 1600, h: 900 },
  { file: 'home-ac-repair-service.svg', icon: 'outdoorUnit', label: 'A/C Repair', w: 900, h: 675 },
  { file: 'home-affordable-furnace-and-ac-repair.svg', icon: 'wrench', label: 'Furnace & A/C Repair', w: 900, h: 675 },
  { file: 'home-nest-thermostat.svg', icon: 'thermostat', label: 'Smart Thermostat', w: 900, h: 675 },
  { file: 'home-rooftop-hvac-units.svg', icon: 'rooftop', label: 'Rooftop HVAC Units', w: 900, h: 675 },
  { file: 'home-technician-servicing-furnace.svg', icon: 'furnace', label: 'Furnace Service', w: 900, h: 675 },
  { file: 'air-duct-cleaning-main.svg', icon: 'duct', label: 'Air Duct Cleaning', w: 900, h: 675 },
  { file: 'emergency-hvac-main.svg', icon: 'emergency', label: '24/7 Emergency Service', w: 900, h: 675 },
  { file: 'air-conditioning-contractor-columbia-mo.svg', icon: 'outdoorUnit', label: 'A/C Contractor', w: 900, h: 675 }
];

IMAGES.forEach(function (spec) {
  var iconGroup = '<g transform="translate(' + (spec.w / 2) + ',' + (spec.h / 2 - 30) + ')">' + ICONS[spec.icon] + '</g>';
  var svg = wrap(iconGroup + caption(spec.label, spec.w, spec.h), spec.w, spec.h);
  fs.writeFileSync(path.join(OUT_DIR, spec.file), svg, 'utf8');
  console.log('wrote', spec.file);
});

/* Demo wordmark logo — same visual style/palette as the real logo (flame
   mark + bold charcoal wordmark) but an original recreation carrying the
   fictional demo business name, not a copy of the real artwork. */
var logoW = 560, logoH = 190;
var logoSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + logoW + ' ' + logoH + '" width="' + logoW + '" height="' + logoH + '">' +
  '<text x="20" y="70" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="4" fill="' + DARK + '">SUMMIT</text>' +
  '<text x="20" y="140" font-family="Arial, sans-serif" font-size="58" font-weight="900" letter-spacing="1" fill="' + DARK + '">HOME <tspan fill="' + FLAME + '">Services</tspan></text>' +
  '<g transform="translate(470,30)">' +
    '<path d="M40 0 C55 25 60 45 50 65 C65 55 72 35 65 15 C85 30 90 65 70 90 C50 110 20 105 10 80 C0 55 10 30 40 0 Z" fill="' + FLAME + '"/>' +
    '<circle cx="40" cy="95" r="8" fill="' + EMBER + '"/>' +
  '</g>' +
  '</svg>';
fs.writeFileSync(path.join(OUT_DIR, 'summit-home-services-logo.svg'), logoSvg, 'utf8');
console.log('wrote summit-home-services-logo.svg');

console.log('\nDone. Demo image sources written to assets/demo-images/.');
