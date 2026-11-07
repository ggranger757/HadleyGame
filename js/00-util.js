/* =========================================================================
   TECHNOMANCERS — 00-util.js
   Math helpers, seeded RNG, and the Web Audio synth (no audio files needed).
   Everything hangs off the global TM namespace so the game runs from file://
   ========================================================================= */
'use strict';
window.TM = window.TM || {};

TM.U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
  angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; },
  // mulberry32 seeded RNG — used for tiles, daily jam, procedural sprites
  rng(seed) { let s = seed >>> 0; return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
  pick: (r, arr) => arr[Math.floor(r() * arr.length)],
  todayKey() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  dayDiff(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000); },
  fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); },
  esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); },
  // *word* → magenta emphasis, _word_ → red (reserved: tears/danger)
  fmt(s) { return TM.U.esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/_(.+?)_/g, '<b class="red">$1</b>').replace(/\n/g, '<br>'); },
  vibrate(ms) { try { if (TM.S && TM.S.profile && TM.S.profile.settings.haptics && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } },
};

/* -------------------------------------------------------------------------
   AUDIO — everything is synthesized, all music is original.
   A small step sequencer plays era + mood tracks written in these styles:
     present  · industrial noir (NIN-ish)        street · dusty boom-bap (MF DOOM-ish)
     synth86  · darkwave pulse (Boy Harsher-ish)  hyper86 · bright arcade hyperpop (Charli XCX-ish)
     strings1888 / boss · ostinato strings + braams (Zimmer-ish)
     noir47 / swing47 · 1947 jazz noir & club swing     box1888 · music-box waltz
     chime · the Hartwell Chime (the killer's seven notes)  horror · calm · chase · fight · title
   ------------------------------------------------------------------------- */
TM.Audio = (() => {
  let ctx = null, master, musicBus, sfxBus, rainGain, noiseBuf, verb, crush;
  let mood = 'off', rainOn = false, hbTimer = 0, fogTimer = 0, track = null, nextT = 0, step = 0, timer = 0, fade = null;
  const A = {};
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const CHIME = [62, 64, 65, 67, 69, 70, 73];           // D harmonic minor; the motif is 0 2 4 2 5 4 6
  const MOTIF = [0, 2, 4, 2, 5, 4, 6];

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    // a cheap "room": feedback delay, darkened
    verb = ctx.createDelay(1); verb.delayTime.value = .29; const fb = ctx.createGain(); fb.gain.value = .38; const vlp = ctx.createBiquadFilter(); vlp.type = 'lowpass'; vlp.frequency.value = 2200;
    verb.connect(vlp); vlp.connect(fb); fb.connect(verb); const vout = ctx.createGain(); vout.gain.value = .5; vlp.connect(vout); vout.connect(musicBus);
    // grit for industrial parts
    crush = ctx.createWaveShaper(); const cv = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 4); } crush.curve = cv; crush.connect(musicBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const rn = ctx.createBufferSource(); rn.buffer = noiseBuf; rn.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rn.connect(bp); bp.connect(hp); hp.connect(rainGain); rainGain.connect(master); rn.start();
    loadFiles(); applyVolume(); setRain(rainOn);
    timer = setInterval(sched, 25);
    if (mood !== 'off') { const m = mood; mood = 'off'; setMood(m); }
  }
  function applyVolume() {
    if (!ctx) return; const st = (TM.S && TM.S.profile) ? TM.S.profile.settings : { sound: true, music: .7, sfx: .8 };
    master.gain.value = st.sound ? 1 : 0; musicBus.gain.value = st.music * .62; sfxBus.gain.value = st.sfx;
  }

  /* ---------------- instruments (scheduled at time t into the track gain g) ---------------- */
  function env(gn, t, a, peak, d, sus = 0) { gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), t + a); gn.gain.exponentialRampToValueAtTime(Math.max(.0001, peak * sus) || .0001, t + a + d); }
  function vo(type, f, t, dur, vol, dest, o = {}) {
    const os = ctx.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t); if (o.slide) os.frequency.exponentialRampToValueAtTime(o.slide, t + (o.slideT || dur)); if (o.det) os.detune.value = o.det;
    const gn = ctx.createGain(); env(gn, t, o.a || .005, vol, dur, o.sus || 0);
    let node = os;
    if (o.lp) { const f2 = ctx.createBiquadFilter(); f2.type = o.bp ? 'bandpass' : 'lowpass'; f2.frequency.setValueAtTime(o.lp, t); if (o.lpTo) f2.frequency.exponentialRampToValueAtTime(o.lpTo, t + dur); if (o.q) f2.Q.value = o.q; os.connect(f2); node = f2; }
    if (o.vib) { const l = ctx.createOscillator(); l.frequency.value = o.vib; const lg = ctx.createGain(); lg.gain.value = f * .012; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + .1); }
    node.connect(gn); gn.connect(dest); if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; gn.connect(w); w.connect(verb); }
    os.start(t); os.stop(t + (o.a || .005) + dur + .05);
  }
  function nz(t, dur, vol, f, type, dest, q = 1, o = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const gn = ctx.createGain(); env(gn, t, o.a || .002, vol, dur); s.connect(fl); fl.connect(gn); gn.connect(dest); if (o.wet) { const w = ctx.createGain(); w.gain.value = o.wet; gn.connect(w); w.connect(verb); }
    s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  const I = {
    kick: (t, g, v = 1) => vo('sine', 150, t, .32, .9 * v, g, { slide: 42, slideT: .18 }),
    k808: (t, g, v = 1) => vo('sine', 110, t, .8, .85 * v, g, { slide: 40, slideT: .3 }),
    kickX: (t, g, v = 1) => { vo('sine', 170, t, .3, 1 * v, crush, { slide: 38, slideT: .14 }); nz(t, .03, .3 * v, 3000, 'highpass', g); },
    snare: (t, g, v = 1) => { nz(t, .16, .45 * v, 1900, 'bandpass', g, .8, { wet: .2 }); vo('triangle', 190, t, .09, .25 * v, g); },
    snareX: (t, g, v = 1) => { nz(t, .22, .6 * v, 1500, 'bandpass', crush, .6); nz(t, .3, .15 * v, 4000, 'highpass', g, 1, { wet: .4 }); },
    clap: (t, g, v = 1) => { for (let i = 0; i < 3; i++) nz(t + i * .011, .07, .35 * v, 1300, 'bandpass', g, 1.2, { wet: .25 }); },
    hat: (t, g, v = 1) => nz(t, .035, .16 * v, 8000, 'highpass', g),
    ohat: (t, g, v = 1) => nz(t, .22, .12 * v, 7000, 'highpass', g),
    ride: (t, g, v = 1) => { nz(t, .35, .08 * v, 6000, 'bandpass', g, 3); vo('square', 3520, t, .2, .01 * v, g); },
    brush: (t, g, v = 1) => nz(t, .28, .07 * v, 2600, 'lowpass', g, .5, { a: .05 }),
    metal: (t, g, v = 1) => { vo('square', 820, t, .25, .05 * v, g, { lp: 3000, wet: .5 }); vo('square', 1187, t, .2, .04 * v, g, { lp: 3000 }); },
    crackle: (t, g) => { for (let i = 0; i < 3; i++) if (Math.random() < .6) nz(t + Math.random() * .1, .004, .12, 3000 + Math.random() * 4000, 'highpass', g); },
    bass: (t, g, n, d, v = 1) => vo('sawtooth', mf(n), t, d, .32 * v, g, { lp: 900, lpTo: 220, sus: .3 }),
    sub: (t, g, n, d, v = 1) => vo('sine', mf(n), t, d, .45 * v, g, { sus: .6 }),
    pulse: (t, g, n, d, v = 1) => vo('square', mf(n), t, d, .16 * v, g, { lp: 1400, lpTo: 300 }),
    upright: (t, g, n, d, v = 1) => vo('triangle', mf(n), t, d * 1.2, .5 * v, g, { lp: 700, sus: .2 }),
    pad: (t, g, ns, d, v = 1) => ns.forEach((n, i) => { vo('sawtooth', mf(n), t, d, .05 * v, g, { a: .35, sus: .7, lp: 900, det: i % 2 ? 9 : -9, wet: .3 }); }),
    strings: (t, g, ns, d, v = 1) => ns.forEach((n, i) => vo('sawtooth', mf(n), t, d, .06 * v, g, { a: .5, sus: .8, lp: 1800, det: i % 2 ? 7 : -7, vib: 5, wet: .4 })),
    spicc: (t, g, n, v = 1) => { vo('sawtooth', mf(n), t, .12, .09 * v, g, { lp: 2400, lpTo: 900, det: 6 }); vo('sawtooth', mf(n), t, .12, .06 * v, g, { lp: 2400, det: -6 }); },
    braam: (t, g, n, v = 1) => [0, 7, 12, 15].forEach((k, i) => vo('sawtooth', mf(n + k), t, 2.6, .09 * v, crush, { a: .08, sus: .5, lp: 200, lpTo: 1600, det: i * 5 })),
    pluck: (t, g, n, v = 1) => vo('square', mf(n), t, .2, .1 * v, g, { lp: 2600, lpTo: 600, wet: .35 }),
    saw: (t, g, n, d, v = 1) => { vo('sawtooth', mf(n), t, d, .07 * v, g, { lp: 3800, lpTo: 1200, det: 12, wet: .3 }); vo('sawtooth', mf(n), t, d, .07 * v, g, { lp: 3800, lpTo: 1200, det: -12 }); },
    lead: (t, g, n, d, v = 1) => vo('square', mf(n), t, d, .07 * v, g, { lp: 2000, vib: 5.5, a: .02, sus: .5, wet: .5 }),
    rhodes: (t, g, ns, d, v = 1) => ns.forEach((n) => { vo('sine', mf(n), t, d, .09 * v, g, { sus: .3, wet: .3 }); vo('sine', mf(n) * 2, t, d * .4, .02 * v, g); }),
    piano: (t, g, n, d, v = 1) => { vo('triangle', mf(n), t, d, .14 * v, g, { sus: .15, wet: .4 }); vo('sine', mf(n) * 2, t, d * .5, .04 * v, g); },
    box: (t, g, n, v = 1) => { vo('sine', mf(n + 12), t, 1.2, .12 * v, g, { wet: .6 }); vo('sine', mf(n + 12) * 3, t, .3, .03 * v, g); },
    horn: (t, g, n, d, v = 1) => vo('square', mf(n), t, d, .07 * v, g, { lp: 1200, bp: 1, q: 2, vib: 5, a: .04, sus: .6, wet: .5 }),
    vox: (t, g, n, v = 1) => { vo('sawtooth', mf(n), t, .14, .1 * v, g, { lp: 1100, bp: 1, q: 8, slide: mf(n + 2), slideT: .06, wet: .3 }); },
    drone: (t, g, n, d, v = 1) => { vo('sawtooth', mf(n), t, d, .07 * v, g, { a: 1.2, sus: .8, lp: 300, det: 5 }); vo('sine', mf(n + 31), t, d, .015 * v, g, { a: 1.5, sus: .8, det: 7, wet: .6 }); },
  };

  /* ---------------- the tracks (original) ----------------
     each: bpm, steps per bar, bars, swing, and play(t, step, bar, s, g) */
  const pat = (str) => str.replace(/\s/g, '').split('').map((c) => c === 'x' ? 1 : c === 'o' ? .6 : c === '-' ? .35 : 0);
  const T = {
    present: { bpm: 88, steps: 16, bars: 4, play(t, i, bar, s, g) {   // industrial noir
      const K = pat('x... ..x. x... ....'), S = pat('.... x... .... x..o');
      if (K[i]) I.kickX(t, g, K[i]); if (S[i]) I.snareX(t, g, S[i]); if (i % 4 === 2) I.hat(t, g, .7); if (i === 6 || i === 14) I.metal(t, g, .8);
      const roots = [38, 38, 34, 36]; const r = roots[bar % 4]; if (i % 2 === 0) I.bass(t, g, r + (i === 10 ? 12 : 0), s * 1.8, .9);
      if (i === 0) I.drone(t, g, r + 12, s * 16, .9);
      if (bar % 4 === 3 && i === 12) MOTIF.slice(0, 3).forEach((k, j) => I.box(t + j * s * 1.3, g, CHIME[k] - 12, .5));
    } },
    street: { bpm: 86, steps: 16, bars: 4, swing: .62, play(t, i, bar, s, g) {   // boom-bap
      const K = pat('x... ...x ..x. ....'), S = pat('.... x... .... x...');
      if (K[i]) I.kick(t, g, 1); if (S[i]) I.snare(t, g, .9); if (i % 2 === 0) I.hat(t, g, i % 4 ? .5 : .9); if (i % 4 === 0) I.crackle(t, g);
      const ch = [[50, 53, 57, 60, 64], [43, 47, 53, 57, 64], [48, 52, 55, 59, 62], [45, 49, 55, 58, 61]][bar % 4];
      if (i === 0 || i === 7) I.rhodes(t, g, ch.slice(1), s * 6, .9);
      const bl = [38, 31, 36, 33][bar % 4]; if (i === 0 || i === 3 || i === 8 || i === 11) I.upright(t, g, bl + (i === 8 ? 7 : 0), s * 2.5);
    } },
    chime: { bpm: 70, steps: 8, bars: 4, play(t, i, bar, s, g) {
      if (i === 0) I.pad(t, g, bar % 2 ? [50, 53, 58] : [50, 53, 57], s * 8, .8);
      if (bar % 2 === 0 && i < 7) I.box(t, g, CHIME[MOTIF[i]], .8);
      if (i === 4) I.ride(t, g, .4);
    } },
    horror: { bpm: 60, steps: 8, bars: 4, play(t, i, bar, s, g) {
      if (i === 0 && bar % 2 === 0) { I.drone(t, g, 26, s * 16, 1.1); I.drone(t, g, 27, s * 16, .5); }
      if (i === 3 && Math.random() < .5) I.box(t, g, CHIME[Math.floor(Math.random() * 7)] + (Math.random() < .5 ? 0 : -12), .5);
      if (i === 0 || i === 1) vo('sine', 55, t, .14, .35, g, { slide: 40 });
    } },
    synth86: { bpm: 112, steps: 16, bars: 4, play(t, i, bar, s, g) {   // darkwave
      if (i % 4 === 0) I.kick(t, g, 1); if (i === 4 || i === 12) I.clap(t, g, .9); I.hat(t, g, i % 2 ? .45 : .8); if (i === 14) I.ohat(t, g);
      const r = [45, 41, 48, 43][bar % 4]; I.pulse(t, g, r + (i % 2 ? 12 : 0), s * .9, .9);
      if (i === 0) I.pad(t, g, [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]][bar % 4], s * 16, .9);
      const mel = [[69, 0, 0, 72, 0, 0, 71, 0, 69, 0, 0, 0, 67, 0, 0, 0], [65, 0, 0, 69, 0, 0, 67, 0, 65, 0, 64, 0, 0, 0, 0, 0]][bar % 2];
      if (mel[i]) I.lead(t, g, mel[i], s * 2.5, .8);
    } },
    hyper86: { bpm: 128, steps: 16, bars: 4, play(t, i, bar, s, g) {   // bright arcade hyperpop
      if (i % 4 === 0) I.k808(t, g, 1); if (i === 4 || i === 12) I.clap(t, g, 1); if (i % 2) I.hat(t, g, .7);
      const ch = [[66, 69, 73], [62, 66, 69], [69, 73, 76], [64, 68, 71]][bar % 4];
      if ([0, 3, 6, 10, 12].includes(i)) I.saw(t, g, ch[i % 3], s * 1.5, .9);
      if (i % 2 === 0) I.pluck(t, g, ch[(i / 2) % 3] + 12, .8);
      if (i === 7 || i === 15) I.vox(t, g, ch[0] + 12, 1);
      if (i % 4 === 0) I.sub(t, g, ch[0] - 24, s * 3, .8);
    } },
    noir47: { bpm: 62, steps: 8, bars: 4, swing: .6, play(t, i, bar, s, g) {   // jazz noir
      I.brush(t, g, i % 2 ? .6 : 1);
      const walk = [[36, 39, 43, 46], [41, 44, 48, 51], [43, 46, 50, 53], [36, 38, 39, 43]][bar % 4]; if (i % 2 === 0) I.upright(t, g, walk[i / 2], s * 2);
      if (i === 0) I.rhodes(t, g, [[51, 55, 58, 62], [56, 60, 63, 67], [55, 58, 62, 65], [51, 55, 58, 62]][bar % 4], s * 7, .8);
      const mel = [[67, 0, 70, 0, 72, 70, 0, 0], [68, 0, 67, 0, 63, 0, 0, 0], [65, 0, 67, 68, 70, 0, 0, 0], [72, 0, 0, 70, 67, 0, 0, 0]][bar % 4];
      if (mel[i]) I.horn(t, g, mel[i] - 12, s * 1.8, .9);
    } },
    swing47: { bpm: 150, steps: 8, bars: 4, swing: .64, play(t, i, bar, s, g) {   // club swing
      if (i % 2 === 0 || i === 3 || i === 7) I.ride(t, g, i % 2 ? .6 : 1); if (i === 2 || i === 6) I.brush(t, g, .8); if (i === 0) I.kick(t, g, .5);
      const walk = [[46, 50, 53, 55], [51, 50, 48, 46], [43, 46, 50, 51], [41, 45, 48, 50]][bar % 4]; if (i % 2 === 0) I.upright(t, g, walk[i / 2], s * 2);
      if (i === 1 || i === 5) I.rhodes(t, g, [[58, 62, 65, 69], [63, 67, 70, 74], [55, 58, 62, 65], [53, 57, 60, 63]][bar % 4], s * 1.2, .7);
      if (bar % 2 === 1) { const r = [70, 0, 72, 0, 74, 72, 70, 0]; if (r[i]) I.horn(t, g, r[i], s * 1.4, 1); }
    } },
    box1888: { bpm: 84, steps: 12, bars: 4, play(t, i, bar, s, g) {   // music-box waltz (3/4)
      if (i === 0) I.strings(t, g, [[50, 57, 62], [46, 53, 58], [48, 55, 60], [45, 52, 57]][bar % 4], s * 12, .7);
      const m = [[74, 0, 0, 77, 0, 76, 74, 0, 0, 69, 0, 0], [70, 0, 0, 74, 0, 72, 70, 0, 0, 65, 0, 0], [72, 0, 0, 76, 0, 74, 72, 0, 0, 67, 0, 0], [73, 0, 0, 76, 0, 79, 77, 0, 76, 0, 73, 0]][bar % 4];
      if (m[i]) I.box(t, g, m[i] - 12, .8);
      if (i % 4 === 0) I.upright(t, g, [38, 34, 36, 33][bar % 4] + (i ? 7 : 0), s * 3, .5);
    } },
    strings1888: { bpm: 96, steps: 16, bars: 4, play(t, i, bar, s, g) {   // ostinato
      const r = [50, 46, 48, 45][bar % 4]; const os = [0, 0, 3, 0, 7, 0, 3, 0, 0, 0, 3, 0, 8, 7, 3, 0];
      I.spicc(t, g, r + os[i], i % 4 === 0 ? 1 : .7);
      if (i === 0) { I.strings(t, g, [r - 12, r - 5], s * 16, .8); if (bar % 4 === 0) I.braam(t, g, r - 24, .6); }
      if (i === 0 || i === 8) vo('sine', 70, t, .4, .5, g, { slide: 50 });
    } },
    boss: { bpm: 100, steps: 16, bars: 4, play(t, i, bar, s, g) {   // industrial + braams
      const K = pat('x..x ..x. x.x. ..x.'); if (K[i]) I.kickX(t, g, 1); if (i === 4 || i === 12) I.snareX(t, g, 1); if (i % 2) I.hat(t, g, .6); if (i === 10) I.metal(t, g);
      const r = [38, 37, 34, 36][bar % 4]; I.spicc(t, g, r + 12 + [0, 3, 7, 3][i % 4], .8); if (i % 4 === 0) I.bass(t, g, r, s * 3.5, 1);
      if (i === 0 && bar % 2 === 0) I.braam(t, g, r - 12, .9);
      if (bar % 4 === 3 && i === 8) MOTIF.forEach((k, j) => I.box(t + j * s, g, CHIME[k], .6));
    } },
    fight: { bpm: 116, steps: 16, bars: 2, play(t, i, bar, s, g) {
      const K = pat('x... ..x. x... x...'); if (K[i]) I.kickX(t, g, .9); if (i === 4 || i === 12) I.snare(t, g, 1); I.hat(t, g, i % 2 ? .4 : .7);
      const r = [40, 38][bar % 2]; I.pulse(t, g, r + (i % 4 === 2 ? 12 : 0), s * .9, 1); if (i === 0) I.pad(t, g, [r + 12, r + 15, r + 19], s * 16, .7);
      if (i % 4 === 3) I.pluck(t, g, r + 24 + (i % 8 === 3 ? 3 : 7), .7);
    } },
    chase: { bpm: 152, steps: 16, bars: 4, play(t, i, bar, s, g) {   // hyperpop / industrial drive
      if (i % 4 === 0) I.kickX(t, g, 1); if (i === 4 || i === 12) I.clap(t, g, 1); I.hat(t, g, i % 2 ? .5 : .8);
      const r = [42, 45, 40, 47][bar % 4]; I.bass(t, g, r + (i % 2 ? 12 : 0), s * .9, 1);
      if (i % 4 === 2) I.saw(t, g, r + 24 + [0, 4, 7, 4][(i / 4) | 0], s * 1.4, .8);
      if (i === 15) I.vox(t, g, r + 31, 1);
    } },
    calm: { bpm: 72, steps: 8, bars: 4, play(t, i, bar, s, g) {
      const ch = [[50, 54, 57, 61], [47, 50, 54, 57], [43, 47, 50, 54], [45, 49, 52, 57]][bar % 4];
      I.piano(t, g, ch[i % 4] + (i > 3 ? 12 : 0), s * 3, .9); if (i === 0) { I.pad(t, g, ch.slice(0, 3), s * 8, .5); I.upright(t, g, ch[0] - 12, s * 6, .6); }
    } },
    title: { bpm: 66, steps: 8, bars: 4, play(t, i, bar, s, g) {
      if (i === 0) { I.pad(t, g, [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]][bar % 4], s * 8, .9); I.drone(t, g, 26, s * 8, .5); }
      if (bar % 2 === 0 && i < 7) I.box(t, g, CHIME[MOTIF[i]], .9);
      if (bar % 2 === 1 && i % 2 === 0) I.piano(t, g, [62, 65, 69, 73][i / 2] - 12, s * 2, .5);
    } },
  };
  T.investigate = T.present; T.tension = T.fight;

  function sched() {
    if (!ctx || !track) return;
    const tr = T[track.id]; const s = 60 / tr.bpm / 4 * (16 / tr.steps) * (tr.steps === 12 ? 4 / 3 : 1);
    while (nextT < ctx.currentTime + .14) {
      const i = step % tr.steps, bar = Math.floor(step / tr.steps) % tr.bars;
      const sw = tr.swing && i % 2 === 1 ? (tr.swing - .5) * 2 * s : 0;
      try { tr.play(nextT + sw, i, bar, s, track.g); } catch (e) { }
      nextT += s; step++;
    }
  }
  function setMood(m, instant) {
    if (m === mood && track) return; mood = m; if (!ctx) return;
    const id = T[m] ? m : 'present'; const now = ctx.currentTime;
    if (track) { const old = track.g; old.gain.cancelScheduledValues(now); old.gain.setTargetAtTime(0, now, .4); setTimeout(() => old.disconnect(), 2500); }
    const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus); g.gain.setTargetAtTime(1, now + .05, instant ? .05 : .5);
    track = { id, g }; step = 0; nextT = now + .08;
  }
  function setRain(on) { rainOn = on; if (!ctx) return; rainGain.gain.setTargetAtTime(on ? .08 : 0, ctx.currentTime, .8); }

  // ---- one-shot synth voices (sfx) ----
  function tone(type, f, dur, vol = .3, slideTo = null, delay = 0) {
    if (!ctx) return; const t = ctx.currentTime + delay; const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain(); env(g, t, .005, vol, dur); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, vol = .3, freq = 1000, type = 'bandpass', q = 1, delay = 0) {
    if (!ctx) return; const t = ctx.currentTime + delay; const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); env(g, t, .003, vol, dur); s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + .05);
  }
  const sfx = {
    step(surface) { // wet concrete / wood / metal
      if (surface === 'metal') { noise(.06, .08, 3200, 'bandpass', 6); tone('square', 180, .03, .02); }
      else if (surface === 'wood') { noise(.07, .1, 380, 'lowpass', 1); tone('sine', 90, .05, .05); }
      else if (surface === 'wet') { noise(.09, .08, 1800, 'bandpass', .7); noise(.05, .05, 4200, 'highpass', 1, .03); }
      else noise(.05, .06, 900, 'bandpass', 1);
    },
    ui() { tone('square', 880, .04, .05); },
    blip() { tone('square', 1200 + Math.random() * 300, .02, .025); },
    clue() { [523, 659, 784, 1046].forEach((f, i) => tone('triangle', f, .14, .12, null, i * .06)); },
    deduce() { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, .18, .07, null, i * .055)); noise(.4, .05, 6000, 'highpass', 1, .3); },
    wrong() { tone('sawtooth', 110, .35, .15, 70); tone('square', 116, .35, .08, 72); },
    swing() { noise(.12, .14, 900, 'bandpass', 2); },
    hit() { noise(.08, .25, 300, 'lowpass', 1); tone('square', 90, .08, .15, 50); },
    knife() { noise(.06, .14, 5000, 'highpass', 1); },
    shotgun() { noise(.35, .5, 700, 'lowpass', .6); tone('square', 60, .2, .25, 30); },
    taser() { for (let i = 0; i < 6; i++) tone('square', 1600 + Math.random() * 1600, .03, .06, null, i * .025); },
    horn() { tone('sawtooth', 220, .5, .18, 180); tone('sawtooth', 330, .5, .1, 260); noise(.4, .08, 600, 'bandpass', 3); },
    cast(lang) { const base = { whisper: 660, nanohive: 440, temporaltext: 330, foldspeak: 220, beam: 520 }[lang] || 500; tone('sine', base, .6, .07, base * 1.5); tone('sine', base * 1.01, .6, .05, base * 1.52); },
    counter() { tone('square', 1318, .06, .1); tone('square', 659, .2, .1, 165, .05); noise(.25, .12, 2400, 'bandpass', 2); },
    hurt() { tone('sawtooth', 200, .2, .18, 90); noise(.15, .15, 500, 'lowpass'); },
    door() { tone('triangle', 120, .25, .12, 80); noise(.2, .06, 400, 'lowpass'); },
    pickup() { tone('square', 660, .06, .06); tone('square', 990, .08, .06, null, .06); },
    swap() { tone('square', 300, .05, .08); noise(.05, .1, 900, 'bandpass', 3); tone('square', 420, .05, .07, null, .4); noise(.08, .08, 2400, 'bandpass', 4, .45); tone('square', 1200, .03, .1, null, .85); noise(.03, .15, 5000, 'highpass', 1, .85); }, // push · quarter-turn · click
    sting() { [61.7, 65.4, 69.3, 92.5].forEach(f => tone('sawtooth', f, 1.4, .12)); noise(1.2, .12, 200, 'lowpass'); tone('sine', 1760, 1.2, .03, 1700); },
    heartbeat() { tone('sine', 55, .12, .3, 40); tone('sine', 50, .12, .22, 38, .18); },
    foghorn() { tone('sawtooth', 73, 2.2, .07, 70); tone('sawtooth', 110, 2.2, .04, 104); },
    explode() { noise(.9, .6, 400, 'lowpass', .5); tone('square', 50, .6, .3, 25); },
    emp() { tone('sine', 2000, .5, .15, 60); noise(.4, .15, 3000, 'bandpass', 4); },
    tear() { tone('sawtooth', 40, 1, .2, 120); noise(.8, .1, 3000, 'highpass', 1); },
    bernard() { tone('sawtooth', 98, .7, .15, 61); tone('sawtooth', 103, .7, .12, 58); noise(.5, .08, 900, 'bandpass', 8); },
    rank() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone('triangle', f, .2, .1, null, i * .09)); },
    ach() { [784, 988, 1175, 1568].forEach((f, i) => tone('square', f, .12, .06, null, i * .07)); },
  };
  A.init = init; A.setMood = setMood; A.setRain = setRain; A.applyVolume = applyVolume; A.sfx = sfx;
  A.chime = (k) => { if (!ctx) return; const t = ctx.currentTime; const n = CHIME[k % 7]; [0, 12, 19].forEach((d, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mf(n + 12 + d); const g = ctx.createGain(); env(g, t, .004, [.22, .05, .02][i], 1.1); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 1.2); }); };
  const FILES = { hit: 'hit_mace', knife: 'hit_knife', staff: 'hit_staff', clue: 'discovery', rank: 'level_up', win: 'quest_complete', lose: 'battle_loss', block: 'shield_block', heal: 'potion', stun: 'status_stun', void: 'spell_void', cast: 'spell_cast', spark: 'spark', nova: 'special_nova', flame: 'blue_flame', zap: 'en_zap', portal: 'dm_void', mirror: 'mirror_attack', monster: 'creature_attack_2', ui2: 'equip', coin: 'buy' };
  const bufs = {};
  function loadFiles() { for (const k in FILES) fetch('assets/sfx/' + FILES[k] + '.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(d => { bufs[k] = d; }).catch(() => { }); }
  A.file = (k, vol = .7) => { if (!ctx || !bufs[k]) return false; const s = ctx.createBufferSource(); s.buffer = bufs[k]; const g = ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxBus); s.start(); return true; };
  A.play = (name, ...a) => { try { if (A.file(name)) return; if (ctx && sfx[name]) sfx[name](...a); } catch (e) { } };
  A.tick = () => { };
  A.getMood = () => mood;
  A.tracks = () => Object.keys(T);
  return A;
})();
