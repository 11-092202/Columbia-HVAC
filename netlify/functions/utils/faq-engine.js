/* ==========================================================================
   Zero-dependency FAQ chat engine
   --------------------------------------------------------------------------
   A drop-in alternative to the OpenAI-backed assistant. No external API,
   no API key, no per-message cost, and no network dependency at request
   time — every answer is either a fixed string built from
   business-data.js, or the fallback "please call us" message. It can
   never hallucinate a fact, because it never generates text; it only
   picks the closest pre-written answer.

   How matching works: the visitor's message is normalized (lowercased,
   punctuation stripped) and scored against a bank of {triggers, answer}
   entries built from BUSINESS_PROFILE. Longer/more specific trigger
   phrases score higher than short generic words, so "how much does a
   furnace repair cost" matches the pricing entry, not just "furnace".
   Safety-related messages (gas smell, smoke, carbon monoxide, etc.) are
   checked FIRST and always win, regardless of other matches.

   This file only reads BUSINESS_PROFILE — it works automatically for
   both the real site and the demo build (whichever business-data.js is
   present at build/run time), with no changes needed here.
   ========================================================================== */

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildQaBank(b) {
  var bank = [];

  bank.push({
    id: 'safety',
    priority: true, // checked before everything else
    triggers: [
      'gas smell', 'smell gas', 'smell of gas', 'smoke', 'sparking', 'sparks',
      'carbon monoxide', 'co alarm', 'co detector', 'gas leak', 'fire',
      'burning smell'
    ],
    answer:
      'If you smell gas, see smoke/sparks, or your carbon monoxide alarm is going off, ' +
      'please prioritize safety first — leave the area and/or turn off the system if it is ' +
      'safe to do so — then call ' + b.phone + ' right away. ' + b.name + ' offers 24/7 ' +
      'emergency service.'
  });

  bank.push({
    id: 'greeting',
    triggers: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    answer:
      'Hi! I’m the ' + b.name + ' assistant. Ask me about our services, service area, hours, ' +
      'or how to get in touch.'
  });

  bank.push({
    id: 'thanks',
    triggers: ['thank you', 'thanks', 'appreciate it', 'thank u'],
    answer: 'You’re welcome! Is there anything else I can help with?'
  });

  bank.push({
    id: 'hours',
    triggers: ['hours', 'open', 'what time', 'office hours', 'when are you open'],
    answer: b.hours
  });

  bank.push({
    id: 'service-area',
    triggers: [
      'service area', 'areas do you serve', 'do you serve', 'where are you located',
      'your location', 'your address', 'what areas', 'which areas'
    ],
    answer:
      'We serve ' + b.serviceAreas.join(', ') + '. Our address is ' + b.address + '.'
  });

  bank.push({
    id: 'contact',
    triggers: [
      'contact', 'phone number', 'call you', 'reach you', 'get in touch',
      'how do i contact', 'how can i reach'
    ],
    answer: b.howToContact
  });

  bank.push({
    id: 'guarantee',
    triggers: ['guarantee', 'warranty', 'satisfaction', 'promise'],
    answer: b.guarantees.join(' ')
  });

  bank.push({
    id: 'credentials',
    triggers: ['certified', 'licensed', 'qualified', 'credentials', 'experience'],
    answer: b.credentials
  });

  bank.push({
    id: 'price',
    triggers: ['price', 'cost', 'how much', 'estimate', 'quote', 'pricing'],
    answer:
      'We don’t list exact pricing online since it depends on your system and situation, ' +
      'but we offer free estimates. Call ' + b.phone + ' or use the contact form to request one.'
  });

  // One entry per service, built directly from business-data.js — no
  // service-specific facts are hardcoded here.
  b.services.forEach(function (service) {
    var words = normalize(service.name).split(' ').filter(Boolean);
    bank.push({
      id: 'service:' + service.name,
      triggers: [normalize(service.name)].concat(words),
      answer:
        service.summary + ' Call ' + b.phone + ' or use the contact form to get started.'
    });
  });

  return bank;
}

function scoreEntry(normalizedMessage, entry) {
  var score = 0;
  entry.triggers.forEach(function (trigger) {
    if (!trigger) return;
    if (normalizedMessage.indexOf(trigger) !== -1) {
      // Longer/more specific phrases score higher than short single words,
      // so multi-word matches win over an incidental one-word overlap.
      score += trigger.split(' ').length;
    }
  });
  return score;
}

/* Returns a plain-text reply string. Never throws, never calls the
   network, never returns anything not explicitly written in this file
   or derived from BUSINESS_PROFILE. */
function getFaqReply(message, businessProfile) {
  var b = businessProfile;
  var normalized = normalize(message);
  if (!normalized) {
    return 'Could you tell me a bit more about what you need help with?';
  }

  var bank = buildQaBank(b);

  // Safety entries always win if triggered, regardless of score.
  var safetyEntry = bank.filter(function (e) { return e.priority; })[0];
  if (safetyEntry && scoreEntry(normalized, safetyEntry) > 0) {
    return safetyEntry.answer;
  }

  var best = null;
  var bestScore = 0;
  bank.forEach(function (entry) {
    if (entry.priority) return; // already checked above
    var score = scoreEntry(normalized, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  });

  if (best && bestScore > 0) {
    return best.answer;
  }

  return (
    'I don’t have specific information about that. For a direct answer, please call ' +
    b.phone + ' or use our contact form.'
  );
}

module.exports = { getFaqReply, buildQaBank, normalize };
