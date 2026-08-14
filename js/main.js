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
       Forms submit to Netlify Forms (data-netlify="true") via AJAX so the
       user stays on the page. Client-side validation runs first with
       inline, per-field messages; the submit button is disabled while the
       request is in flight to prevent duplicate submissions. */
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var PHONE_RE = /^[0-9()+\-.\s]{7,}$/;

    var VALIDATORS = {
      name: function (value) {
        if (!value.trim()) return 'Please enter your name.';
        if (value.trim().length < 2) return 'Please enter your full name.';
        return '';
      },
      phone: function (value) {
        if (!value.trim()) return 'Please enter a phone number.';
        if (!PHONE_RE.test(value.trim())) return 'Please enter a valid phone number.';
        return '';
      },
      email: function (value) {
        if (!value.trim()) return 'Please enter your email address.';
        if (!EMAIL_RE.test(value.trim())) return 'Please enter a valid email address (e.g. you@example.com).';
        return '';
      },
      message: function (value) {
        if (!value.trim()) return 'Please tell us a bit about what you need help with.';
        if (value.trim().length < 10) return 'Please add a few more details so we can help.';
        return '';
      }
    };

    function fieldError(form, fieldName) {
      return form.querySelector('#error-' + fieldName);
    }

    function setFieldError(form, fieldName, message) {
      var field = form.elements[fieldName];
      var errorEl = fieldError(form, fieldName);
      if (!field) return;
      if (message) {
        field.classList.add('is-invalid');
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.classList.add('is-visible');
        }
      } else {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.classList.remove('is-visible');
        }
      }
    }

    function validateForm(form) {
      var firstInvalid = null;
      Object.keys(VALIDATORS).forEach(function (fieldName) {
        var field = form.elements[fieldName];
        if (!field) return;
        var message = VALIDATORS[fieldName](field.value || '');
        setFieldError(form, fieldName, message);
        if (message && !firstInvalid) firstInvalid = field;
      });
      return firstInvalid;
    }

    function encodeFormData(form) {
      var data = new FormData(form);
      var pairs = [];
      data.forEach(function (value, key) {
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      });
      return pairs.join('&');
    }

    document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      var submitBtn = form.querySelector('button[type="submit"]');
      var successEl = form.parentElement.querySelector('.form-success');
      var errorEl = form.parentElement.querySelector('.form-error');
      var submitting = false;

      /* Clear a field's error as soon as the user starts fixing it */
      Object.keys(VALIDATORS).forEach(function (fieldName) {
        var field = form.elements[fieldName];
        if (!field) return;
        field.addEventListener('input', function () {
          if (field.classList.contains('is-invalid')) {
            setFieldError(form, fieldName, VALIDATORS[fieldName](field.value || ''));
          }
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (submitting) return; /* guard against double-submit */

        if (errorEl) errorEl.classList.remove('is-visible');

        var firstInvalid = validateForm(form);
        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        submitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.classList.add('is-loading');
        }

        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encodeFormData(form)
        })
          .then(function (response) {
            if (!response.ok) throw new Error('Submission failed with status ' + response.status);
            form.reset();
            form.style.display = 'none';
            if (successEl) successEl.classList.add('is-visible');
          })
          .catch(function () {
            if (errorEl) errorEl.classList.add('is-visible');
          })
          .finally(function () {
            submitting = false;
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.classList.remove('is-loading');
            }
          });
      });
    });

    /* ---- Footer year ---- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
