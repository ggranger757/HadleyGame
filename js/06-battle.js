/* =========================================================================
   CHRONOMANCER — 06-battle.js
   REAL-TIME side-view fights. No turns.
   · move ◀ ▶ · ATTACK (tap in rhythm to chain a combo) · DODGE (roll with i-frames)
   · enemies WIND UP before they hit (sometimes they fake it), heavy attacks glow red —
     interrupt them or get out of the way · some enemies raise a GUARD
   AUGIE  — Hush Crook heads, swapped live (push · quarter-turn · click):
            KNOCKER (cracks guards) · STUN CROWN · MOWER BLADE (reach + bleed) · THUNDERCLAP (sonic, interrupts)
            DRUM rounds (taser → flare → ash) · GOLEM I (battle) / GOLEM II (fortress)
   JESTER — fists (jab, jab, uppercut) · pump SHOTGUN (2 shells, reload) · CREW RUSH · THE MASK (berserk)
   keys: ←/→ or A/D move · J/Space attack · K/Shift dodge · U I O kit · H heal
   ========================================================================= */
'use strict';
TM.Battle = (() => {
  const U = TM.U, $ = (s) => document.querySelector(s);
  const rnd = Math.random, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  let b = null; const B = {}; const held = {};
  const run = () => TM.S.run, hero = () => TM.HEROES[run().hero];
  const imgs = {}; const img = (s) => { if (!imgs[s]) { const i = new Image(); i.src = s; imgs[s] = i; } return imgs[s]; };
  const HEADS = ['knocker', 'stun', 'mower', 'thunder'];
  const HEADSPEC = { knocker: { range: 36, mult: 1.1, cd: .42, breakGuard: true }, stun: { range: 32, mult: .7, cd: .34, stun: .35 }, mower: { range: 48, mult: 1.5, cd: .7, bleed: true }, thunder: { range: 80, mult: .9, cd: .6, sonic: true, cool: 6 } };
  const MOVE = (m, f) => {
    const base = { hit: { wind: .55, range: 36, rec: .45 }, heavy: { wind: 1.15, range: 46, rec: .9, mult: 1.7 }, multi: { wind: .6, range: 40, rec: .7, hits: m.hits || 3 }, drain: { wind: .7, range: 42, rec: .6 }, guard: { wind: .2, dur: 1.5 }, blind: { wind: .8, range: 999, rec: .6 } }[m.k];
    return Object.assign({}, base, { dmg: m.dmg || f.atk });
  };

  B.start = (thing) => {
    const def = TM.FIGHTS[thing.fight], foe = TM.FOES[def.foe], R = run(); const W = TM.W.W;
    const big = foe.boss === 'bernard';
    b = { thing, def, foe, t: 0, over: false, nums: [], fx: [], msg: '', msgT: 0,
      h: { x: W * .26, vx: 0, dir: 1, anim: 'idle', at: 0, hurt: 0, iframe: 0, dodgeCd: 0, atkCd: 0, combo: 0, comboT: 0, heal: 0 },
      f: { x: W * .74, dir: -1, hp: foe.hp, max: foe.hp, state: 'idle', st: 1 + rnd(), move: null, mv: null, anim: 'idle', at: 0, stun: 0, bleed: 0, blind: 0, guard: 0, big, rewound: false, phase: 1, tell: '' },
      head: R.head || 'knocker', swap: null, cool: { thunder: 0 }, rounds: { taser: 2, flare: 1, ash: 1 }, droids: { golem1: 2, golem2: 2 }, golem: null, shield: 0, heads: {},
      shells: 2, reload: 0, rage: R.rage || 0, crew: false, crewAnim: null, mask: 0, cutin: 0, blindHero: 0 };
    TM.W.state.battle = b; TM.Audio.setMood(foe.boss ? 'boss' : 'fight'); TM.Audio.play('sting');
    TM.UI.battle(true); panel();
    const seen = TM.S.profile.tips = TM.S.profile.tips || {};
    if (def.tip && !seen[thing.fight]) { seen[thing.fight] = 1; TM.S.save(); TM.UI.notice('FIGHT TIP', def.tip); }
  };

  /* ---------------- input ---------------- */
  const keymap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', KeyJ: 'attack', Space: 'attack', Enter: 'attack', KeyK: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge', KeyU: 'k1', KeyI: 'k2', KeyO: 'k3', KeyH: 'heal', Digit1: 'k1', Digit2: 'k2', Digit3: 'k3' };
  window.addEventListener('keyup', (e) => { const k = keymap[e.code]; if (k) held[k] = false; });
  B.key = (e) => { if (!b) return false; const k = keymap[e.code]; if (!k) return true; if (k === 'left' || k === 'right') held[k] = true; else if (!e.repeat) act(k); return true; };
  B.act = (k) => act(k); B.hold = (k, v) => { held[k] = v; };
  function act(k) {
    if (!b || b.over || TM.UI.modalOpen()) return; const h = b.h, R = run();
    if (h.hurt > 0 || h.heal > 0) return;
    if (k === 'dodge') { if (h.dodgeCd > 0) return; const away = held.left ? -1 : held.right ? 1 : -h.dir; h.vx = away * 190; h.iframe = .38; h.dodgeCd = .65; h.anim = 'dash'; h.at = .38; TM.Audio.play('swing'); return; }
    if (k === 'heal') { if (R.meds <= 0) return; R.meds--; h.heal = .8; h.anim = 'crouch'; h.at = .8; TM.Audio.play('heal'); setTimeout(() => { if (b) healHero(40); }, 600); return panel(); }
    if (k === 'attack') return attack();
    if (R.hero === 'augie') { if (k === 'k1') swap(); if (k === 'k2') drum(); if (k === 'k3') droid(); }
    else { if (k === 'k1') shotgun(); if (k === 'k2') crew(); if (k === 'k3') mask(); }
    panel();
  }
  const dist = () => Math.abs(b.f.x - b.h.x);

  /* ---------------- hero attacks ---------------- */
  function attack() {
    const h = b.h, R = run(); if (h.atkCd > 0 || b.swap) return;
    const masked = b.mask > 0; let range, mult, cd;
    if (R.hero === 'augie') { const S = HEADSPEC[b.head]; if (S.sonic && b.cool.thunder > 0) { toast('THUNDERCLAP is refilling its air tank'); return; } range = S.range; mult = S.mult; cd = S.cd; }
    else { range = 30; mult = .85; cd = masked ? .16 : .3; }
    h.combo = h.comboT > 0 ? h.combo + 1 : 1; h.comboT = .6;
    const fin = h.combo % 3 === 0;
    h.anim = fin ? 'attack2' : 'attack'; h.at = Math.max(.22, cd * .9); h.atkCd = cd * (fin ? 1.3 : 1);
    TM.Audio.play(R.hero === 'augie' ? (b.head === 'stun' ? 'zap' : b.head === 'thunder' ? 'horn' : b.head === 'mower' ? 'knife' : 'staff') : 'hit');
    setTimeout(() => {
      if (!b || b.over) return; const f = b.f;
      if (R.hero === 'augie' && HEADSPEC[b.head].sonic) {
        b.cool.thunder = HEADSPEC.thunder.cool; b.fx.push({ k: 'wave', x: h.x + h.dir * 14, dir: h.dir, t: 0 });
        if (dist() < range) hitFoe(Math.round(hero().atk * mult), { kb: 30, interrupt: true, label: 'BOOM' });
        b.heads.thunder = 1; return checkHeads();
      }
      if (dist() < range && Math.sign(f.x - h.x) === h.dir) {
        const d = Math.round(hero().atk * mult * (fin ? 1.5 : 1) * (masked ? 1.35 : 1)) + ri(0, 3);
        const o = { kb: fin ? 16 : 6, label: fin ? 'COMBO' : '' };
        if (R.hero === 'augie') { const S = HEADSPEC[b.head]; b.heads[b.head] = 1; checkHeads(); if (S.breakGuard) o.breakGuard = true; if (S.stun && rnd() < S.stun) o.stun = 1.1; if (S.bleed) o.bleed = 3; }
        if (fin && R.hero === 'jester') o.stun = .5;
        if (fin) { const p = TM.S.profile; p.combos = (p.combos || 0) + 1; TM.S.save(); if (p.combos >= 10) TM.S.feat('crit5'); }
        hitFoe(d, o);
      }
    }, 110);
  }
  function checkHeads() { if (HEADS.every((k) => b.heads[k])) TM.S.feat('swap'); }
  function swap() {
    if (b.swap) return; const next = HEADS[(HEADS.indexOf(b.head) + 1) % HEADS.length];
    b.swap = { from: b.head, to: next, t: 0 }; TM.Audio.play('swap'); b.h.atkCd = .9;
    setTimeout(() => { if (!b) return; b.head = next; run().head = next; b.swap = null; toast(`${TM.HEADS[next].name} locked on`); panel(); }, 900);
  }
  function drum() {
    const order = ['taser', 'flare', 'ash']; const r = order.find((k) => b.rounds[k] > 0); if (!r || b.h.atkCd > 0) return;
    b.rounds[r]--; b.h.anim = 'attack'; b.h.at = .35; b.h.atkCd = .5;
    b.fx.push({ k: 'shot', x: b.h.x + b.h.dir * 20, dir: b.h.dir, t: 0, col: r === 'ash' ? '#ff4fd8' : r === 'flare' ? '#ffd23a' : '#6df0ff' });
    TM.Audio.play(r === 'ash' ? 'nova' : r === 'flare' ? 'flame' : 'zap');
    setTimeout(() => { if (!b) return;
      if (r === 'taser') hitFoe(ri(5, 8), { stun: 1.6, interrupt: true, label: 'TASER' });
      if (r === 'flare') { b.f.blind = 4; toast('FLARE — it can\'t see you'); }
      if (r === 'ash') { hitFoe(Math.round(hero().atk * 3.2) + ri(0, 8), { kb: 26, interrupt: true, label: 'ASH', col: '#ff4fd8' }); TM.W.shake(); }
    }, 160);
  }
  function droid() {
    const k = b.droids.golem1 >= b.droids.golem2 ? 'golem1' : 'golem2'; if (!b.droids[k] || b.golem) return; b.droids[k]--;
    if (k === 'golem1') { b.golem = { kind: 'battle', t: 0, x: b.h.x - 20 }; TM.Audio.play('hit'); toast('GOLEM I: BATTLE MODE'); }
    else { b.golem = { kind: 'fortress', t: 0, x: b.h.x + b.h.dir * 18 }; b.shield = 4; healHero(15); TM.Audio.play('block'); toast('GOLEM II: FORTRESS'); }
  }
  function shotgun() {
    const h = b.h; if (b.reload > 0 || h.atkCd > 0) return;
    if (b.shells <= 0) { b.reload = 1.6; h.anim = 'crouch'; h.at = 1.6; TM.Audio.play('ui2'); toast('Reloading — chk-chk'); setTimeout(() => { if (b) { b.shells = 2; panel(); } }, 1600); return; }
    b.shells--; h.anim = 'shoot'; h.at = .45; h.atkCd = .7; TM.Audio.play('shotgun'); TM.W.shake(); h.vx = -h.dir * 60;
    b.fx.push({ k: 'blast', x: h.x + h.dir * 26, dir: h.dir, t: 0 });
    setTimeout(() => { if (!b) return; if (dist() < 95 && Math.sign(b.f.x - h.x) === h.dir) { const fall = dist() < 45 ? 1 : .65; hitFoe(Math.round(hero().atk * 1.9 * fall) + ri(0, 6), { kb: 34, interrupt: true, label: 'BOOM' }); } }, 80);
  }
  function crew() {
    if (b.crew) return; b.crew = true; TM.S.feat('crew'); const era = TM.W.chapter().era;
    b.crewAnim = { t: 0, portal: era !== '2026' }; TM.Audio.play(era !== '2026' ? 'portal' : 'ui2');
    toast(era !== '2026' ? 'Mina opens a door — the Mantis crew charges through!' : 'You whistle. The Mantis crew hits it all at once!');
    [0, 1, 2, 3].forEach((i) => setTimeout(() => { if (b && !b.over) { hitFoe(ri(7, 11), { kb: 8, stun: .3 }); TM.Audio.play('hit'); } }, 900 + i * 260));
  }
  function mask() {
    if (b.rage < 100 || b.mask > 0) return; b.rage = 0; b.cutin = 1.1; TM.S.feat('mask'); TM.Audio.play('sting');
    setTimeout(() => { if (b) { b.mask = 6; toast('THE MASK — hit everything'); } }, 900);
  }

  /* ---------------- damage ---------------- */
  function hitFoe(d, o = {}) {
    const f = b.f; if (b.over) return;
    if (f.guard > 0 && !o.breakGuard && !o.interrupt) { d = Math.round(d * .3); o.label = 'GUARD'; }
    if (o.breakGuard && f.guard > 0) { f.guard = 0; o.label = 'GUARD BROKEN'; }
    if (rnd() < .1) { d = Math.round(d * 1.5); o.label = 'CRIT'; o.col = '#ffd23a'; }
    f.hp = Math.max(0, f.hp - d); f.anim = 'hurt'; f.at = .25; f.x += Math.sign(f.x - b.h.x) * (o.kb || 6) * (f.big ? .4 : 1);
    if (o.stun) { f.stun = Math.max(f.stun, o.stun); if (f.state === 'wind') { f.state = 'idle'; f.st = .3; f.move = null; } }
    if (o.interrupt && f.state === 'wind') { f.state = 'idle'; f.st = .6; f.move = null; f.stun = Math.max(f.stun, .6); o.label = 'INTERRUPTED'; }
    if (o.bleed) f.bleed = o.bleed;
    num(f.x, '-' + d + (o.label ? ' ' + o.label : ''), o.col || (o.label === 'COMBO' ? '#ff4fd8' : '#fff')); TM.W.shake();
    if (run().hero === 'jester') b.rage = Math.min(100, b.rage + 7);
    if (f.big && f.phase === 1 && f.hp < f.max * .55) { f.phase = 2; TM.UI.banner('IT OPENS', 'red'); TM.Audio.play('tear'); }
    if (b.foe.boss === 'silas' && !f.rewound && f.hp < f.max * .35 && f.hp > 0) { f.rewound = true; f.state = 'rewind'; f.st = 1.2; }
    if (f.hp <= 0) win();
    panel();
  }
  function hitHero(d, label) {
    const h = b.h, R = run();
    if (h.iframe > 0) { num(h.x, 'DODGE', '#6df0ff'); const p = TM.S.profile; p.dodges = (p.dodges || 0) + 1; TM.S.save(); if (p.dodges >= 5) TM.S.feat('dodge5'); return false; }
    if (b.shield > 0 && b.golem && b.golem.kind === 'fortress') { num(h.x, 'BLOCKED', '#6df0ff'); TM.Audio.play('block'); return false; }
    if (b.mask > 0) d = Math.round(d * 1.2);
    R.hp = Math.max(0, R.hp - d); h.hurt = .32; h.anim = 'hurt'; h.at = .32; h.vx = Math.sign(h.x - b.f.x) * 120; h.combo = 0;
    num(h.x, '-' + d + (label ? ' ' + label : ''), '#ff6b6b'); TM.W.shake(); TM.Audio.play('monster'); TM.U.vibrate(40);
    if (R.hero === 'jester') b.rage = Math.min(100, b.rage + 12);
    if (R.hp <= 0) lose();
    panel(); return true;
  }
  function healHero(n) { const R = run(); const h = Math.min(R.maxHp - R.hp, n); R.hp += h; num(b.h.x, '+' + h, '#7cf0b0'); panel(); }
  function num(x, text, col) { b.nums.push({ x, text, col, t: 0 }); }
  function toast(t) { if (b) { b.msg = t; b.msgT = 1.8; } }

  /* ---------------- enemy brain ---------------- */
  function foeThink(dt) {
    const f = b.f, h = b.h, F = b.foe, W = TM.W.W; f.dir = Math.sign(h.x - f.x) || -1;
    if (f.bleed > 0) { f.bleed -= dt; f.bleedT = (f.bleedT || 0) - dt; if (f.bleedT <= 0) { f.bleedT = .8; f.hp = Math.max(0, f.hp - 2); num(f.x, '-2', '#ff6b6b'); if (f.hp <= 0) return win(); } }
    if (f.blind > 0) f.blind -= dt; if (f.guard > 0) f.guard -= dt;
    if (f.stun > 0) { f.stun -= dt; f.anim = 'hurt'; return; }
    f.st -= dt;
    const speed = (f.big ? 26 : 42) * (f.phase > 1 ? 1.35 : 1);
    if (f.state === 'rewind') { if (f.st <= 0) { const hp = Math.round(f.max * .25); f.hp = Math.min(f.max, f.hp + hp); num(f.x, '+' + hp + ' REWIND', '#6df0ff'); TM.Audio.play('portal'); toast('Silas turns his watch back. Your hits un-happen.'); f.state = 'idle'; f.st = .5; panel(); } return; }
    if (f.state === 'idle' || f.state === 'approach') {
      if (!f.move) { const moves = F.moves.filter((m) => !m.rewind); f.move = moves[Math.floor(rnd() * moves.length)]; f.mv = MOVE(f.move, F); }
      const want = (f.mv.range || 40) - 6;
      if (f.move.k === 'guard') { if (f.st <= 0) { f.state = 'guard'; f.guard = f.mv.dur; f.st = f.mv.dur; } return; }
      if (dist() > want && f.mv.range < 900) { f.x += f.dir * speed * dt; f.anim = 'walk'; f.state = 'approach'; }
      else if (f.st <= 0) {
        f.state = 'wind'; f.st = f.mv.wind * (f.phase > 1 ? .8 : 1); f.feint = rnd() < (F.feint || .25) * .6; f.tell = f.move.tell; f.anim = 'idle';
        if (f.move.k === 'heavy') TM.Audio.play('cast');
      } else { f.anim = 'idle'; f.state = 'idle'; }
      if (F.boss === 'silas' && rnd() < dt * .12 && f.state !== 'wind') { f.x = Math.max(30, Math.min(W - 30, h.x - h.dir * 40)); b.fx.push({ k: 'door', x: f.x, t: 0 }); TM.Audio.play('portal'); }
      return;
    }
    if (f.state === 'wind') {
      if (f.st <= 0) {
        if (f.feint) { f.state = 'idle'; f.st = .5 + rnd() * .4; f.move = null; f.x -= f.dir * 14; num(f.x, 'FEINT', '#9aa4b2'); return; }
        strike(); return;
      }
      f.anim = 'idle'; return;
    }
    if (f.state === 'guard') { f.anim = 'idle'; if (f.st <= 0) { f.state = 'idle'; f.st = .3; f.move = null; } return; }
    if (f.state === 'recover') { if (f.st <= 0) { f.state = 'idle'; f.st = .3 + rnd() * .8; f.move = null; } return; }
  }
  function strike() {
    const f = b.f, mv = f.mv, m = f.move; f.anim = 'attack'; f.at = .4; f.tell = '';
    const miss = f.blind > 0 ? .65 : 0;
    const land = (mult = 1) => { if (b.over) return; if (dist() < mv.range + (f.big ? 20 : 0) && rnd() >= miss) hitHero(Math.round(mv.dmg * mult) + ri(0, 3)); else num(b.h.x, 'MISS', '#9aa4b2'); };
    if (m.k === 'multi') { for (let i = 0; i < mv.hits; i++) setTimeout(() => { if (b && !b.over) { f.anim = 'attack'; f.at = .2; land(.6); } }, i * 190); }
    else if (m.k === 'heavy') { land(mv.mult || 1.7); TM.W.shake(); }
    else if (m.k === 'drain') { const before = run().hp; land(1); const got = before - run().hp; if (got > 0) { const hh = Math.round(got * .7); f.hp = Math.min(f.max, f.hp + hh); num(f.x, '+' + hh, '#6df0ff'); } }
    else if (m.k === 'blind') { if (b.h.iframe <= 0) { b.blindHero = 3; toast('STARLIGHT — you can barely see'); TM.Audio.play('void'); } }
    else land(1);
    f.state = 'recover'; f.st = mv.rec || .5; f.move = null; panel();
  }

  /* ---------------- update ---------------- */
  B.update = (dt) => {
    if (!b) return; b.t += dt; const h = b.h, f = b.f, W = TM.W.W;
    if (TM.UI.modalOpen()) return;
    if (!b.over) {
      const dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (h.hurt <= 0 && h.heal <= 0 && !(h.anim === 'dash' && h.at > 0)) h.vx = dir * 78;
      h.x = Math.max(16, Math.min(W - 16, h.x + h.vx * dt)); if (h.anim === 'dash' || h.hurt > 0) h.vx *= .9;
      h.dir = Math.sign(f.x - h.x) || 1;
      if (Math.abs(h.x - f.x) < 14) h.x = f.x - h.dir * 14;
      h.at -= dt; h.hurt -= dt; h.iframe -= dt; h.dodgeCd -= dt; h.atkCd -= dt; h.comboT -= dt; h.heal -= dt;
      if (h.at <= 0) h.anim = dir && h.hurt <= 0 ? 'walk' : 'idle';
      if (b.cool.thunder > 0) b.cool.thunder -= dt; if (b.reload > 0) b.reload -= dt; if (b.shield > 0) b.shield -= dt;
      if (b.mask > 0) { b.mask -= dt; if (b.mask <= 0) toast('The mask comes off. You\'re gasping.'); }
      b.blindHero = Math.max(0, b.blindHero - dt); b.cutin = Math.max(0, b.cutin - dt);
      foeThink(dt); f.at -= dt;
      f.x = Math.max(20, Math.min(W - 20, f.x));
      if (b.golem) { const g = b.golem; g.t += dt;
        if (g.kind === 'battle') { const tx = f.x - Math.sign(f.x - h.x) * 18; g.x += Math.sign(tx - g.x) * Math.min(Math.abs(tx - g.x), 160 * dt); if (Math.abs(tx - g.x) < 3 && !g.hit) { g.hit = true; for (let i = 0; i < 3; i++) setTimeout(() => { if (b && !b.over) { hitFoe(ri(5, 8), { kb: 4 }); TM.Audio.play('hit'); } }, i * 220); } if (g.t > 2.2 && b) b.golem = null; }
        else { g.x = h.x + Math.sign(f.x - h.x) * 18; if (b.shield <= 0) b.golem = null; } }
      if (b && b.crewAnim) { b.crewAnim.t += dt; if (b.crewAnim.t > 2.6) b.crewAnim = null; }
      if (!b) return;
      if (b.swap) b.swap.t += dt; if (b.msgT > 0) b.msgT -= dt;
      b.hudT = (b.hudT || 0) - dt; if (b.hudT <= 0) { b.hudT = .25; panel(); }
    }
    b.nums = b.nums.filter((n) => (n.t += dt) < 1); b.fx = b.fx.filter((x) => (x.t += dt) < .6);
  };

  function win() {
    if (b.over) return; b.over = true; const R = run(), d = b.def, blown = b.thing.blown, bl = b.thing.blend;
    R.wins[b.thing.fight] = true; R.rage = Math.min(60, b.rage); TM.Audio.play('win'); b.f.anim = 'hurt';
    TM.S.xp(d.boss ? 250 : 45, 'fight won'); if (b.foe.boss === 'silas') TM.S.feat('silas'); if (b.foe.boss === 'bernard') TM.S.feat('boss');
    toast(d.boss ? `${b.foe.name} falls.` : 'You win.');
    const close = () => { TM.W.state.battle = null; b = null; for (const k in held) held[k] = false; TM.UI.battle(false); TM.Audio.setMood(TM.W.sceneMusic()); };
    setTimeout(() => {
      if (d.end) { close(); TM.UI.talk(d.end, null, () => TM.Game.checkSteps()); }
      else { close(); if (d.drop) TM.UI.clue(d.drop); if (blown) TM.Game.coverRestored(); if (bl) TM.Game.blendRestored(); TM.Game.checkSteps(); TM.S.saveRun(); }
    }, 1100);
  }
  function lose() {
    if (b.over) return; b.over = true; TM.S.stat('ko'); TM.Audio.play('lose');
    setTimeout(() => TM.UI.notice('KNOCKED OUT', 'You went down. Try again with full health.\n\nTips: watch the wind-up above its head — red means a heavy hit, so DODGE through it or interrupt it. Some wind-ups are fakes. Tap ATTACK in rhythm to finish combos.', () => { const R = run(); R.hp = R.maxHp; const t = b.thing; b = null; B.start(t); }), 700);
  }

  /* ---------------- panel (thin: bars + one row of buttons) ---------------- */
  function panel() {
    if (!b) return; const R = run(), H = hero(), el = $('#battle'), aug = R.hero === 'augie', f = b.f;
    const nextRound = ['taser', 'flare', 'ash'].find((k) => b.rounds[k] > 0); const nextDroid = b.droids.golem1 >= b.droids.golem2 ? 'golem1' : 'golem2';
    const sig = [Math.ceil(R.hp), f.hp, b.head, !!b.swap, nextRound, b.rounds[nextRound], b.droids[nextDroid], !!b.golem, b.shells, b.reload > 0, b.crew, Math.floor(b.rage / 5), Math.ceil(b.mask), R.meds, f.guard > 0, f.stun > 0, f.bleed > 0, f.blind > 0, f.state === 'wind'].join('|');
    if (sig === b.sig && el.firstChild) return; b.sig = sig;
    const btn = (k, icon, label, o = {}) => `<button class="bb ${o.cls || ''}" data-k="${k}" ${o.off ? 'disabled' : ''}><i>${icon}</i><span>${label}</span>${o.n != null ? `<em>${o.n}</em>` : ''}</button>`;
    const kit = aug ? btn('k1', TM.HEADS[b.head].icon, b.swap ? '...' : 'SWAP', { n: TM.HEADS[b.head].name.split(' ')[0] }) + btn('k2', nextRound ? TM.ROUNDS[nextRound].icon : '◉', 'DRUM', { off: !nextRound, n: nextRound ? b.rounds[nextRound] : 0 }) + btn('k3', '🤖', nextDroid === 'golem1' ? 'GOLEM I' : 'GOLEM II', { off: !b.droids[nextDroid] || !!b.golem, n: b.droids[nextDroid] })
      : btn('k1', '💥', b.shells ? 'SHOTGUN' : 'RELOAD', { n: b.shells, off: b.reload > 0 }) + btn('k2', '🦐', 'CREW', { off: b.crew }) + btn('k3', '🎭', 'MASK', { cls: b.rage >= 100 ? 'hot' : b.mask > 0 ? 'on' : '', off: b.rage < 100 && !(b.mask > 0), n: b.mask > 0 ? Math.ceil(b.mask) + 's' : Math.floor(b.rage) + '%' });
    const status = [f.guard > 0 && 'GUARD', f.stun > 0 && 'STUNNED', f.bleed > 0 && 'BLEEDING', f.blind > 0 && 'BLIND', f.state === 'wind' && 'WINDING UP'].filter(Boolean).join(' · ');
    el.innerHTML = `<div class="bt-bars"><div class="bh"><b>${H.name}</b><div class="hpbar"><i style="width:${R.hp / R.maxHp * 100}%"></i></div><small>${Math.ceil(R.hp)}</small></div>
        <div class="bf"><b>${U.esc(b.foe.name)}</b><div class="hpbar foe"><i style="width:${Math.max(0, f.hp / f.max) * 100}%"></i></div><small>${status || U.esc(b.foe.kind)}</small></div></div>
      <div class="bt-row"><div class="mv"><button class="bb" data-h="left">◀</button><button class="bb" data-h="right">▶</button></div>
        ${btn('attack', aug ? TM.HEADS[b.head].icon : '👊', 'ATTACK', { cls: 'big' })}${btn('dodge', '💨', 'DODGE')}${kit}${btn('heal', '✚', 'HEAL', { n: R.meds, off: !R.meds })}</div>`;
    el.querySelectorAll('[data-k]').forEach((x) => x.onpointerdown = (e) => { e.preventDefault(); TM.Audio.init(); act(x.dataset.k); });
    el.querySelectorAll('[data-h]').forEach((x) => { const k = x.dataset.h; x.onpointerdown = (e) => { e.preventDefault(); held[k] = true; }; x.onpointerup = x.onpointerleave = x.onpointercancel = () => { held[k] = false; }; });
  }

  /* ---------------- render ---------------- */
  function drawHead(ctx, kind, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const R = (a, b2, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(a, b2, w, h); };
    if (kind === 'knocker') { R(-1, -5, 7, 10, '#100c14'); R(0, -4, 5, 8, '#6f7887'); R(0, -4, 5, 1, '#9aa4b2'); R(-2, -1, 2, 2, '#4a4e58'); }
    else if (kind === 'stun') { R(0, -4, 6, 8, '#100c14'); R(1, -3, 4, 6, '#3a3e47'); R(5, -3, 1, 1, '#e0752d'); R(5, 2, 1, 1, '#e0752d'); R(6, -1, 1, 2, '#e0752d'); if ((t * 8 | 0) % 2) R(7, -2, 2, 1, '#6df0ff'); }
    else if (kind === 'mower') { R(0, -1, 11, 3, '#100c14'); R(0, 0, 10, 1, '#c8d0d8'); R(10, 0, 2, 1, '#e8eef4'); R(-1, -2, 2, 5, '#4a4e58'); }
    else if (kind === 'thunder') { ctx.fillStyle = '#100c14'; ctx.beginPath(); ctx.moveTo(-1, -2); ctx.lineTo(8, -6); ctx.lineTo(8, 6); ctx.lineTo(-1, 2); ctx.fill(); ctx.fillStyle = '#9aa4b2'; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(7, -5); ctx.lineTo(7, 5); ctx.lineTo(0, 1); ctx.fill(); R(0, -1, 2, 2, '#e0752d'); }
    ctx.restore();
  }
  function golemBox(ctx, x, g, t, mode) {
    const y = g - 13 + Math.sin(t * 8) * .6;
    if (mode === 'battle') { ctx.fillStyle = '#3a3e47'; ctx.fillRect(x - 5, g - 7, 2, 7); ctx.fillRect(x + 3, g - 7, 2, 7); ctx.fillRect(x + 8, y + 4 + Math.sin(t * 20) * 2, 6, 2); }
    ctx.fillStyle = '#100c14'; ctx.fillRect(x - 8, y - 1, 17, 13); ctx.fillStyle = '#8a8a80'; ctx.fillRect(x - 7, y, 15, 11); ctx.fillStyle = '#a2a298'; ctx.fillRect(x - 7, y, 15, 1);
    ctx.fillStyle = '#7a8a6a'; ctx.fillRect(x - 7, y, 4, 3); ctx.fillRect(x + 4, y, 4, 3);
    ctx.fillStyle = '#1a2422'; ctx.fillRect(x - 5, y + 4, 11, 2); ctx.fillStyle = mode === 'battle' ? '#ff3040' : '#5becf1'; ctx.fillRect(x - 3, y + 4, 2, 1); ctx.fillRect(x + 2, y + 4, 2, 1);
    if (mode === 'fortress') { ctx.fillStyle = 'rgba(160,170,180,.9)'; ctx.fillRect(x - 2, g - 38, 4, 38); ctx.fillStyle = 'rgba(109,240,255,.55)'; ctx.fillRect(x - 2, g - 38, 1, 38); }
  }
  B.render = (ctx, W, H, g, drawSpr, t) => {
    if (!b) return; const R = run(), h = b.h, f = b.f; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H);
    if (b.crewAnim) { const c = b.crewAnim, k = c.t;
      if (c.portal) { ctx.save(); ctx.globalAlpha = Math.min(1, k * 3) * (k < 2.2 ? 1 : (2.6 - k) / .4); ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(16, g - 34, 12 + Math.sin(t * 9) * 2, 34, 0, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,79,216,.15)'; ctx.fill(); ctx.restore(); }
      ['crew1', 'crew2', 'crew3', 'marquis'].forEach((id, i) => { const st = .2 + i * .18, p = Math.max(0, Math.min(1, (k - st) / .55)), back = Math.max(0, (k - 1.9 - i * .05) / .5); if (k < st) return;
        const x = 16 + (f.x - 24 - i * 6 - 16) * p - back * f.x; drawSpr(id, p >= 1 && back <= 0 ? (i % 2 ? 'attack2' : 'attack') : 'walk', t + i, x, g + (i % 2) * 3, back > 0 ? -1 : 1, { scale: .95 }); });
    }
    if (R.hero === 'augie') {
      if (b.golem) golemBox(ctx, b.golem.x, g, t * 2, b.golem.kind);
      if (!b.golem || b.golem.kind !== 'battle') golemBox(ctx, h.x - h.dir * 28, g, t, null);
      if (!b.golem || b.golem.kind !== 'fortress') golemBox(ctx, h.x - h.dir * 46, g, t + 1, null);
    }
    const fr2 = drawSpr(b.foe.spr, f.anim, t, f.x, g, f.dir, { scale: f.big ? .9 : 1.1, flash: f.anim === 'hurt' && f.at > .12, shadow: b.foe.shadow });
    const top = fr2 ? fr2.top : g - 80;
    if (f.state === 'wind' && f.mv) { const heavy = f.move.k === 'heavy'; const k = 1 - Math.max(0, f.st) / f.mv.wind;
      ctx.fillStyle = heavy ? `rgba(255,59,59,${.25 + .25 * Math.sin(t * 18)})` : 'rgba(255,214,107,.18)'; ctx.beginPath(); ctx.arc(f.x, g - 36, heavy ? 30 : 20, 0, 7); ctx.fill();
      ctx.font = 'bold 9px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(f.tell, f.x + 1, top - 7); ctx.fillStyle = heavy ? '#ff6b6b' : '#ffd23a'; ctx.fillText(f.tell, f.x, top - 8);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(f.x - 14, top - 4, 28, 3); ctx.fillStyle = heavy ? '#ff3b3b' : '#ffd23a'; ctx.fillRect(f.x - 14, top - 4, 28 * k, 3); }
    if (f.guard > 0) { ctx.strokeStyle = `rgba(200,210,220,${.5 + .3 * Math.sin(t * 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x + f.dir * 10, g - 36, 20, -1.2, 1.2); ctx.stroke(); ctx.lineWidth = 1; }
    if (f.stun > 0) for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; ctx.fillStyle = '#ffd23a'; ctx.fillRect(f.x + Math.cos(a) * 12, top - 6 + Math.sin(a) * 3, 2, 2); }
    if (f.blind > 0) { ctx.fillStyle = 'rgba(255,240,180,.22)'; ctx.fillRect(f.x - 18, top, 36, g - top); }
    const blink = h.iframe > 0 && (t * 30 | 0) % 2;
    const fr = drawSpr(TM.HEROES[R.hero].spr, h.anim, t, h.x, g, h.dir, { scale: 1.08, flash: h.hurt > .2, alpha: blink ? .45 : 1 });
    if (R.hero === 'augie' && fr && fr.an && fr.an.tip) {
      const px = fr.x + fr.an.tip[0] * fr.s, py = fr.y + fr.an.tip[1] * fr.s;
      ctx.save(); if (h.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.translate(-px, 0); }
      if (b.swap) { const k = b.swap.t;
        if (k < .3) drawHead(ctx, b.swap.from, px, py + k * 40, fr.s, t);
        else if (k < .65) { ctx.save(); ctx.translate(px, py); ctx.rotate((1 - (k - .3) / .35) * 1.57); drawHead(ctx, b.swap.to, 0, 0, fr.s, t); ctx.restore(); }
        else { drawHead(ctx, b.swap.to, px, py, fr.s, t); if (k < .85) { ctx.fillStyle = '#ffd23a'; ctx.fillRect(px - 2, py - 6, 1, 3); ctx.fillRect(px + 3, py - 7, 1, 3); } }
      } else drawHead(ctx, b.head, px, py, fr.s, t);
      ctx.restore();
      if (b.swap) { ctx.font = 'bold 8px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23a'; const k = b.swap.t; ctx.fillText(k < .3 ? 'PUSH' : k < .65 ? 'QUARTER-TURN' : 'CLICK', h.x, fr.top - 6); }
    }
    if (R.hero === 'jester' && b.mask > 0 && fr && fr.an && fr.an.face) {
      const m = img('assets/ui/jmask_s.png'); if (m.complete) { const [cx, cy, w] = fr.an.face; const s = (w + 6) * fr.s / m.width; const ax = fr.x + cx * fr.s; ctx.save(); if (h.dir < 0) { ctx.translate(ax, 0); ctx.scale(-1, 1); ctx.translate(-ax, 0); } ctx.drawImage(m, ax - m.width * s / 2 + 1, fr.y + cy * fr.s - m.height * s / 2 - 1, m.width * s, m.height * s); ctx.restore(); }
      ctx.fillStyle = `rgba(255,79,216,${.12 + .08 * Math.sin(t * 20)})`; ctx.fillRect(h.x - 16, fr.top - 2, 32, g - fr.top);
    }
    for (const x of b.fx) {
      if (x.k === 'blast') { ctx.fillStyle = `rgba(255,210,90,${1 - x.t / .6})`; for (let i = 0; i < 6; i++) ctx.fillRect(x.x + x.dir * (x.t * 160 + i * 6), g - 36 + (i - 3) * 3 * (1 + x.t * 4), 4, 2); }
      if (x.k === 'wave') { ctx.strokeStyle = `rgba(200,220,255,${1 - x.t / .6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x.x, g - 34, 6 + x.t * 120, x.dir > 0 ? -0.8 : Math.PI - .8, x.dir > 0 ? .8 : Math.PI + .8); ctx.stroke(); ctx.lineWidth = 1; }
      if (x.k === 'shot') { ctx.fillStyle = x.col; ctx.fillRect(x.x + x.dir * x.t * 400, g - 34, 6, 2); }
      if (x.k === 'door') { ctx.strokeStyle = `rgba(255,79,216,${1 - x.t / .6})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x.x, g - 34, 12, 34, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
    }
    ctx.font = 'bold 10px "Courier New", monospace'; ctx.textAlign = 'center';
    for (const n of b.nums) { ctx.globalAlpha = Math.max(0, 1 - n.t); ctx.fillStyle = '#000'; ctx.fillText(n.text, n.x + 1, g - 92 - n.t * 24 + 1); ctx.fillStyle = n.col; ctx.fillText(n.text, n.x, g - 92 - n.t * 24); } ctx.globalAlpha = 1;
    if (b.msgT > 0) { ctx.font = 'bold 10px "Courier New", monospace'; ctx.fillStyle = '#000'; ctx.fillText(b.msg, W / 2 + 1, 31); ctx.fillStyle = '#ffd23a'; ctx.fillText(b.msg, W / 2, 30); }
    if (b.blindHero > 0) { ctx.fillStyle = `rgba(230,240,255,${Math.min(.75, b.blindHero * .3)})`; ctx.fillRect(0, 0, W, H); }
    if (b.cutin > 0) { const m = img('assets/ui/jmask.png'); const k = b.cutin; const a = Math.min(1, (1.1 - k) * 5, k * 4);
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,8,30,.75)'; ctx.fillRect(0, H * .16, W, H * .5);
      if (m.complete) { const s = Math.min(H * .42 / m.height, 1.4); ctx.drawImage(m, W / 2 - m.width * s / 2 + (k - .55) * 30, H * .18, m.width * s, m.height * s); }
      ctx.font = 'bold 15px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd23a'; ctx.fillText('MASK ON', W / 2, H * .64); ctx.restore(); }
  };
  B.active = () => !!b;
  return B;
})();
