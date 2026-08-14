/* ==========================================================================
   Columbia HVAC Co. — Navigation behavior
   Sticky header, desktop dropdown, mobile drawer + accordion submenu
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var header = document.querySelector('.site-header');

    /* Sticky header shadow on scroll */
    if (header) {
      var onScroll = function () {
        if (window.scrollY > 12) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* Desktop dropdown — keyboard + click support (in addition to CSS hover) */
    var dropdownToggle = document.querySelector('.has-dropdown > .nav-link');
    var dropdownWrap = document.querySelector('.has-dropdown');
    if (dropdownToggle && dropdownWrap) {
      dropdownToggle.addEventListener('click', function (e) {
        if (window.innerWidth <= 900) return; /* handled by mobile drawer */
        e.preventDefault();
        dropdownWrap.classList.toggle('is-open');
      });
      document.addEventListener('click', function (e) {
        if (!dropdownWrap.contains(e.target)) dropdownWrap.classList.remove('is-open');
      });
      dropdownWrap.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') dropdownWrap.classList.remove('is-open');
      });
    }

    /* Mobile nav drawer */
    var navToggle = document.querySelector('.nav-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    var mobileClose = document.querySelector('.mobile-nav-close');
    var mobileOverlay = document.querySelector('.mobile-nav-overlay');

    function openMobileNav() {
      if (!mobileNav) return;
      mobileNav.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      navToggle && navToggle.setAttribute('aria-expanded', 'true');
    }
    function closeMobileNav() {
      if (!mobileNav) return;
      mobileNav.classList.remove('is-open');
      document.body.style.overflow = '';
      navToggle && navToggle.setAttribute('aria-expanded', 'false');
    }

    if (navToggle) navToggle.addEventListener('click', openMobileNav);
    if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileNav);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });

    /* Mobile accordion submenu (Services) */
    var mobileToggles = document.querySelectorAll('[data-mobile-toggle]');
    mobileToggles.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = btn.getAttribute('data-mobile-toggle');
        var submenu = document.getElementById(targetId);
        if (!submenu) return;
        submenu.classList.toggle('is-open');
        btn.classList.toggle('is-open');
      });
    });
  });
})();
