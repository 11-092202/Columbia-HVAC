/* ==========================================================================
   Columbia HVAC Co. — AI Assistant Netlify Function
   --------------------------------------------------------------------------
   Server-side endpoint the frontend chat widget talks to. It keeps the AI
   API key out of the browser: the client only ever calls this function
   (POST /api/chat -> /.netlify/functions/chat), and this function is the
   only place that talks to the OpenAI API using a secret stored in a
   Netlify environment variable (OPENAI_API_KEY).
   ========================================================================== */

const { buildSystemPrompt, BUSINESS_PROFILE } = require('./business-data');
const { getClientIp } = require('./utils/validate');
const { createRateLimiter } = require('./utils/rate-limit');
const { getFaqReply } = require('./utils/faq-engine');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_HISTORY_MESSAGES = 12; // limit context sent per request
const MAX_MESSAGE_LENGTH = 1000;
const MAX_BODY_BYTES = 20 * 1024; // 20KB is generous for a chat turn + trimmed history

// 12 messages / 60s / IP. Generous enough for a real conversation, tight
// enough to make scripted abuse of the OpenAI-backed endpoint expensive to
// sustain. See netlify/functions/utils/rate-limit.js for how this is
// enforced and its limitations under serverless concurrency.
const limiter = createRateLimiter({ windowMs: 60 * 1000, max: 12 });

function isChatbotEnabled() {
  // Default to enabled if the variable is unset, so existing deployments
  // aren't silently broken by introducing this flag. Set
  // CHATBOT_ENABLED=false (any case) to turn the assistant off.
  return String(process.env.CHATBOT_ENABLED || 'true').toLowerCase() !== 'false';
}

// Which backend answers messages. Defaults to 'openai' so existing
// deployments keep working unchanged. Set CHATBOT_PROVIDER=faq to use the
// zero-dependency keyword/FAQ engine instead — no API key, no external
// network call, no per-message cost, answers built only from
// business-data.js. Same enable/disable switch, rate limiting, and
// validation apply to both providers; only how the reply is produced
// differs.
function getChatProvider() {
  var raw = String(process.env.CHATBOT_PROVIDER || 'openai').toLowerCase();
  return raw === 'faq' ? 'faq' : 'openai';
}

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

function isValidHistoryEntry(entry) {
  return (
    entry &&
    (entry.role === 'user' || entry.role === 'assistant') &&
    typeof entry.content === 'string'
  );
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  // Independent server-side kill switch. This is checked here regardless of
  // what the frontend shows, so a direct POST to this endpoint is refused
  // even if someone bypasses the UI entirely.
  if (!isChatbotEnabled()) {
    return jsonResponse(503, {
      error: 'The chat assistant is currently unavailable. Please call ' + BUSINESS_PROFILE.phone + ' or use the contact form.'
    });
  }

  const provider = getChatProvider();

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured.');
    return jsonResponse(500, {
      error: 'The assistant is not configured yet. Please call ' + BUSINESS_PROFILE.phone + ' for help.'
    });
  }

  const rawBody = event.body || '';
  const bodyBytes = Buffer.byteLength(rawBody, event.isBase64Encoded ? 'base64' : 'utf8');
  if (bodyBytes > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request is too large.' });
  }

  const ip = getClientIp(event);
  const limitResult = limiter.check(ip);
  if (!limitResult.allowed) {
    return jsonResponse(
      429,
      { error: 'You are sending messages too quickly. Please wait a moment and try again.' },
      { 'Retry-After': String(limitResult.retryAfterSeconds) }
    );
  }

  let payload;
  try {
    payload = JSON.parse(rawBody || '{}');
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return jsonResponse(400, { error: 'Message cannot be empty.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(400, { error: 'Message is too long.' });
  }

  const history = Array.isArray(payload.history)
    ? payload.history.filter(isValidHistoryEntry).slice(-MAX_HISTORY_MESSAGES)
    : [];

  // --- Free/zero-dependency provider: answer locally, no network call ---
  // Same guards above (enabled check, body size, rate limit, message
  // validation) already ran identically for this path. History isn't used
  // here — each FAQ answer is looked up fresh from the current message.
  if (provider === 'faq') {
    try {
      const reply = getFaqReply(message, BUSINESS_PROFILE);
      return jsonResponse(200, { reply: reply });
    } catch (err) {
      console.error('FAQ engine error:', err);
      return jsonResponse(500, {
        error: 'The assistant hit an unexpected error. Please call ' + BUSINESS_PROFILE.phone + ' for help.'
      });
    }
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.map(function (entry) {
      return { role: entry.role, content: entry.content.slice(0, MAX_MESSAGE_LENGTH) };
    }),
    { role: 'user', content: message }
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 20000);

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.4,
        max_tokens: 400
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI API error:', response.status, errText);
      return jsonResponse(502, {
        error: 'The assistant is having trouble responding right now. Please try again, or call ' + BUSINESS_PROFILE.phone + '.'
      });
    }

    const data = await response.json();
    const reply =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';

    if (!reply) {
      return jsonResponse(502, {
        error: 'The assistant could not generate a response. Please try again, or call ' + BUSINESS_PROFILE.phone + '.'
      });
    }

    return jsonResponse(200, { reply: reply.trim() });
  } catch (err) {
    console.error('Chat function error:', err);
    const message =
      err && err.name === 'AbortError'
        ? 'The assistant took too long to respond. Please try again, or call ' + BUSINESS_PROFILE.phone + '.'
        : 'Something went wrong reaching the assistant. Please try again, or call ' + BUSINESS_PROFILE.phone + '.';
    return jsonResponse(504, { error: message });
  }
};
