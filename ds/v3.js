/* WGYB site v3: homepage motion. Every effect only enhances. With no script or with
   prefers-reduced-motion the page shows its finished state: the plan line drawn, all four
   rules ticked, Before and After side by side. Nothing pins; all motion follows normal scroll. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  // bound, so Safari accepts the call (an unbound requestAnimationFrame throws there)
  var raf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) { return setTimeout(f, 16); };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var jobs = [];
  var queued = false;
  function tick() { queued = false; var vh = window.innerHeight || 800; jobs.forEach(function (j) { j(vh); }); }
  function queue() { if (!queued) { queued = true; raf(tick); } }

  // The plan line in "How it works" draws down as the section scrolls through the viewport.
  var plan = document.querySelector('.plan');
  var line = plan && plan.querySelector('.plan-line');
  if (line) {
    jobs.push(function (vh) {
      var r = plan.getBoundingClientRect();
      var p = clamp((vh * 0.75 - r.top) / (r.height + vh * 0.35));
      line.style.setProperty('--draw', p.toFixed(3));
    });
  }

  // The four rules tick as each row reaches the reading line.
  var rules = [].slice.call(document.querySelectorAll('.checklist .rule'));
  if (rules.length && 'IntersectionObserver' in window) {
    root.classList.add('js-ticks');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-ticked'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -45% 0px', threshold: 0 });   // a row ticks when it reaches the middle of the screen
    rules.forEach(function (r) { io.observe(r); });
    setTimeout(function () { rules.forEach(function (r) { r.classList.add('is-ticked'); }); }, 15000);
  }

  // Stakes: the stack builds once, when it comes into view.
  var stack = document.querySelector('.stack');
  if (stack && 'IntersectionObserver' in window) {
    root.classList.add('js-stack');
    var so = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { stack.classList.add('is-built'); so.disconnect(); }
    }, { rootMargin: '0px 0px -40% 0px', threshold: 0 });   // builds once the stack is well into view
    so.observe(stack);
    setTimeout(function () { stack.classList.add('is-built'); }, 15000);
  }

  // Hiring gate figures count up when their row ticks; the final text is always the original string.
  function countUp(dd) {
    var final = dd.getAttribute('data-count'), target = Number(final.replace(/[^0-9]/g, ''));
    var t0 = null, dur = 1100;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      dd.textContent = p < 1 ? '$' + v.toLocaleString('en-US') : final;
      if (p < 1) raf(step);
    }
    raf(step);
  }
  if (rules.length && 'MutationObserver' in window) {
    var counted = false;
    var gate = document.getElementById('rule-3');
    if (gate) new MutationObserver(function () {
      if (!counted && gate.classList.contains('is-ticked')) {
        counted = true;
        [].forEach.call(gate.querySelectorAll('[data-count]'), countUp);
      }
    }).observe(gate, { attributes: true, attributeFilter: ['class'] });
  }

  // Before and After: the After panel wipes in from the right while the section crosses the
  // viewport. Dragging the range input takes over from scroll.
  var box = document.querySelector('.compare');
  var range = document.getElementById('cmp-range');
  if (box && range) {
    root.classList.add('cmp-on');
    var manual = false;
    var set = function (v) {
      box.style.setProperty('--wipe', (100 - v) + '%');
      if (String(range.value) !== String(v)) range.value = v;
      range.setAttribute('aria-valuetext', v + '% after');
    };
    range.addEventListener('input', function () { manual = true; set(Number(range.value)); });
    jobs.push(function (vh) {
      if (manual) return;
      var r = box.getBoundingClientRect();
      var p = clamp((vh * 0.9 - r.top) / (r.height + vh * 0.35));
      set(Math.round(p * 100));
    });
  }

  if (jobs.length) {
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
  }
})();
