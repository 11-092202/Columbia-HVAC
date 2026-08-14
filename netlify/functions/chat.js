/* ==========================================================================
   Columbia HVAC Co. — AI Assistant Netlify Function
   --------------------------------------------------------------------------
   Server-side endpoint the frontend chat widget talks to. It keeps the AI
   API key out of the browser: the client only ever calls this function
   (POST /api/chat -> /.netlify/functions/chat), and this function is the
   only place that talks to the OpenAI API using a secret stored in a
   Netlify environment variable (OPENAI_API_KEY).
   ========================================================================== */

const { buildSystemPrompt } = require('./business-data');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_HISTORY_MESSAGES = 12; // limit context sent per request
const MAX_MESSAGE_LENGTH = 1000;

function jsonResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
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

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not configured.');
    return jsonResponse(500, {
      error: 'The assistant is not configured yet. Please call 573-204-6161 for help.'
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
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
        error: 'The assistant is having trouble responding right now. Please try again, or call 573-204-6161.'
      });
    }

    const data = await response.json();
    const reply =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : '';

    if (!reply) {
      return jsonResponse(502, {
        error: 'The assistant could not generate a response. Please try again, or call 573-204-6161.'
      });
    }

    return jsonResponse(200, { reply: reply.trim() });
  } catch (err) {
    console.error('Chat function error:', err);
    const message =
      err && err.name === 'AbortError'
        ? 'The assistant took too long to respond. Please try again, or call 573-204-6161.'
        : 'Something went wrong reaching the assistant. Please try again, or call 573-204-6161.';
    return jsonResponse(504, { error: message });
  }
};
