/* =========================================================================
   CHRONOMANCER — 08-main.js
   Game flow: one objective at a time, the pink arrow's target, chapter
   stars, Jester's COVER, then boot + main loop + service worker.
   ========================================================================= */
'use strict';
TM.Game = (() => {
  const G = {}; let lastKey = null, completing = false, askT = null;
  const S = () => TM.S;
  const ch = () => TM.CHAPTERS[TM.S.run.ch];
  G.steps = () => ch().steps.filter((s) => !s.only || s.only === TM.S.run.hero);
  G.done = (st) => TM.S.check(st.need);
  G.step = () => G.steps().find((s) => !G.done(s)) || null;
  G.text = (t) => typeof t === 'object' ? (TM.S.run.hero === 'augie' ? t.a : t.j) : t;
  G.progress = (st) => { const c = st.need.clue; if (Array.isArray(c)) return `<em>${c.filter(TM.S.has).length}/${c.length}</em>`; return ''; };
  function sceneOf(id) { for (const [k, sc] of Object.entries(ch().scenes)) if (sc.things.some((t) => t.id === id)) return k; return null; }
  function targetIds() {
    const st = G.step(); if (!st || !st.target) return [];
    if (Array.isArray(st.target)) { const c = [].concat(st.need.clue || []); return st.target.filter((t, i) => !TM.S.has(c[i])); }
    return [st.target];
  }
  G.targets = () => { const w = TM.W.state; return targetIds().filter((id) => sceneOf(id) === w.scene); };
  G.doorTo = () => {
    const w = TM.W.state; const ids = targetIds(); if (!ids.length) return null; const goal = sceneOf(ids[0]); if (!goal || goal === w.scene) return null;
    // breadth-first over doors to find the next room on the way
    const q = [[w.scene, null]], seen = { [w.scene]: 1 };
    while (q.length) { const [sc, first] = q.shift(); for (const t of ch().scenes[sc].things) if (t.type === 'door' && t.to !== 'END' && !seen[t.to]) { const f = first || t; if (t.to === goal) return w.things.find((x) => x.id === f.id) || null; seen[t.to] = 1; q.push([t.to, f]); } }
    return null;
  };
  G.checkSteps = () => {
    const run = TM.S.run; if (!run || TM.Main.state !== 'play') return;
    const st = G.step(); const key = st ? G.steps().indexOf(st) : 'done';
    if (key !== lastKey) {
      if (lastKey !== null && lastKey !== 'done') { TM.Audio.play('coin'); TM.UI.toast('✓ ' + G.text(G.steps()[lastKey].text)); }
      lastKey = key;
      if (st) { TM.UI.banner(st.need.q ? 'CASE QUESTION!' : G.text(st.text), st.need.q ? 'mag' : 'soft'); }
    }
    clearTimeout(askT);
    if (st && st.need.q) askT = setTimeout(() => { if (!TM.UI.blocking() && G.step() === st) TM.UI.question(st.need.q); }, 900);
    if (!st && !completing) { completing = true; setTimeout(G.complete, 700); }
  };
  G.reset = () => { lastKey = null; completing = false; };
  G.onClue = (id) => { (TM.ONCLUE[id] || []).forEach((f) => TM.S.run.flags[f] = true); };
  G.onSolve = (q) => { (TM.ONSOLVE[q] || []).forEach((f) => TM.S.run.flags[f] = true); };
  G.solveNow = () => { const st = G.step(); if (st && st.need.q) TM.UI.question(st.need.q); };

  /* Jester is undercover: cop-ish answers cost cover; at zero the crew attacks */
  G.cover = (n) => {
    const run = TM.S.run; if (run.hero !== 'jester') return;
    run.cover = Math.max(0, Math.min(3, run.cover + n));
    if (n < 0) { TM.Audio.play('sting'); TM.UI.toast('⚠ Your COVER slipped! (' + run.cover + ' left)'); TM.W.shake(); }
    if (run.cover <= 0) {
      const wait = setInterval(() => { if (TM.UI.blocking()) return; clearInterval(wait);
        TM.S.stat('blown'); TM.UI.banner('COVER BLOWN!', 'red');
        const p = TM.W.state.p; setTimeout(() => TM.Battle.start({ fight: 'f_blown', foe: 'mantis', x: p.x + 60, blown: true }), 900);
      }, 200);
    }
  };
  /* BLEND: in the past, saying something from the future gets you noticed. At zero, the law comes. */
  G.blend = (n) => {
    const run = TM.S.run; if (ch().era === '2026') return;
    run.blend = Math.max(0, Math.min(3, (run.blend == null ? 3 : run.blend) + n));
    if (n < 0) { TM.S.stat('slip'); TM.Audio.play('sting'); TM.UI.toast('⚠ You slipped — that\'s not something people know in ' + ch().era + '. (BLEND ' + run.blend + ')'); TM.W.shake(); }
    if (run.blend <= 0) {
      const wait = setInterval(() => { if (TM.UI.blocking()) return; clearInterval(wait);
        TM.UI.banner('THEY\'RE ONTO YOU', 'red'); const f = { '1986': 'f_law86', '1947': 'f_law47', '1888': 'f_law88' }[ch().era];
        const p = TM.W.state.p; setTimeout(() => TM.Battle.start({ fight: f, x: p.x + 60, blend: true }), 900);
      }, 200);
    }
  };
  G.blendRestored = () => { TM.S.run.blend = 2; TM.UI.notice('SHAKEN OFF', 'You got away and kept your head down. People are still watching — BLEND is back to 2. Think before you talk about the future.'); };
  G.coverRestored = () => { const run = TM.S.run; run.cover = 1; TM.UI.notice('BARELY', 'You fought your way out and convinced them it was a misunderstanding. They\'re watching you now. Careful — you only have 1 cover left.'); };

  G.complete = () => {
    const run = TM.S.run, C = ch(), p = TM.S.profile; const stats = run.chStats[run.ch] || { wrong: 0, ko: 0, caught: 0, blown: 0 };
    const glyphs = Object.values(C.scenes).reduce((a, s) => a + s.things.filter((t) => t.type === 'glyph').length, 0);
    const got = Object.keys(run.glyphs).filter((k) => k.startsWith(run.ch + ':')).length;
    const past = C.era !== '2026';
    const why = [['Solved the chapter', true], [past ? 'No wrong answers, never slipped in ' + C.era : run.hero === 'jester' ? 'No wrong answers, cover never blown' : 'No wrong answers', !stats.wrong && !stats.blown && !stats.slip], [`Found every lost second (${got}/${glyphs})`, got >= glyphs]];
    if (past && !stats.slip) TM.S.feat('blend');
    const stars = why.filter((w) => w[1]).length;
    const key = run.hero + ':' + C.id; p.stars[key] = Math.max(p.stars[key] || 0, stars); TM.S.save();
    if (stars === 3) TM.S.feat('perfect'); if (got >= glyphs) TM.S.feat('glyphs'); if (!stats.ko) TM.S.feat('noko');
    if (['augie', 'jester'].every((h) => TM.CHAPTERS.every((c) => p.stars[h + ':' + c.id] === 3))) TM.S.feat('allstars');
    TM.S.xp(100 + stars * 50, 'chapter');
    TM.UI.results(C, stars, why, () => {
      const go = () => {
        if (C.epilogue) { p.done[run.hero] = true; TM.S.save(); TM.S.feat('case1'); if (p.done.augie && p.done.jester) TM.S.feat('both'); TM.UI.ending(); TM.S.clearRun(); TM.Main.state = 'title'; return; }
        TM.Main.startChapter(run.ch + 1);
      };
      if (C.outro) TM.UI.talk(C.outro, null, go); else go();
    });
  };
  return G;
})();

TM.Main = (() => {
  const M = { state: 'boot' }; let last = 0, hudT = 0;
  M.newGame = (hero) => { TM.S.newRun(hero); TM.S.run.cover = 3; M.startChapter(0); };
  M.startChapter = (i) => {
    const run = TM.S.run; run.ch = i; run.scene = null; run.x = null; run.sceneRestore = null; TM.S.refill(); run.hp = run.maxHp;
    TM.UI.closeScreen(); TM.UI.close(); M.state = 'play'; document.body.classList.add('playing'); TM.Game.reset();
    const C = TM.CHAPTERS[i]; const prev = i > 0 ? TM.CHAPTERS[i - 1].era : null; run.blend = 3;
    const go = () => { TM.W.enter(Object.keys(C.scenes)[0]); TM.S.saveRun(); if (C.intro) TM.UI.talk(C.intro); };
    if (prev && prev !== C.era) { TM.W.enter(Object.keys(C.scenes)[0]); TM.UI.timejump(prev, C.era, () => { if (C.intro) TM.UI.talk(C.intro); }); TM.S.saveRun(); } else go();
  };
  M.cont = () => {
    const run = TM.S.loadRun(); if (!run) return TM.UI.title(); if (run.cover == null) run.cover = 3;
    TM.UI.closeScreen(); M.state = 'play'; document.body.classList.add('playing'); TM.Game.reset();
    const C = TM.CHAPTERS[run.ch]; TM.W.enter(run.scene || Object.keys(C.scenes)[0]);
    TM.UI.toast('Welcome back, detective.');
  };
  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
    if (M.state === 'play' && TM.S.run) { TM.W.update(dt); TM.W.render(); hudT -= dt; if (hudT <= 0) { hudT = .12; TM.UI.hud(); } }
    requestAnimationFrame(loop);
  }
  function boot() {
    TM.S.load(); TM.W.init(); TM.In.bindTouch();
    document.querySelectorAll('[data-ui]').forEach((b) => b.addEventListener('click', () => { if (M.state !== 'play' || TM.UI.blocking()) return; TM.Audio.init(); TM.Audio.play('ui'); const u = b.dataset.ui; if (u === 'file') TM.UI.caseFile(); if (u === 'menu') TM.UI.pause(); }));
    document.getElementById('obj').addEventListener('click', () => { if (M.state === 'play' && !TM.UI.blocking()) TM.Game.solveNow(); });
    document.addEventListener('pointerdown', () => TM.Audio.init(), { once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden && TM.S.run) TM.S.saveRun(); });
    TM.UI.title(); requestAnimationFrame(loop);
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
  }
  window.addEventListener('DOMContentLoaded', boot);
  return M;
})();
