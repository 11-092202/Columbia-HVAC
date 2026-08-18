/* ==========================================================================
   Columbia HVAC Co. — Main interactions
   Scroll-reveal animation, smooth-scroll anchors, contact form UX, year stamp
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- Scroll-reveal (IntersectionObserver) ---- */
    var revealEls = document.querySelectorAll('[data-reveal]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
    } else if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var delay = entry.target.getAttribute('data-reveal-delay') || (i * 60);
            setTimeout(function () {
              entry.target.classList.add('is-revealed');
            }, Number(delay));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

      revealEls.forEach(function (el) { observer.observe(el); });

      /* Stagger children of [data-reveal-group] automatically */
      document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
        Array.prototype.forEach.call(group.children, function (child, idx) {
          if (child.hasAttribute('data-reveal')) {
            child.setAttribute('data-reveal-delay', idx * 90);
          }
        });
      });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-revealed'); });
    }

    /* ---- Smooth-scroll for in-page anchors ---- */
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(link.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });

    /* ---- Contact / lead forms ----
       Real client + server validated submission to the Netlify Function at
       POST /api/contact (see netlify/functions/contact.js). Every page
       with a [data-lead-form] (home, about, contact, and all 6 service
       pages) uses this exact same handler, since they all share the same
       field markup (name, phone, email, optional subject, message).

       NOTE on validation duplication: the email/phone rules below
       intentionally mirror netlify/functions/utils/validate.js. This is a
       plain script-tag site with no build step/bundler, so browser code
       and Node function code can't literally share one file — the server
       copy is the authoritative one; this copy only exists to give
       visitors instant feedback without a round trip. */

    var LEAD_EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

    function isValidEmail(value) {
      var v = (value || '').trim();
      return v.length > 0 && v.length <= 254 && LEAD_EMAIL_RE.test(v);
    }

    function isValidPhone(value) {
      var v = (value || '').trim();
      if (!v) return false;
      var stripped = v.replace(/[^\d+]/g, '');
      var digitsOnly = stripped.replace(/\+/g, '');
      var looksNumeric = /^\+?\d+$/.test(stripped);
      return looksNumeric && digitsOnly.length >= 7 && digitsOnly.length <= 15;
    }

    function validateLeadFields(form) {
      var errors = {};
      var nameEl = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var messageEl = form.querySelector('[name="message"]');

      var name = (nameEl && nameEl.value || '').trim();
      if (!name) errors.name = 'Please enter your name.';
      else if (name.length < 2) errors.name = 'Name looks too short.';

      var email = (emailEl && emailEl.value || '').trim();
      if (!email) errors.email = 'Please enter your email address.';
      else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';

      var phone = (phoneEl && phoneEl.value || '').trim();
      if (!phone) errors.phone = 'Please enter your phone number.';
      else if (!isValidPhone(phone)) errors.phone = 'Please enter a valid phone number.';

      var message = (messageEl && messageEl.value || '').trim();
      if (!message) errors.message = "Please tell us what you need help with.";
      else if (message.length < 5) errors.message = 'Please add a few more details.';

      return errors;
    }

    /* Builds (once per form) the hidden anti-spam honeypot field, the
       inline per-field error <small> elements, and a form-level error
       banner — all via safe DOM APIs (createElement + textContent), never
       innerHTML, and all styled to match the existing design via CSS
       classes already scoped in css/components.css. */
    function enhanceLeadForm(form) {
      form.setAttribute('novalidate', 'novalidate');
      form.dataset.renderedAt = String(Date.now());

      /* Honeypot field — invisible to real visitors, commonly auto-filled
         by unsophisticated spam bots. Positioned off-screen rather than
         display:none, and left out of the tab order / accessibility tree. */
      var honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.className = 'hp-field';
      honeypot.setAttribute('tabindex', '-1');
      honeypot.setAttribute('autocomplete', 'off');
      honeypot.setAttribute('aria-hidden', 'true');
      form.appendChild(honeypot);

      /* Inline error <small> after each validated field. */
      ['name', 'phone', 'email', 'message'].forEach(function (fieldName) {
        var input = form.querySelector('[name="' + fieldName + '"]');
        if (!input) return;
        var errorId = 'error-' + fieldName;
        var errorEl = document.createElement('small');
        errorEl.className = 'field-error';
        errorEl.id = errorId;
        errorEl.setAttribute('role', 'alert');
        input.insertAdjacentElement('afterend', errorEl);
        input.setAttribute('aria-describedby', errorId);
        input.setAttribute('aria-invalid', 'false');
      });

      /* Form-level error banner (network/server errors, rate limiting). */
      var errorBanner = document.createElement('div');
      errorBanner.className = 'form-error-banner';
      errorBanner.setAttribute('role', 'alert');
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.insertAdjacentElement('beforebegin', errorBanner);
      else form.appendChild(errorBanner);

      return { honeypot: honeypot, errorBanner: errorBanner };
    }

    function setFieldError(form, fieldName, message) {
      var input = form.querySelector('[name="' + fieldName + '"]');
      var errorEl = form.querySelector('#error-' + fieldName);
      var group = input && input.closest('.form-group');
      if (errorEl) errorEl.textContent = message || '';
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (group) group.classList.toggle('has-error', !!message);
    }

    function clearAllFieldErrors(form) {
      ['name', 'phone', 'email', 'message'].forEach(function (fieldName) {
        setFieldError(form, fieldName, '');
      });
    }

    function setFormBusy(form, submitBtn, busy) {
      form.dataset.submitting = busy ? 'true' : 'false';
      submitBtn.disabled = busy;
      submitBtn.classList.toggle('is-loading', busy);
      submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      if (busy) {
        submitBtn.dataset.originalLabel = submitBtn.textContent;
        submitBtn.textContent = 'Sending…';
      } else if (submitBtn.dataset.originalLabel) {
        submitBtn.textContent = submitBtn.dataset.originalLabel;
      }
    }

    document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      var refs = enhanceLeadForm(form);
      var submitBtn = form.querySelector('button[type="submit"]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        /* Prevent accidental double submission (double-click, double Enter,
           or a slow network causing a second submit before the first
           finishes). */
        if (form.dataset.submitting === 'true') return;

        refs.errorBanner.textContent = '';
        clearAllFieldErrors(form);

        var errors = validateLeadFields(form);
        if (Object.keys(errors).length > 0) {
          Object.keys(errors).forEach(function (fieldName) {
            setFieldError(form, fieldName, errors[fieldName]);
          });
          var firstInvalid = form.querySelector('[aria-invalid="true"]');
          if (firstInvalid) firstInvalid.focus();
          refs.errorBanner.textContent = 'Please fix the highlighted fields below.';
          return; // Never calls the network with known-invalid input.
        }

        var subjectEl = form.querySelector('[name="subject"]');
        var payload = {
          name: form.querySelector('[name="name"]').value.trim(),
          email: form.querySelector('[name="email"]').value.trim(),
          phone: form.querySelector('[name="phone"]').value.trim(),
          message: form.querySelector('[name="message"]').value.trim(),
          subject: subjectEl ? subjectEl.value.trim() : '',
          website: refs.honeypot.value, // expected empty; server checks this
          renderedAt: Number(form.dataset.renderedAt) || Date.now(),
          page: window.location.pathname
        };

        setFormBusy(form, submitBtn, true);

        fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (response) {
            return response
              .json()
              .catch(function () { return {}; })
              .then(function (data) { return { ok: response.ok, status: response.status, data: data }; });
          })
          .then(function (result) {
            if (result.ok && result.data && result.data.success) {
              var successEl = form.parentElement.querySelector('.form-success');
              form.reset();
              form.style.display = 'none';
              if (successEl) successEl.classList.add('is-visible');
              return;
            }

            if (result.status === 400 && result.data && result.data.fieldErrors) {
              Object.keys(result.data.fieldErrors).forEach(function (fieldName) {
                setFieldError(form, fieldName, result.data.fieldErrors[fieldName]);
              });
              var firstInvalid = form.querySelector('[aria-invalid="true"]');
              if (firstInvalid) firstInvalid.focus();
            }

            refs.errorBanner.textContent =
              (result.data && result.data.error) ||
              'Something went wrong sending your message. Please try again, or call 573-204-6161.';
          })
          .catch(function () {
            refs.errorBanner.textContent =
              'We could not reach the server. Please check your connection and try again, or call 573-204-6161.';
          })
          .finally(function () {
            setFormBusy(form, submitBtn, false);
          });
      });
    });

    /* ---- Footer year ---- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
