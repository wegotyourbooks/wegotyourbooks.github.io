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

  // The four rules: each row's progress follows the scroll (its top from 95% to 25% of the screen, most of a screen's
  // worth of scrolling, so a quick flick still shows it) and never goes back. The box ticks at 20%, then the row's
  // visual plays out with the rest of the scroll.
  var rules = [].slice.call(document.querySelectorAll('.checklist .rule'));
  if (rules.length) {
    root.classList.add('js-ticks');
    rules.forEach(function (row) {
      var best = 0, figs = [].slice.call(row.querySelectorAll('[data-count]'));
      var set = function (k, v) { row.style.setProperty(k, clamp(v).toFixed(3)); };
      var paint = function (p) {
        if (p >= 0.2) row.classList.add('is-ticked');
        for (var k = 0; k < 4; k++) set('--a' + (k + 1), (p - 0.2 - k * 0.15) / 0.3);
        set('--b', (p - 0.3) / 0.6);
        for (var c = 0; c < 3; c++) set('--c' + (c + 1), (p - 0.3 - c * 0.2) / 0.3);
        figs.forEach(function (dd) {
          var final = dd.getAttribute('data-count'), target = Number(final.replace(/[^0-9]/g, ''));
          var q = clamp((p - 0.3) / 0.6);
          dd.textContent = q >= 1 ? final : '$' + Math.round(target * (1 - Math.pow(1 - q, 3))).toLocaleString('en-US');
        });
      };
      jobs.push(function (vh) {
        var r = row.getBoundingClientRect();
        var p = clamp((vh * 0.95 - r.top) / (vh * 0.7));
        if (p > best) { best = p; paint(best); }
      });
      paint(0);
      setTimeout(function () { best = 1; paint(1); }, 15000);
    });
  }

  // Stakes: the stack builds with the scroll, bottom-up (Files, Records, Closes, then Sees ahead), then the brackets draw.
  // Progress runs from the stack entering the bottom of the screen (top at 95%) to its top reaching 30%, and never
  // goes back down, so the finished stack stays put when the visitor scrolls up again.
  var stack = document.querySelector('.stack');
  if (stack) {
    root.classList.add('js-stack');
    var layers = [].slice.call(stack.querySelectorAll('.layer')), brackets = [].slice.call(stack.querySelectorAll('.bracket'));
    var best = 0;
    var paint = function (p) {
      layers.forEach(function (l) {
        var i = Number(l.style.getPropertyValue('--i')) || 0;            // 0 = Files (first) ... 3 = Sees ahead (last)
        l.style.setProperty('--p', clamp((p - i * 0.17) / 0.32).toFixed(3));
      });
      brackets.forEach(function (b) { b.style.setProperty('--pb', clamp((p - 0.72) / 0.28).toFixed(3)); });
    };
    jobs.push(function (vh) {
      var r = stack.getBoundingClientRect();
      var p = clamp((vh * 0.95 - r.top) / (vh * 0.65));
      if (p > best) { best = p; paint(best); }
    });
    paint(0);
    setTimeout(function () { best = 1; paint(1); }, 15000);
  }

  // Proof: the three stat cards. Each gold bar draws and its figure counts up as the card scrolls in (top from 95% to
  // 45% of the screen), never going back. Only the number moves; its prefix and suffix ($, +) stay put, and at the end the
  // exact original text is restored.
  var stats = [].slice.call(document.querySelectorAll('.result--stat'));
  if (stats.length) {
    root.classList.add('js-tally');
    stats.forEach(function (card) {
      var fig = card.querySelector('[data-tally]'), final = fig ? fig.textContent : '';
      var m = final.match(/^(\D*)([\d,]+)(.*)$/), target = m ? Number(m[2].replace(/,/g, '')) : 0, best = 0;
      var paint = function (p) {
        card.style.setProperty('--g', clamp(p / 0.7).toFixed(3));
        if (!m) return;
        var q = clamp((p - 0.1) / 0.8);
        fig.textContent = q >= 1 ? final : m[1] + Math.round(target * (1 - Math.pow(1 - q, 3))).toLocaleString('en-US') + m[3];
      };
      jobs.push(function (vh) {
        var r = card.getBoundingClientRect();
        var p = clamp((vh * 0.95 - r.top) / (vh * 0.5));
        if (p > best) { best = p; paint(best); }
      });
      paint(0);
      setTimeout(function () { best = 1; paint(1); }, 15000);
    });
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
