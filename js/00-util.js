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
   AUDIO — everything is synthesized. Music = layered drones whose mix
   changes with mood: 'investigate', 'tension', 'boss', 'horror', 'calm'.
   ------------------------------------------------------------------------- */
TM.Audio = (() => {
  let ctx = null, master, musicBus, sfxBus, rainGain, noiseBuf;
  let layers = {}, mood = 'off', rainOn = false, hbTimer = 0, fogTimer = 0;
  const A = {};

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // rain: looped band-passed noise
    const rn = ctx.createBufferSource(); rn.buffer = noiseBuf; rn.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.4;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    rainGain = ctx.createGain(); rainGain.gain.value = 0;
    rn.connect(bp); bp.connect(hp); hp.connect(rainGain); rainGain.connect(master); rn.start();
    buildLayers(); loadFiles();
    applyVolume();
    setMood(mood === 'off' ? 'calm' : mood, true);
  }
  function applyVolume() {
    if (!ctx) return; const st = (TM.S && TM.S.profile) ? TM.S.profile.settings : { sound: true, music: .7, sfx: .8 };
    master.gain.value = st.sound ? 1 : 0; musicBus.gain.value = st.music * .55; sfxBus.gain.value = st.sfx;
  }
  function osc(type, f, g, dest, detune = 0) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune; const gn = ctx.createGain(); gn.gain.value = g; o.connect(gn); gn.connect(dest); o.start(); return { o, g: gn }; }
  function buildLayers() {
    // each layer has its own gain we crossfade
    const mk = () => { const g = ctx.createGain(); g.gain.value = 0; g.connect(musicBus); return g; };
    // INVESTIGATE: low minor drone + slow filtered pad
    const inv = mk(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(inv);
    osc('sawtooth', 55, .18, lp); osc('sawtooth', 55, .14, lp, 9); osc('triangle', 82.4, .12, lp); osc('sine', 130.8, .05, lp);
    const lfo = ctx.createOscillator(); lfo.frequency.value = .07; const lg = ctx.createGain(); lg.gain.value = 180; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    layers.investigate = inv;
    // TENSION: dissonant cluster with tremolo
    const ten = mk(); const tl = ctx.createBiquadFilter(); tl.type = 'lowpass'; tl.frequency.value = 900; tl.connect(ten);
    const trem = ctx.createGain(); trem.gain.value = .6; trem.connect(tl);
    osc('sawtooth', 73.4, .12, trem); osc('sawtooth', 77.8, .12, trem); osc('square', 36.7, .1, trem);
    const tlfo = ctx.createOscillator(); tlfo.frequency.value = 5.5; const tlg = ctx.createGain(); tlg.gain.value = .4; tlfo.connect(tlg); tlg.connect(trem.gain); tlfo.start();
    layers.tension = ten;
    // BOSS: pulsing low end + metallic high
    const bos = mk(); const bl = ctx.createBiquadFilter(); bl.type = 'lowpass'; bl.frequency.value = 1200; bl.connect(bos);
    const pul = ctx.createGain(); pul.gain.value = .5; pul.connect(bl);
    osc('sawtooth', 41.2, .22, pul); osc('square', 82.4, .08, pul, 12); osc('triangle', 622, .025, bl); osc('triangle', 659, .025, bl);
    const blfo = ctx.createOscillator(); blfo.type = 'square'; blfo.frequency.value = 2.2; const blg = ctx.createGain(); blg.gain.value = .45; blfo.connect(blg); blg.connect(pul.gain); blfo.start();
    layers.boss = bos;
    // HORROR: high glassy beating tones (entity / Gabriel)
    const hor = mk(); osc('sine', 1046, .03, hor); osc('sine', 1052, .03, hor); osc('sine', 1568, .015, hor); osc('triangle', 49, .12, hor);
    layers.horror = hor;
    // CALM: soft fifths
    const calm = mk(); const cl = ctx.createBiquadFilter(); cl.type = 'lowpass'; cl.frequency.value = 600; cl.connect(calm);
    osc('triangle', 110, .1, cl); osc('triangle', 164.8, .07, cl); osc('sine', 220, .04, cl);
    layers.calm = calm;
  }
  function setMood(m, instant) {
    mood = m; if (!ctx) return; const t = ctx.currentTime;
    for (const k in layers) { const g = layers[k].gain; g.cancelScheduledValues(t); g.setTargetAtTime(k === m ? (k === 'horror' ? 1.2 : 1) : 0, t, instant ? .05 : 1.2); }
  }
  function setRain(on) { rainOn = on; if (!ctx) return; rainGain.gain.setTargetAtTime(on ? .09 : 0, ctx.currentTime, .8); }

  // ---- one-shot synth voices ----
  function env(node, t, a, peak, d) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
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
    swap() { tone('square', 300, .03, .06); tone('square', 420, .03, .06, null, .5); tone('square', 900, .04, .08, null, 1.6); }, // push · quarter-turn · click
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
  // real sound effects (from Step Quest) with synth fallback
  const FILES = { hit: 'hit_mace', knife: 'hit_knife', staff: 'hit_staff', clue: 'discovery', rank: 'level_up', win: 'quest_complete', lose: 'battle_loss', block: 'shield_block', heal: 'potion', stun: 'status_stun', void: 'spell_void', cast: 'spell_cast', spark: 'spark', nova: 'special_nova', flame: 'blue_flame', zap: 'en_zap', portal: 'dm_void', mirror: 'mirror_attack', monster: 'creature_attack_2', ui2: 'equip', coin: 'buy' };
  const bufs = {};
  function loadFiles() { for (const k in FILES) fetch('assets/sfx/' + FILES[k] + '.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(d => { bufs[k] = d; }).catch(() => { }); }
  A.file = (k, vol = .7) => { if (!ctx || !bufs[k]) return false; const s = ctx.createBufferSource(); s.buffer = bufs[k]; const g = ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxBus); s.start(); return true; };
  A.play = (name, ...a) => { try { if (A.file(name)) return; if (ctx && sfx[name]) sfx[name](...a); } catch (e) { } };
  A.tick = (dt, nerve, outdoors) => {
    if (!ctx) return;
    if (nerve < 35) { hbTimer -= dt; if (hbTimer <= 0) { sfx.heartbeat(); hbTimer = TM.U.lerp(.55, 1.1, nerve / 35); } }
    if (outdoors) { fogTimer -= dt; if (fogTimer <= 0) { sfx.foghorn(); fogTimer = 25 + Math.random() * 20; } }
  };
  A.getMood = () => mood;
  return A;
})();
