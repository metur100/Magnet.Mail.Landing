(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Disabled store buttons (until the app is live)
  document.querySelectorAll('a[aria-disabled="true"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  // Header state, scroll progress and hero parallax
  var header = document.getElementById('top');
  var progress = document.getElementById('progress');
  var parallax = Array.prototype.slice.call(document.querySelectorAll('.parallax'));
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.classList.toggle('scrolled', y > 10);
    progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    if (!reduceMotion) {
      parallax.forEach(function (el) {
        el.style.transform = 'translateY(' + y * parseFloat(el.dataset.speed || 0) + 'px)';
      });
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Count-up numbers
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    if (reduceMotion || !target) return;
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Screenshot gallery arrows
  var gallery = document.getElementById('gallery');
  document.querySelectorAll('.gallery-nav button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var shot = gallery.querySelector('.shot');
      var step = shot ? shot.getBoundingClientRect().width + 28 : 260;
      gallery.scrollBy({ left: step * 2 * parseInt(btn.dataset.dir, 10), behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // Warm-up delivery: a tiny version of the real game (fixed-step physics, same controls)
  var canvas = document.getElementById('toy');
  var ctx = canvas.getContext('2d');
  var msg = document.getElementById('toy-msg');
  var hudImpulses = document.getElementById('toy-impulses');
  var btnA = document.getElementById('btn-attract');
  var btnR = document.getElementById('btn-repel');
  var W = 600, H = 300, GROUND = 284, R = 13, PAR = 2;
  var BLUE = { x: 494, y: 66 }, RED = { x: 30, y: 258 };
  var RECTS = [
    { x: 250, y: 158, w: 22, h: GROUND - 158, kind: 'wall' },
    { x: 450, y: 212, w: 9, h: GROUND - 212, kind: 'post' },
    { x: 530, y: 212, w: 9, h: GROUND - 212, kind: 'post' }
  ];
  var p, attract, repel, repelPulse, impulses, settle, done, running = false, last = 0, acc = 0;

  function reset() {
    p = { x: 78, y: GROUND - R, vx: 0, vy: 0, rot: 0 };
    attract = false; repel = false; repelPulse = 0; impulses = 0; settle = 0; done = false;
    hudImpulses.textContent = 'Impulses: 0';
    say('');
    draw();
  }
  function say(text) {
    msg.textContent = text;
    msg.classList.remove('pop');
    void msg.offsetWidth;
    if (text) msg.classList.add('pop');
  }
  function falloff(d) { return 1 / (1 + (d / 380) * (d / 380)); }

  function step(dt) {
    var ax = 0, ay = 760;
    var dx = BLUE.x - p.x, dy = BLUE.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
    if (attract) {
      var a = 5000 * falloff(d);
      ax += dx / d * a; ay += dy / d * a;
      if (d < 60) { var damp = Math.exp(-9 * dt); p.vx *= damp; p.vy *= damp; ay -= 760; }
    }
    if (repel || repelPulse > 0) {
      var rx = p.x - RED.x, ry = p.y - RED.y, rd = Math.sqrt(rx * rx + ry * ry) || 1;
      var b = 4200 * falloff(rd);
      ax += rx / rd * b; ay += ry / rd * b;
      repelPulse -= dt;
    }
    var drag = Math.exp(-0.25 * dt);
    p.vx = (p.vx + ax * dt) * drag;
    p.vy = (p.vy + ay * dt) * drag;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += p.vx * dt * 0.02;

    // Arena bounds
    if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * 0.35; }
    if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx) * 0.35; }
    if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy) * 0.35; }
    if (p.y > GROUND - R) {
      p.y = GROUND - R;
      if (p.vy > 0) p.vy = -p.vy * 0.35;
      if (Math.abs(p.vy) < 30) p.vy = 0;
      p.vx *= Math.exp(-5 * dt);
    }
    // Boxes (circle vs rectangle)
    RECTS.forEach(function (r) {
      var cx = Math.max(r.x, Math.min(p.x, r.x + r.w)), cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
      var ox = p.x - cx, oy = p.y - cy, od = Math.sqrt(ox * ox + oy * oy);
      if (od >= R) return;
      var nx, ny;
      if (od > 0.0001) { nx = ox / od; ny = oy / od; } else { nx = 0; ny = -1; }
      p.x += nx * (R - od); p.y += ny * (R - od);
      var vn = p.vx * nx + p.vy * ny;
      if (vn < 0) { p.vx -= 1.35 * vn * nx; p.vy -= 1.35 * vn * ny; }
    });

    // Delivery: inside the mailbox, slow, for a moment
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (p.x > 460 && p.x < 530 && p.y > 236 && speed < 140) settle += dt; else settle = 0;
    if (settle > 0.35 && !done) {
      done = true;
      var stars = impulses <= PAR ? 3 : impulses <= PAR + 2 ? 2 : 1;
      say('Delivered! ' + '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars) + (stars === 3 ? ' Perfect delivery.' : ' Try it in ' + PAR + ' impulses.'));
      if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
    }
  }

  function horseshoe(m, color, sign, active) {
    ctx.save();
    ctx.translate(m.x, m.y);
    if (active) {
      ctx.fillStyle = color; ctx.globalAlpha = 0.18;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.arc(0, -2, 13, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#E3E8EF';
    ctx.fillRect(-17.5, -2, 9, 12); ctx.fillRect(8.5, -2, 9, 12);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(15, -16, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color; ctx.font = '700 14px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sign, 15, -15.5);
    ctx.restore();
  }
  function field(from, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.55; ctx.lineWidth = 2; ctx.setLineDash([5, 6]);
    ctx.lineDashOffset = -performance.now() / 30;
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(from.x, from.y);
      var mx = (from.x + p.x) / 2 - (p.y - from.y) * 0.12 * i, my = (from.y + p.y) / 2 + (p.x - from.x) * 0.12 * i;
      ctx.quadraticCurveTo(mx, my, p.x, p.y); ctx.stroke();
    }
    ctx.restore();
  }
  function draw() {
    var s = canvas.width / W;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Clouds and ground
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    [[110, 60], [330, 40]].forEach(function (c) { ctx.beginPath(); ctx.arc(c[0], c[1], 16, 0, 7); ctx.arc(c[0] + 18, c[1] - 6, 20, 0, 7); ctx.arc(c[0] + 38, c[1], 15, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#7CC36E'; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#5FA653'; ctx.fillRect(0, GROUND, W, 4);
    // Wall (fence)
    ctx.fillStyle = '#C98B5A'; ctx.fillRect(250, 158, 22, GROUND - 158);
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (var y = 170; y < GROUND; y += 16) ctx.fillRect(250, y, 22, 3);
    // Mailbox
    ctx.fillStyle = '#E04848'; ctx.fillRect(450, 212, 89, GROUND - 212);
    ctx.fillStyle = '#B8323A'; ctx.fillRect(459, 222, 71, GROUND - 222);
    ctx.fillStyle = '#F4C542'; ctx.beginPath(); ctx.moveTo(494, 196); ctx.lineTo(484, 184); ctx.lineTo(504, 184); ctx.fill();
    // Magnets and fields
    if (attract) field(BLUE, '#2F7FF0');
    if (repel || repelPulse > 0) field(RED, '#EC4B4B');
    horseshoe(BLUE, '#2F7FF0', '+', attract);
    horseshoe(RED, '#EC4B4B', '−', repel || repelPulse > 0);
    // Parcel (envelope)
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.rot) * 0.25);
    ctx.fillStyle = '#FFF4DC'; ctx.strokeStyle = '#24324A'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.rect(-15, -10, 30, 20); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#EC4B4B'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(0, 2); ctx.lineTo(13, -8); ctx.stroke();
    ctx.restore();
    // Mailbox front lip (drawn over the parcel)
    ctx.fillStyle = '#E04848'; ctx.fillRect(450, 262, 89, GROUND - 262);
    ctx.fillStyle = '#fff'; ctx.font = '700 13px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MAIL', 494, 278);
  }

  function frame(t) {
    if (!running) return;
    var dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t; acc += dt;
    while (acc >= 1 / 120) { step(1 / 120); acc -= 1 / 120; }
    draw();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true; last = performance.now(); acc = 0;
    requestAnimationFrame(frame);
  }

  function press(which, on) {
    var btn = which === 'a' ? btnA : btnR;
    var was = which === 'a' ? attract : repel;
    if (on && !was) {
      if (done) reset();
      impulses++;
      hudImpulses.textContent = 'Impulses: ' + impulses;
      if (which === 'r') repelPulse = 0.22;
      if (navigator.vibrate) navigator.vibrate(12);
    }
    if (which === 'a') attract = on; else repel = on;
    btn.classList.toggle('down', on);
  }
  [[btnA, 'a'], [btnR, 'r']].forEach(function (pair) {
    var b = pair[0], k = pair[1];
    b.addEventListener('pointerdown', function (e) { e.preventDefault(); b.setPointerCapture(e.pointerId); press(k, true); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function () { press(k, false); }); });
    b.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(k, true); } });
    b.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') press(k, false); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !running) return;
    var k = e.key.toLowerCase();
    if (k === 'a') press('a', true); else if (k === 'd') press('r', true);
  });
  document.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'a') press('a', false); else if (k === 'd') press('r', false);
  });
  document.getElementById('toy-reset').addEventListener('click', reset);

  reset();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) start(); else { running = false; press('a', false); press('r', false); }
      });
    }).observe(canvas);
  } else {
    start();
  }
  if (document.fonts) document.fonts.ready.then(draw);
})();
