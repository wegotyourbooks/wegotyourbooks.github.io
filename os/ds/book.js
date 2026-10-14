/*
 * Book a call behavior. Any element with [data-book] opens the Calendly popup.
 * The element's own href is the booking URL, so the link works with no script
 * (new tab) and this file never holds the URL. Calendly loads on first
 * pointer or focus contact, not on page load.
 */
(function () {
  'use strict';
  var loaded = false, loading = false;

  function load(done) {
    if (loaded) return done(true);
    if (loading) return;
    loading = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(l);
    var s = document.createElement('script');
    s.src = 'https://assets.calendly.com/assets/external/widget.js';
    s.async = true;
    s.onload = function () { loaded = true; loading = false; if (done) done(true); };
    s.onerror = function () { loading = false; if (done) done(false); };
    document.head.appendChild(s);
  }

  function warm(e) {
    if (e.target.closest && e.target.closest('[data-book]')) load(function () {});
  }
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-book]');
    if (!btn) return;
    var url = btn.getAttribute('href');
    if (!url) return;
    e.preventDefault();
    if (window.Calendly && window.Calendly.initPopupWidget) {
      window.Calendly.initPopupWidget({ url: url });
      return;
    }
    load(function (ok) {
      if (ok && window.Calendly && window.Calendly.initPopupWidget) {
        window.Calendly.initPopupWidget({ url: url });
      } else {
        window.open(url, '_blank', 'noopener');
      }
    });
  });
})();
