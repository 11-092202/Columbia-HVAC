/* ==========================================================================
   Columbia HVAC Co. — AI Assistant
   --------------------------------------------------------------------------
   Builds the UI shell (unchanged look/markup from the original scaffold),
   and sends visitor messages to a real backend: a Netlify Function
   (netlify/functions/assistant.js) that proxies to Anthropic's Claude API.
   The API key lives only in that server-side function via the
   ANTHROPIC_API_KEY environment variable — it is never present in this
   file or any other client-side code.

   Integration points (unchanged, still available for other scripts):
     window.ColumbiaHVACAssistant.openAIAssistant()   -> opens the panel
     window.ColumbiaHVACAssistant.closeAIAssistant()  -> closes the panel
     window.ColumbiaHVACAssistant.onUserMessage(fn)   -> register a handler
        that receives the raw text the visitor typed/clicked.
   ========================================================================== */
(function () {
  'use strict';

  var ASSISTANT_ENDPOINT = '/.netlify/functions/assistant';
  var FALLBACK_ERROR = "Sorry, something went wrong. Please try again or call 573-204-6161.";

  var QUICK_ACTION_TEXT = {
    'furnace-repair': 'My furnace needs repair.',
    'ac-repair': "My A/C isn't cooling.",
    'emergency': 'This is an emergency.',
    'estimate': 'I want a free estimate.'
  };

  var messageHandlers = [];

  function buildMarkup() {
    var launcher = document.createElement('button');
    launcher.className = 'ai-assistant-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'ai-assistant-panel');
    launcher.setAttribute('aria-label', 'Open HVAC help assistant');
    launcher.innerHTML =
      '<span class="pulse-ring" aria-hidden="true"></span>' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' +
      '</svg>';

    var panel = document.createElement('div');
    panel.className = 'ai-assistant-panel';
    panel.id = 'ai-assistant-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'ai-assistant-title');
    panel.innerHTML =
      '<div class="ai-panel-header">' +
        '<span class="icon-circle" aria-hidden="true">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
        '</span>' +
        '<span>' +
          '<h4 id="ai-assistant-title">Columbia HVAC Assistant</h4>' +
          '<p>Ask about a service or start a request</p>' +
        '</span>' +
        '<button type="button" class="ai-panel-close" aria-label="Close assistant">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ai-panel-body">' +
        '<div class="ai-placeholder-msg">' +
          'Hi, I\'m the Columbia HVAC Co. assistant. Ask me a question, or for immediate help ' +
          '<a href="tel:5732046161" style="color: var(--color-flame-600); font-weight:700;">call 573-204-6161</a>.' +
        '</div>' +
        '<div class="ai-quick-actions">' +
          '<button type="button" data-ai-quick="furnace-repair">My furnace needs repair</button>' +
          '<button type="button" data-ai-quick="ac-repair">My A/C isn\'t cooling</button>' +
          '<button type="button" data-ai-quick="emergency">This is an emergency</button>' +
          '<button type="button" data-ai-quick="estimate">I want a free estimate</button>' +
        '</div>' +
        '<div class="ai-chat-log" aria-live="polite"></div>' +
      '</div>' +
      '<form class="ai-panel-footer" data-ai-input-form>' +
        '<input type="text" name="message" placeholder="Type a message..." aria-label="Message" autocomplete="off">' +
        '<button type="submit" class="send-btn" aria-label="Send">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    return { launcher: launcher, panel: panel };
  }

  document.addEventListener('DOMContentLoaded', function () {
    var refs = buildMarkup();
    var launcher = refs.launcher;
    var panel = refs.panel;
    var closeBtn = panel.querySelector('.ai-panel-close');
    var inputForm = panel.querySelector('[data-ai-input-form]');
    var input = panel.querySelector('input[name="message"]');
    var sendBtn = panel.querySelector('.send-btn');
    var chatLog = panel.querySelector('.ai-chat-log');
    var quickActionBtns = panel.querySelectorAll('[data-ai-quick]');
    var isWaiting = false;

    function openAIAssistant() {
      panel.classList.add('is-open');
      launcher.setAttribute('aria-expanded', 'true');
      window.setTimeout(function () { input && input.focus(); }, 200);
    }
    function closeAIAssistant() {
      panel.classList.remove('is-open');
      launcher.setAttribute('aria-expanded', 'false');
    }
    function toggleAIAssistant() {
      panel.classList.contains('is-open') ? closeAIAssistant() : openAIAssistant();
    }

    function scrollToBottom() {
      var body = panel.querySelector('.ai-panel-body');
      if (body) body.scrollTop = body.scrollHeight;
    }

    function appendMessage(text, role) {
      var bubble = document.createElement('div');
      bubble.className = 'ai-message ' + role;
      bubble.textContent = text;
      chatLog.appendChild(bubble);
      scrollToBottom();
      return bubble;
    }

    function appendTypingIndicator() {
      var bubble = document.createElement('div');
      bubble.className = 'ai-message assistant typing';
      bubble.setAttribute('aria-label', 'Assistant is typing');
      bubble.innerHTML =
        '<span class="ai-typing-dot"></span><span class="ai-typing-dot"></span><span class="ai-typing-dot"></span>';
      chatLog.appendChild(bubble);
      scrollToBottom();
      return bubble;
    }

    function setWaiting(waiting) {
      isWaiting = waiting;
      if (input) input.disabled = waiting;
      if (sendBtn) sendBtn.disabled = waiting;
      quickActionBtns.forEach(function (btn) { btn.disabled = waiting; });
    }

    /* Sends the visitor's message to the Netlify Function backend
       (netlify/functions/assistant.js), which proxies to Anthropic's
       Claude API using a server-side API key. */
    function dispatchMessage(text) {
      if (isWaiting || !text) return;

      messageHandlers.forEach(function (fn) {
        try { fn(text); } catch (err) { /* isolate handler errors from UI */ }
      });

      appendMessage(text, 'user');
      setWaiting(true);
      var typingBubble = appendTypingIndicator();

      fetch(ASSISTANT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
        .then(function (response) {
          return response.json().catch(function () { return {}; }).then(function (data) {
            if (!response.ok) throw new Error((data && data.error) || FALLBACK_ERROR);
            return data;
          });
        })
        .then(function (data) {
          typingBubble.remove();
          appendMessage(data.reply || FALLBACK_ERROR, 'assistant');
        })
        .catch(function (err) {
          typingBubble.remove();
          appendMessage((err && err.message) || FALLBACK_ERROR, 'assistant error');
        })
        .finally(function () {
          setWaiting(false);
          window.setTimeout(function () { input && input.focus(); }, 50);
        });
    }

    launcher.addEventListener('click', toggleAIAssistant);
    closeBtn.addEventListener('click', closeAIAssistant);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAIAssistant();
    });

    quickActionBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-ai-quick');
        dispatchMessage(QUICK_ACTION_TEXT[key] || key);
      });
    });

    inputForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      dispatchMessage(text);
      input.value = '';
    });

    /* Public API */
    window.ColumbiaHVACAssistant = {
      openAIAssistant: openAIAssistant,
      closeAIAssistant: closeAIAssistant,
      onUserMessage: function (fn) {
        if (typeof fn === 'function') messageHandlers.push(fn);
      }
    };
  });
})();
