/* ==========================================================================
   Columbia HVAC Co. — AI Assistant
   --------------------------------------------------------------------------
   Builds the chat widget UI (launcher button + panel), and wires it up to
   the server-side Netlify Function at /api/chat. No API key or business
   logic lives in this file — it only sends the visitor's message (plus a
   short in-memory history) to the server and renders whatever comes back.

   Public API (kept for backwards compatibility / other scripts):
     window.ColumbiaHVACAssistant.openAIAssistant()
     window.ColumbiaHVACAssistant.closeAIAssistant()
     window.ColumbiaHVACAssistant.onUserMessage(fn)
   ========================================================================== */
(function () {
  'use strict';

  var CHAT_ENDPOINT = '/api/chat';
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
        '<div class="ai-messages" role="log" aria-live="polite" aria-relevant="additions" data-ai-messages></div>' +
        '<div class="ai-quick-actions" data-ai-quick-actions>' +
          '<button type="button" data-ai-quick="My furnace needs repair">My furnace needs repair</button>' +
          '<button type="button" data-ai-quick="My A/C isn\'t cooling">My A/C isn\'t cooling</button>' +
          '<button type="button" data-ai-quick="This is an emergency">This is an emergency</button>' +
          '<button type="button" data-ai-quick="I want a free estimate">I want a free estimate</button>' +
        '</div>' +
      '</div>' +
      '<form class="ai-panel-footer" data-ai-input-form>' +
        '<input type="text" name="message" placeholder="Type a message..." aria-label="Type your message" autocomplete="off" maxlength="1000">' +
        '<button type="submit" class="send-btn" aria-label="Send message">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
        '</button>' +
      '</form>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    return { launcher: launcher, panel: panel };
  }

  /* ---- Enable/disable switch ----
     The chatbot can be fully turned off via the CHATBOT_ENABLED server
     environment variable. The AUTHORITATIVE check happens independently
     inside netlify/functions/chat.js on every request — that still refuses
     POST /api/chat while disabled even if this frontend check is bypassed,
     spoofed, or simply never runs (e.g. JS disabled, direct API call).
     This check only decides whether to show the widget at all. If the
     status check itself fails (e.g. offline, function not yet available),
     we fail OPEN here and still render the widget — the backend will
     correctly refuse the request if the assistant is actually disabled, so
     failing open here never allows chat to work when it shouldn't. */
  function initAIAssistant(enabled) {
    if (enabled === false) return; // Chatbot disabled: render nothing.

    var refs = buildMarkup();
    var launcher = refs.launcher;
    var panel = refs.panel;
    var closeBtn = panel.querySelector('.ai-panel-close');
    var inputForm = panel.querySelector('[data-ai-input-form]');
    var input = panel.querySelector('input[name="message"]');
    var sendBtn = inputForm.querySelector('.send-btn');
    var messagesEl = panel.querySelector('[data-ai-messages]');
    var quickActionsEl = panel.querySelector('[data-ai-quick-actions]');

    /* In-memory conversation history for this page session only. */
    var history = [];
    var isSending = false;
    var hasGreeted = false;

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendMessage(role, text) {
      var row = document.createElement('div');
      row.className = 'ai-msg ai-msg--' + role;

      var bubble = document.createElement('div');
      bubble.className = 'ai-msg-bubble';
      bubble.textContent = text;
      row.appendChild(bubble);

      messagesEl.appendChild(row);
      scrollToBottom();
      return row;
    }

    function appendError(text) {
      var row = document.createElement('div');
      row.className = 'ai-msg ai-msg--error';
      row.setAttribute('role', 'alert');

      var bubble = document.createElement('div');
      bubble.className = 'ai-msg-bubble';
      bubble.textContent = text;
      row.appendChild(bubble);

      messagesEl.appendChild(row);
      scrollToBottom();
    }

    function showGreeting() {
      if (hasGreeted) return;
      hasGreeted = true;
      appendMessage(
        'assistant',
        'Hi, I\u2019m the Columbia HVAC Co. assistant. Ask me about our services, service area, ' +
          'or how to get in touch \u2014 or use a quick option below. For anything urgent, please ' +
          'call 573-204-6161.'
      );
    }

    function setTyping(isTyping) {
      var existing = messagesEl.querySelector('[data-ai-typing]');
      if (isTyping) {
        if (existing) return;
        var row = document.createElement('div');
        row.className = 'ai-msg ai-msg--assistant ai-msg--typing';
        row.setAttribute('data-ai-typing', '');
        row.setAttribute('aria-label', 'Assistant is typing');
        row.innerHTML =
          '<div class="ai-msg-bubble ai-typing-dots"><span></span><span></span><span></span></div>';
        messagesEl.appendChild(row);
        scrollToBottom();
      } else if (existing) {
        existing.remove();
      }
    }

    function setSending(sending) {
      isSending = sending;
      input.disabled = sending;
      sendBtn.disabled = sending;
      sendBtn.setAttribute('aria-busy', sending ? 'true' : 'false');
    }

    function sendToAssistant(text) {
      /* Prevent accidental duplicate/overlapping requests. */
      if (isSending) return;

      appendMessage('user', text);
      history.push({ role: 'user', content: text });
      setSending(true);
      setTyping(true);

      fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          /* Send prior turns only (exclude the message just added). */
          history: history.slice(0, -1).slice(-12)
        })
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () { return {}; })
            .then(function (data) {
              if (!response.ok) {
                throw new Error((data && data.error) || 'The assistant is unavailable right now.');
              }
              return data;
            });
        })
        .then(function (data) {
          var reply = data && data.reply ? data.reply : '';
          if (!reply) throw new Error('The assistant did not return a response.');
          history.push({ role: 'assistant', content: reply });
          appendMessage('assistant', reply);
        })
        .catch(function (err) {
          appendError(
            (err && err.message) ||
              'Sorry, something went wrong reaching the assistant. Please try again or call 573-204-6161.'
          );
        })
        .finally(function () {
          setTyping(false);
          setSending(false);
          input.focus();
        });
    }

    function dispatchMessage(text) {
      messageHandlers.forEach(function (fn) {
        try { fn(text); } catch (err) { /* isolate handler errors from UI */ }
      });
      sendToAssistant(text);
    }

    function openAIAssistant() {
      panel.classList.add('is-open');
      launcher.setAttribute('aria-expanded', 'true');
      showGreeting();
      window.setTimeout(function () { input && input.focus(); }, 200);
    }
    function closeAIAssistant() {
      panel.classList.remove('is-open');
      launcher.setAttribute('aria-expanded', 'false');
      launcher.focus();
    }
    function toggleAIAssistant() {
      panel.classList.contains('is-open') ? closeAIAssistant() : openAIAssistant();
    }

    launcher.addEventListener('click', toggleAIAssistant);
    closeBtn.addEventListener('click', closeAIAssistant);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) closeAIAssistant();
    });

    quickActionsEl.querySelectorAll('[data-ai-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        dispatchMessage(btn.getAttribute('data-ai-quick'));
      });
    });

    inputForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSending) return; // guard against duplicate submits (e.g. double Enter)
      var text = input.value.trim();
      if (!text) return; // handle empty messages
      dispatchMessage(text);
      input.value = '';
    });

    /* Public API for other scripts / future integrations */
    window.ColumbiaHVACAssistant = {
      openAIAssistant: openAIAssistant,
      closeAIAssistant: closeAIAssistant,
      onUserMessage: function (fn) {
        if (typeof fn === 'function') messageHandlers.push(fn);
      }
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/chat-status')
      .then(function (response) { return response.ok ? response.json() : { enabled: true }; })
      .catch(function () { return { enabled: true }; }) // network/offline: fail open (see comment above)
      .then(function (data) {
        initAIAssistant(data && data.enabled === false ? false : true);
      });
  });
})();
