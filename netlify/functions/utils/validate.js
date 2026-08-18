/* ==========================================================================
   Columbia HVAC Co. — Shared server-side validation & sanitization helpers
   --------------------------------------------------------------------------
   Used by any Netlify Function that accepts untrusted browser input
   (currently: contact.js, chat.js). Nothing here executes the input as
   code, SQL, HTML, or a shell command — it is always treated as plain text.
   ========================================================================== */

/** Remove ASCII control characters (keeps \n and \t) and trim whitespace. */
function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/\r\n/g, '\n')
    .trim();
}

/** Trim + collapse a string down to a maximum length (does not throw). */
function clamp(value, maxLength) {
  var str = cleanText(value);
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/** Pragmatic email format check. Not a full RFC 5322 parser by design —
 *  good enough to catch typos/garbage without rejecting valid real-world
 *  addresses. Deliverability is never guaranteed by format checks alone. */
var EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
function isValidEmail(value) {
  var v = cleanText(value);
  return v.length > 0 && v.length <= 254 && EMAIL_RE.test(v);
}

/** Accepts common US/international phone formats by checking digit count
 *  after stripping everything except digits and a leading "+". Rejects
 *  letters, so "abc" or SQL/JS-injection strings never pass. */
function isValidPhone(value) {
  var v = cleanText(value);
  if (!v) return false;
  var stripped = v.replace(/[^\d+]/g, '');
  var digitsOnly = stripped.replace(/\+/g, '');
  // Must be ALL digits (plus an optional single leading +) with a
  // reasonable length (7-15 digits per ITU E.164 range).
  var looksNumeric = /^\+?\d+$/.test(stripped);
  return looksNumeric && digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

/** Best-effort client IP extraction across local `netlify dev` and
 *  deployed Netlify (which sets x-nf-client-connection-ip). Falls back to
 *  a stable constant so local testing still exercises the rate limiter. */
function getClientIp(event) {
  var headers = (event && event.headers) || {};
  return (
    headers['x-nf-client-connection-ip'] ||
    (headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    headers['client-ip'] ||
    'local-dev'
  );
}

module.exports = { cleanText: cleanText, clamp: clamp, isValidEmail: isValidEmail, isValidPhone: isValidPhone, getClientIp: getClientIp };
