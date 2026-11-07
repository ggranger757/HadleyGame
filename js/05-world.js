/* =========================================================================
   TECHNOMANCERS — 05-world.js
   Side-view scenes (Step Quest style): parallax backgrounds, the hero walks
   left/right, one ACTION button, a pink arrow that always points at the next
   thing to do. Also input, sprites, stealth guards, pickups.
   ========================================================================= */
'use strict';

TM.In = (() => {
  const held = {}, hits = {};
  const MAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'act', KeyE: 'act', Enter: 'act', ArrowUp: 'act', KeyW: 'act', Escape: 'menu', KeyC: 'file', Tab: 'file' };
  window.addEventListener('keydown', (e) => {
    TM.Audio.init();
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) { if (e.code === 'Escape') e.target.blur(); return; }
    if (TM.UI && TM.UI.onKey && TM.UI.onKey(e)) { e.preventDefault(); return; }
    const a = MAP[e.code]; if (!a) return; e.preventDefault(); if (!held[a]) hits[a] = true; held[a] = true;
  });
  window.addEventListener('keyup', (e) => { const a = MAP[e.code]; if (a) held[a] = false; });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  const In = {
    held: (a) => !!held[a], hit: (a) => { if (hits[a]) { hits[a] = false; return true; } return false; }, clear() { for (const k in hits) hits[k] = false; },
    bindTouch() {
      document.querySelectorAll('[data-hold]').forEach((b) => {
        const a = b.dataset.hold; const on = (e) => { e.preventDefault(); TM.Audio.init(); held[a] = true; b.classList.add('on'); }; const off = () => { held[a] = false; b.classList.remove('on'); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
      });
      document.querySelectorAll('[data-tap]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); TM.Audio.init(); hits[b.dataset.tap] = true; TM.U.vibrate(8); }));
    },
  };
  return In;
})();

TM.W = (() => {
  const U = TM.U, P = TM.PAL || {};
  const GROUND = { c1: 214, c3: 224, c4: 232, lab: 218, ind: 292, bulk: 184, cold: 198, miami: 193, b4: 232, s4n: 250 };
  const TINT = { night: 'rgba(4,6,30,.62)', dark: 'rgba(0,0,0,.55)', neon: 'rgba(28,0,40,.32)', club: 'rgba(38,0,48,.5)', lab: 'rgba(0,18,30,.35)', ritual: 'rgba(48,0,32,.55)', dawn: null };
  let cv, ctx, lc, lx, W = 480, H = 270, imgs = {}, rain = [];
  const w = { scene: null, sc: null, cam: 0, t: 0, p: null, fx: [], things: [], battle: null };

  function img(src) { if (!imgs[src]) { const i = new Image(); i.src = src; imgs[src] = i; } return imgs[src]; }
  function preload() { for (const k in TM.SPR) img('assets/sprites/' + k + '.png'); for (const k in TM.BG) for (const l of TM.BG[k].layers) img(`assets/bg/${k}/${l}.png`); }

  function sizeCanvas() {
    const st = document.getElementById('stage'); if (!st) return; const r = st.getBoundingClientRect();
    const bg = w.sc ? TM.BG[w.sc.bg] : { h: 270 }; H = bg.h;
    W = Math.round(U.clamp(H * r.width / Math.max(1, r.height), H * .72, H * 2.3));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; lc.width = W; lc.height = H; ctx.imageSmoothingEnabled = false; }
    const s = Math.min(r.width / W, r.height / H); cv.style.width = Math.round(W * s) + 'px'; cv.style.height = Math.round(H * s) + 'px';
    rain = Array.from({ length: Math.round(W / 4) }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 200 + Math.random() * 140 }));
  }

  /* ---------------- sprites ---------------- */
  function heroSpr() { return TM.HEROES[TM.S.run.hero].spr; }
  function partnerSpr() { return TM.S.run.hero === 'augie' ? 'jester' : 'augie'; }
  function drawSpr(id, anim, t, x, ground, dir, o = {}) {
    if (id === 'PARTNER') id = partnerSpr();
    const m = TM.SPR[id]; if (!m) return; const a = m.anims[anim] || m.anims.idle; const im = img('assets/sprites/' + id + '.png'); if (!im.complete) return;
    const f = o.frame != null ? Math.min(o.frame, a.n - 1) : Math.floor(t * (anim === 'walk' ? 10 : 7)) % a.n;
    const s = (m.scale || 1) * (o.scale || 1); const fw = m.fw, fh = m.fh;
    const feet = (a.b[1] + a.b[3]);
    const dx = Math.round(x - fw * s / 2), dy = Math.round(ground - feet * s);
    const flip = (m.face === 'left') ? dir > 0 : dir < 0;
    ctx.save(); if (o.alpha != null) ctx.globalAlpha = o.alpha; if (o.flash) ctx.filter = 'brightness(3)';
    if (flip) { ctx.translate(dx + fw * s, dy); ctx.scale(-1, 1); ctx.drawImage(im, f * fw, a.r * fh, fw, fh, 0, 0, fw * s, fh * s); }
    else ctx.drawImage(im, f * fw, a.r * fh, fw, fh, dx, dy, fw * s, fh * s);
    ctx.restore();
    return { top: dy + a.b[1] * s, h: a.b[3] * s };
  }
  function sprTop(id) { if (id === 'PARTNER') id = partnerSpr(); const m = TM.SPR[id]; if (!m) return 50; const a = m.anims.idle; return a.b[3] * (m.scale || 1); }

  /* ---------------- scene ---------------- */
  function chapter() { return TM.CHAPTERS[TM.S.run.ch]; }
  function enter(sceneId, fromId) {
    const ch = chapter(); const sc = ch.scenes[sceneId]; w.scene = sceneId; w.sc = sc; const run = TM.S.run; run.scene = sceneId;
    w.ground = GROUND[sc.bg] || 220;
    w.things = sc.things.filter((t) => !t.only || t.only === run.hero).map((t, i) => ({ ...t, key: t.id || (sceneId + i) }));
    let x = sc.start; if (fromId) { const back = w.things.find((t) => t.type === 'door' && t.to === fromId); if (back) x = back.x + (back.x < sc.w / 2 ? 40 : -40); }
    if (run.x != null && !fromId && run.sceneRestore === sceneId) x = run.x;
    w.p = { x, dir: 1, walking: false, hidden: false, anim: 'idle' };
    w.cam = U.clamp(x - W / 2, 0, Math.max(0, sc.w - W));
    for (const t of w.things) if (t.type === 'cop') { t.cx = t.x; t.cdir = -1; t.wait = 0; }
    run.flags['seen_' + sceneId] = true;
    TM.Audio.setRain(!!sc.rain);
    sizeCanvas(); TM.S.saveRun(); TM.Game.checkSteps();
  }
  const visible = (t) => {
    const run = TM.S.run;
    if (t.hidden && !run.flags[t.hidden]) return false;
    if (t.type === 'clue' && TM.S.has(t.clue)) return false;
    if (t.type === 'foe' && run.wins[t.fight]) return false;
    if (t.type === 'glyph' && run.glyphs[run.ch + ':' + t.key]) return false;
    if (t.type === 'med' && run.flags['med_' + run.ch + t.key]) return false;
    if (t.type === 'wall' && run.flags.wall_open) return false;
    if (t.type === 'npc' && t.id === 'canister' && run.flags.canister) return false;
    if (t.type === 'puzzle' && run.flags['pz_' + t.puzzle]) return false;
    if (t.id === 'rival' && run.flags.rival_done) return false;
    return true;
  };
  function nearest() {
    let best = null, bd = 34;
    for (const t of w.things) { if (!visible(t) || ['glyph', 'med', 'prop', 'cop'].includes(t.type)) continue; const d = Math.abs(t.x - w.p.x); if (d < bd) { bd = d; best = t; } }
    return best;
  }
  function label(t) {
    if (!t) return null; if (t.label) return t.label;
    return { clue: 'LOOK', npc: 'TALK', door: 'GO', foe: 'FIGHT', puzzle: 'SOLVE', hide: w.p.hidden ? 'COME OUT' : 'HIDE', wall: 'TOUCH' }[t.type] || 'USE';
  }

  /* ---------------- update ---------------- */
  function update(dt) {
    w.t += dt; const p = w.p, sc = w.sc; if (!sc) return;
    w.fx = w.fx.filter((f) => (f.t += dt) < f.life);
    if (w.battle) { TM.Battle.update(dt); return; }
    if (TM.UI.blocking()) { p.walking = false; return; }
    const dirIn = (TM.In.held('right') ? 1 : 0) - (TM.In.held('left') ? 1 : 0);
    if (dirIn && p.hidden) { p.hidden = false; }
    p.walking = !!dirIn; if (dirIn) { p.dir = dirIn; p.x = U.clamp(p.x + dirIn * 92 * dt, 14, sc.w - 14); p.step = (p.step || 0) - dt; if (p.step <= 0) { p.step = .34; TM.Audio.play('step', sc.rain ? 'wet' : 'tile'); } }
    const target = U.clamp(p.x - W / 2 + p.dir * 30, 0, Math.max(0, sc.w - W)); w.cam += (target - w.cam) * Math.min(1, dt * 5);
    // pickups
    const run = TM.S.run;
    for (const t of w.things) {
      if (!visible(t)) continue;
      if (t.type === 'glyph' && Math.abs(t.x - p.x) < 16) { run.glyphs[run.ch + ':' + t.key] = 1; TM.Audio.play('spark'); burst(t.x, w.ground - t.y, '#ff2a8d', 14); TM.UI.toast('◆ Hidden glyph found! (' + glyphCount() + ')'); TM.S.xp(25, 'glyph'); const f = Object.keys(TM.FILES).find((k) => !TM.S.profile.files[k]); if (f) { TM.S.file(f); TM.UI.toast('📁 New file unlocked: ' + TM.FILES[f][0]); } TM.S.saveRun(); }
      if (t.type === 'med' && Math.abs(t.x - p.x) < 16) { run.flags['med_' + run.ch + t.key] = 1; run.meds++; TM.Audio.play('heal'); TM.UI.toast('+1 MED KIT'); TM.S.saveRun(); }
    }
    // stealth guards
    for (const t of w.things) if (t.type === 'cop') {
      if (t.wait > 0) { t.wait -= dt; if (t.wait <= 0) t.cdir *= -1; }
      else { t.cx += t.cdir * 34 * dt; if (t.cx < t.x1 || t.cx > t.x2) { t.cx = U.clamp(t.cx, t.x1, t.x2); t.wait = 1.4; } }
      const rel = (p.x - t.cx) * t.cdir; const facingAway = t.wait > 0 && t.wait < .6;
      if (!p.hidden && rel > -6 && rel < 120 && !facingAway) caught(t);
    }
    // interaction
    const n = nearest(); TM.UI.action(label(n));
    if (TM.In.hit('act') && n) use(n);
    if (TM.In.hit('menu')) TM.UI.pause();
    if (TM.In.hit('file')) TM.UI.caseFile();
    run.x = p.x; run.sceneRestore = w.scene;
  }
  function caught(t) {
    const p = w.p; TM.S.stat('caught'); TM.Audio.play('sting'); shake(); TM.UI.banner('SPOTTED!', 'red');
    p.x = w.sc.start; p.hidden = false; w.cam = 0; for (const c of w.things) if (c.type === 'cop') { c.cx = c.x; c.wait = 0; }
    TM.UI.toast('The guard saw you. Back to the start — wait until he turns away, then move. Hide behind cover!');
  }
  function glyphCount() { const run = TM.S.run; const total = Object.values(chapter().scenes).reduce((a, s) => a + s.things.filter((t) => t.type === 'glyph').length, 0); const got = Object.keys(run.glyphs).filter((k) => k.startsWith(run.ch + ':')).length; return got + '/' + total; }
  function use(t) {
    TM.Audio.play('ui');
    const run = TM.S.run;
    if (t.type === 'clue') return TM.UI.clue(t.clue);
    if (t.type === 'npc') {
      const tg = TM.Game.targets().includes(t.id);
      if (TM.Talk.has(t.id) && run.flags['talked_' + t.id] && !tg) return TM.Talk.open(t.id);
      return t.dlg && TM.UI.talk(t.dlg, t, () => { if (TM.Talk.has(t.id) && !run.flags['chathint']) { run.flags.chathint = 1; TM.UI.toast('💬 Tip: TALK to someone again to ask them ANYTHING — type your own questions.'); } });
    }
    if (t.type === 'door') { if (t.to === 'END') { run.flags.END = true; TM.Game.checkSteps(); return; } return TM.UI.fade(() => enter(t.to, w.scene)); }
    if (t.type === 'foe') return TM.Battle.start(t);
    if (t.type === 'hide') { w.p.hidden = !w.p.hidden; w.p.x = t.x; TM.Audio.play('ui'); return; }
    if (t.type === 'wall') return TM.Puzzle.open('spot', () => TM.UI.talk('wall'));
    if (t.type === 'puzzle') return TM.Puzzle.open(t.puzzle, () => { const th = t.then || {}; run.flags['pz_' + t.puzzle] = true; if (th.flag) run.flags[th.flag] = true; if (th.clue) TM.UI.clue(th.clue); else if (th.dlg) TM.UI.talk(th.dlg); TM.Game.checkSteps(); TM.S.saveRun(); });
  }

  /* ---------------- draw ---------------- */
  function burst(x, y, col, n = 10) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 30 + Math.random() * 70; w.fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, col, t: 0, life: .6 }); } }
  function shake() { if (TM.S.profile.settings.shake) w.shakeT = .35; U.vibrate(40); }
  function drawBG(cam) {
    const bg = TM.BG[w.sc.bg]; const n = bg.layers.length;
    for (let i = 0; i < n; i++) {
      const im = img(`assets/bg/${w.sc.bg}/${bg.layers[i]}.png`); if (!im.complete || !im.width) continue;
      const f = i === 0 ? .02 : i === n - 1 ? 1 : .1 + .75 * Math.pow(i / (n - 1), 1.4);
      const lw = im.width, off = ((cam * f) % lw + lw) % lw; const lh = im.height;
      for (let x = -off; x < W; x += lw) ctx.drawImage(im, Math.round(x), H - lh);
    }
  }
  function targets() { return TM.Game.targets(); }
  function render() {
    if (!w.sc) return; const t = w.t, p = w.p, run = TM.S.run;
    ctx.save(); ctx.clearRect(0, 0, W, H);
    if (w.shakeT > 0) { w.shakeT -= 1 / 60; ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 4); }
    if (w.battle) {
      // lift the fight above the battle menu so both fighters are fully visible
      const panel = document.getElementById('battle'), st = document.getElementById('stage');
      const ph = panel ? panel.getBoundingClientRect().height : 0, sr = st.getBoundingClientRect(), cr = cv.getBoundingClientRect();
      const visBottom = Math.min(cr.bottom, window.innerHeight - ph) - cr.top; const gy = Math.max(H * .42, Math.min(w.ground, visBottom / (cr.height / H) - 10));
      const off = w.ground - gy;
      ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, -off); drawBG(w.cam); ctx.restore();
      TM.Battle.render(ctx, W, H, gy, drawSpr, t); overlay(); ctx.restore(); return;
    }
    drawBG(w.cam);
    ctx.translate(-Math.round(w.cam), 0);
    const g = w.ground; const tg = targets();
    for (const th of w.things) {
      if (!visible(th)) continue; const x = th.x;
      if (th.type === 'prop') drawProp(th.art, x, g, t);
      if (th.type === 'hide') { ctx.fillStyle = '#2a2d36'; ctx.fillRect(x - 14, g - 22, 28, 22); ctx.fillStyle = '#3a3e4a'; ctx.fillRect(x - 14, g - 22, 28, 3); }
      if (th.type === 'wall') { ctx.fillStyle = 'rgba(90,96,110,.9)'; ctx.fillRect(x - 14, g - 70, 28, 70); ctx.fillStyle = `rgba(255,42,141,${.15 + .15 * Math.sin(t * 5)})`; ctx.fillRect(x - 14, g - 70, 28, 70); }
      if (th.type === 'door') { const back = th.back; ctx.fillStyle = 'rgba(230,236,240,.85)'; ctx.font = '10px Silkscreen, monospace'; ctx.textAlign = 'center'; ctx.fillText(back ? '◀' : '▶', x, g - 30 + Math.sin(t * 4) * 2); ctx.fillStyle = 'rgba(230,236,240,.12)'; ctx.fillRect(x - 10, g - 54, 20, 54); }
      if (th.type === 'glyph') { ctx.save(); ctx.globalAlpha = .45 + .25 * Math.sin(t * 3 + x); diamond(x, g - th.y + Math.sin(t * 2 + x) * 3, 4, '#ff2a8d'); ctx.restore(); }
      if (th.type === 'med') { ctx.fillStyle = '#e6ecf0'; ctx.fillRect(x - 6, g - 12, 12, 10); ctx.fillStyle = '#3aa07a'; ctx.fillRect(x - 1, g - 11, 2, 8); ctx.fillRect(x - 4, g - 8, 8, 2); }
      if (th.type === 'puzzle') { ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText(th.icon || '🧩', x, g - 6 + Math.sin(t * 3) * 1.5); sparkle(x + 10, g - 30, 4, `rgba(255,214,107,${.6 + .4 * Math.sin(t * 5)})`); }
      if (th.type === 'clue') { const k = .6 + .4 * Math.sin(t * 5 + x); sparkle(x, g - 28 + Math.sin(t * 3) * 2, 5 + k * 2, `rgba(230,236,240,${.6 + .4 * k})`); }
    }
    // characters (npcs, foes, cops), then the hero
    for (const th of w.things) {
      if (!visible(th)) continue; const x = th.x;
      if (th.type === 'npc') { if (th.spr) drawSpr(th.spr, 'idle', t + x, x, g, p.x < x ? -1 : 1); else { ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillText(th.icon || '❔', x, g - 6); } }
      if (th.type === 'foe') { const f = TM.FOES[th.foe]; drawSpr(f.spr, 'idle', t + x, x, g, p.x < x ? -1 : 1); if (th.foe !== 'grunt' && th.foe !== 'bernard') { ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(t * 6); diamond(x, g - sprTop(f.spr) - 14, 5, '#ff2a8d'); ctx.restore(); } }
      if (th.type === 'cop') { const d = th.cdir; ctx.fillStyle = 'rgba(255,230,140,.16)'; ctx.beginPath(); ctx.moveTo(th.cx, g - 40); ctx.lineTo(th.cx + d * 120, g - 10); ctx.lineTo(th.cx + d * 120, g); ctx.lineTo(th.cx, g); ctx.fill(); drawSpr('cop', th.wait > 0 ? 'idle' : 'walk', t, th.cx, g, d); }
    }
    drawSpr(heroSpr(), p.walking ? 'walk' : 'idle', t, p.x, g, p.dir, { alpha: p.hidden ? .35 : 1 });
    if (run.hero === 'augie' && TM.S.run.ch === 0) drawSpr('golem', 'idle', t, p.x - p.dir * 26, g, p.dir, {});
    // guidance arrow
    for (const tg1 of tg) { const tt = w.things.find((x) => x.key === tg1 || x.id === tg1); if (tt && visible(tt)) { arrowAt(tt.x, g - targetTop(tt) - 18, t); } }
    const door = TM.Game.doorTo(); if (door) arrowAt(door.x, g - 70, t);
    // fx
    for (const f of w.fx) { if (f.kind === 'spark') { ctx.fillStyle = f.col; ctx.fillRect(f.x + f.vx * f.t, f.y + f.vy * f.t + 60 * f.t * f.t, 2, 2); } }
    ctx.restore();
    overlay();
    // off-screen arrow
    const all = tg.map((k) => w.things.find((x) => x.key === k || x.id === k)).filter((x) => x && visible(x)); if (door) all.push(door);
    if (all.length) { const tx = all[0].x - w.cam; if (tx < 0 || tx > W) edgeArrow(tx < 0 ? -1 : 1, t); }
  }
  function targetTop(t) { if (t.type === 'npc' && t.spr) return sprTop(t.spr); if (t.type === 'foe') return sprTop(TM.FOES[t.foe].spr) + 10; if (t.type === 'wall') return 70; if (t.type === 'door') return 60; return 34; }
  function overlay() {
    const tint = TINT[w.sc.tint]; const p = w.p;
    if (tint) {
      lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, W, H); lx.fillStyle = tint; lx.fillRect(0, 0, W, H);
      lx.globalCompositeOperation = 'destination-out';
      const px = p.x - w.cam, py = w.ground - 30; const gr = lx.createRadialGradient(px, py, 10, px, py, 110); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = gr; lx.fillRect(0, 0, W, H);
      ctx.drawImage(lc, 0, 0);
    }
    if (w.sc.tint === 'dawn') { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,170,130,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (w.sc.rain) { ctx.strokeStyle = 'rgba(170,185,210,.35)'; ctx.beginPath(); for (const r of rain) { r.y += r.s / 60; r.x -= r.s * .2 / 60; if (r.y > H) { r.y = -10; r.x = Math.random() * (W + 40); } ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 2, r.y - 7); } ctx.stroke(); }
  }
  function diamond(x, y, r, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.fill(); }
  function sparkle(x, y, r, c) { ctx.fillStyle = c; ctx.fillRect(x - .5, y - r, 1.5, r * 2); ctx.fillRect(x - r, y - .5, r * 2, 1.5); ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
  function arrowAt(x, y, t) { const b = Math.sin(t * 6) * 3; ctx.fillStyle = '#ff2a8d'; ctx.beginPath(); ctx.moveTo(x - 7, y - 10 + b); ctx.lineTo(x + 7, y - 10 + b); ctx.lineTo(x, y + b); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
  function edgeArrow(d, t) { const x = d < 0 ? 10 : W - 10, y = H / 2, b = Math.sin(t * 6) * 3 * d; ctx.fillStyle = '#ff2a8d'; ctx.beginPath(); ctx.moveTo(x + b, y); ctx.lineTo(x - d * 12 + b, y - 9); ctx.lineTo(x - d * 12 + b, y + 9); ctx.fill(); }
  function drawProp(art, x, g, t) {
    if (art === 'corpse') { ctx.fillStyle = '#cfc8c0'; ctx.fillRect(x - 26, g - 7, 46, 7); ctx.fillStyle = '#d8b8a0'; ctx.fillRect(x + 20, g - 8, 8, 8); ctx.fillStyle = '#3a2a22'; ctx.fillRect(x + 26, g - 9, 4, 9); ctx.fillStyle = `rgba(255,42,141,${.5 + .3 * Math.sin(t * 2)})`; for (let i = 0; i < 5; i++) ctx.fillRect(x - 22 + i * 9, g - 6, 6, 1); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, g - 4, 2.5, 0, 7); ctx.fill(); }
    if (art === 'car' || art === 'wagon') { const c = art === 'wagon' ? '#6a4a2a' : '#3a4a5a'; ctx.fillStyle = '#000'; ctx.fillRect(x - 40, g - 4, 80, 4); ctx.fillStyle = c; ctx.fillRect(x - 40, g - 22, 80, 16); ctx.fillRect(x - 26, g - 34, 50, 13); ctx.fillStyle = '#1a2530'; ctx.fillRect(x - 22, g - 31, 20, 9); ctx.fillRect(x + 2, g - 31, 18, 9); if (art === 'wagon') { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 40, g - 16, 80, 4); } ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x - 24, g - 5, 7, 0, 7); ctx.arc(x + 24, g - 5, 7, 0, 7); ctx.fill(); if (art === 'wagon') { ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 31, g - 6, 14, 3); ctx.fillRect(x + 17, g - 6, 14, 3); } }
  }

  function init() {
    cv = document.getElementById('game'); ctx = cv.getContext('2d'); lc = document.createElement('canvas'); lx = lc.getContext('2d');
    preload(); window.addEventListener('resize', sizeCanvas); window.addEventListener('orientationchange', () => setTimeout(sizeCanvas, 200));
    // golem buddy sprite (Augie's box robot) is drawn in code into a tiny sheet
    const g = document.createElement('canvas'); g.width = 128; g.height = 32; const x = g.getContext('2d');
    for (let f = 0; f < 4; f++) { const o = f * 32, b = f % 2; x.fillStyle = '#4a5246'; x.fillRect(o + 8, 12 + b, 16, 14); x.fillStyle = '#5d6858'; x.fillRect(o + 8, 12 + b, 16, 2); x.fillStyle = '#0d1512'; x.fillRect(o + 10, 17 + b, 12, 4); x.fillStyle = '#8fe3d0'; x.fillRect(o + 12, 18 + b, 2, 2); x.fillRect(o + 18, 18 + b, 2, 2); x.fillStyle = '#222'; x.fillRect(o + 9, 26, 4, 3); x.fillRect(o + 19, 26, 4, 3); }
    imgs['assets/sprites/golem.png'] = g; g.complete = true;
    TM.SPR.golem = { fw: 32, fh: 32, anims: { idle: { r: 0, n: 4, b: [8, 12, 16, 17] }, walk: { r: 0, n: 4, b: [8, 12, 16, 17] } }, scale: 1, face: 'right' };
  }
  return { init, enter, update, render, sizeCanvas, drawSpr, burst, shake, visible, get state() { return w; }, get W() { return W; }, get H() { return H; }, chapter, glyphCount };
})();
