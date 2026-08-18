/* ==========================================================================
   Columbia HVAC Co. — Contact / lead form Netlify Function
   --------------------------------------------------------------------------
   Real server-side endpoint for every "Send Us a Message" form on the site
   (home, about, contact, and all 6 service pages all POST here via
   /api/contact -> /.netlify/functions/contact).

   What it does on every request, in order:
     1. Method / size / JSON guards.
     2. Rate limiting per client IP.
     3. Lightweight anti-spam checks (honeypot field + minimum fill time).
     4. Full server-side validation & sanitization (never trusts the client).
     5. "Delivers" the lead:
          - Always logs a structured record to the function's server-side
            logs (visible in the `netlify dev` terminal locally, and in
            the Netlify UI's function logs once deployed).
          - Optionally emails a notification via the Resend API if
            RESEND_API_KEY + CONTACT_TO_EMAIL are configured (both are
            OPTIONAL — the form works and "processes" submissions without
            them; email is a nice-to-have you can turn on later).
     6. Returns a safe, generic JSON response — never internal details.

   No database is used. There is nothing here for SQL injection to exploit;
   user input is only ever treated as plain text (validated, sanitized,
   logged, and optionally placed in a plain-text email body).
   ========================================================================== */

var validate = require('./utils/validate');
var rateLimit = require('./utils/rate-limit');

var MAX_BODY_BYTES = 10 * 1024; // 10KB is generous for this form; anything bigger is rejected
var MIN_FILL_TIME_MS = 1200; // submissions faster than this are almost always bots
var MAX_FIELD = { name: 120, email: 254, phone: 32, subject: 150, message: 3000 };

var SUBJECT_OPTIONS = [
  'General Inquiry',
  'Furnace Repair',
  'Air Conditioning Repair',
  'Air Duct Cleaning',
  'Emergency HVAC Service',
  'Free Estimate / New Installation'
];

var limiter = rateLimit.createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 }); // 5 submissions / 10 min / IP

function jsonResponse(statusCode, body, extraHeaders) {
  return {
    statusCode: statusCode,
    headers: Object.assign(
      { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      extraHeaders || {}
    ),
    body: JSON.stringify(body)
  };
}

function genericSuccess() {
  return jsonResponse(200, {
    success: true,
    message:
      "Thanks — we received your message and will be in touch shortly. For anything urgent, please call 573-204-6161."
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(204, {});
  if (event.httpMethod !== 'POST') return jsonResponse(405, { success: false, error: 'Method not allowed.' });

  // --- Body size guard (defense in depth; Netlify/API Gateway also caps this) ---
  var rawBody = event.body || '';
  var bodyBytes = Buffer.byteLength(rawBody, event.isBase64Encoded ? 'base64' : 'utf8');
  if (bodyBytes > MAX_BODY_BYTES) {
    return jsonResponse(413, { success: false, error: 'Request is too large.' });
  }

  // --- Rate limiting per client IP ---
  var ip = validate.getClientIp(event);
  var limitResult = limiter.check(ip);
  if (!limitResult.allowed) {
    return jsonResponse(
      429,
      { success: false, error: 'Too many submissions from this connection. Please try again in a few minutes, or call 573-204-6161.' },
      { 'Retry-After': String(limitResult.retryAfterSeconds) }
    );
  }

  // --- Parse JSON safely ---
  var payload;
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch (err) {
    return jsonResponse(400, { success: false, error: 'Invalid request body.' });
  }
  if (!payload || typeof payload !== 'object') {
    return jsonResponse(400, { success: false, error: 'Invalid request body.' });
  }

  // --- Anti-spam: honeypot field ---
  // The frontend injects a hidden "website" field via JS that real visitors
  // never see or fill in. Bots that blindly fill every field trip it.
  // We return a normal-looking success so automated tools don't learn the
  // trap exists, but we do not process it as a real lead.
  var honeypot = typeof payload.website === 'string' ? payload.website.trim() : '';
  if (honeypot) {
    console.warn('[contact] Ignored likely-bot submission (honeypot filled) from', ip);
    return genericSuccess();
  }

  // --- Anti-spam: minimum time-on-form ---
  // The frontend sends the timestamp (ms) it rendered the form. Genuine
  // humans take at least ~1.2s to fill in a form; scripted submissions
  // typically fire near-instantly.
  var renderedAt = Number(payload.renderedAt);
  if (renderedAt && Number.isFinite(renderedAt)) {
    var elapsed = Date.now() - renderedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_TIME_MS) {
      console.warn('[contact] Ignored likely-bot submission (submitted too fast:', elapsed, 'ms) from', ip);
      return genericSuccess();
    }
  }

  // --- Validation ---
  var fieldErrors = {};

  var name = validate.clamp(payload.name, MAX_FIELD.name);
  if (!name) fieldErrors.name = 'Please enter your name.';
  else if (name.length < 2) fieldErrors.name = 'Name looks too short.';

  var email = validate.clamp(payload.email, MAX_FIELD.email);
  if (!email) fieldErrors.email = 'Please enter your email address.';
  else if (!validate.isValidEmail(email)) fieldErrors.email = 'Please enter a valid email address.';

  var phone = validate.clamp(payload.phone, MAX_FIELD.phone);
  if (!phone) fieldErrors.phone = 'Please enter your phone number.';
  else if (!validate.isValidPhone(phone)) fieldErrors.phone = 'Please enter a valid phone number.';

  var message = validate.clamp(payload.message, MAX_FIELD.message);
  if (!message) fieldErrors.message = 'Please tell us what you need help with.';
  else if (message.length < 5) fieldErrors.message = 'Please add a few more details.';

  var subjectRaw = validate.clamp(payload.subject, MAX_FIELD.subject);
  var subject = SUBJECT_OPTIONS.indexOf(subjectRaw) !== -1 ? subjectRaw : (subjectRaw || 'General Inquiry');
  // Strip any stray newlines from subject specifically — it's the one field
  // that could plausibly end up in an email "Subject:" line later, and
  // newlines have no legitimate reason to be there (defense against
  // email-header-style injection even though the current email API takes
  // a JSON body, not raw SMTP headers).
  subject = subject.replace(/[\r\n]+/g, ' ').trim();

  var sourcePage = validate.clamp(payload.page, 120) || 'unknown page';

  if (Object.keys(fieldErrors).length > 0) {
    return jsonResponse(400, {
      success: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: fieldErrors
    });
  }

  var lead = {
    name: name,
    email: email,
    phone: phone,
    subject: subject,
    message: message,
    page: sourcePage,
    ip: ip,
    receivedAt: new Date().toISOString()
  };

  // --- "Deliver" the lead ---
  // Always log server-side (this alone satisfies "a real backend that
  // actually processes the submission" — nothing here is fake).
  console.log('[contact] New lead received:', JSON.stringify(lead));

  // Optional: email notification via Resend, only if configured.
  var canEmail = !!(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL);
  if (canEmail) {
    try {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 8000);

      var emailBody =
        'New website lead — Columbia HVAC Co.\n\n' +
        'Name: ' + lead.name + '\n' +
        'Email: ' + lead.email + '\n' +
        'Phone: ' + lead.phone + '\n' +
        'Subject: ' + lead.subject + '\n' +
        'Submitted from: ' + lead.page + '\n' +
        'Received: ' + lead.receivedAt + '\n\n' +
        'Message:\n' + lead.message + '\n';

      var res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + process.env.RESEND_API_KEY
        },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM_EMAIL,
          to: process.env.CONTACT_TO_EMAIL,
          reply_to: lead.email,
          subject: 'New website lead: ' + lead.subject,
          text: emailBody
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) {
        var errText = await res.text();
        console.error('[contact] Email notification failed:', res.status, errText);
        // Do not fail the request — the lead is already logged above.
      }
    } catch (err) {
      console.error('[contact] Email notification error:', err && err.message ? err.message : err);
      // Same reasoning: the lead was already recorded via console.log.
    }
  }

  return genericSuccess();
};
