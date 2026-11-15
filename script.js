(() => {
"use strict";

/* ================= CONFIG ================= */
const C = Object.assign({}, window.BDAY || {});
const qs = new URLSearchParams(location.search);
const clean = s => (s || "").replace(/[<>]/g, "").trim().slice(0, 30);
if (qs.get("name")) C.name = clean(qs.get("name"));
if (qs.get("from")) C.from = clean(qs.get("from"));
const NAME = C.name || "Friend";

document.title = `Happy Birthday ${NAME} 🎂`;
document.querySelectorAll(".js-name").forEach(el => el.textContent = NAME);
if (C.birthday) document.querySelectorAll(".js-date").forEach(el => el.textContent = C.birthday);

const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[(Math.random() * a.length) | 0];
const W = () => innerWidth, H = () => innerHeight;
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
// reliable tap: fires on pointerup or click (whichever comes first), never twice
const onTap = (el, fn) => {
  let last = 0;
  const h = e => { const now = Date.now(); if (now - last < 450) return; last = now; fn(e); };
  el.addEventListener("pointerup", h); el.addEventListener("click", h);
};

/* ================= BACKGROUND ================= */
(function background() {
  const box = $("#stars");
  let html = "";
  for (let i = 0; i < 80; i++) {
    const s = rand(1, 2.6);
    html += `<i class="star" style="left:${rand(0, 100)}%;top:${rand(0, 100)}%;width:${s}px;height:${s}px;--t:${rand(2, 5)}s;--d:${rand(0, 5)}s"></i>`;
  }
  const em = ["💖", "✨", "💕", "🎈", "💗", "⭐"];
  for (let i = 0; i < 14; i++) {
    html += `<span class="float-heart" style="left:${rand(0, 96)}%;--s:${rand(12, 26)}px;--t:${rand(10, 18)}s;--d:${rand(0, 14)}s;--x:${rand(-60, 60)}px">${pick(em)}</span>`;
  }
  box.innerHTML = html;
})();

/* ================= AUDIO ================= */
const Audio = {
  ac: null, master: null, on: true, playing: false, timer: null, noise: null,
  init() {
    if (this.ac) { if (this.ac.state === "suspended") this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = this.ac = new AC();
    this.master = ac.createGain(); this.master.gain.value = .32;
    // soft echo for a dreamy feel
    const delay = ac.createDelay(); delay.delayTime.value = .27;
    const fb = ac.createGain(); fb.gain.value = .28;
    const wet = ac.createGain(); wet.gain.value = .3;
    this.master.connect(ac.destination);
    this.master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ac.destination);
    // noise buffer for effects
    const len = ac.sampleRate * 1;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  },
  bell(f, t, dur, vol = .5) {
    const ac = this.ac, g = ac.createGain();
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), o3 = ac.createOscillator();
    o1.type = "sine"; o1.frequency.value = f;
    o2.type = "triangle"; o2.frequency.value = f * 2;
    o3.type = "sine"; o3.frequency.value = f * 3.01;
    const g2 = ac.createGain(); g2.gain.value = .18;
    const g3 = ac.createGain(); g3.gain.value = .06;
    o1.connect(g); o2.connect(g2).connect(g); o3.connect(g3).connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + .9);
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(t + dur + 1); });
  },
  pad(f, t, dur, vol = .12) {
    const ac = this.ac, g = ac.createGain(), o = ac.createOscillator(), o2 = ac.createOscillator();
    o.type = "sine"; o.frequency.value = f; o2.type = "sine"; o2.frequency.value = f * 1.5;
    o.connect(g); o2.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + .1); o2.stop(t + dur + .1);
  },
  song() {
    if (!this.ac || !this.playing) return;
    const N = { F2: 87.31, G2: 98, C3: 130.81, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
    // [note, beats, bass]
    const seq = [
      ["G4", .75], ["G4", .25], ["A4", 1, "C3"], ["G4", 1], ["C5", 1], ["B4", 2, "G2"],
      ["G4", .75], ["G4", .25], ["A4", 1, "G2"], ["G4", 1], ["D5", 1], ["C5", 2, "C3"],
      ["G4", .75], ["G4", .25], ["G5", 1, "C3"], ["E5", 1], ["C5", 1], ["B4", 1, "F2"], ["A4", 2],
      ["F5", .75], ["F5", .25], ["E5", 1, "C3"], ["C5", 1], ["D5", 1, "G2"], ["C5", 3, "C3"]
    ];
    const beat = .46;
    let t = this.ac.currentTime + .1;
    for (const [n, b, bass] of seq) {
      this.bell(N[n], t, b * beat, .42);
      if (bass) this.pad(N[bass], t, beat * 3.2, .14);
      t += b * beat;
    }
    const total = (t - this.ac.currentTime + beat * 3) * 1000;
    this.timer = setTimeout(() => this.song(), total);
  },
  start() { this.init(); if (!this.ac || this.playing) return; this.playing = true; this.song(); },
  toggle() {
    this.on = !this.on;
    if (this.master) this.master.gain.setTargetAtTime(this.on ? .32 : 0, this.ac.currentTime, .1);
    return this.on;
  },
  fxNoise(type) {
    if (!this.ac || !this.on) return;
    const ac = this.ac, t = ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = this.noise;
    const f = ac.createBiquadFilter(), g = ac.createGain();
    src.connect(f).connect(g).connect(ac.destination);
    if (type === "pop") {
      f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = .8;
      g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
      src.start(t, rand(0, .5), .15);
    } else if (type === "blow") {
      f.type = "lowpass"; f.frequency.setValueAtTime(1600, t); f.frequency.exponentialRampToValueAtTime(200, t + .5);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .55);
      src.start(t, 0, .6);
    } else if (type === "boom") {
      f.type = "lowpass"; f.frequency.value = 500;
      g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .7);
      src.start(t, rand(0, .3), .7);
    }
  },
  blip(f) { if (!this.ac || !this.on) return; this.bell(f, this.ac.currentTime, .15, .35); }
};
document.addEventListener("visibilitychange", () => {
  if (!Audio.ac) return;
  document.hidden ? Audio.ac.suspend() : Audio.ac.resume();
});
const musicBtn = $("#musicBtn");
musicBtn.addEventListener("click", () => { musicBtn.textContent = Audio.toggle() ? "🔊" : "🔈"; });

/* ================= FIREWORKS ================= */
const FX = (() => {
  const cv = $("#fx"), ctx = cv.getContext("2d");
  let dpr = 1, rockets = [], parts = [], auto = null;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W() * dpr; cv.height = H() * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); addEventListener("resize", resize);
  const palettes = [[330, 350], [40, 55], [190, 210], [270, 290], [0, 360], [120, 150], [10, 25]];

  function launch(x, ty) {
    x = x ?? rand(W() * .12, W() * .88);
    ty = ty ?? rand(H() * .1, H() * .42);
    const g = .09, dist = H() - ty;
    rockets.push({ x, y: H() + 10, vx: rand(-.6, .6), vy: -Math.sqrt(2 * g * dist), g, hue: rand(0, 360) });
  }
  function explode(x, y) {
    const pal = pick(palettes), type = Math.random();
    const n = W() < 500 ? 70 : 110;
    const add = (vx, vy, hue) => parts.push({ x, y, vx, vy, hue, life: 1, decay: rand(.011, .02), size: rand(1.4, 2.6), glit: Math.random() < .3 });
    if (type < .22) { // heart
      const s = rand(.22, .3) * (W() < 500 ? .85 : 1);
      for (let i = 0; i < n; i++) {
        const t = i / n * Math.PI * 2;
        const hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        add(hx * s, hy * s, rand(330, 355));
      }
    } else if (type < .42) { // ring
      const sp = rand(3.5, 5);
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; add(Math.cos(a) * sp, Math.sin(a) * sp, rand(pal[0], pal[1])); }
    } else { // peony
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = Math.pow(Math.random(), .5) * rand(3.5, 6);
        add(Math.cos(a) * sp, Math.sin(a) * sp, rand(pal[0], pal[1]));
      }
    }
    // flash
    parts.push({ x, y, vx: 0, vy: 0, hue: 50, life: 1, decay: .12, size: 26, flash: true });
    Audio.fxNoise("boom");
  }
  function frame() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(0, 0, W(), H());
    ctx.globalCompositeOperation = "lighter";
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += r.g;
      ctx.fillStyle = `hsla(${r.hue},100%,75%,1)`;
      ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, 7); ctx.fill();
      // sparks trail
      if (Math.random() < .8) parts.push({ x: r.x, y: r.y, vx: rand(-.4, .4), vy: rand(.5, 1.5), hue: 40, life: .7, decay: .04, size: 1.2 });
      if (r.vy >= -.6) { explode(r.x, r.y); rockets.splice(i, 1); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= .975; p.vy = p.vy * .975 + .045;
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (p.flash) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        g.addColorStop(0, `rgba(255,250,220,${p.life * .8})`); g.addColorStop(1, "rgba(255,200,120,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, 7); ctx.fill(); continue;
      }
      const a = p.glit ? (Math.random() < .5 ? p.life : p.life * .2) : p.life;
      ctx.fillStyle = `hsla(${p.hue},100%,${55 + p.life * 25}%,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + p.life * .6), 0, 7); ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    launch,
    show(n = 6, gap = 260) { for (let i = 0; i < n; i++) setTimeout(() => launch(), i * gap + rand(0, 120)); },
    auto(ms) { clearInterval(auto); auto = ms ? setInterval(() => { launch(); if (Math.random() < .4) setTimeout(() => launch(), 180); }, ms) : null; }
  };
})();

/* ================= CONFETTI ================= */
const Confetti = (() => {
  const cv = $("#confetti"), ctx = cv.getContext("2d");
  let dpr = 1, ps = [];
  const colors = ["#ff5fa2", "#ffd36e", "#7ee8fa", "#b388ff", "#ff8a65", "#69f0ae", "#ffffff"];
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = W() * dpr; cv.height = H() * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener("resize", resize);
  function piece(x, y, vx, vy) {
    ps.push({ x, y, vx, vy, w: rand(6, 11), h: rand(8, 15), rot: rand(0, 6.28), vr: rand(-.2, .2), tilt: rand(0, 6.28), vt: rand(.05, .2),
      color: pick(colors), shape: Math.random() < .25 ? "circle" : (Math.random() < .15 ? "heart" : "rect"), life: 1 });
  }
  function frame() {
    ctx.clearRect(0, 0, W(), H());
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.vx *= .985; p.vy = p.vy * .985 + .12; if (p.vy > 4.5) p.vy = 4.5;
      p.x += p.vx + Math.sin(p.tilt) * .6; p.y += p.vy; p.rot += p.vr; p.tilt += p.vt;
      if (p.y > H() + 30) { ps.splice(i, 1); continue; }
      if (p.spark) {
        p.life -= .028; if (p.life <= 0) { ps.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = p.life; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.font = `${p.h}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.ch, 0, 0); ctx.restore(); continue;
      }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
      else if (p.shape === "heart") { ctx.font = `${p.h + 4}px serif`; ctx.fillText("❤", -p.w / 2, p.h / 2); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return {
    burst(x = W() / 2, y = H() / 2, n = 120, power = 1) {
      for (let i = 0; i < n; i++) { const a = rand(-Math.PI, 0), s = rand(4, 13) * power; piece(x, y, Math.cos(a) * s, Math.sin(a) * s - 2); }
    },
    cannons(n = 80) {
      for (let i = 0; i < n; i++) {
        piece(-10, H() * .85, rand(6, 15), rand(-16, -8));
        piece(W() + 10, H() * .85, -rand(6, 15), rand(-16, -8));
      }
    },
    spark(x, y, n = 10) {
      for (let k = 0; k < n; k++) {
        const a = rand(0, 6.28), s = rand(1.5, 4.5);
        ps.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5, w: 0, h: rand(10, 18), rot: rand(-.5, .5), vr: rand(-.1, .1), tilt: 0, vt: 0,
          color: pick(colors), ch: pick(["✦", "❤", "✧", "★", "•"]), spark: true, life: 1 });
      }
    },
    rain(n = 150, spread = 2500) {
      for (let i = 0; i < n; i++) setTimeout(() => piece(rand(0, W()), -20, rand(-1, 1), rand(1, 3)), rand(0, spread));
    }
  };
})();

/* ================= SCENES ================= */
const order = ["s-gift", "s-count", "s-wish", "s-cake", "s-balloons", "s-bouquet", "s-memories", "s-letter", "s-finale"];
let cur = 0;
const progress = $("#progress");
progress.innerHTML = order.slice(2).map(() => "<i></i>").join("");
const enter = {};

// sparkle burst wherever you tap + magical scene transitions
let tapX = innerWidth / 2, tapY = innerHeight / 2;
addEventListener("pointerdown", e => { tapX = e.clientX; tapY = e.clientY; Confetti.spark(e.clientX, e.clientY, 9); }, true);
const wipe = document.createElement("div");
wipe.id = "wipe"; wipe.innerHTML = '<span class="wipe-heart">💖</span><span class="wipe-ring"></span>';
document.body.appendChild(wipe);
let wipeKind = 0, busy = false;
function transition(swap) {
  if (!wipe.animate) return swap();
  if (busy) return; busy = true;
  const w = W(), h = H(), x = Math.min(Math.max(tapX, 0), w), y = Math.min(Math.max(tapY, 0), h);
  const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 30;
  const kinds = [
    [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
    [{ clipPath: "polygon(0 0,0 0,-40% 100%,-40% 100%)" }, { clipPath: "polygon(0 0,140% 0,100% 100%,-40% 100%)" }],
    [{ clipPath: "inset(50% 50% 50% 50% round 40px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }]
  ];
  const kf = kinds[wipeKind++ % kinds.length];
  wipe.style.display = "flex";
  const a = wipe.animate(kf, { duration: 600, easing: "cubic-bezier(.7,0,.25,1)", fill: "forwards" });
  // timers (not animation events) drive the steps, so it can never get stuck
  setTimeout(() => {
    swap();
    const b = wipe.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.15)" }], { duration: 650, delay: 180, easing: "ease", fill: "forwards" });
    setTimeout(() => { wipe.style.display = "none"; a.cancel(); b.cancel(); busy = false; }, 900);
  }, 620);
}

function goTo(i, fancy = true) {
  if (fancy && i > 2) return transition(() => goTo(i, false));
  const prev = document.getElementById(order[cur]);
  prev.classList.add("leaving");
  prev.classList.remove("active");
  setTimeout(() => prev.classList.remove("leaving"), 900);
  cur = i;
  const el = document.getElementById(order[i]);
  el.classList.add("active");
  FX.auto(0);
  [...progress.children].forEach((d, k) => d.classList.toggle("on", k === i - 2));
  progress.classList.toggle("hidden", i < 2);
  enter[order[i]] && enter[order[i]](el);
}
const next = () => goTo(Math.min(cur + 1, order.length - 1));
document.querySelectorAll("[data-next]").forEach(b => onTap(b, () => { Audio.blip(880); next(); }));

/* ---- 0. gift ---- */
const gift = $("#gift");
let giftOpened = false;
function openGift() {
  if (giftOpened) return; giftOpened = true;
  Audio.start();
  musicBtn.classList.remove("hidden");
  gift.classList.add("open");
  vibrate(40);
  const r = gift.getBoundingClientRect();
  Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, 160, 1.2);
  setTimeout(() => goTo(1), 1100);
}
onTap(gift, openGift);
gift.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && openGift());

/* ---- 1. countdown ---- */
enter["s-count"] = () => {
  const el = $("#count");
  let n = 3;
  const tick = () => {
    if (n === 0) return goTo(2);
    el.textContent = n; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
    Audio.blip(n === 1 ? 1046 : 784);
    n--; setTimeout(tick, 1000);
  };
  tick();
};

/* ---- 2. big wish ---- */
(function buildHB() {
  let i = 0;
  $("#hbText").innerHTML = ["Happy", "Birthday"].map(w =>
    `<span class="w">${[...w].map(ch => `<span class="ch" style="--i:${i++}">${ch}</span>`).join("")}</span>`).join(" ");
})();
enter["s-wish"] = () => {
  vibrate([60, 40, 60]);
  Confetti.cannons(90);
  FX.show(8, 300);
  setTimeout(() => Confetti.rain(120), 1400);
  FX.auto(1600);
  const sky = $("#balloonSky");
  const cols = ["#ff5fa2", "#ffd36e", "#7ee8fa", "#b388ff", "#ff8a65", "#69f0ae", "#ff4d6d"];
  sky.innerHTML = Array.from({ length: 16 }, () =>
    `<div class="sky-balloon" style="left:${rand(-4, 92)}%;--w:${rand(38, 64)}px;--c:${pick(cols)};--t:${rand(8, 13)}s;--d:${rand(0, 5)}s;--x:${rand(-40, 40)}px"></div>`).join("");
};

/* ---- 3. cake ---- */
(function buildCake() {
  const box = $("#candles");
  const cols = ["#ff5fa2", "#7ee8fa", "#ffd36e", "#b388ff", "#69f0ae"];
  box.innerHTML = cols.map(c => `<div class="candle" style="--c:${c}"><div class="wick"></div><div class="flame"></div><span class="smoke"></span><span class="smoke"></span></div>`).join("");
  let left = cols.length;
  box.querySelectorAll(".candle").forEach(c => onTap(c, () => {
    if (c.classList.contains("out")) return;
    c.classList.add("out"); Audio.fxNoise("blow"); vibrate(20);
    if (--left === 0) {
      $("#cakeHint").textContent = "Yaay! 🥳";
      setTimeout(() => {
        $("#wishText").classList.add("show");
        document.querySelector(".cake-wrap").classList.add("cheer");
        $("#cakeTitle").textContent = `Happy Birthday ${NAME}! 🎂`;
        Confetti.cannons(70); FX.show(5, 280);
        setTimeout(() => $("#cakeNext").classList.remove("hidden"), 1200);
      }, 600);
    }
  }));
})();
enter["s-cake"] = () => {};

/* ---- 4. balloons ---- */
(function buildPop() {
  const words = (C.balloonWords && C.balloonWords.length ? C.balloonWords : ["You", "are", "so", "special"]).slice(0, 6);
  const cols = ["#ff5fa2", "#7ee8fa", "#ffd36e", "#b388ff", "#69f0ae", "#ff8a65"];
  const field = $("#popField"), sent = $("#sentence"), cnt = $("#popCount");
  let popped = 0;
  const got = new Array(words.length).fill(null);
  cnt.textContent = `0 / ${words.length} popped`;
  field.innerHTML = words.map((w, i) =>
    `<div class="pop-balloon" data-i="${i}" style="--c:${cols[i % cols.length]};--t:${rand(2.2, 3.4)}s;--d:${-rand(0, 2)}s"><div class="b"></div><div class="str"></div><div class="pop-word">${w}</div></div>`).join("");
  if (words.length !== 5) field.querySelectorAll(".pop-balloon").forEach(b => { b.style.gridColumn = "auto"; b.style.margin = "0"; });
  field.querySelectorAll(".pop-balloon").forEach(b => onTap(b, () => {
    if (b.classList.contains("popped")) return;
    b.classList.add("popped"); popped++;
    Audio.fxNoise("pop"); vibrate(30);
    const r = b.getBoundingClientRect();
    Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, 40, .7);
    got[+b.dataset.i] = words[+b.dataset.i];
    sent.innerHTML = got.map(w => w ? `<span>${w}</span>` : "").join("");
    cnt.textContent = `${popped} / ${words.length} popped`;
    if (popped === words.length) {
      setTimeout(() => {
        sent.classList.add("done"); sent.innerHTML = words.map(w => `<span>${w}</span>`).join("") + " 💖";
        Confetti.rain(100, 1500); FX.show(4, 300);
        $("#popNext").classList.remove("hidden");
      }, 500);
    }
  }));
})();

/* ---- 5. bouquet ---- */
(function buildBouquet() {
  const svg = $("#bouquet");
  const rose = (x, y, s, d, kind) => {
    const k = { red: ["#7a0420", "#c3123d", "#ff4d6d"], pink: ["#a3124f", "#ff5fa2", "#ffb3d1"], peach: ["#b5452a", "#ff8a65", "#ffd0b5"] }[kind];
    const outer = [0, 72, 144, 216, 288].map(a => `<ellipse rx="17" ry="24" transform="rotate(${a}) translate(0,-11)" fill="${k[1]}" stroke="${k[0]}" stroke-width="1.2"/>`).join("");
    const inner = [36, 108, 180, 252, 324].map(a => `<ellipse rx="11" ry="15" transform="rotate(${a}) translate(0,-5)" fill="${k[2]}" stroke="${k[0]}" stroke-width="1"/>`).join("");
    return `<g transform="translate(${x},${y}) scale(${s})"><g class="bloom" style="--d:${d}s">
      <circle r="31" fill="${k[0]}"/>${outer}${inner}<circle r="8" fill="${k[1]}" stroke="${k[0]}"/>
      <path d="M0,-5 C6,-5 6,4 0,4 C-5,4 -5,-2 0,-2 C2.5,-2 2.5,1.5 0,1.5" fill="none" stroke="${k[0]}" stroke-width="1.4"/>
      <circle r="9" cx="-9" cy="-10" fill="#fff" opacity=".12"/></g></g>`;
  };
  const leaf = (x, y, r, d) => `<g transform="translate(${x},${y}) rotate(${r})"><path class="leaf" style="--d:${d}s" d="M0,0 C-14,-22 -10,-48 0,-62 C10,-48 14,-22 0,0Z" fill="#2e8b57" stroke="#1d5e3a"/></g>`;
  const dots = Array.from({ length: 26 }, (_, i) => `<circle class="bloom" style="--d:${1.6 + i * .04}s" cx="${rand(40, 260)}" cy="${rand(40, 200)}" r="${rand(2.5, 4.5)}" fill="#fff" opacity=".95"/>`).join("");
  svg.innerHTML = `
    <defs>
      <linearGradient id="wrapB" x1="0" x2="1"><stop offset="0" stop-color="#e9c3d6"/><stop offset="1" stop-color="#c9a0b9"/></linearGradient>
      <linearGradient id="wrapF" x1="0" x2="1"><stop offset="0" stop-color="#ffe3ef"/><stop offset=".5" stop-color="#ffd0e4"/><stop offset="1" stop-color="#f3b4cf"/></linearGradient>
    </defs>
    <polygon class="wrap-in" points="15,95 150,160 285,95 165,350 135,350" fill="url(#wrapB)"/>
    ${leaf(70, 190, -50, .5)}${leaf(230, 190, 50, .6)}${leaf(90, 150, -25, .7)}${leaf(210, 150, 25, .8)}${leaf(150, 130, 0, .7)}
    ${dots}
    ${rose(150, 70, .95, .9, "pink")}
    ${rose(95, 100, .9, 1.0, "red")}${rose(205, 100, .9, 1.1, "red")}
    ${rose(60, 150, .85, 1.25, "peach")}${rose(240, 150, .85, 1.3, "peach")}
    ${rose(150, 125, 1.05, 1.2, "red")}
    ${rose(105, 165, .95, 1.4, "pink")}${rose(195, 165, .95, 1.5, "pink")}
    ${rose(150, 190, .9, 1.6, "red")}
    <polygon class="wrap-in" points="40,190 150,228 260,190 168,352 132,352" fill="url(#wrapF)" stroke="#e7a6c4"/>
    <path class="wrap-in" d="M150,228 L150,352" stroke="#e7a6c4" stroke-width="1.5"/>
    <g transform="translate(150,282)"><g class="bloom" style="--d:2s">
      <path d="M0,0 C-30,-26 -52,-4 -34,10 C-22,18 -8,8 0,0Z M0,0 C30,-26 52,-4 34,10 C22,18 8,8 0,0Z" fill="#d4145a"/>
      <path d="M-4,4 L-20,46 L-10,40 L-4,50Z M4,4 L20,46 L10,40 L4,50Z" fill="#b30f4c"/>
      <circle r="8" fill="#ff3d7f"/>
    </g></g>`;
  const comps = (C.compliments || []).slice(0, 6);
  const pos = [["left", 0, 4], ["right", 0, 10], ["left", -2, 40], ["right", -2, 44], ["left", 2, 76], ["right", 2, 80]];
  const stage = $("#bouquetStage");
  comps.forEach((t, i) => {
    const b = document.createElement("div");
    const [side, off, top] = pos[i];
    b.className = "bubble"; b.textContent = t;
    b.style.cssText = `${side}:${off}%;top:${top}%;--d:${2.2 + i * .35}s`;
    stage.appendChild(b);
  });
})();
enter["s-bouquet"] = () => { setTimeout(() => Confetti.rain(60, 2000), 2000); };

/* ---- 6. memories ---- */
const esc = t => String(t || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const Mem = (() => {
  const box = $("#carousel"), dots = $("#dots");
  const fallback = (C.memories || []).filter(Boolean);
  const bgs = fallback.map(m => m.bg).filter(Boolean);
  let list = fallback.slice(), cards = [], tilt = [], n = 0, i = 0, timer = null, running = false;

  function build(newList, jumpTo = 0) {
    list = newList.length ? newList : fallback;
    box.innerHTML = list.map((m, k) => {
      const bg = m.bg || bgs[k % (bgs.length || 1)] || ["#ff6fb1", "#7b2ff7"];
      const media = m.src
        ? `<div class="frame loading" style="background:linear-gradient(135deg,${bg[0]},${bg[1]})">${m.blur ? `<img class="lqip" src="${m.blur}" alt="">` : ""}<img class="full" src="${esc(m.src)}" alt="${esc(m.caption || "memory")}" decoding="async"><span class="shine"></span></div>`
        : `<div class="art" style="background:linear-gradient(135deg,${bg[0]},${bg[1]})"><span>${m.emoji || "💖"}</span></div>`;
      return `<figure class="card"><div class="tape"></div><div class="ph">${media}</div><figcaption class="cap">${esc(m.caption)}</figcaption></figure>`;
    }).join("");
    dots.innerHTML = list.length > 1 && list.length <= 14 ? list.map(() => "<i></i>").join("") : "";
    cards = [...box.children]; n = cards.length; tilt = cards.map(() => rand(-4, 4));
    box.querySelectorAll("img.full").forEach(img => {
      const done = () => { img.closest(".frame").classList.remove("loading"); img.classList.add("loaded"); };
      let tries = 0;
      img.addEventListener("error", () => { if (tries++ < 3) setTimeout(() => { img.src = img.src.split("?")[0] + "?r=" + Date.now(); }, 2500 * tries); });
      if (img.complete && img.naturalWidth) done(); else img.addEventListener("load", done);
    });
    i = Math.min(jumpTo, n - 1);
    render();
    if (running) restart();
  }
  function render() {
    cards.forEach((c, k) => {
      const off = (k - i + n) % n;
      c.classList.toggle("current", off === 0);
      let t, o = 1, z = n - off;
      if (off === 0) t = `translate(0,0) rotate(${tilt[k] * .5}deg)`;
      else if (off === 1) t = `translate(14px,10px) rotate(${6 + tilt[k]}deg) scale(.95)`;
      else if (off === 2) t = `translate(-14px,14px) rotate(${-7 + tilt[k]}deg) scale(.9)`;
      else if (off === n - 1 && n > 3) { t = `translate(-140%,-10%) rotate(-24deg)`; o = 0; z = n + 1; }
      else { t = `translate(0,20px) scale(.85)`; o = 0; }
      c.style.transform = t; c.style.opacity = o; c.style.zIndex = z;
      c.style.filter = off === 0 ? "none" : "brightness(.85)";
    });
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
  }
  const go = d => { if (n < 2) return; i = (i + d + n) % n; render(); restart(); };
  function restart() { clearInterval(timer); if (n > 1) timer = setInterval(() => { i = (i + 1) % n; render(); }, 4200); }
  let sx = null, sy = null;
  box.addEventListener("pointerdown", e => { sx = e.clientX; sy = e.clientY; });
  box.addEventListener("pointerup", e => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else { const r = box.getBoundingClientRect(); go(e.clientX < r.left + r.width / 2 ? -1 : 1); }
    Audio.blip(660);
  });
  build(fallback);

  // 1) Photos uploaded to the /photos folder on GitHub (list built automatically on every upload)
  const defaultCaps = fallback.map(m => m.caption).filter(Boolean);
  // backup: if the auto-built list is missing, read the folder straight from GitHub
  const fromGitHub = () => {
    const owner = location.hostname.split(".")[0], repo = location.pathname.split("/")[1];
    if (!location.hostname.endsWith("github.io") || !repo) return [];
    return fetch(`https://api.github.com/repos/${owner}/${repo}/contents/photos`)
      .then(r => r.ok ? r.json() : [])
      .then(files => (Array.isArray(files) ? files : [])
        .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        .map(f => ({ src: "photos/" + encodeURIComponent(f.name), caption: "" })));
  };
  fetch("photos/photos.json", { cache: "no-store" })
    .then(r => r.ok ? r.json() : fromGitHub())
    .then(arr => (Array.isArray(arr) && arr.length) ? arr : fromGitHub())
    .then(arr => {
      if (!Array.isArray(arr) || !arr.length) return;
      arr.forEach(img => { const im = new Image(); im.src = img.src; }); // warm up cache
      build(arr.map((p, k) => ({ src: p.src, blur: p.blur, caption: p.caption || defaultCaps[k % (defaultCaps.length || 1)] || "" })));
    })
    .catch(() => {});

  let dealt = false;
  function deal() { // cards fly in one by one the first time
    if (dealt) return; dealt = true;
    cards.forEach(c => { c.style.transition = "none"; c.style.transform = `translate(${rand(-120, 120)}px,110vh) rotate(${rand(-50, 50)}deg)`; c.style.opacity = 1; });
    void box.offsetWidth;
    cards.forEach((c, k) => { const off = (k - i + n) % n; c.style.transition = ""; c.style.transitionDelay = off <= 2 ? `${(2 - off) * .18 + .3}s` : "0s"; c.style.transitionDuration = "1s"; });
    render();
    setTimeout(() => cards.forEach(c => { c.style.transitionDelay = ""; c.style.transitionDuration = ""; }), 2000);
  }
  return { start() { running = true; deal(); restart(); }, stop() { running = false; clearInterval(timer); } };
})();
enter["s-memories"] = () => Mem.start();

/* ---- 7. letter ---- */
(function letter() {
  const env = $("#envelope"), scene = $("#s-letter"), out = $("#letterText"), sign = $("#letterSign");
  const text = (C.letter || "Happy Birthday {name}!").replace(/\{name\}/g, NAME);
  let opened = false, typing = null, idx = 0;
  const finish = () => {
    clearInterval(typing); out.textContent = text; sign.textContent = `— ${C.from || "with love"}`;
    $("#letterNext").classList.remove("hidden");
  };
  function open() {
    if (opened) return; opened = true; Mem.stop();
    env.classList.add("open"); $("#envHint").classList.add("hidden"); Audio.blip(988);
    const er = env.getBoundingClientRect();
    for (let k = 0; k < 4; k++) setTimeout(() => Confetti.spark(er.left + er.width / 2 + rand(-40, 40), er.top + er.height * .4, 12), k * 180);
    setTimeout(() => {
      scene.classList.add("opened");
      setTimeout(() => {
        out.innerHTML = '<span class="caret"></span>';
        typing = setInterval(() => {
          idx++;
          out.innerHTML = text.slice(0, idx).replace(/&/g, "&amp;").replace(/</g, "&lt;") + '<span class="caret"></span>';
          const box = out.parentElement; box.scrollTop = box.scrollHeight;
          if (idx >= text.length) finish();
        }, 32);
      }, 1500);
    }, 700);
  }
  onTap(env, open);
  env.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && open());
  $("#letter").addEventListener("click", e => { if (opened && typing && idx < text.length) { e.stopPropagation(); idx = text.length; finish(); } });
})();

/* ---- 8. finale ---- */
enter["s-finale"] = () => {
  FX.show(10, 220); FX.auto(1100);
  Confetti.cannons(100); setTimeout(() => Confetti.rain(160, 4000), 900);
  vibrate([80, 50, 80, 50, 120]);
};
(function finale() {
  const msg = `Thank you so much for this beautiful birthday surprise! 🥹💖`;
  const num = (C.whatsappNumber || "").replace(/\D/g, "");
  $("#waBtn").href = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
  $("#replayBtn").addEventListener("click", () => location.reload());
})();

/* ---- shooting stars ---- */
setInterval(() => {
  if (document.hidden) return;
  const st = document.createElement("i");
  st.className = "shoot";
  st.style.cssText = `left:${rand(10, 100)}%;top:${rand(-5, 35)}%;--len:${rand(80, 160)}px`;
  $("#stars").appendChild(st);
  setTimeout(() => st.remove(), 1600);
}, 3200);

})();
