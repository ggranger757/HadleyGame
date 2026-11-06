/* =========================================================================
   TECHNOMANCERS — 06-player.js
   Augie / Jester controller: 8-dir movement, sprint, flashlight, interact,
   Hush Crook head swaps (2 s, push · quarter-turn · click), Jester's
   bat/knife/shotgun, counter-kit throws, Reality Anchor, Detective Mode.
   ========================================================================= */
'use strict';

TM.Player = (() => {
  const U = TM.U, In = TM.In, G = TM.G, TS = 16;
  const P = {};
  let anchorCd = 0;

  P.weapon = () => { const run = TM.S.run; const list = TM.CHARS[run.char].weapons; return TM.WEAPONS[list[run.weap % list.length]]; };
  P.weaponId = () => { const run = TM.S.run; const list = TM.CHARS[run.char].weapons; return list[run.weap % list.length]; };
  P.kitList = () => Object.keys(TM.S.run.kit).filter(k => k !== 'shells');
  P.kitSel = () => { const l = P.kitList(); const run = TM.S.run; return l[run.kitSel % l.length]; };

  function nearestTarget(W, range, arc) {
    const p = W.player; let best = null, bd = 1e9;
    const cands = W.enemies.filter(e => !e.dead && !e.def.nocombat);
    if (W.boss && !W.boss.gone) cands.push(W.boss);
    for (const e of cands) {
      const d = U.dist(p.x, p.y, e.x, e.y); if (d > range) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x); if (Math.abs(U.angDiff(p.a, a)) > arc) continue;
      if (!G.los(p.x, p.y - 8, e.x, e.y - 8)) continue;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  P.update = (W, dt) => {
    const p = W.player, run = TM.S.run, C = TM.CHARS[run.char], perks = TM.S.rankPerks();
    p.atkCd -= dt; p.kitCd -= dt; p.inv -= dt; p.hurtFlash = Math.max(0, p.hurtFlash - dt * 3); p.hotwire -= dt; p.aging -= dt; anchorCd -= dt;
    // ---- movement ----
    let { x: ax, y: ay } = In.axis(); if (p.hotwire > 0) { ax = -ax; ay = -ay; }
    p.sprinting = In.held('sprint') && (ax || ay);
    let spd = C.speed * (p.sprinting ? C.sprint : 1) * (p.slowed ? .5 : 1) * (p.aging > 0 ? .65 : 1) * (p.swap > 0 ? .7 : 1) * (p.channel ? 0 : 1);
    p.moving = !!(ax || ay) && !p.channel;
    if (p.moving) {
      const ta = Math.atan2(ay, ax); p.a = ta; p.anim += dt;
      G.move(p, ax * spd * dt, ay * spd * dt, p.r);
      p.dir4 = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 1 : 2) : (ay < 0 ? 3 : 0);
      // footsteps on three surfaces
      p.stepT -= dt * (p.sprinting ? 1.6 : 1); if (p.stepT <= 0) { p.stepT = .32; const ch = G.tile(Math.floor(p.x / TS), Math.floor(p.y / TS)); const surf = '=X'.includes(ch) ? 'metal' : '._PD'.includes(ch) ? 'wood' : ',~g'.includes(ch) ? 'wet' : 'tile'; TM.Audio.play('step', surf); if (p.sprinting) G.noise(p.x, p.y, 4); }
    }
    // ---- hidden in shadow ----
    const tch = G.tile(Math.floor(p.x / TS), Math.floor(p.y / TS));
    p.hidden = tch === 'H' && !p.sprinting;
    // ---- toggles ----
    if (In.hit('light')) { p.flashlight = !p.flashlight; TM.Audio.play('ui'); TM.UI.toast(p.flashlight ? 'FLASHLIGHT ON' : 'FLASHLIGHT OFF — harder to spot, harder to see', 'sys'); }
    if (In.hit('detective')) { p.detective = !p.detective; TM.Audio.play('ui'); TM.UI.toast(p.detective ? (run.char === 'augie' ? 'DETECTIVE MODE · Golem drone overhead' : 'DETECTIVE MODE · eyeballing it') : 'DETECTIVE MODE OFF', 'sys'); }
    if (p.detective) W.detR = (run.char === 'augie' ? 90 : 55) * (perks.scan ? 1.5 : 1);
    // ---- anchor ping ----
    if (In.hit('anchor')) anchor(W);
    // ---- swap ----
    if (p.swap > 0) { p.swap -= dt; if (p.swap <= 0) { run.weap = (run.weap + 1) % C.weapons.length; TM.UI.toast('◆ ' + P.weapon().name, 'sys'); } }
    else if (In.hit('swap')) {
      p.swapMax = C.swap * (perks.swap ? .7 : 1); p.swap = p.swapMax; if (run.char === 'augie') { TM.Audio.play('swap'); const n = TM.S.count('swaps'); if (n >= 25) TM.S.unlock('swapper'); } else TM.Audio.play('ui');
    }
    // ---- cycle kit ----
    if (In.hit('cycle')) { run.kitSel = (run.kitSel + 1) % P.kitList().length; TM.Audio.play('ui'); }
    // ---- attack ----
    if (In.hit('attack') && p.swap <= 0 && p.atkCd <= 0) attack(W);
    // ---- kit ----
    if (In.hit('kit') && p.kitCd <= 0 && p.swap <= 0) useKit(W);
    // ---- interact (tap) & channel (hold) ----
    interactScan(W, dt);
  };

  function attack(W) {
    const p = W.player, run = TM.S.run, wid = P.weaponId(), w = TM.WEAPONS[wid];
    // soft aim: snap facing toward a target in front of you
    const tgt = nearestTarget(W, (w.range || 120) + 40, 1.0); if (tgt) p.a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
    p.atkCd = w.cd;
    if (w.ammo) { if ((run.ammo[w.ammo] || 0) <= 0) { G.text(p.x, p.y, 'EMPTY — craft ' + (w.ammo === 'shells' ? 'shells' : 'taser rounds'), '#ff6b6b'); TM.Audio.play('wrong'); return; } run.ammo[w.ammo]--; }
    TM.Audio.play(w.sfx); G.noise(p.x, p.y, w.noise);
    if (w.kind === 'melee') {
      G.fx({ kind: 'swing', x: p.x, y: p.y - 10, r: w.range, a: p.a, arc: w.arc * .6, col: '#e6ecf0', life: .18 });
      TM.Audio.play('swing');
      const targets = W.enemies.filter(e => !e.dead); if (W.boss && !W.boss.gone) targets.push(W.boss);
      for (const e of targets) {
        const d = U.dist(p.x, p.y, e.x, e.y); if (d > w.range + 10) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x); if (Math.abs(U.angDiff(p.a, a)) > w.arc) continue;
        if (e.isBoss) { TM.AI.bossHit(e, w.dmg, { melee: true, stun: w.stun }); continue; }
        G.hitEnemy(e, w.dmg, { knock: w.knock, stun: w.stun, interrupt: w.interrupt || w.stun, melee: true, backstab: w.backstab });
        if (w.stun && e.state === 'windup' && !e.def.conventional) G.abortCast(e, 'CROWNED', true);
      }
      if (w.deflect) for (const pr of W.proj) if (pr.hostile && U.dist(p.x, p.y, pr.x, pr.y) < w.range + 12) { pr.dead = true; G.text(pr.x, pr.y, 'DEFLECT', '#e6ecf0'); }
      if (W.tears.length && TM.AI.tearHit) TM.AI.tearHit(W, p.x + Math.cos(p.a) * 14, p.y + Math.sin(p.a) * 14, 22);
    } else if (w.kind === 'cone') {
      G.fx({ kind: 'cone', x: p.x, y: p.y - 10, r: w.range, a: p.a, arc: w.arc, col: '#dfe6ea', life: .45 });
      for (const e of W.enemies) {
        if (e.dead) continue; const d = U.dist(p.x, p.y, e.x, e.y); if (d > w.range) continue;
        const a = Math.atan2(e.y - p.y, e.x - p.x); if (Math.abs(U.angDiff(p.a, a)) > w.arc) continue;
        if (e.state === 'windup' && w.counters.includes(e.def.lang)) G.abortCast(e, 'WHISPER CODE BROKEN', true);
        else { G.hitEnemy(e, w.dmg, {}); if (e.def.lang === 'whisper') e.stun = Math.max(e.stun, .8); }
        for (const f of W.enemies) if (f.fake && f.owner === e && U.dist(p.x, p.y, f.x, f.y) < w.range) { f.dead = true; G.sparks(f.x, f.y, '#9aa4b2'); }
      }
      if (W.dolores && W.dolores.casting > 0 && U.dist(p.x, p.y, W.dolores.x, W.dolores.y) < w.range) TM.AI.counterDolores(W, 'HUSH HORN');
    } else if (w.kind === 'shot') {
      W.proj.push({ kind: 'taser', x: p.x, y: p.y - 10, vx: Math.cos(p.a) * w.speed, vy: Math.sin(p.a) * w.speed, life: .6, dmg: w.dmg, stun: w.stun });
    } else if (w.kind === 'spread') {
      for (let i = 0; i < w.pellets; i++) { const a = p.a + (i - (w.pellets - 1) / 2) * (w.arc / w.pellets); W.proj.push({ kind: 'pellet', x: p.x, y: p.y - 10, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, life: w.range / w.speed, dmg: w.dmg, knock: w.knock, interrupt: true, shotgun: true }); }
      G.shake(.5); W.flash = .15;
    }
  }

  function useKit(W) {
    const p = W.player, run = TM.S.run, id = P.kitSel(); const K = TM.KIT[id];
    if (!id || (run.kit[id] || 0) <= 0) { G.text(p.x, p.y, (K ? K.name : 'KIT') + ' — EMPTY', '#ff6b6b'); TM.Audio.play('wrong'); return; }
    p.kitCd = .6;
    if (K.ash) { // ASH: chamber six — only an exposed core is worth it
      run.kit.ash--; TM.Audio.play('shotgun'); G.shake(.4);
      const tgt = W.boss && !W.boss.gone ? W.boss : nearestTarget(W, 200, 1.2);
      const a = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : p.a;
      W.proj.push({ kind: 'taser', ash: true, x: p.x, y: p.y - 10, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: .9, dmg: 0 });
      return;
    }
    run.kit[id]--;
    const tgt = nearestTarget(W, 150, 1.3);
    let tx, ty; if (tgt) { tx = tgt.x; ty = tgt.y; } else { tx = p.x + Math.cos(p.a) * 70; ty = p.y + Math.sin(p.a) * 70; }
    // don't throw through walls: stop at first wall
    const d = U.dist(p.x, p.y, tx, ty), n = Math.ceil(d / 6); for (let i = 1; i <= n; i++) { const k = i / n; const qx = p.x + (tx - p.x) * k, qy = p.y + (ty - p.y) * k; if (G.solidAt(qx, qy)) { tx = p.x + (tx - p.x) * (i - 1) / n; ty = p.y + (ty - p.y) * (i - 1) / n; break; } }
    const col = { tattle: '#6f7887', salt: '#9a4a3a', jar: '#7a9aa0', ticks: '#c8e05a', flare: '#ffd080', frag: '#4a5a3a', emp: '#8fe3d0' }[id];
    W.proj.push({ kind: 'throw', id, x: p.x, y: p.y, sx: p.x, sy: p.y, tx, ty, t: 0, dur: .4, h: 0, col });
    TM.Audio.play('swing');
  }

  P.stepProj = (W, pr, dt) => {
    if (pr.kind === 'throw') {
      pr.t += dt; const k = Math.min(1, pr.t / pr.dur); pr.x = U.lerp(pr.sx, pr.tx, k); pr.y = U.lerp(pr.sy, pr.ty, k); pr.h = Math.sin(k * Math.PI) * 18;
      if (k >= 1) { pr.dead = true; G.applyKit(pr.id, pr.x, pr.y); }
      return;
    }
    pr.life -= dt; if (pr.life <= 0) { pr.dead = true; return; }
    if (pr.kind === 'swarm') { // homing nanobot cloud
      const p = W.player; const a = Math.atan2(p.y - 10 - pr.y, p.x - pr.x); pr.vx = U.lerp(pr.vx, Math.cos(a) * 55, dt * 2); pr.vy = U.lerp(pr.vy, Math.sin(a) * 55, dt * 2);
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; if (U.dist(pr.x, pr.y, p.x, p.y - 10) < 12) { G.hurtPlayer(9 * dt * 8, 'nano swarm'); }
      return;
    }
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (G.solidAt(pr.x, pr.y + 8) && !'FKTSBb'.includes(G.tile(Math.floor(pr.x / TS), Math.floor((pr.y + 8) / TS)))) { pr.dead = true; G.sparks(pr.x, pr.y, '#9aa4b2', 3); return; }
    if (pr.hostile) {
      const p = W.player; if (U.dist(pr.x, pr.y, p.x, p.y - 10) < 9) { pr.dead = true; G.hurtPlayer(pr.dmg, pr.src); if (pr.age) { p.aging = 4; G.text(p.x, p.y, 'AGING', TM.PAL.glow); } if (pr.gate) gateHit(W); }
      return;
    }
    // player projectile
    const tg = W.enemies.filter(e => !e.dead); if (W.boss && !W.boss.gone) tg.push(W.boss);
    for (const e of tg) {
      if (U.dist(pr.x, pr.y, e.x, e.y - 10) < (e.isBoss ? 14 : 9)) {
        pr.dead = true;
        if (e.isBoss) { TM.AI.bossHit(e, pr.dmg, { ash: pr.ash, stun: pr.stun, shot: true }); }
        else { if (pr.ash) { G.text(e.x, e.y, 'ASH WASTED', '#ff6b6b'); } G.hitEnemy(e, pr.dmg, { stun: pr.stun, knock: pr.knock, interrupt: pr.interrupt }); }
        return;
      }
    }
  };
  function gateHit(W) { // Voidwalker gate shell: you land somewhere else (last anchor point = start of room)
    const p = W.player; const s = W.L.spawn[TM.S.run.char]; G.text(p.x, p.y, 'GATED', TM.PAL.glow, 1.4);
    let tries = 0; while (tries++ < 30) { const nx = p.x + (Math.random() - .5) * 160, ny = p.y + (Math.random() - .5) * 120; if (!G.solidAt(nx, ny) && !G.solidAt(nx, ny - 6)) { p.x = nx; p.y = ny; break; } }
    W.flash = .4; TM.Audio.play('tear');
  }

  function anchor(W) {
    const p = W.player, run = TM.S.run; if (anchorCd > 0) { G.text(p.x, p.y, 'ANCHOR RECHARGING', '#6f7887'); return; }
    anchorCd = 3; W.anchorPing = 1; TM.Audio.play('taser');
    G.fx({ kind: 'ring', x: p.x, y: p.y - 8, r: 100, col: '#8fe3d0', life: .7 });
    let found = 0;
    for (const v of W.veils) if (U.dist(p.x, p.y, v.px, v.py) < 80) {
      for (let yy = 0; yy < v.h; yy++) for (let xx = 0; xx < v.w; xx++) W.veil.delete((v.x + xx) + ',' + (v.y + yy));
      run.flags.veil_open = true; found++; G.text(v.px, v.py, 'REALITY VEIL — FALSE WALL', TM.PAL.tear, 1.8); TM.Audio.play('counter'); G.xp(30, 'veil pierced');
    }
    W.veils = W.veils.filter(v => !run.flags.veil_open);
    for (const e of W.enemies) if (e.fake && !e.dead && U.dist(p.x, p.y, e.x, e.y) < 110) {
      found++; if (run.char === 'augie') { e.dead = true; G.sparks(e.x, e.y, '#9aa4b2', 10); G.text(e.x, e.y, 'NO HEAT · ECHO', '#9aa4b2'); } else { e.revealed = 3; G.text(e.x, e.y, 'LED: RED', TM.PAL.tear); }
    }
    for (const e of W.enemies) if (!e.dead && e.def.lang === 'whisper' && e.state === 'windup' && U.dist(p.x, p.y, e.x, e.y) < 90 && run.char === 'augie') { G.abortCast(e, 'VEIL SEEN THROUGH', true); found++; }
    TM.UI.anchorLED(found ? 'red' : 'green');
    if (!found) G.text(p.x, p.y, 'LED GREEN · REAL', '#8fe3d0');
  }

  // what's near enough to use?
  function interactables(W) {
    const p = W.player, out = [];
    for (const n of W.npcs) if (!n.gone && (n.dlg || n.dlgFn)) out.push({ kind: 'npc', o: n, x: n.x, y: n.y, label: (TM.CAST[n.id] && TM.CAST[n.id].name) || 'TALK' });
    for (const c of W.clues) if (!c.got) out.push({ kind: 'clue', o: c, x: c.x, y: c.y + 4, label: 'INSPECT' });
    for (const pr of W.props) if (pr.t === 'bench') out.push({ kind: 'bench', o: pr, x: pr.x, y: pr.y, label: TM.S.run.char === 'augie' ? 'WORKBENCH' : 'CALL A CONTACT' });
    for (const pr of W.props) if (pr.t === 'safe' && !pr.open) out.push({ kind: 'safe', o: pr, x: pr.sx, y: pr.sy + 10, label: 'HOLD · CRACK SAFE' });
    for (const l of W.locks) if (!l.open) out.push({ kind: 'lock', o: l, x: l.px, y: l.py + 4, label: TM.S.run.char === 'augie' ? 'HOLD · LEECH THE LOCK' : 'HOLD · PRY IT' });
    for (const v of W.veils) out.push({ kind: 'veil', o: v, x: v.px, y: v.py, label: '?? WALL' });
    if (W.dolores && W.dolores.npc && !W.boss) { }
    let best = null, bd = 26;
    for (const it of out) { const d = U.dist(p.x, p.y, it.x, it.y); if (d < bd) { bd = d; best = it; } }
    return best;
  }
  function interactScan(W, dt) {
    const p = W.player, run = TM.S.run;
    // pickups (walk over)
    for (const it of W.items) {
      if (it.taken || U.dist(p.x, p.y, it.x, it.y + 4) > 12) continue; it.taken = true;
      if (it.t === 'scrap') { run.scrap++; run.flags[it.id] = true; TM.Audio.play('pickup'); G.text(p.x, p.y, run.char === 'augie' ? '+1 SCRAP' : '+1 CASH', '#d8c070'); G.xp(5, 'scrap'); }
      if (it.t === 'frag') {
        (run.frags[W.L.n] = run.frags[W.L.n] || []).push(it.id); TM.Audio.play('clue'); G.xp(30, 'glyph fragment');
        const total = Object.values(run.frags).reduce((a, b) => a + b.length, 0); const prof = TM.S.profile;
        prof.counters.fragsMax = Math.max(prof.counters.fragsMax || 0, total);
        const next = TM.FRAG_CODEX.find(k => !prof.codex[k]); if (next) TM.S.codex(next);
        TM.UI.toast('GLYPH FRAGMENT ' + (run.frags[W.L.n].length) + '/3', 'frag', TM.R.icon('frag'));
        const all = TM.LEVELS.reduce((a, L) => a + L.ents.filter(e => e.t === 'frag').length, 0); if (total >= all) TM.S.unlock('frags_all');
      }
    }
    const it = interactables(W);
    W.hint = it ? { x: it.x, y: it.y, text: (TM.In.touch ? '◉ ' : '[E] ') + it.label } : null;
    if (p.channel) {
      if (!it || it.o !== p.channel.o || !TM.In.held('interact')) { p.channel = null; return; }
      p.channel.t += dt; p.channel.k = p.channel.t / p.channel.max;
      if (run.char === 'jester' && Math.random() < dt * 3) G.noise(p.x, p.y, 2);
      if (p.channel.t >= p.channel.max) finishChannel(W, p.channel); return;
    }
    if (!it) { TM.In.hit('interact'); return; }
    if (it.kind === 'lock' || it.kind === 'safe') {
      if (TM.In.held('interact')) { const o = it.o; const base = o.hold || 2; p.channel = { o, kind: it.kind, t: 0, max: run.char === 'augie' ? base : base * .6, k: 0 }; if (TM.In.hit('interact') && it.kind === 'safe' && !run.flags.safehint) { run.flags.safehint = true; } }
      return;
    }
    if (!TM.In.hit('interact')) return;
    TM.Audio.play('ui');
    if (it.kind === 'npc') { const n = it.o; let d = n.dlg; if (n.need && !TM.S.check(n.need)) d = n.early; if (n.id === 'dolores' && TM.S.check(n.need)) { TM.AI.prepBoss(W, n); } TM.UI.dialog(d, n); }
    else if (it.kind === 'clue') TM.Forensics.inspect(it.o.id);
    else if (it.kind === 'bench') TM.UI.craft();
    else if (it.kind === 'veil') TM.UI.dialog(it.o.dlg || 'veil_hint');
  }
  function finishChannel(W, ch) {
    const p = W.player, run = TM.S.run; p.channel = null;
    if (run.char === 'jester') G.noise(p.x, p.y, ch.o.noiseJ || 25);
    TM.Audio.play('door');
    if (ch.kind === 'lock') { ch.o.open = true; run.flags['lock_' + ch.o.id] = true; W.locked.delete(ch.o.x + ',' + ch.o.y); G.text(p.x, p.y, 'OPEN', '#8fe3d0'); G.xp(15, 'lock'); }
    if (ch.kind === 'safe') { ch.o.open = true; G.clue(ch.o.clue); TM.Forensics.inspect(ch.o.clue); }
  }

  return P;
})();
