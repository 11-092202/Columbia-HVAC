/* ==========================================================================
   Columbia HVAC Co. — Chat availability status endpoint
   --------------------------------------------------------------------------
   GET /api/chat-status -> /.netlify/functions/chat-status

   Tiny public endpoint the frontend polls once on page load to decide
   whether to render the chat widget at all. It only ever returns a
   boolean — never a secret, never the API key, never configuration
   details. The REAL enforcement of CHATBOT_ENABLED happens independently
   inside chat.js on every request, so this endpoint being spoofed or
   skipped by a malicious client changes nothing about whether /api/chat
   will actually respond.
   ========================================================================== */

function isChatbotEnabled() {
  return String(process.env.CHATBOT_ENABLED || 'true').toLowerCase() !== 'false';
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Cache-Control': 'no-store' }, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: 'Method not allowed.' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ enabled: isChatbotEnabled() })
  };
};
