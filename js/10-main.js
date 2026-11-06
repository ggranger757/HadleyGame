/* =========================================================================
   TECHNOMANCERS — 10-main.js
   Boot, main loop (fixed-cap delta time), scaling, level flow, cutscenes,
   service-worker registration.
   ========================================================================= */
'use strict';

TM.Main = (() => {
  const M = { state: 'boot' };
  let last = 0, titleT = 0;

  function resize() {
    const stage = document.getElementById('stage'), cv = document.getElementById('game');
    const touch = document.body.classList.contains('touch');
    const portrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', portrait);
    const ctrlH = touch && portrait ? Math.min(window.innerHeight * .4, 300) : 0;
    const aw = window.innerWidth, ah = window.innerHeight - ctrlH;
    // portrait phones get a taller internal view instead of a letterboxed 16:9 strip
    let iw = 480, ih = 270;
    if (portrait && aw < 700) { iw = 288; ih = Math.round(Math.max(270, Math.min(520, iw * ah / aw))); }
    if (TM.R.setView(iw, ih) && TM.G.W) TM.G.updateCam(true);
    let s = Math.min(aw / iw, ah / ih);
    if (!touch && s >= 1) s = Math.floor(s); // integer scaling on desktop for crisp pixels
    cv.style.width = Math.floor(iw * s) + 'px'; cv.style.height = Math.floor(ih * s) + 'px';
    stage.style.height = ah + 'px';
  }

  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
    TM.In.pollPad();
    if (M.state === 'play' && TM.G.W) {
      const W = TM.G.W;
      if (!TM.UI.blocking()) {
        if (TM.In.hit('pause')) TM.UI.pause();
        else if (TM.In.hit('board')) TM.Forensics.board();
      }
      TM.G.update(dt);
      TM.R.frame(W, W.t);
      TM.UI.hud(dt);
      TM.Audio.tick(dt, TM.S.run.nerve, W.L.outdoors);
    } else titleFrame(dt);
    requestAnimationFrame(loop);
  }

  // title backdrop: rain over a lit OmniBox eye
  function titleFrame(dt) {
    titleT += dt; const cv = document.getElementById('game'), x = cv.getContext('2d'); const P = TM.PAL; const w = cv.width, h = cv.height;
    x.fillStyle = P.ink; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(45,49,66,${.3 + .2 * Math.sin(titleT + i)})`; x.fillRect((i * 37) % w, h * .55 + (i * 13) % 120, 14, 140); }
    x.save(); x.globalAlpha = .25 + .1 * Math.sin(titleT * 1.3); TM.R.glyph(x, 'lattice', w / 2, h * .4, 6, P.magenta); x.restore();
    x.strokeStyle = 'rgba(154,164,178,.25)'; x.beginPath();
    for (let i = 0; i < 120; i++) { const rx = ((i * 53 + titleT * 60) % (w + 40)) - 20, ry = ((i * 97 + titleT * 260) % (h + 20)) - 10; x.moveTo(rx, ry); x.lineTo(rx + 2, ry - 7); } x.stroke();
  }

  M.newGame = (char) => {
    TM.S.newRun(char); TM.UI.closeScreen(); TM.UI.close(); M.startLevel(0);
  };
  M.continueGame = () => {
    const run = TM.S.loadAuto(); if (!run) return TM.UI.title();
    TM.UI.closeScreen(); M.state = 'play'; document.body.classList.add('playing'); TM.G.load(run.level, true); TM.UI.applySettings();
    TM.UI.toast('Welcome back. ' + TM.LEVELS[run.level].name, 'sys');
  };
  M.loadManual = () => { const r = TM.S.loadManual(); if (r) M.continueGame(); };
  M.startLevel = (n) => {
    const L = TM.LEVELS[n]; TM.UI.closeScreen(); M.state = 'play'; document.body.classList.add('playing');
    TM.S.run.pos = null; TM.G.load(n, false); TM.UI.applySettings();
    const h = new Date().getHours(); if (h < 4) TM.S.unlock('night_owl');
    const intro = typeof L.intro === 'object' ? L.intro[TM.S.run.char] : L.intro;
    if (intro) TM.UI.dialog(intro);
    if (n === 0) setTimeout(() => !TM.UI.blocking() && TM.UI.toast(TM.In.touch ? 'Left stick to move · ◉ to interact · ⚑ board' : 'WASD to move · E interact · F attack · Q kit · TAB board · ESC pause', 'sys'), 600);
  };
  M.finishLevel = () => {
    const W = TM.G.W; if (!W || W.finishing) return; W.finishing = true;
    const gr = TM.G.completeLevel(); const n = W.L.n;
    TM.Audio.play('rank');
    TM.UI.levelComplete(gr, () => {
      const go = () => { if (n + 1 < TM.LEVELS.length) { TM.S.run.level = n + 1; TM.S.run.pos = null; TM.S.autosave(); M.startLevel(n + 1); } };
      if (W.L.outro) TM.UI.dialog(W.L.outro, null, go); else go();
    });
  };
  M.endCase = () => {
    const run = TM.S.run, prof = TM.S.profile; run.flags.case_done = true;
    prof.completed[run.char] = true; TM.S.saveProfile();
    if (prof.completed.augie && prof.completed.jester) TM.S.unlock('both');
    TM.G.completeLevel();
    M.state = 'title'; document.body.classList.remove('playing');
    TM.UI.ending();
    TM.S.clearRun();
  };

  function boot() {
    TM.S.load(); TM.R.init(); TM.In.buildTouch(); TM.UI.applySettings();
    resize(); window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    new MutationObserver(resize).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', () => { if (document.hidden && M.state === 'play') { TM.S.autosave(); if (!TM.UI.blocking()) TM.UI.pause(); } });
    document.addEventListener('pointerdown', () => TM.Audio.init(), { once: true });
    // touch top-bar buttons
    document.querySelectorAll('[data-ui]').forEach(b => b.addEventListener('click', () => { if (M.state !== 'play' || TM.UI.blocking()) return; TM.Audio.init(); if (b.dataset.ui === 'board') TM.Forensics.board(); if (b.dataset.ui === 'pause') TM.UI.pause(); }));
    TM.UI.title();
    requestAnimationFrame(loop);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  window.addEventListener('DOMContentLoaded', boot);
  return M;
})();
