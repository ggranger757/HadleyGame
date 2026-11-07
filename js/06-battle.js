/* =========================================================================
   TECHNOMANCERS — 06-battle.js
   Turn-based fights, Step Quest style: ATTACK · GADGET · HEAL.
   The enemy always shows its NEXT MOVE. Use the gadget it's weak to and
   you cancel that move and deal big damage. That's the whole trick.
   Bernard: 1) hit it  2) seal the tears  3) break Dolores' shield, hit the core.
   ========================================================================= */
'use strict';
TM.Battle = (() => {
  const U = TM.U, $ = (s) => document.querySelector(s);
  let b = null;
  const B = {};
  const rand = (n) => Math.floor(Math.random() * n);
  const hero = () => TM.HEROES[TM.S.run.hero];

  B.start = (thing) => {
    const def = TM.FIGHTS[thing.fight], foe = TM.FOES[def.foe];
    b = { thing, def, foe, id: def.foe, hp: foe.hp, max: foe.hp, phase: 1, tears: 0, shield: false, core: false, coreHp: 50, busy: false, log: '', ha: 0, fa: 0, hhit: 0, fhit: 0, nums: [] };
    TM.W.state.battle = b; TM.Audio.setMood(def.boss ? 'boss' : 'tension'); TM.Audio.play('sting');
    pickIntent(); TM.UI.battle(true);
    b.log = def.boss ? 'BERNARD unfolds out of the dark.' : `A ${foe.name} blocks your way!`;
    draw();
    const seen = TM.S.profile.tips = TM.S.profile.tips || {};
    if (def.tip && !seen[thing.fight]) { seen[thing.fight] = 1; TM.S.save(); TM.UI.notice('FIGHT TIP', def.tip); }
    if (def.boss) TM.UI.notice('BOSS: BERNARD', 'Phase 1: just hit it.\nPhase 2: tears will open — close them (attacks close one, Static Salt or EMP closes all).\nPhase 3: Dolores shields it — break the shield with the HUSH HORN or EMP, then hit the core.');
  };
  function targetKind() { if (b.phase === 2) return 'tear'; if (b.phase === 3) return b.core ? 'core' : 'shield'; return b.id; }
  function pickIntent() {
    if (b.phase === 2) { b.intent = { name: 'OPEN TEARS', tell: `${b.tears} red tears are open. Each one will hurt you.`, tears: true }; return; }
    if (b.phase === 3) { if (!b.shield && !b.core) b.intent = { name: 'SHIELD', tell: 'Dolores is casting a shield over Bernard!', shield: true }; else b.intent = { name: 'WRONG LUNGE', tell: 'is lunging at you.', dmg: 13 }; return; }
    b.intent = U.pick(Math.random, b.foe.moves);
  }
  const effective = (gid) => { const G = TM.GADGETS[gid]; const k = targetKind(); return G.beats.includes(k) || b.foe.weak === gid && b.phase === 1; };

  function act(kind, gid) {
    if (!b || b.busy) return; b.busy = true; const run = TM.S.run, H = hero(); let cancel = false, msg = '', dmg = 0;
    if (kind === 'heal') { if (run.meds <= 0) { b.busy = false; return; } run.meds--; const h = Math.min(run.maxHp - run.hp, 45); run.hp += h; TM.Audio.play('heal'); msg = `You patch yourself up. +${h} HP.`; num(.3, '+' + h, '#7cf0b0'); }
    else if (kind === 'attack') {
      b.ha = .5; TM.Audio.play(run.hero === 'augie' ? 'staff' : 'hit');
      dmg = H.atk + rand(5);
      if (b.phase === 2) { b.tears = Math.max(0, b.tears - 1); msg = 'You slam a tear shut!'; dmg = 0; }
      else if (b.phase === 3 && b.shield) { if (Math.random() < .35) { b.shield = false; b.core = true; msg = 'You hit Dolores! Her spell breaks — the CORE is exposed!'; } else msg = 'Bernard is shielded. Your hit bounces off. (Try the HUSH HORN or EMP.)'; dmg = 0; }
      else if (b.phase === 3 && b.core) { if (run.hero === 'jester') dmg += 12; b.coreHp -= dmg; msg = `You hit the core for ${dmg}!`; }
      else if (b.intent.dodge && Math.random() < .65) { msg = 'MISSED! It dodged.'; dmg = 0; num(.7, 'MISS', '#9aa4b2'); }
      else { b.hp -= dmg; msg = `You hit for ${dmg}.`; }
      if (dmg) { b.fhit = .25; num(.7, '-' + dmg, '#fff'); }
    } else if (kind === 'gadget') {
      const G = TM.GADGETS[gid]; if ((run.gadgets[gid] || 0) <= 0) { b.busy = false; return; } run.gadgets[gid]--; b.ha = .5;
      if (gid === 'ash') {
        if (b.phase === 3 && b.core) { b.coreHp = 0; msg = 'THE ASH ROUND hits the core dead center!'; TM.Audio.play('nova'); TM.W.shake(); num(.7, 'ASH!', '#ff2a8d'); }
        else { msg = 'Wasted! The ASH ROUND only works on an exposed core.'; }
      } else if (gid === 'frag') { TM.Audio.play('flame'); TM.W.shake(); if (b.phase === 2) { b.tears = Math.max(0, b.tears - 2); msg = 'The blast seals two tears!'; } else if (b.phase === 3 && b.shield) msg = 'The blast bounces off the shield.'; else { dmg = G.dmg; if (b.phase === 3) b.coreHp -= dmg; else b.hp -= dmg; msg = `BOOM! ${dmg} damage.`; b.fhit = .3; num(.7, '-' + dmg, '#ffd070'); } }
      else if (effective(gid)) {
        TM.Audio.play(gid === 'emp' ? 'zap' : 'nova'); TM.W.shake(); cancel = true; TM.S.feat('super1');
        if (b.phase === 2) { b.tears = 0; msg = `SUPER EFFECTIVE! ${G.name} seals every tear!`; }
        else if (b.phase === 3) { b.shield = false; b.core = true; msg = `SUPER EFFECTIVE! The shield shatters. Bernard's CORE is exposed — hit it!`; }
        else { dmg = Math.round(H.atk * 2.3) + rand(5); b.hp -= dmg; msg = `SUPER EFFECTIVE! ${G.name} cancels ${b.intent.name} and hits for ${dmg}!`; const wk = TM.S.profile.weak; wk[b.id] = 1; TM.S.save(); if (['holo', 'chrono', 'nano', 'void'].every((k) => wk[k])) TM.S.feat('allweak'); }
        b.fhit = .35; num(.7, 'SUPER!', '#ff2a8d');
      } else { TM.Audio.play('cast'); dmg = Math.round(H.atk * .5); if (b.phase === 1) { b.hp -= dmg; msg = `${G.name}: not very effective. ${dmg} damage.`; } else msg = `${G.name} doesn't do anything here.`; }
    }
    b.log = msg; draw(); TM.S.saveRun();
    setTimeout(() => {
      if (checkPhase()) return;
      if (cancel) { b.log += ' It loses its turn!'; pickIntent(); b.busy = false; draw(); return; }
      enemyTurn();
    }, 750);
  }
  function enemyTurn() {
    const run = TM.S.run, it = b.intent; let msg = '';
    const hit = (d) => { d = Math.max(0, d); run.hp = Math.max(0, run.hp - d); b.hhit = .3; num(.3, '-' + d, '#ff6b6b'); TM.W.shake(); TM.Audio.play('monster'); };
    b.fa = .5;
    if (it.tears) { const d = 5 * b.tears; if (d) { hit(d); msg = `The tears burn you for ${d}.`; } else msg = 'The tears are closed.'; }
    else if (it.shield) { b.shield = true; msg = 'Dolores raises a shield over Bernard!'; TM.Audio.play('cast'); }
    else if (it.idle) msg = 'Bernard just... looks around. Confused.';
    else { const d = (it.dmg || b.foe.atk) + rand(4); hit(d); msg = `${b.foe.name} uses ${it.name}! You take ${d}.`; if (it.twice) { const d2 = b.foe.atk + rand(3); hit(d2); msg += ` Then again for ${d2}!`; } }
    b.log = msg; draw();
    setTimeout(() => {
      if (run.hp <= 0) return lose();
      if (b.phase === 3 && b.core && !it.shield && Math.random() < .5) { b.core = false; b.log += ' The core closes up again.'; }
      pickIntent(); b.busy = false; draw();
    }, 650);
  }
  function checkPhase() {
    if (b.phase === 1 && b.hp <= 0) { if (b.def.boss) { b.phase = 2; b.tears = 3; b.hp = 0; TM.Audio.play('portal'); TM.W.shake(); TM.UI.banner('PHASE 2 · THE TEARS', 'red'); b.log = 'The air RIPS open. Three red tears. Something huge looks through them.'; pickIntent(); b.busy = false; draw(); return true; } win(); return true; }
    if (b.phase === 2 && b.tears <= 0) { b.phase = 3; b.shield = false; b.core = false; TM.UI.banner('PHASE 3 · DOLORES', 'mag'); b.log = 'Dolores steps out of the dark: "You don\'t get to finish her. *I* finish her."'; pickIntent(); b.busy = false; draw(); return true; }
    if (b.phase === 3 && b.coreHp <= 0) { win(); return true; }
    return false;
  }
  function win() {
    const run = TM.S.run, d = b.def, blown = b.thing.blown; run.wins[b.thing.fight] = true; TM.Audio.play('win'); TM.W.burst(b.thing.x, TM.W.state.ground - 30, '#ff2a8d', 24);
    TM.S.xp(d.boss ? 250 : 40, 'fight won'); if (d.boss) TM.S.feat('boss');
    const end = () => { TM.W.state.battle = null; b = null; TM.UI.battle(false); TM.Audio.setMood(TM.W.chapter().music); if (d.drop) TM.UI.clue(d.drop); if (blown) TM.Game.coverRestored(); TM.Game.checkSteps(); TM.S.saveRun(); };
    b.log = d.boss ? 'Bernard falls.' : 'You win!'; draw();
    setTimeout(() => { if (d.end) { TM.W.state.battle = null; TM.UI.battle(false); TM.UI.talk(d.end, null, () => { b = null; TM.Audio.setMood('horror'); TM.Game.checkSteps(); }); } else end(); }, 900);
  }
  function lose() {
    TM.S.stat('ko'); TM.Audio.play('lose');
    TM.UI.notice('KNOCKED OUT', 'You got knocked out. No big deal — try the fight again with full health.\n\nTip: watch the NEXT MOVE box and use the gadget the enemy is WEAK to.', () => { const run = TM.S.run; run.hp = run.maxHp; const t = b.thing; b = null; B.start(t); });
  }
  function num(x, text, col) { b.nums.push({ x, text, col, t: 0 }); }

  /* ---------------- UI ---------------- */
  function draw() {
    if (!b) return; const run = TM.S.run, H = hero(); const el = $('#battle');
    const gList = Object.keys(run.gadgets).filter((g) => TM.GADGETS[g]);
    const weak = b.phase === 1 ? (b.foe.weak ? TM.GADGETS[b.foe.weak].name + (run.hero === 'jester' ? ' (or your EMP)' : '') : (b.def.boss ? '—' : 'nothing special — just hit it')) : b.phase === 2 ? 'STATIC SALT / EMP (or attack to close one tear)' : b.core ? (run.gadgets.ash ? 'ASH ROUND — or attack!' : 'ATTACK the core!') : 'HUSH HORN / EMP breaks the shield';
    const foeHp = b.phase === 1 ? b.hp / b.max : b.phase === 2 ? b.tears / 3 : b.coreHp / 50;
    el.innerHTML = `
      <div class="bt-top"><div class="bt-foe"><b>${b.foe.name}</b><small>${b.phase > 1 ? (b.phase === 2 ? 'TEARS OPEN: ' + b.tears : 'CORE') : b.foe.kind}</small><div class="hpbar foe"><i style="width:${Math.max(0, foeHp) * 100}%"></i></div></div>
        <div class="bt-hero"><b>${H.name}</b><small>${Math.ceil(run.hp)} / ${run.maxHp} HP</small><div class="hpbar"><i style="width:${run.hp / run.maxHp * 100}%"></i></div></div></div>
      <div class="bt-intent"><span>NEXT MOVE</span><b>${b.intent.name}</b> ${b.phase === 3 && b.intent.shield ? '' : (b.phase === 1 ? b.foe.name.toLowerCase().replace(/^./, (c) => c.toUpperCase()) + ' ' : '')}${U.esc(b.intent.tell)}</div>
      <div class="bt-weak">WEAK TO: <b>${weak}</b></div>
      <div class="bt-log">${U.fmt(b.log)}</div>
      <div class="bt-menu" id="btmenu">
        <button class="bbtn atk" data-a="attack">⚔ ATTACK</button>
        <button class="bbtn gad" data-a="gadgets">🧰 GADGETS</button>
        <button class="bbtn heal" data-a="heal" ${run.meds ? '' : 'disabled'}>✚ HEAL <em>×${run.meds}</em></button>
      </div>
      <div class="bt-gadgets" id="btgad" hidden>${gList.map((g) => { const G = TM.GADGETS[g], n = run.gadgets[g] || 0, eff = effective(g) || (g === 'ash' && b.core); return `<button class="gbtn ${eff ? 'eff' : ''}" data-g="${g}" ${n ? '' : 'disabled'}><span class="gi">${G.icon}</span><span class="gn"><b>${G.name} ×${n}</b><small>${G.text}</small></span>${eff ? '<em>STRONG!</em>' : ''}</button>`; }).join('')}<button class="gbtn back" data-back>◀ BACK</button></div>`;
    el.classList.toggle('busy', b.busy);
    el.querySelectorAll('[data-a]').forEach((x) => x.onclick = () => { TM.Audio.play('ui'); const a = x.dataset.a; if (a === 'gadgets') { $('#btmenu').hidden = true; $('#btgad').hidden = false; } else act(a); });
    el.querySelectorAll('[data-g]').forEach((x) => x.onclick = () => act('gadget', x.dataset.g));
    const bk = el.querySelector('[data-back]'); if (bk) bk.onclick = () => { $('#btmenu').hidden = false; $('#btgad').hidden = true; };
  }
  B.update = (dt) => { if (!b) return; b.ha = Math.max(0, b.ha - dt); b.fa = Math.max(0, b.fa - dt); b.hhit = Math.max(0, b.hhit - dt); b.fhit = Math.max(0, b.fhit - dt); b.nums = b.nums.filter((n) => (n.t += dt) < 1); };
  B.render = (ctx, W, H, g, drawSpr, t) => {
    if (!b) return; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
    const hx = W * .3 + (b.ha > 0 ? Math.sin((.5 - b.ha) / .5 * Math.PI) * 40 : 0), fx = W * .7 - (b.fa > 0 ? Math.sin((.5 - b.fa) / .5 * Math.PI) * 30 : 0);
    const run = TM.S.run;
    if (b.phase === 3) drawSpr('dolores', 'idle', t, W * .9, g, -1);
    // tears (red is reserved for tears/damage)
    for (let i = 0; i < b.tears; i++) { const x = W * (.55 + i * .13), y = g - 70 - (i % 2) * 30; ctx.save(); ctx.translate(x, y); ctx.rotate(.4 + i); ctx.fillStyle = `rgba(255,59,59,${.5 + .3 * Math.sin(t * 8 + i)})`; ctx.fillRect(-16, -3, 32, 6); ctx.fillStyle = '#000'; ctx.fillRect(-12, -1, 24, 2); ctx.restore(); }
    if (b.phase === 2) { ctx.globalAlpha = .25 + .15 * Math.sin(t * 2); const cols = ['#6df0ff', '#ff7bd5', '#fff36b']; for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(W * .5 + Math.sin(t + i) * 20, 20 + i * 8, W * .4 - i * 10, 3); } ctx.globalAlpha = 1; }
    drawSpr(TM.HEROES[run.hero].spr, b.ha > 0 ? 'attack' : 'idle', t, hx, g, 1, { scale: 1.25, flash: b.hhit > .15 });
    drawSpr(b.foe.spr, b.fa > 0 && TM.SPR[b.foe.spr].anims.attack ? 'attack' : 'idle', t, fx, g, -1, { scale: b.def.boss ? 1.1 : 1.25, flash: b.fhit > .15 });
    if (b.shield) { ctx.strokeStyle = `rgba(214,51,138,${.6 + .3 * Math.sin(t * 6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(fx, g - 50, 34, 60, 0, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
    if (b.core) { ctx.fillStyle = `rgba(109,240,255,${.6 + .4 * Math.sin(t * 9)})`; ctx.beginPath(); ctx.arc(fx, g - 60, 5, 0, 7); ctx.fill(); }
    ctx.font = '12px Silkscreen, monospace'; ctx.textAlign = 'center';
    for (const n of b.nums) { ctx.globalAlpha = 1 - n.t; ctx.fillStyle = '#000'; ctx.fillText(n.text, W * n.x + 1, g - 90 - n.t * 30 + 1); ctx.fillStyle = n.col; ctx.fillText(n.text, W * n.x, g - 90 - n.t * 30); } ctx.globalAlpha = 1;
  };
  B.key = (e) => { if (!b || b.busy) return false; const m = { Digit1: 'attack', Digit2: 'gadgets', Digit3: 'heal', KeyA: 'attack', KeyG: 'gadgets', KeyH: 'heal' }[e.code]; if (!m) return false; const btn = document.querySelector(`#battle [data-a="${m}"]`); if (btn && !btn.disabled && !btn.closest('[hidden]')) btn.click(); return true; };
  B.active = () => !!b;
  return B;
})();
