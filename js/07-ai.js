/* =========================================================================
   TECHNOMANCERS — 07-ai.js
   Enemy perception + casting state machine per class (telegraph → cast),
   night-shift cops (stealth only), ambient NPCs, and BERNARD (3 phases):
     1 · The Wrong Body   — erratic lunges; exploit its confusion
     2 · The Entity Tear  — red tears + Gabriel slices; seal them
     3 · The Sacrifice    — Dolores shields it; break her cast, hit the core
   ========================================================================= */
'use strict';

TM.AI = (() => {
  const U = TM.U, G = TM.G, P = TM.PAL;
  const A = {};
  const hist = []; let histT = 0; // player position history (Stutter Field rewinds you)

  function sees(W, e) {
    const p = W.player; if (TM.UI.blocking()) return 0;
    const d = U.dist(e.x, e.y, p.x, p.y); if (d < 18) return 1;
    let range = e.def.sight * (p.flashlight ? 1 : .6) * (p.hidden ? .25 : 1) * (G.inLight(p.x, p.y) ? 1.25 : 1) * (p.sprinting ? 1.15 : 1);
    if (d > range) return 0;
    const a = Math.atan2(p.y - e.y, p.x - e.x); if (Math.abs(U.angDiff(e.a || 0, a)) > 1.05 && e.state === 'patrol') return 0;
    if (!G.los(e.x, e.y - 10, p.x, p.y - 10)) return 0;
    return 1 - d / range * .6;
  }
  function stepToward(W, e, tx, ty, spd, dt) {
    const a = Math.atan2(ty - e.y, tx - e.x); e.a = a;
    if (e.detour > 0) { e.detour -= dt; const da = e.detourA; if (!G.move(e, Math.cos(da) * spd * dt, Math.sin(da) * spd * dt, 5)) e.detourA += 1.6; }
    else if (!G.move(e, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, 5)) { e.detour = .5 + Math.random() * .5; e.detourA = a + (Math.random() < .5 ? 1.57 : -1.57); }
    e.moving = true; e.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 1 : 2) : (Math.sin(a) < 0 ? 3 : 0);
  }

  A.update = (W, dt) => {
    const p = W.player;
    histT += dt; if (histT > .1) { histT = 0; hist.push({ x: p.x, y: p.y }); if (hist.length > 14) hist.shift(); }
    for (const n of W.npcs) {
      n.moving = false;
      if (n.wander) { n.wander.t -= dt; if (n.wander.t <= 0) { n.wander.t = 2 + Math.random() * 3; n.wander.tx = n.wander.ox + (Math.random() - .5) * 30; n.wander.ty = n.wander.oy + (Math.random() - .5) * 20; } if (n.wander.tx != null && U.dist(n.x, n.y, n.wander.tx, n.wander.ty) > 3) { const a = Math.atan2(n.wander.ty - n.y, n.wander.tx - n.x); G.move(n, Math.cos(a) * 14 * dt, Math.sin(a) * 14 * dt, 4); n.moving = true; n.dir = Math.cos(a) < 0 ? 1 : 2; } }
      else { const d = U.dist(n.x, n.y, p.x, p.y); if (d < 60) { const a = Math.atan2(p.y - n.y, p.x - n.x); n.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 1 : 2) : (Math.sin(a) < 0 ? 3 : 0); } }
    }
    for (const z of W.zones) if (z.ttl != null) { z.ttl -= dt; if (z.ttl <= 0) z.dead = true; }
    W.zones = W.zones.filter(z => z.ttl == null || z.ttl > 0);
    let seenAny = false;
    for (const e of W.enemies) {
      if (e.dead) continue; e.moving = false; e.flashHit = Math.max(0, (e.flashHit || 0) - dt); e.cd -= dt; e.jam = Math.max(0, e.jam - dt); e.meleeCd = (e.meleeCd || 0) - dt;
      if (e.fake) { fakeStep(W, e, dt); continue; }
      if (e.phased) { e.phaseT -= dt; if (e.phaseT <= 0) e.phased = false; }
      if (e.stun > 0) { e.stun -= dt; if (e.state === 'windup') e.state = 'chase'; continue; }
      const s = sees(W, e);
      if (s > 0) { e.alert = Math.min(1, e.alert + dt * (e.def.nocombat ? 1.1 : 1.6) * s); seenAny = true; G.addSusp(dt * (e.def.nocombat ? 18 : 9) * s); e.lastSeen = { x: p.x, y: p.y }; }
      else e.alert = Math.max(0, e.alert - dt * .15);
      if (e.alert >= 1 && (e.state === 'patrol' || e.state === 'investigate')) { e.state = 'chase'; G.text(e.x, e.y - 14, e.def.nocombat ? 'HEY!' : '!', e.def.nocombat ? '#ffd070' : P.warn); if (!e.def.nocombat) TM.Audio.play('sting'); }
      if (e.def.nocombat) { copStep(W, e, dt, s); continue; }
      switch (e.state) {
        case 'patrol': {
          const q = e.patrol[e.pi % e.patrol.length]; if (U.dist(e.x, e.y, q.x, q.y) < 4) { e.pi++; e.wait = 1 + Math.random(); }
          if (e.wait > 0) { e.wait -= dt; e.a += Math.sin(W.t + e.x) * dt; } else stepToward(W, e, q.x, q.y, e.def.speed * .6, dt);
          break;
        }
        case 'investigate': { const h = e.heard || e.home; stepToward(W, e, h.x, h.y, e.def.speed * .8, dt); if (U.dist(e.x, e.y, h.x, h.y) < 8) { e.state = 'patrol'; e.heard = null; } break; }
        case 'stunned': e.state = 'chase'; break;
        case 'chase': {
          const tgt = s > 0 ? p : (e.lastSeen || p); const d = U.dist(e.x, e.y, p.x, p.y);
          if (s <= 0 && e.lastSeen && U.dist(e.x, e.y, e.lastSeen.x, e.lastSeen.y) < 8 && W.lockdown <= 0) { e.alert = .6; e.state = 'investigate'; e.heard = e.home; break; }
          const canCast = e.cd <= 0 && s > 0 && d < e.def.castRange && !(e.def.lang === 'foldspeak' && e.jam > 0);
          if (canCast) { beginCast(W, e); break; }
          if (d > 22 || e.phased) stepToward(W, e, tgt.x, tgt.y, e.def.speed * (e.phased ? 1.8 : 1) * (e.jam > 0 && e.def.lang === 'foldspeak' ? .7 : 1), dt);
          if (d < 18 && e.meleeCd <= 0) { e.meleeCd = 1; G.hurtPlayer(e.phased ? 12 : 8, e.def.name); }
          break;
        }
        case 'windup': {
          e.timer -= dt; const a = Math.atan2(p.y - e.y, p.x - e.x); e.a = a; e.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 1 : 2) : (Math.sin(a) < 0 ? 3 : 0);
          if (e.def.lang === 'temporaltext' && e.jam > 0) { G.abortCast(e, 'BOSON SCAN FLOODED', true); break; }
          if (e.timer <= 0) execCast(W, e);
          break;
        }
      }
    }
    W.player.seen = seenAny;
    if (W.boss && !W.boss.gone) bossStep(W, W.boss, dt);
  };

  function copStep(W, e, dt, s) {
    if (e.alert >= 1) { G.addSusp(100); e.alert = 0; return; }
    if (e.alert > .3 && s > 0) { e.a = Math.atan2(W.player.y - e.y, W.player.x - e.x); return; } // stops and stares
    const q = e.patrol[e.pi % e.patrol.length]; if (U.dist(e.x, e.y, q.x, q.y) < 4) { e.pi++; e.wait = 1.5; }
    if (e.wait > 0) e.wait -= dt; else stepToward(W, e, q.x, q.y, e.def.speed, dt);
  }

  function beginCast(W, e) {
    const c = U.pick(Math.random, e.def.casts); e.cast = c; e.state = 'windup'; e.timer = e.def.windup;
    TM.Audio.play('cast', e.def.lang);
    if (c === 'tumble') { // pick re-emergence point behind the player — Seam Goggles show it early
      const p = W.player; for (let i = 0; i < 12; i++) { const a = p.a + Math.PI + (Math.random() - .5) * 1.4; const tx = p.x + Math.cos(a) * 34, ty = p.y + Math.sin(a) * 34; if (!G.solidAt(tx, ty) && !G.solidAt(tx, ty - 6)) { e.tumbleTo = { x: tx, y: ty }; break; } }
      if (!e.tumbleTo) e.cast = 'gateshell';
    }
    if (e.tut && !TM.S.run.flags.tutCast) { TM.S.run.flags.tutCast = true; if (e.dlg) TM.UI.dialog(e.dlg); }
  }
  function execCast(W, e) {
    const p = W.player; e.state = 'chase'; e.cd = 2.5 + Math.random() * 2;
    const a = Math.atan2(p.y - e.y, p.x - e.x);
    switch (e.cast) {
      case 'echostep': {
        G.text(e.x, e.y - 14, 'ECHOSTEP', P.glow);
        for (let i = 0; i < 2; i++) { const f = { ...e, fake: true, owner: e, hp: 1, maxHp: 1, ttl: 14, state: 'chase', x: e.x + (i ? 16 : -16), y: e.y + 4, uid: e.uid + 'f' + i, drop: null, flag: null, isEnemy: true }; if (!G.solidAt(f.x, f.y)) W.enemies.push(f); }
        // the real one slips sideways
        G.move(e, Math.cos(a + 1.57) * 20, Math.sin(a + 1.57) * 20, 5);
        break;
      }
      case 'hotwire': if (G.los(e.x, e.y - 10, p.x, p.y - 10)) { p.hotwire = 3.5; TM.S.run.nerve = Math.max(0, TM.S.run.nerve - 10); G.text(p.x, p.y, 'NEURAL HOTWIRE · CONTROLS INVERTED', P.glow, 1.6); TM.Audio.play('tear'); } break;
      case 'swarm': W.proj.push({ kind: 'swarm', x: e.x, y: e.y - 12, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: 5, hostile: true, dmg: 0 }); G.text(e.x, e.y - 14, 'NANO SWARM', P.glow); break;
      case 'phase': e.phased = true; e.phaseT = 3.5; G.text(e.x, e.y - 14, 'PHASE', P.glow); break;
      case 'lag': W.zones.push({ kind: 'slow', px: p.x - 40, py: p.y - 40, pw: 80, ph: 80, ttl: 5, key: 'lagtmp' }); G.text(p.x, p.y, 'TEMPORAL LAG', P.glow, 1.4); G.hurtPlayer(4, 'temporal lag'); break;
      case 'stutter': { const back = hist[0]; if (back && !G.solidAt(back.x, back.y)) { p.x = back.x; p.y = back.y; } G.text(p.x, p.y, 'STUTTER FIELD · REWOUND', P.glow, 1.4); G.hurtPlayer(6, 'stutter field'); W.flash = .25; break; }
      case 'tumble': if (e.tumbleTo) { G.sparks(e.x, e.y, P.tear, 10); e.x = e.tumbleTo.x; e.y = e.tumbleTo.y; G.sparks(e.x, e.y, P.tear, 10); TM.Audio.play('tear'); e.tumbleTo = null; e.cd = .6; e.cast = 'gateshell'; e.state = 'windup'; e.timer = .5; } break;
      case 'gateshell': TM.Audio.play('shotgun'); W.proj.push({ kind: 'gate', x: e.x, y: e.y - 10, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, life: 1, hostile: true, dmg: 12, gate: true, src: 'gate shell' }); break;
      case 'beam': { TM.Audio.play('cast', 'beam'); W.proj.push({ kind: 'pellet', x: e.x, y: e.y - 10, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, life: .6, hostile: true, dmg: 10, age: true, src: 'aging beam' }); G.fx({ kind: 'beam', x: e.x, y: e.y - 10, x2: e.x + Math.cos(a) * 120, y2: e.y - 10 + Math.sin(a) * 120, life: .25 }); break; }
    }
  }
  function fakeStep(W, e, dt) {
    e.ttl -= dt; if (e.ttl <= 0 || (e.owner && e.owner.dead)) { e.dead = true; return; }
    if (e.revealed > 0) e.revealed -= dt;
    const p = W.player; stepToward(W, e, p.x + Math.sin(W.t + e.x) * 20, p.y, e.def.speed, dt);
    if (Math.random() < dt * .3) { e.state = 'windup'; e.timer = e.def.windup; e.cast = 'none'; }
    if (e.state === 'windup') { e.timer -= dt; if (e.timer <= 0) e.state = 'chase'; }
  }

  /* ============================== BERNARD ============================== */
  A.prepBoss = (W, npc) => { W.dolores = npc; };
  A.startBoss = () => {
    const W = G.W, c = W.circle || { x: W.player.x, y: W.player.y - 40 };
    TM.S.run.flags.boss_started = true;
    W.boss = { isBoss: true, x: c.x, y: c.y + 6, dir: 0, phase: 1, hp: 150, maxHp: 150, lunge: null, confused: 0, cd: 2, stillT: 0, shield: 0, core: 0, coreHp: 110, tearWave: 0, gone: false };
    W.tears = []; TM.Audio.setMood('boss'); TM.Audio.play('bernard'); G.shake(1); W.flash = .6;
    TM.UI.banner('BERNARD', 'red'); TM.UI.bossBar(true);
    if (W.dolores) { W.dolores.x = (W.L.arena.x + W.L.arena.w - 2) * 16 + 8; W.dolores.y = (W.L.arena.y + 1) * 16 + 12; W.dolores.casting = 0; W.dolores.cd = 6; }
  };
  function bossStep(W, b, dt) {
    const p = W.player; b.moving = false; b.flashHit = Math.max(0, (b.flashHit || 0) - dt); b.cd -= dt; b.shield = Math.max(0, b.shield - dt); b.core = Math.max(0, b.core - dt); b.confused = Math.max(0, b.confused - dt);
    const d = U.dist(b.x, b.y, p.x, p.y);
    // exploit confusion: stand still in the dark and it loses you
    if (!p.moving && !p.flashlight) { b.stillT += dt; if (b.stillT > 1.4 && b.confused <= 0) { b.confused = 2.5; G.text(b.x, b.y - 46, '?', '#e6ecf0', 1.2); } } else b.stillT = 0;
    if (b.lunge) {
      if (b.lunge.wind > 0) { b.lunge.wind -= dt; if (b.lunge.wind <= 0) TM.Audio.play('bernard'); }
      else { const a = Math.atan2(b.lunge.ty - b.y, b.lunge.tx - b.x); const moved = G.move(b, Math.cos(a) * 230 * dt, Math.sin(a) * 230 * dt, 7); b.moving = true; b.lunge.t -= dt;
        if (d < 18) { G.hurtPlayer(b.phase === 3 ? 22 : 18, 'Bernard'); b.lunge = null; b.cd = 1.4; }
        else if (!moved || b.lunge.t <= 0 || U.dist(b.x, b.y, b.lunge.tx, b.lunge.ty) < 6) { b.lunge = null; b.confused = 2.2; b.cd = 2.2; G.text(b.x, b.y - 46, '?', '#e6ecf0', 1.2); } }
    } else if (b.confused > 0) {
      // wanders, searching — head turning
      if (Math.random() < dt) b.dir = (Math.random() * 4) | 0;
    } else if (b.phase !== 2 || Math.random() < .5) {
      const spd = b.phase === 1 ? 46 : b.phase === 2 ? 26 : 40;
      if (d > 30) { const a = Math.atan2(p.y - b.y, p.x - b.x) + (b.phase === 1 ? Math.sin(W.t * 7) * .8 : 0); G.move(b, Math.cos(a) * spd * dt, Math.sin(a) * spd * dt, 7); b.moving = true; b.dir = Math.abs(Math.cos(a)) > Math.abs(Math.sin(a)) ? (Math.cos(a) < 0 ? 1 : 2) : (Math.sin(a) < 0 ? 3 : 0); }
      if (b.cd <= 0 && d < 140 && G.los(b.x, b.y - 10, p.x, p.y - 10)) { b.lunge = { tx: p.x, ty: p.y, wind: b.phase === 3 ? .6 : .8, t: .9 }; b.cd = 3; }
      if (d < 16 && Math.random() < dt * 2) G.hurtPlayer(10, 'Bernard');
    }
    // phase 2: tears
    if (b.phase === 2) {
      for (const tr of W.tears) { tr.open = Math.min(1, tr.open + dt); tr.rot += dt * .3; tr.pulse -= dt; if (U.dist(p.x, p.y, tr.x, tr.y) < tr.r + 4) { G.hurtPlayer(6, 'reality tear'); } if (tr.pulse <= 0) { tr.pulse = 3 + Math.random() * 2; G.fx({ kind: 'slice', x: tr.x, y: tr.y + 20, life: 1.6 }); TM.S.run.nerve = Math.max(0, TM.S.run.nerve - 4); if (U.dist(p.x, p.y, tr.x, tr.y) < 50) G.hurtPlayer(5, 'Gabriel'); } }
      if (W.tears.length === 0) { b.phase = 3; b.hp = 1; TM.UI.banner('III · THE SACRIFICE', 'mag'); TM.UI.dialogLine('dolores', 'No — NO. You don\'t get to *finish* her. *I* finish her.'); if (W.dolores) W.dolores.cd = 1.5; }
    }
    // phase 3: Dolores shields Bernard; break her cast to expose the core
    if (b.phase === 3 && W.dolores) {
      const dl = W.dolores; dl.cd -= dt;
      if (dl.casting > 0) { dl.casting -= dt; if (dl.casting <= 0) { b.shield = 6; b.core = 0; G.text(b.x, b.y - 50, 'SHIELDED', P.glow, 1.4); TM.Audio.play('cast', 'whisper'); dl.cd = 4; } }
      else if (dl.cd <= 0 && b.shield <= 0 && b.core <= 0) { dl.casting = dl.castMax = 2.6; TM.Audio.play('cast', 'whisper'); G.text(dl.x, dl.y - 44, 'WHISPER · WARD', P.glow, 1.2); }
    }
    TM.UI.bossBar(true, b);
  }
  function enterPhase2(W, b) {
    b.phase = 2; b.lunge = null; b.confused = 0; TM.UI.banner('II · THE ENTITY TEAR', 'red'); TM.Audio.play('tear'); G.shake(1); W.flash = .5;
    const a = W.L.arena, TS = 16; const spots = [[a.x + 2, a.y + 2], [a.x + a.w - 3, a.y + 2], [a.x + 2, a.y + a.h - 2], [a.x + a.w - 3, a.y + a.h - 2]];
    W.tears = spots.slice(0, 3).map(([x, y], i) => ({ x: x * TS + 8, y: y * TS + 8, r: 10, open: 0, rot: i, hp: 4, pulse: 2 + i }));
    TM.UI.dialogLine('narr', 'The air *splits*. Red seams open in the basement. Something pastel and enormous looks through them in slices. Seal the tears — Static Salt, EMP, or brute force.');
  }
  A.tearHit = (W, x, y, r) => { for (const tr of W.tears) if (U.dist(x, y, tr.x, tr.y) < r + tr.r) { tr.hp--; G.sparks(tr.x, tr.y, P.tear, 6); G.text(tr.x, tr.y, tr.hp > 0 ? 'TEAR ' + tr.hp : 'SEALED', tr.hp > 0 ? P.tear : '#e6ecf0'); if (tr.hp <= 0) closeTear(W, tr); } };
  function closeTear(W, tr) { W.tears = W.tears.filter(t => t !== tr); TM.Audio.play('counter'); G.xp(30, 'tear sealed'); }
  A.bossKit = (b, id, x, y, R) => {
    const W = G.W; let any = false;
    if (['salt', 'emp', 'tattle'].includes(id)) for (const tr of [...W.tears]) if (U.dist(x, y, tr.x, tr.y) < R + 10) { closeTear(W, tr); G.text(tr.x, tr.y, 'TEAR SEALED', '#e6ecf0', 1.4); any = true; }
    if (id === 'flare' && U.dist(x, y, b.x, b.y) < R) { b.confused = 3.5; b.lunge = null; G.text(b.x, b.y - 46, 'BLINDED', '#ffd080'); any = true; }
    if (['tattle', 'emp'].includes(id) && W.dolores && W.dolores.casting > 0 && U.dist(x, y, W.dolores.x, W.dolores.y) < R + 20) { A.counterDolores(W, TM.KIT[id].name); any = true; }
    return any;
  };
  A.counterDolores = (W, by) => {
    const dl = W.dolores, b = W.boss; if (!dl || dl.casting <= 0) return;
    dl.casting = 0; dl.cd = 5; b.shield = 0; b.core = 6; b.confused = 2;
    G.text(dl.x, dl.y - 44, by + ' · WARD ABORTED', P.glow, 1.6); G.text(b.x, b.y - 50, 'CORE EXPOSED', P.entCyan, 1.6); TM.Audio.play('counter'); G.xp(40, 'ward broken'); G.shake(.5);
  };
  A.bossHit = (b, dmg, o = {}) => {
    const W = G.W; if (!b || b.gone) return;
    // melee/shots near Dolores while she casts interrupt her (bat, taser)
    if (b.phase === 3 && W.dolores && W.dolores.casting > 0 && o.melee) { const p = W.player; if (U.dist(p.x, p.y, W.dolores.x, W.dolores.y) < 30) { A.counterDolores(W, 'INTERRUPT'); return; } }
    b.flashHit = .12;
    if (b.phase === 1) { const m = b.confused > 0 ? 2 : 1; b.hp -= dmg * m; if (o.stun) b.confused = Math.max(b.confused, 1); G.sparks(b.x, b.y - 10, '#cfc8c0', 5); if (m > 1) G.text(b.x, b.y - 40, 'EXPLOIT', '#e6ecf0', .6); if (b.hp <= 0) enterPhase2(W, b); return; }
    if (b.phase === 2) { G.text(b.x, b.y - 46, 'SEAL THE TEARS', P.tear, .8); return; }
    if (b.shield > 0) { G.text(b.x, b.y - 46, 'WARDED', P.glow, .6); return; }
    if (b.core > 0) {
      const k = o.ash ? 200 : dmg; b.coreHp -= k; G.sparks(b.x, b.y - 22, P.entCyan, o.ash ? 30 : 6);
      if (o.ash) { G.text(b.x, b.y - 50, 'ASH ROUND', '#e6ecf0', 1.6); G.shake(1); W.flash = .7; TM.Audio.play('explode'); }
      if (b.coreHp <= 0) victory(W, b); return;
    }
    if (o.ash) { G.text(b.x, b.y - 46, 'ASH WASTED — EXPOSE THE CORE', P.warn, 1.6); TM.S.run.kit.ash = (TM.S.run.kit.ash || 0) + 1; return; }
    if (o.explosive) { b.core = Math.max(b.core, 1.2); }
    G.text(b.x, b.y - 46, 'CORE HIDDEN', '#9aa4b2', .6);
  };
  function victory(W, b) {
    b.gone = true; W.tears = []; TM.UI.bossBar(false); TM.Audio.play('explode'); G.shake(1.4); W.flash = 1;
    TM.S.run.flags.boss_done = true; G.xp(250, 'Bernard');
    if (W.dolores) { W.dolores.casting = 0; }
    setTimeout(() => TM.UI.dialog('boss_end', null, () => TM.Main.finishLevel()), 900);
  }
  return A;
})();
