/* ==========================================================================
   UNIVERSAL JAVASCRIPT
   One file. Loaded on every page. No page ever needs its own <script>.
   Every behavior is wired through data-attributes, so adding a new page
   that reuses these patterns requires zero JS changes.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Smooth scroll
     Any element with data-action="scroll" + data-target="#id" scrolls
     smoothly to that target. Works for buttons, links, anything.
  ------------------------------------------------------------------------ */
  function initSmoothScroll() {
    document.querySelectorAll('[data-action="scroll"]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var selector = el.getAttribute('data-target');
        if (!selector) return;
        var target = document.querySelector(selector);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Move focus for keyboard/screen-reader users after the scroll settles
        window.setTimeout(function () {
          if (target.hasAttribute('tabindex') === false) {
            target.setAttribute('tabindex', '-1');
          }
          target.focus({ preventScroll: true });
        }, 400);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Mobile menu
     Toggles [data-mobile-menu] open/closed from any [data-action="menu-toggle"]
     button. Closes automatically when a link inside is clicked.
  ------------------------------------------------------------------------ */
  function initMobileMenu() {
    var toggle = document.querySelector('[data-action="menu-toggle"]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.contains('is-open');
      setOpen(!isOpen);
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    // Expose for initKeyboardNav
    window.__closeMobileMenu = function () { setOpen(false); };
  }

  /* ------------------------------------------------------------------------
     Forms
     Any <form data-form> gets client-side validation + a fake-submit flow.
     There is no backend on this site, so a real submission has nowhere to
     go; this reports success in the UI and logs the payload to the console
     so a real endpoint can be wired in later without touching markup.
  ------------------------------------------------------------------------ */
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach(function (form) {
      var status = form.querySelector('[data-form-status]');

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var valid = true;
        var firstInvalid = null;
        form.querySelectorAll('[required]').forEach(function (field) {
          var ok = field.value && field.value.trim().length > 0;
          if (field.type === 'email' && ok) {
            ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
          }
          field.setAttribute('aria-invalid', String(!ok));
          if (!ok) {
            valid = false;
            firstInvalid = firstInvalid || field;
          }
        });

        if (!valid) {
          if (status) {
            status.textContent = 'Please fill in the highlighted fields correctly.';
            status.setAttribute('data-state', 'error');
          }
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        var data = {};
        new FormData(form).forEach(function (value, key) { data[key] = value; });
        console.log('[form submitted]', form.getAttribute('data-form'), data);

        if (status) {
          status.textContent = "Thanks — that came through. I'll reply soon.";
          status.setAttribute('data-state', 'success');
        }
        form.reset();
      });
    });
  }

  /* ------------------------------------------------------------------------
     Lazy-load images
     Images marked data-lazy="true" carry their real URL in data-src.
     Native loading="lazy" already handles most of this; the observer here
     is a progressive-enhancement layer for older browsers and for adding
     a fade-in once the image is actually in view.
  ------------------------------------------------------------------------ */
  function initLazyLoadImages() {
    var images = document.querySelectorAll('img[data-lazy]');
    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach(function (img) {
        if (img.dataset.src) img.src = img.dataset.src;
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        img.addEventListener('load', function () { img.style.opacity = 1; });
        obs.unobserve(img);
      });
    }, { rootMargin: '200px 0px' });

    images.forEach(function (img) {
      img.style.opacity = 0;
      img.style.transition = 'opacity 0.4s ease';
      observer.observe(img);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll-to-top
     Injects one button (so no page markup is required), shows it after
     the user scrolls past one viewport height.
  ------------------------------------------------------------------------ */
  function initScrollToTop() {
    var btn = document.createElement('button');
    btn.className = 'scroll-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
        ticking = false;
      });
    });
  }

  /* ------------------------------------------------------------------------
     Keyboard nav
     Escape closes the mobile menu from anywhere on the page.
  ------------------------------------------------------------------------ */
  function initKeyboardNav() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && typeof window.__closeMobileMenu === 'function') {
        window.__closeMobileMenu();
      }
    });
  }

  /* ------------------------------------------------------------------------
     Active nav state
     Marks the link matching the current path with aria-current="page".
     Reads data-path on the <body> so it works from any file depth.
  ------------------------------------------------------------------------ */
  function initActiveNav() {
    var current = document.body.getAttribute('data-path');
    if (!current) return;
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (link) {
      if (link.getAttribute('href') === current) {
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSmoothScroll();
    initMobileMenu();
    initForms();
    initLazyLoadImages();
    initScrollToTop();
    initKeyboardNav();
    initActiveNav();
  });
})();
