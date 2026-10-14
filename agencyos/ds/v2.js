/* WGYB site v2: scroll reveal. Motion only enhances: with no script, no IntersectionObserver or
   prefers-reduced-motion, every element stays visible and finished. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;
  var els = [].slice.call(document.querySelectorAll('.reveal'));
  if (!els.length) return;
  root.classList.add('rv');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el); });
  // Failsafe: nothing stays hidden if the observer never fires.
  setTimeout(function () { els.forEach(function (el) { el.classList.add('is-in'); }); }, 6000);
})();
