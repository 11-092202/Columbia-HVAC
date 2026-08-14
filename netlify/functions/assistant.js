/* ==========================================================================
   Columbia HVAC Co. — AI Assistant backend (Netlify Function)
   --------------------------------------------------------------------------
   Proxies chat messages from the site's assistant widget to Anthropic's
   Claude API. The API key is never exposed to the browser: it is read
   here, server-side, from the ANTHROPIC_API_KEY environment variable
   configured in the Netlify dashboard (Site settings > Environment
   variables). Do not hardcode a key or commit one to the repository.

   Request:  POST { "message": "<visitor text>" }
   Response: 200 { "reply": "<assistant text>" }
             4xx/5xx { "error": "<user-facing message>" }
   ========================================================================== */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022';
const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT =
  "You are the virtual assistant embedded on the Columbia HVAC Co. website, a " +
  "residential and commercial HVAC company serving Columbia, Missouri and the " +
  "surrounding area (1403 W Ash St, Columbia, MO 65203; phone 573-204-6161; " +
  "available 24/7 for emergencies). Services include furnace repair, air " +
  "conditioning repair and installation, air duct cleaning, emergency HVAC " +
  "service, and heating/air conditioning contracting. Answer visitor questions " +
  "helpfully and concisely (2-4 sentences, under 120 words). Encourage " +
  "visitors to call 573-204-6161 or use the site's contact form to schedule " +
  "service. Never invent specific prices, appointment availability, or " +
  "guarantees you cannot confirm — direct those questions to a phone call.";

function jsonResponse(statusCode, payload) {
  return {
    statusCode: statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not configured.');
    return jsonResponse(500, {
      error: "The assistant isn't configured yet. Please call 573-204-6161 for help."
    });
  }

  let message;
  try {
    const parsed = JSON.parse(event.body || '{}');
    message = typeof parsed.message === 'string' ? parsed.message.trim() : '';
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid request.' });
  }

  if (!message) {
    return jsonResponse(400, { error: 'Please enter a message.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse(400, { error: 'That message is too long. Please shorten it and try again.' });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return jsonResponse(502, {
        error: "Sorry, the assistant is temporarily unavailable. Please call 573-204-6161."
      });
    }

    const data = await response.json();
    const reply =
      data && Array.isArray(data.content) && data.content[0] && data.content[0].text
        ? data.content[0].text.trim()
        : "Sorry, I couldn't come up with a response. Please call 573-204-6161.";

    return jsonResponse(200, { reply: reply });
  } catch (err) {
    console.error('Assistant function error:', err);
    return jsonResponse(500, {
      error: 'Something went wrong. Please try again or call 573-204-6161.'
    });
  }
};
