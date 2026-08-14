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
       No backend is wired up yet. This provides a polished client-side
       experience (validation + confirmation state) and a single clear
       integration point for a real endpoint (e.g. POST to a CRM, email
       service, or serverless function). */
    document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        /* TODO (integration point): send form data to your lead pipeline.
           Example:
           fetch('/api/leads', { method: 'POST', body: new FormData(form) });
        */

        var successEl = form.parentElement.querySelector('.form-success');
        form.reset();
        form.style.display = 'none';
        if (successEl) successEl.classList.add('is-visible');
      });
    });

    /* ---- Footer year ---- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });
})();
