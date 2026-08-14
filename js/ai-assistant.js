/* ==========================================================================
   Columbia HVAC Co. — AI Assistant (frontend scaffold only)
   --------------------------------------------------------------------------
   This module builds the UI shell, open/close behavior, and a single
   integration point for a future AI backend. It does NOT call any AI API
   and does NOT simulate a conversation. It is intentionally isolated from
   the rest of the site so a developer can wire up a real assistant later
   without touching navigation.js / main.js.

   Integration point:
     window.ColumbiaHVACAssistant.openAIAssistant()   -> opens the panel
     window.ColumbiaHVACAssistant.closeAIAssistant()  -> closes the panel
     window.ColumbiaHVACAssistant.onUserMessage(fn)   -> register a handler
        that receives the raw text the visitor typed/clicked, so a future
        backend (e.g. a hosted LLM endpoint) can be dropped in with one call.
   ========================================================================== */
(function () {
  'use strict';

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
          'Hi, I\'m the Columbia HVAC Co. assistant (coming soon). For immediate help, please ' +
          '<a href="tel:5732046161" style="color: var(--color-flame-600); font-weight:700;">call 573-204-6161</a> ' +
          'or use the quick options below.' +
        '</div>' +
        '<div class="ai-quick-actions">' +
          '<button type="button" data-ai-quick="furnace-repair">My furnace needs repair</button>' +
          '<button type="button" data-ai-quick="ac-repair">My A/C isn\'t cooling</button>' +
          '<button type="button" data-ai-quick="emergency">This is an emergency</button>' +
          '<button type="button" data-ai-quick="estimate">I want a free estimate</button>' +
        '</div>' +
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

    function dispatchMessage(text) {
      messageHandlers.forEach(function (fn) {
        try { fn(text); } catch (err) { /* isolate handler errors from UI */ }
      });
      /* No backend wired up: this is where a future call such as
         fetch('/api/assistant', {method:'POST', body: JSON.stringify({message:text})})
         would be added. Left intentionally unimplemented. */
    }

    launcher.addEventListener('click', toggleAIAssistant);
    closeBtn.addEventListener('click', closeAIAssistant);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAIAssistant();
    });

    panel.querySelectorAll('[data-ai-quick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        dispatchMessage(btn.getAttribute('data-ai-quick'));
      });
    });

    inputForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      dispatchMessage(text);
      input.value = '';
    });

    /* Public API for a future integration */
    window.ColumbiaHVACAssistant = {
      openAIAssistant: openAIAssistant,
      closeAIAssistant: closeAIAssistant,
      onUserMessage: function (fn) {
        if (typeof fn === 'function') messageHandlers.push(fn);
      }
    };
  });
})();
