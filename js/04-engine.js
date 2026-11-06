/* =========================================================================
   TECHNOMANCERS — 04-engine.js
   World construction, collision, line of sight, FOV raycast, camera,
   suspicion/noise, damage & counter resolution, pickups, exits, grading.
   ========================================================================= */
'use strict';

TM.G = (() => {
  const U = TM.U, TS = 16;
  let W = null;
  const G = { get W() { return W; } };

  /* ------------------------------------------------------------ LOAD */
  G.load = function (n, restorePos) {
    const L = TM.LEVELS[n]; const run = TM.S.run; run.level = n;
    const wmax = Math.max(...L.map.map(r => r.length));
    const map = L.map.map(r => r.padEnd(wmax, ' ').split(''));
    W = {
      L, map, w: wmax, h: map.length, dt: 0, t: 0, cam: { x: 0, y: 0 }, shake: 0, flash: 0,
      explored: new Uint8Array(wmax * map.length), fov: [], fovRange: 120,
      npcs: [], enemies: [], clues: [], items: [], props: [], lights: [], exits: [], triggers: [], zones: [], locks: [],
      proj: [], fx: [], tears: [], locked: new Set(), veil: new Set(), veils: [], anchorPing: 0, hint: null,
      susp: 0, lockdown: 0, boss: null, dolores: null, circle: null, detR: 90, chain: 0, chainT: 0, slices: [],
    };
    const perks = TM.S.rankPerks(); W.detR = perks.scan ? 135 : 90;
    const c = (v) => v * TS + TS / 2;
    let oCount = 0, ox = 0, oy = 0;
    map.forEach((row, y) => row.forEach((ch, x) => { if (ch === 'O') { oCount++; ox += x; oy += y; } }));
    if (oCount) W.circle = { x: c(ox / oCount), y: c(oy / oCount) };
    const other = run.char === 'augie' ? 'jester' : 'augie';
    for (const e of L.ents) {
      if (e.only && e.only !== run.char) continue;
      switch (e.t) {
        case 'npc': {
          const spr = e.spr === 'partner' ? other : e.spr;
          if (e.once && run.flags[e.once]) break;
          W.npcs.push({ ...e, spr, x: c(e.x), y: c(e.y) + 4, dir: 0, isNpc: true, wander: ['dancer', 'patron'].includes(e.spr) ? { ox: c(e.x), oy: c(e.y) + 4, t: Math.random() * 3 } : null });
          break;
        }
        case 'enemy': {
          if (run.killed[n + ':' + L.ents.indexOf(e)]) break;
          const def = TM.ENEMIES[e.kind];
          W.enemies.push({ ...e, uid: n + ':' + L.ents.indexOf(e), def, isEnemy: true, x: c(e.x), y: c(e.y) + 4, hp: def.hp, maxHp: def.hp, dir: 0, state: 'patrol', pi: 0, timer: 0, cd: 1 + Math.random() * 2, alert: 0, stun: 0, jam: 0, home: { x: c(e.x), y: c(e.y) + 4 }, patrol: (e.patrol || [[e.x, e.y]]).map(([a, b]) => ({ x: c(a), y: c(b) + 4 })) });
          break;
        }
        case 'clue': W.clues.push({ id: e.id, x: c(e.x), y: c(e.y), got: run.clues.includes(e.id) }); break;
        case 'frag': { const id = n + ':' + e.x + ',' + e.y; W.items.push({ t: 'frag', id, x: c(e.x), y: c(e.y), taken: !!(run.frags[n] || []).includes(id) }); break; }
        case 'scrap': { const id = 's' + n + ':' + e.x + ',' + e.y; W.items.push({ t: 'scrap', id, x: c(e.x), y: c(e.y), taken: !!run.flags[id] }); break; }
        case 'bench': W.props.push({ t: 'bench', x: c(e.x), y: c(e.y) }); break;
        case 'car': W.props.push({ t: 'car', x: c(e.x), y: c(e.y), wood: e.wood }); break;
        case 'corpse': W.props.push({ t: 'corpse', x: c(e.x), y: c(e.y) }); break;
        case 'safe': W.props.push({ t: 'safe', x: c(e.x), y: c(e.y) + 8, open: run.clues.includes(e.clue), ...e, sx: c(e.x), sy: c(e.y) }); break;
        case 'light': W.lights.push({ x: c(e.x), y: c(e.y), r: e.r, k: .85, flicker: !e.neon && Math.random() < .5, col: e.neon || e.magic ? 'rgba(214,51,138,1)' : e.warm ? 'rgba(255,190,120,1)' : e.cold ? 'rgba(170,200,230,1)' : null }); break;
        case 'exit': W.exits.push({ ...e, px: e.x * TS, py: e.y * TS, pw: (e.w || 1) * TS, ph: (e.h || 1) * TS }); break;
        case 'trigger': if (!(e.once && run.flags['trig' + n + L.ents.indexOf(e)])) W.triggers.push({ ...e, key: 'trig' + n + L.ents.indexOf(e), px: e.x * TS, py: e.y * TS, pw: e.w * TS, ph: e.h * TS }); break;
        case 'zone': W.zones.push({ ...e, px: e.x * TS, py: e.y * TS, pw: e.w * TS, ph: e.h * TS, cx: e.cx != null ? c(e.cx) : 0, cy: e.cy != null ? c(e.cy) : 0, dead: run.flags['zone' + n + L.ents.indexOf(e)], key: 'zone' + n + L.ents.indexOf(e) }); break;
        case 'lock': if (!run.flags['lock_' + e.id]) { W.locked.add(e.x + ',' + e.y); W.locks.push({ ...e, px: c(e.x), py: c(e.y) }); } break;
        case 'veil': if (!run.flags.veil_open) { for (let yy = 0; yy < e.h; yy++) for (let xx = 0; xx < e.w; xx++) W.veil.add((e.x + xx) + ',' + (e.y + yy)); W.veils.push({ ...e, px: c(e.x), py: c(e.y + (e.h - 1) / 2) }); } break;
        case 'slices': W.slices.push({ x: c(e.x), y: c(e.y), t: 0 }); break;
      }
    }
    // the corpse body clue gets drawn by the prop; safes are clue sources
    const sp = (restorePos && run.pos) || null;
    const s = L.spawn[run.char];
    const P = TM.CHARS[run.char];
    W.player = {
      x: sp ? sp.x : c(s[0]), y: sp ? sp.y : c(s[1]) + 4, r: 5, a: 0, dir4: 0, moving: false, anim: 0, sprinting: false,
      atkCd: 0, kitCd: 0, swap: 0, swapMax: P.swap, inv: 0, hurtFlash: 0, hidden: false, flashlight: true, detective: false,
      hotwire: 0, aging: 0, slowed: false, stepT: 0, channel: null, seenBy: 0,
    };
    run.lvl = run.lvl && run.lvl.n === n ? run.lvl : { n, time: 0, dmg: 0, maxSusp: 0, wrong: 0, seen: 0, counters: 0 };
    TM.Audio.setRain(!!L.rain); TM.Audio.setMood(L.music);
    G.updateCam(true);
    TM.S.autosave();
    return W;
  };

  /* --------------------------------------------------------- QUERIES */
  G.tile = (tx, ty) => (W.map[ty] && W.map[ty][tx]) || ' ';
  G.solidTile = (tx, ty) => { if (tx < 0 || ty < 0 || tx >= W.w || ty >= W.h) return true; const k = tx + ',' + ty; if (W.locked.has(k) || W.veil.has(k)) return true; return TM.R.SOLID.has(W.map[ty][tx]); };
  G.solidAt = (x, y) => G.solidTile(Math.floor(x / TS), Math.floor(y / TS));
  G.opaqueAt = (x, y) => { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (tx < 0 || ty < 0 || tx >= W.w || ty >= W.h) return true; const k = tx + ',' + ty; if (W.veil.has(k)) return true; return TM.R.OPAQUE.has(W.map[ty][tx]); };
  G.move = (e, dx, dy, r = 5) => {
    // feet-box collision, axis separated so you slide along walls
    const hit = (x, y) => G.solidAt(x - r, y - 3) || G.solidAt(x + r, y - 3) || G.solidAt(x - r, y + 2) || G.solidAt(x + r, y + 2);
    let moved = false;
    if (dx && !hit(e.x + dx, e.y)) { e.x += dx; moved = true; }
    if (dy && !hit(e.x, e.y + dy)) { e.y += dy; moved = true; }
    return moved;
  };
  G.los = (x1, y1, x2, y2) => { const d = U.dist(x1, y1, x2, y2), n = Math.ceil(d / 6); for (let i = 1; i < n; i++) { const k = i / n; if (G.opaqueAt(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k)) return false; } return true; };

  /* ------------------------------------------------------------- FOV */
  function computeFOV() {
    const p = W.player; const range = (p.flashlight ? 135 : 70) * (W.L.dawn ? 1.6 : 1); W.fovRange = range;
    const half = p.flashlight ? .62 : 1.2, rays = 64, ox = p.x, oy = p.y - 8; const pts = [];
    for (let i = 0; i <= rays; i++) {
      const a = p.a - half + (2 * half * i) / rays; const cx = Math.cos(a), cy = Math.sin(a); let d = 0, hx = ox, hy = oy;
      while (d < range) { d += 4; hx = ox + cx * d; hy = oy + cy * d; const tx = Math.floor(hx / TS), ty = Math.floor(hy / TS); if (tx >= 0 && ty >= 0 && tx < W.w && ty < W.h) W.explored[ty * W.w + tx] = 1; if (G.opaqueAt(hx, hy)) break; }
      pts.push([hx, hy]);
    }
    W.fov = pts;
    // always remember tiles right around you
    const ptx = Math.floor(p.x / TS), pty = Math.floor(p.y / TS);
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const tx = ptx + x, ty = pty + y; if (tx >= 0 && ty >= 0 && tx < W.w && ty < W.h) W.explored[ty * W.w + tx] = 1; }
    for (const l of W.lights) { const tx = Math.floor(l.x / TS), ty = Math.floor(l.y / TS); const rr = Math.ceil(l.r / TS / 2); for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) { const a = tx + x, b = ty + y; if (a >= 0 && b >= 0 && a < W.w && b < W.h && G.los(l.x, l.y, a * TS + 8, b * TS + 8)) W.explored[b * W.w + a] = 1; } }
  }
  G.inLight = (x, y) => { // is a point lit (for enemy visibility of the player)
    for (const l of W.lights) if (U.dist(x, y, l.x, l.y) < l.r * .7) return true; return false;
  };
  G.inFOV = (x, y) => { const p = W.player; const d = U.dist(p.x, p.y - 8, x, y - 8); if (d < 28) return true; if (d > W.fovRange) return G.inLight(x, y); const a = Math.atan2(y - p.y, x - p.x); if (Math.abs(U.angDiff(p.a, a)) > (p.flashlight ? .65 : 1.2)) return G.inLight(x, y); return G.los(p.x, p.y - 8, x, y - 8); };

  G.updateCam = (snap) => {
    const p = W.player, VW = TM.R.VW, VH = TM.R.VH; const lead = 22;
    let tx = p.x + Math.cos(p.a) * lead - VW / 2, ty = p.y + Math.sin(p.a) * lead - VH / 2 - 8;
    const mw = W.w * TS, mh = W.h * TS;
    tx = mw <= VW ? (mw - VW) / 2 : U.clamp(tx, 0, mw - VW); ty = mh <= VH ? (mh - VH) / 2 : U.clamp(ty, 0, mh - VH);
    if (snap) { W.cam.x = tx; W.cam.y = ty; } else { W.cam.x = U.lerp(W.cam.x, tx, Math.min(1, W.dt * 6)); W.cam.y = U.lerp(W.cam.y, ty, Math.min(1, W.dt * 6)); }
  };

  /* -------------------------------------------------------- FX & FEEL */
  G.fx = (o) => { W.fx.push({ t: 0, life: .4, ...o }); };
  G.text = (x, y, text, col = '#e6ecf0', life = 1) => G.fx({ kind: 'text', x, y: y - 24, text, col, life });
  G.sparks = (x, y, col, n = 8) => { for (let i = 0; i < n; i++) { const a = Math.random() * 7, s = 30 + Math.random() * 60; G.fx({ kind: 'spark', x, y: y - 10, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col, life: .35 }); } };
  G.shake = (k) => { W.shake = Math.max(W.shake, k); if (k > .5) U.vibrate(40); };
  G.chain = (why) => { // action chain → XP multiplier, the addictive little drumroll
    W.chain = W.chainT > 0 ? Math.min(W.chain + 1, 8) : 1; W.chainT = 9;
    return 1 + (W.chain - 1) * .25;
  };
  G.xp = (n, why) => { const m = G.chain(why); TM.S.addXP(n * m, why + (m > 1 ? ' ×' + m.toFixed(2).replace(/\.?0+$/, '') : '')); };

  /* ---------------------------------------------------- SUSPICION */
  G.noise = (x, y, amount) => {
    if (!amount) return; const perks = TM.S.rankPerks();
    for (const e of W.enemies) { if (e.dead) continue; const d = U.dist(x, y, e.x, e.y); if (d < amount * 4) { e.alert = Math.min(1, e.alert + amount / 40); e.heard = { x, y }; if (e.state === 'patrol') e.state = 'investigate'; } }
    G.addSusp(amount * .5 * (perks.ghost ? .7 : 1));
  };
  G.addSusp = (n) => {
    W.susp = U.clamp(W.susp + n, 0, 100); TM.S.run.lvl.maxSusp = Math.max(TM.S.run.lvl.maxSusp, W.susp);
    if (W.susp >= 100 && W.lockdown <= 0) {
      W.lockdown = 12; TM.Audio.play('sting'); TM.UI.banner(W.L.stealth ? 'SPOTTED' : 'LOCKDOWN', 'red');
      for (const e of W.enemies) if (!e.dead) { e.alert = 1; e.state = 'chase'; }
      if (W.L.stealth) G.caught();
    }
  };
  G.caught = () => { // precinct: you get chased out, not killed
    const p = W.player, s = W.L.spawn[TM.S.run.char]; p.x = s[0] * TS + 8; p.y = s[1] * TS + 12; W.susp = 40; W.lockdown = 0;
    for (const e of W.enemies) { e.alert = 0; e.state = 'patrol'; }
    TM.UI.dialog('caught');
  };

  /* -------------------------------------------------------- DAMAGE */
  G.hurtPlayer = (n, src) => {
    const p = W.player, run = TM.S.run; if (p.inv > 0 || TM.UI.blocking()) return;
    run.hp = Math.max(0, run.hp - n); run.lvl.dmg += n; p.inv = .7; p.hurtFlash = 1; G.shake(.6); TM.Audio.play('hurt');
    run.nerve = Math.max(0, run.nerve - n * .3);
    if (run.hp <= 0) G.die(src);
  };
  G.die = (src) => { TM.UI.dead(src); };
  G.respawn = () => { // checkpoint: restart the level with what you came in with
    TM.S.loadAuto(); const run = TM.S.run; run.hp = Math.max(run.hp, Math.round(run.maxHp * .6)); run.nerve = Math.max(run.nerve, 60); run.pos = null;
    G.load(run.level, false);
  };
  G.hitEnemy = (e, dmg, o = {}) => {
    if (e.dead || e.def.nocombat) { if (e.def.nocombat && o.melee) { G.text(e.x, e.y, 'HEY!', '#ffd070'); G.addSusp(40); } return false; }
    if (e.phased && !o.jar) { G.text(e.x, e.y, 'PHASED', '#9aa4b2'); return false; }
    if (e.fake) { e.dead = true; G.sparks(e.x, e.y, '#9aa4b2', 10); G.text(e.x, e.y, 'ECHO', '#9aa4b2'); return true; }
    const perks = TM.S.rankPerks();
    let m = 1; if (!e.def.conventional) m = e.stun > 0 ? 2 : .5; if (perks.dmg && !e.def.conventional) m *= 1.2;
    if (o.backstab && e.alert < .5 && e.state !== 'chase') { m *= o.backstab; G.text(e.x, e.y - 6, 'SILENT', '#e6ecf0'); TM.S.unlock('backstab'); }
    e.hp -= dmg * m; e.flashHit = .12; e.alert = 1; if (e.state === 'patrol' || e.state === 'investigate') e.state = 'chase';
    if (o.knock) { const a = Math.atan2(e.y - W.player.y, e.x - W.player.x); G.move(e, Math.cos(a) * o.knock * .12, Math.sin(a) * o.knock * .12, 5); }
    if (o.stun) e.stun = Math.max(e.stun, o.stun);
    if (o.interrupt && e.state === 'windup' && (e.def.conventional || Math.random() < .5)) { G.abortCast(e, 'INTERRUPTED', false); }
    G.sparks(e.x, e.y, '#e6ecf0', 5);
    if (e.hp <= 0) G.killEnemy(e);
    return true;
  };
  G.killEnemy = (e) => {
    e.dead = true; const run = TM.S.run; run.killed[e.uid] = true;
    G.sparks(e.x, e.y, e.def.conventional ? '#9aa4b2' : TM.PAL.glow, 16);
    G.text(e.x, e.y, e.def.conventional ? 'DOWN' : 'FOLDED OUT', e.def.conventional ? '#e6ecf0' : TM.PAL.glow, 1.2);
    // masked T-Mancers don't die on screen — their OmniBox pulls them out
    for (const f of W.enemies) if (f.fake && f.owner === e) f.dead = true;
    G.xp(e.def.conventional ? 20 : 35, 'enemy down');
    if (e.drop) { G.clue(e.drop); }
    if (e.flag) run.flags[e.flag] = true;
    G.noise(e.x, e.y, 6);
  };
  G.abortCast = (e, why, counter, kit) => {
    e.state = 'stunned'; e.timer = 0; e.stun = 3; e.cd = 3;
    G.text(e.x, e.y - 8, why, TM.PAL.glow, 1.3); G.fx({ kind: 'ring', x: e.x, y: e.y - 10, r: 30, col: TM.PAL.glow, life: .5 });
    TM.Audio.play('counter'); G.shake(.3);
    if (counter) { const lang = e.def.lang; TM.S.run.lvl.counters++; TM.S.run.total.counters++; G.xp(25, 'counter'); const k = 'c_' + lang; if (TM.ACH[k]) { TM.S.unlock(k); const all = ['c_whisper', 'c_nanohive', 'c_temporaltext', 'c_foldspeak'].every(a => TM.S.profile.ach[a]); if (all) TM.S.unlock('polyglot'); } }
  };
  // counter-kit resolution: kit item lands at x,y
  G.applyKit = (id, x, y) => {
    const K = TM.KIT[id]; const R = K.radius || 60; let any = false;
    G.fx({ kind: 'ring', x, y, r: R, col: id === 'emp' ? '#8fe3d0' : id === 'frag' ? '#ffd070' : '#dfe6ea', life: .6 });
    if (id === 'frag') { TM.Audio.play('explode'); G.shake(1); G.noise(x, y, K.noise); for (const e of W.enemies) if (!e.dead && U.dist(x, y, e.x, e.y) < R) G.hitEnemy(e, K.dmg, { knock: 120, interrupt: true }); if (W.boss) TM.AI.bossHit(W.boss, K.dmg * .6, { explosive: true, x, y }); return; }
    if (id === 'flare') { W.lights.push({ x, y, r: 150, k: 1, ttl: 10, col: 'rgba(255,200,140,1)' }); W.flash = .5; TM.Audio.play('shotgun'); }
    if (id === 'emp') TM.Audio.play('emp'); else if (id !== 'flare') TM.Audio.play('counter');
    for (const e of W.enemies) {
      if (e.dead || !e.def.lang) continue; const d = U.dist(x, y, e.x, e.y); if (d > R) continue;
      const fits = K.counters && K.counters.includes(e.def.lang);
      if (id === 'salt' && e.def.lang === 'foldspeak') { e.jam = 40; e.tumbleTo = null; any = true; G.text(e.x, e.y - 14, 'GATES JAMMED 40s', '#dfe6ea', 1.5); if (e.state === 'windup') G.abortCast(e, 'FOLDSPEAK ABORTED', true); else { e.stun = 1.5; G.xp(15, 'jam'); } continue; }
      if (id === 'jar' && e.def.lang === 'nanohive') { any = true; if (e.phased) { e.phased = false; e.stun = 5; e.hp -= 25; G.text(e.x, e.y - 14, 'COLLAPSED IN JAR', TM.PAL.glow, 1.5); G.abortCast(e, 'PHASE COLLAPSED', true); if (e.hp <= 0) G.killEnemy(e); } else if (e.state === 'windup') G.abortCast(e, 'SWARM VACUUMED', true); else { e.stun = 2; } continue; }
      if (fits && e.state === 'windup') { any = true; G.abortCast(e, (TM.LANG[e.def.lang].name) + ' ABORTED', true); continue; }
      if (fits) { any = true; e.stun = Math.max(e.stun, id === 'emp' ? 3 : 1.6); if (id === 'ticks' || id === 'flare') e.jam = Math.max(e.jam, 8); }
    }
    // swarms in the air
    for (const pr of W.proj) if (pr.kind === 'swarm' && U.dist(x, y, pr.x, pr.y) < R && (id === 'jar' || id === 'emp' || id === 'tattle')) { pr.dead = true; any = true; G.text(pr.x, pr.y, 'BOTS CAUGHT', '#dfe6ea'); }
    // time zones
    for (const z of W.zones) if (z.kind === 'slow' && !z.dead && (id === 'ticks' || id === 'flare' || id === 'emp') && x > z.px - 20 && x < z.px + z.pw + 20 && y > z.py - 20 && y < z.py + z.ph + 20) { z.dead = true; TM.S.run.flags[z.key] = true; G.text(x, y, 'FIELD COLLAPSED', TM.PAL.glow, 1.4); G.xp(20, 'field'); any = true; }
    // boss interactions (tears / Dolores / Bernard)
    if (W.boss) any = TM.AI.bossKit(W.boss, id, x, y, R) || any;
    if (!any && id !== 'flare') G.text(x, y, 'NO EFFECT', '#6f7887');
  };

  /* ------------------------------------------------------- PROGRESS */
  G.clue = (id, silent) => {
    const run = TM.S.run; if (run.clues.includes(id)) return false;
    run.clues.push(id); run.total.clues++; TM.S.profile.totalClues++; TM.S.saveProfile();
    for (const c of W.clues) if (c.id === id) c.got = true;
    if (!silent) { TM.Audio.play('clue'); TM.UI.toast('CLUE · ' + TM.CLUES[id].title, 'clue', TM.R.icon(TM.CLUES[id].icon)); }
    G.xp(15, 'clue'); TM.S.unlock('first_clue');
    TM.S.autosave(); return true;
  };
  G.objectiveDone = (o) => {
    if (o.clue) return TM.S.has(o.clue); if (o.ded) return TM.S.ded(o.ded); if (o.flag) return TM.S.flag(o.flag);
    if (o.count) return o.count.every(TM.S.has); return false;
  };
  G.objCount = (o) => o.count ? o.count.filter(TM.S.has).length + '/' + o.count.length : '';

  G.seamGoggles = () => TM.S.run.char === 'augie';

  /* ------------------------------------------------------- GRADING */
  G.grade = () => {
    const run = TM.S.run, L = W.L, l = run.lvl; let score = 100;
    score -= Math.max(0, (l.time - L.par) / L.par) * 25;
    score -= Math.min(30, l.dmg * .25);
    score -= l.wrong * 6;
    score -= l.maxSusp >= 100 ? 15 : l.maxSusp > 60 ? 5 : 0;
    const frags = (run.frags[L.n] || []).length, ftot = L.ents.filter(e => e.t === 'frag').length; score += frags * 4;
    const bonus = L.objectives.filter(o => o.bonus && G.objectiveDone(o)).length; score += bonus * 6;
    const g = score >= 95 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D';
    return { g, score: Math.round(score), frags, ftot, time: l.time, dmg: Math.round(l.dmg), wrong: l.wrong, susp: Math.round(l.maxSusp), counters: l.counters || 0, bonus };
  };
  G.completeLevel = () => {
    const run = TM.S.run, L = W.L, gr = G.grade(), prof = TM.S.profile; const key = run.char + ':' + L.id;
    const order = 'DCBAS'; const prev = prof.grades[key]; if (!prev || order.indexOf(gr.g) > order.indexOf(prev)) prof.grades[key] = gr.g;
    if (!prof.bestTimes[key] || gr.time < prof.bestTimes[key]) prof.bestTimes[key] = gr.time;
    TM.S.saveProfile();
    if (gr.g === 'S') TM.S.unlock('s_rank');
    if (l_ghost(run)) TM.S.unlock('ghost');
    if (run.lvl.dmg === 0 && L.n > 0 && L.n < 6) TM.S.unlock('untouched');
    if (gr.frags === gr.ftot && gr.ftot > 0) TM.S.unlock('frags_level');
    const bonusXP = { S: 150, A: 100, B: 70, C: 40, D: 20 }[gr.g];
    TM.S.addXP(bonusXP, 'grade ' + gr.g);
    run.total.time += run.lvl.time;
    return gr;
    function l_ghost(r) { return r.lvl.maxSusp < 100 && W.enemies.length > 0; }
  };

  /* -------------------------------------------------------- UPDATE */
  G.update = (dt) => {
    W.dt = dt; W.t += dt; const run = TM.S.run;
    if (TM.UI.blocking()) { W.fx = W.fx.filter(f => (f.t += dt) < f.life); return; }
    run.lvl.time += dt;
    TM.Player.update(W, dt);
    TM.AI.update(W, dt);
    // projectiles
    for (const pr of W.proj) TM.Player.stepProj(W, pr, dt);
    W.proj = W.proj.filter(p => !p.dead);
    W.fx = W.fx.filter(f => (f.t += dt) < f.life);
    for (const l of W.lights) if (l.ttl != null) l.ttl -= dt; W.lights = W.lights.filter(l => l.ttl == null || l.ttl > 0);
    W.shake = Math.max(0, W.shake - dt * 2); W.flash = Math.max(0, W.flash - dt * 1.5); W.anchorPing = Math.max(0, W.anchorPing - dt * .5);
    W.chainT = Math.max(0, W.chainT - dt); if (W.chainT <= 0) W.chain = 0;
    if (W.lockdown > 0) { W.lockdown -= dt; } else W.susp = Math.max(0, W.susp - dt * (W.player.hidden ? 6 : 2.5));
    // entity slices (house horror)
    for (const s of W.slices) { s.t -= dt; if (s.t <= 0 && U.dist(W.player.x, W.player.y, s.x, s.y) < 110) { s.t = 6 + Math.random() * 6; G.fx({ kind: 'slice', x: s.x + (Math.random() - .5) * 40, y: s.y, life: 2.2 }); TM.Audio.play('tear'); run.nerve = Math.max(0, run.nerve - 6); } }
    // nerve
    const perks = TM.S.rankPerks(); const drain = (W.L.nerveDrain || 0) + (W.player.flashlight ? 0 : .6) + (W.boss && !W.boss.gone ? 1.2 : 0);
    if (drain > 0) run.nerve = Math.max(0, run.nerve - drain * dt * (perks.nerve ? .65 : 1));
    else run.nerve = Math.min(100, run.nerve + dt * 2);
    for (const l of W.lights) if (U.dist(l.x, l.y, W.player.x, W.player.y) < l.r * .6) run.nerve = Math.min(100, run.nerve + dt * 3);
    computeFOV();
    G.updateCam();
    // triggers
    const p = W.player;
    for (const tr of W.triggers) {
      if (tr.done) continue; if (!(p.x > tr.px && p.x < tr.px + tr.pw && p.y > tr.py && p.y < tr.py + tr.ph)) continue; if (!TM.S.check(tr.if)) continue;
      tr.done = true; run.flags[tr.key] = true; const d = typeof tr.dlg === 'object' ? tr.dlg[run.char] : tr.dlg; TM.UI.dialog(d);
    }
    // zones
    p.slowed = false;
    for (const z of W.zones) {
      if (z.dead) continue; const inside = p.x > z.px && p.x < z.px + z.pw && p.y > z.py && p.y < z.py + z.ph;
      if (!inside) continue;
      if (z.kind === 'slow') { p.slowed = true; if (z.dlg && !run.flags[z.key + 'd']) { run.flags[z.key + 'd'] = true; TM.UI.dialog(z.dlg); } }
      if (z.kind === 'pull') { const a = Math.atan2(z.cy - p.y, z.cx - p.x); const d = U.dist(p.x, p.y, z.cx, z.cy); if (d > 6) G.move(p, Math.cos(a) * 26 * dt, Math.sin(a) * 26 * dt, p.r); run.nerve = Math.max(0, run.nerve - dt * 1.5); }
    }
    // exits
    for (const ex of W.exits) {
      if (!(p.x > ex.px - 4 && p.x < ex.px + ex.pw + 4 && p.y > ex.py - 4 && p.y < ex.py + ex.ph + 4)) { ex.warned = false; continue; }
      const need = ex.need || {}; const ok = TM.S.check({ ded: need.ded, clue: need.clue, flag: need.flag });
      if (ok) { TM.Main.finishLevel(); return; }
      if (!ex.warned) { ex.warned = true; TM.UI.dialog(ex.locked); }
    }
    run.pos = { x: p.x, y: p.y };
  };

  return G;
})();
