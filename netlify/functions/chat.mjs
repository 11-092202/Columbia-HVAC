/* ==========================================================================
   Columbia HVAC Co. — AI Assistant Netlify Function
   --------------------------------------------------------------------------
   Server-side endpoint the frontend chat widget talks to. It keeps the AI
   API key out of the browser: the client only ever calls this function
   (POST /api/chat -> /.netlify/functions/chat), and this function is the
   only place that talks to the OpenAI API, using credentials injected by
   Netlify AI Gateway (OPENAI_API_KEY / OPENAI_BASE_URL).
   ========================================================================== */

import { buildSystemPrompt } from './business-data.mjs';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_HISTORY_MESSAGES = 12; // limit context sent per request
const MAX_MESSAGE_LENGTH = 1000;

function jsonResponse(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function isValidHistoryEntry(entry) {
  return (
    entry &&
    (entry.role === 'user' || entry.role === 'assistant') &&
    typeof entry.content === 'string'
  );
}

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return jsonResponse(204, {});
  }

  if (req.method !== 'POST') {
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
    payload = await req.json();
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

  const openaiUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1') + '/chat/completions';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 20000);

    const response = await fetch(openaiUrl, {
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

export const config = {
  path: '/api/chat'
};
