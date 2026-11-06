/* =========================================================================
   TECHNOMANCERS — 09-ui.js
   DOM layer: HUD, dialogue (typewriter, portraits, choices, present-evidence,
   Street Sense tells), modals, menus, toasts, crafting, settings & key remap,
   codex, achievements, Daily Jam, grade screen, ending.
   ========================================================================= */
'use strict';

TM.UI = (() => {
  const U = TM.U, $ = (s, r = document) => r.querySelector(s);
  const UI = {};
  let modalOpen = false, screenOpen = false, dlg = null, hudT = 0, deferredInstall = null;

  UI.blocking = () => modalOpen || screenOpen || !!dlg;

  /* ------------------------------------------------------------ MODALS */
  UI.modal = (name, html) => {
    const m = $('#modal'); m.className = 'modal on m-' + name; m.innerHTML = `<div class="panel">${html}</div>`; modalOpen = true;
    m.querySelector('.panel').scrollTop = 0; return m;
  };
  UI.close = () => { const m = $('#modal'); m.className = 'modal'; m.innerHTML = ''; modalOpen = false; TM.In.clearHits(); };
  UI.screen = (html, cls = '') => { const s = $('#screen'); s.className = 'screen on ' + cls; s.innerHTML = html; screenOpen = true; s.scrollTop = 0; return s; };
  UI.closeScreen = () => { const s = $('#screen'); s.className = 'screen'; s.innerHTML = ''; screenOpen = false; TM.In.clearHits(); };

  /* ------------------------------------------------------------ TOASTS */
  UI.toast = (text, kind = 'sys', img) => {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = (img ? `<img class="pix" src="${img}">` : '') + `<span>${U.fmt(text)}</span>`;
    $('#toasts').appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100);
    while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove();
  };
  UI.xpPop = (n, why) => { const t = document.createElement('div'); t.className = 'xppop'; t.textContent = '+' + n + ' XP' + (why ? ' · ' + why : ''); $('#xpfeed').appendChild(t); setTimeout(() => t.remove(), 1800); while ($('#xpfeed').children.length > 5) $('#xpfeed').firstChild.remove(); };
  UI.achToast = (a) => UI.toast('FEAT UNLOCKED · *' + a.name + '* — ' + a.desc, 'achv');
  UI.rankUp = (r) => { TM.Audio.play('rank'); UI.banner('RANK UP · ' + r.name, 'mag', r.text ? 'PERK: ' + r.text : ''); };
  UI.banner = (text, kind = 'mag', sub = '') => { const b = $('#banner'); b.className = 'banner on ' + kind; b.innerHTML = `<div>${U.esc(text)}</div>${sub ? `<small>${U.esc(sub)}</small>` : ''}`; clearTimeout(b._t); b._t = setTimeout(() => b.className = 'banner', 2400); };
  UI.anchorLED = (c) => { const l = $('#led'); if (!l) return; l.className = 'led ' + c; clearTimeout(l._t); l._t = setTimeout(() => l.className = 'led', 2500); };
  UI.bossBar = (on, b) => {
    const el = $('#bossbar'); if (!on) { el.className = 'bossbar'; return; } el.className = 'bossbar on';
    if (!b) return; const ph = b.phase; let k = ph === 1 ? b.hp / b.maxHp : ph === 2 ? TM.G.W.tears.length / 3 : b.coreHp / 110;
    el.innerHTML = `<b>BERNARD</b><span>${['', 'I · THE WRONG BODY', 'II · THE ENTITY TEAR', 'III · THE SACRIFICE'][ph]}</span><div class="bar"><i style="width:${Math.max(0, k) * 100}%"></i></div><small>${ph === 1 ? (b.confused > 0 ? 'CONFUSED — HIT IT NOW' : 'Stand still, light off → it loses you. Flares blind it.') : ph === 2 ? 'Seal tears: Static Salt / EMP / Tattle — or hit them' : b.core > 0 ? 'CORE EXPOSED — ' + (TM.S.run.kit.ash ? 'FIRE THE ASH ROUND' : 'HIT IT') : b.shield > 0 ? 'WARDED — wait' : 'Break Dolores\' ward cast: Hush Horn / Tattle / EMP / hit her'}</small>`;
  };

  /* --------------------------------------------------------------- HUD */
  UI.hud = (dt) => {
    hudT -= dt; if (hudT > 0) return; hudT = .1;
    const W = TM.G.W, run = TM.S.run; if (!W || !run) return;
    const C = TM.CHARS[run.char], prof = TM.S.profile, ri = TM.S.rankIndex(), rk = TM.RANKS[ri], nx = TM.RANKS[ri + 1];
    const w = TM.Player.weapon(), wid = TM.Player.weaponId(), kitId = TM.Player.kitSel();
    $('#hp i').style.width = (run.hp / run.maxHp * 100) + '%'; $('#hp b').textContent = Math.ceil(run.hp);
    $('#nerve i').style.width = run.nerve + '%'; $('#nerve').classList.toggle('low', run.nerve < 35);
    $('#susp i').style.width = W.susp + '%'; $('#susp').classList.toggle('hot', W.susp > 70); $('#susp b').textContent = W.lockdown > 0 ? (W.L.stealth ? 'SPOTTED' : 'LOCKDOWN') : W.player.hidden ? 'HIDDEN' : W.player.seen ? 'SEEN' : 'SUSPICION';
    $('#chain').textContent = W.chain > 1 ? 'CHAIN ×' + (1 + (W.chain - 1) * .25).toFixed(2).replace(/\.?0+$/, '') : '';
    $('#chain').style.opacity = W.chain > 1 ? Math.min(1, W.chainT / 3) : 0;
    $('#rank').innerHTML = `<b>${rk.name}</b><div class="bar"><i style="width:${nx ? ((prof.xp - rk.xp) / (nx.xp - rk.xp) * 100) : 100}%"></i></div><small>${prof.xp} XP</small>`;
    const ammo = w.ammo ? ` <em>${run.ammo[w.ammo] || 0}</em>` : '';
    const kc = run.kit[kitId] || 0; const K = TM.KIT[kitId];
    $('#weap').innerHTML = `<img class="pix" src="${TM.R.kitIcon(w.icon)}"><div><small>${run.char === 'augie' ? 'HEAD' : 'WEAPON'} [${TM.In.keyName(prof.keys.swap)}]</small><b>${w.name}${ammo}</b></div>`;
    $('#kit').innerHTML = `<img class="pix ${kc ? '' : 'empty'}" src="${TM.R.kitIcon(K.icon)}"><div><small>KIT [${TM.In.keyName(prof.keys.kit)}] · ${TM.In.keyName(prof.keys.cycle)} cycle</small><b>${K.name} <em>×${kc}</em></b></div>`;
    $('#scrap').textContent = (run.char === 'augie' ? 'SCRAP ' : 'CASH ') + run.scrap;
    $('#tbtn-kit').innerHTML = `<img class="pix" src="${TM.R.kitIcon(K.icon)}"><em>${kc}</em>`;
    $('#tbtn-atk').innerHTML = `<img class="pix" src="${TM.R.kitIcon(w.icon)}">` + (w.ammo ? `<em>${run.ammo[w.ammo] || 0}</em>` : '');
    // objectives
    let objs = W.L.objectives.filter(o => !o.hideUntil || TM.S.has(o.hideUntil) || TM.S.flag(o.hideUntil));
    if (document.body.classList.contains('portrait')) { const nx = objs.find(o => !TM.G.objectiveDone(o) && !o.bonus); objs = nx ? [nx] : []; }
    $('#obj').innerHTML = `<b>${W.L.name}</b><small>${W.L.mood}</small>` + objs.map(o => { const d = TM.G.objectiveDone(o); return `<div class="${d ? 'done' : ''} ${o.bonus ? 'bonus' : ''}">${d ? '■' : '□'} ${U.esc(o.text)} ${o.count ? `<em>${TM.G.objCount(o)}</em>` : ''}</div>`; }).join('') + `<div class="frags">◆ ${(run.frags[W.L.n] || []).length}/${W.L.ents.filter(e => e.t === 'frag').length} glyph fragments</div>`;
    // anchor LED auto: red if illusion nearby
    const p = W.player; let ill = false; for (const v of W.veils) if (U.dist(p.x, p.y, v.px, v.py) < 90) ill = true; for (const e of W.enemies) if (e.fake && !e.dead && U.dist(p.x, p.y, e.x, e.y) < 100) ill = true;
    const led = $('#led'); if (!led._t) led.className = 'led ' + (ill ? 'red' : 'green');
    $('#tbtn-light').classList.toggle('off', !p.flashlight); $('#tbtn-det').classList.toggle('on2', p.detective);
  };

  /* ------------------------------------------------------------ DIALOG */
  UI.dialog = (id, npc, onEnd) => {
    const D = TM.DLG[id]; if (!D) { onEnd && onEnd(); return; }
    dlg = { id, D, npc, onEnd, after: [] }; $('#dialog').className = 'dialog on'; showNode(Object.keys(D.n)[0]);
  };
  UI.dialogLine = (who, text, onEnd) => { TM.DLG.__line = { n: { a: { who, text, end: true } } }; UI.dialog('__line', null, onEnd); };
  function doActions(list) {
    if (!list) return; const run = TM.S.run;
    for (const a of list) {
      const [k, v, w] = a.split(':');
      if (k === 'give') TM.G.clue(v); else if (k === 'flag') run.flags[v] = true; else if (k === 'xp') TM.G.xp(+v, 'story'); else if (k === 'codex') TM.S.codex(v);
      else if (k === 'sting') { TM.Audio.play('sting'); } else if (k === 'shake') TM.G.shake(1); else if (k === 'mood') TM.Audio.setMood(v); else if (k === 'nerve') run.nerve = U.clamp(run.nerve + (+v), 0, 100);
      else if (k === 'kit') { if (v === 'shells') run.ammo.shells = (run.ammo.shells || 0) + (+w); else if (v === 'ash' && run.char === 'jester') { run.kit.emp = (run.kit.emp || 0) + 1; } else run.kit[v] = (run.kit[v] || 0) + (+w); }
      else if (k === 'scrap') run.scrap += +v; else if (k === 'ach') TM.S.unlock(v); else if (k === 'heal') run.hp = run.maxHp;
      else if (k === 'boss') dlg.after.push(() => TM.AI.startBoss());
      else if (k === 'end-case') dlg.after.push(() => TM.Main.endCase());
    }
  }
  function showNode(key) {
    if (!dlg) return; clearInterval(dlg.iv); dlg.typing = false; dlg.choices = null;
    const node = dlg.D.n[key]; if (!node) return endDialog(); dlg.node = node; dlg.key = key;
    doActions(node.do);
    const run = TM.S.run; const who = node.who === 'player' ? run.char : node.who;
    const box = $('#dialog'); const cast = TM.CAST[who] || { name: '' };
    let text = node.text; if (text && typeof text === 'object') text = run.char === 'augie' ? text.a : text.j;
    // choices filtered by conditions
    const choices = node.choices ? node.choices.filter(c => TM.S.check(c.if)) : null;
    if (node.present) { box.className = 'dialog on'; box.innerHTML = ''; TM.Forensics.pick(node.present.prompt, (cid) => { const go = node.present.map[cid] || node.present.wrong; if (!node.present.map[cid]) { TM.Audio.play('wrong'); TM.S.run.lvl.wrong++; } else TM.Audio.play('deduce'); showNode(go); }, () => endDialog()); return; }
    const isCard = who === 'card';
    box.className = 'dialog on' + (isCard ? ' card' : '') + (who === 'narr' ? ' narr' : '');
    const port = cast.port ? `<img class="pix port" src="${TM.R.portrait(cast.port)}" alt="">` : '';
    const tell = node.tell && run.char === 'jester' ? `<div class="tell"><b>STREET SENSE</b> ${U.fmt(node.tell)}</div>` : '';
    box.innerHTML = isCard ? `<div class="cardtext"></div><div class="next">▼</div>` :
      `<div class="dbox">${port}<div class="dmain">${cast.name ? `<div class="who">${cast.name}</div>` : ''}<div class="dtext"></div>${tell}<div class="choices"></div></div><div class="next">▼</div></div>`;
    const tEl = box.querySelector(isCard ? '.cardtext' : '.dtext');
    if (!text && choices) { tEl.style.display = 'none'; renderChoices(choices); dlg.typing = false; return; }
    const full = U.fmt(text || ''); const plain = text || '';
    const me = dlg; me.typing = true; let i = 0; const spd = 55 * TM.S.profile.settings.textSpeed;
    me.finish = () => { clearInterval(me.iv); if (dlg !== me || me.node !== node) return; me.typing = false; tEl.innerHTML = full; if (choices) renderChoices(choices); else { const nx = box.querySelector('.next'); if (nx) nx.classList.add('on'); } };
    me.iv = setInterval(() => { if (dlg !== me || me.node !== node) return clearInterval(me.iv); i += 2; if (i >= plain.length) return me.finish(); tEl.textContent = plain.slice(0, i).replace(/[*_]/g, ''); if (i % 6 === 0) TM.Audio.play('blip'); }, 1000 / spd);
    box.onclick = (e) => { if (e.target.closest('.choices button')) return; advance(); };
  }
  function renderChoices(list) {
    const c = $('#dialog .choices'); if (!c) return;
    c.innerHTML = list.map((ch, i) => `<button data-i="${i}"><span>${i + 1}</span>${U.fmt(ch.t)}</button>`).join('');
    c.querySelectorAll('button').forEach(b => b.onclick = (e) => { e.stopPropagation(); pick(list[+b.dataset.i]); });
    dlg.choices = list;
  }
  function pick(ch) { TM.Audio.play('ui'); doActions(ch.do); dlg.choices = null; showNode(ch.go); }
  function advance() {
    if (!dlg) return; if (dlg.typing) return dlg.finish(); if (dlg.choices) return;
    const n = dlg.node; if (n.end || !n.next) return endDialog(); TM.Audio.play('ui'); showNode(n.next);
  }
  function endDialog() {
    if (!dlg) return; const d = dlg; clearInterval(d.iv); dlg = null; $('#dialog').className = 'dialog'; $('#dialog').innerHTML = ''; TM.In.clearHits();
    if (d.npc && d.npc.id === 'dolores' && TM.S.flag('boss_started')) d.npc.dlg = null;
    for (const f of d.after) f(); d.onEnd && d.onEnd(); TM.S.autosave();
  }
  UI.onKey = (e) => {
    if (dlg) {
      if (['Space', 'Enter', 'KeyE', 'NumpadEnter'].includes(e.code) || e.code === TM.S.profile.keys.interact) { advance(); return true; }
      const n = parseInt(e.key); if (dlg.choices && n >= 1 && n <= dlg.choices.length) { pick(dlg.choices[n - 1]); return true; }
      return true;
    }
    if (modalOpen && (e.code === 'Escape' || (e.code === 'Tab' && $('#modal.m-board')))) { e.preventDefault(); UI.close(); return true; }
    if (modalOpen) return false;
    if (screenOpen && e.code === 'Escape' && UI.onEsc) { UI.onEsc(); return true; }
    return false;
  };
  UI.onPad = (a) => { if (dlg && (a === 'interact' || a === 'attack')) advance(); else if (modalOpen && a === 'pause') UI.close(); };

  /* ------------------------------------------------------------- CRAFT */
  UI.craft = () => {
    const run = TM.S.run, perks = TM.S.rankPerks(); const list = TM.CRAFT[run.char];
    const cap = (k) => (TM.KIT[k] ? TM.KIT[k].max : 99) + (perks.kit && TM.KIT[k] && k !== 'shells' ? 1 : 0);
    const row = (k) => {
      const K = TM.KIT[k] || TM.CRAFT.extra[k]; const cost = K.cost; const have = k === 'taserAmmo' ? run.ammo.taser : k === 'shells' ? run.ammo.shells : k === 'medic' ? Math.ceil(run.hp) + '/' + run.maxHp : (run.kit[k] || 0) + '/' + cap(k);
      const full = TM.KIT[k] && k !== 'shells' && (run.kit[k] || 0) >= cap(k);
      const desc = k === 'medic' ? (run.char === 'augie' ? K.descA : K.descJ) : K.desc;
      return `<button class="craftrow" data-k="${k}" ${run.scrap < cost || full ? 'disabled' : ''}><img class="pix" src="${TM.R.kitIcon(TM.KIT[k] ? TM.KIT[k].icon : k === 'taserAmmo' ? 'drum' : 'emp')}"><div><b>${K.name}</b><small>${U.esc(desc)}</small></div><span>${have}</span><em>${cost}</em></button>`;
    };
    const el = UI.modal('craft', `<h2>${run.char === 'augie' ? 'WORKBENCH · GOLEM TOOLKIT' : 'MANTIS CONTACT · PAYPHONE'}</h2><p class="sub">${run.char === 'augie' ? 'Scrap-built counter-tech. One cheap, ugly answer for each kind of T-Mancer.' : 'A guy who knows a guy. Cash only.'} · You have <b class="gold">${run.scrap} ${run.char === 'augie' ? 'scrap' : 'cash'}</b></p>
      <div class="craftlist">${list.map(row).join('')}</div><div class="row"><button class="btn" data-close>DONE</button></div>`);
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const k = b.dataset.k, K = TM.KIT[k] || TM.CRAFT.extra[k]; if (run.scrap < K.cost) return; run.scrap -= K.cost; TM.Audio.play('pickup');
      if (k === 'taserAmmo') run.ammo.taser += 4; else if (k === 'shells') run.ammo.shells = (run.ammo.shells || 0) + 3; else if (k === 'medic') run.hp = Math.min(run.maxHp, run.hp + 50); else run.kit[k] = (run.kit[k] || 0) + 1;
      TM.S.autosave(); UI.craft();
    });
    el.querySelector('[data-close]').onclick = UI.close;
  };

  /* --------------------------------------------------------- MENUS */
  function rankBlock() {
    const prof = TM.S.profile, ri = TM.S.rankIndex(), rk = TM.RANKS[ri], nx = TM.RANKS[ri + 1];
    return `<div class="rankblock"><div><small>INVESTIGATOR RANK</small><b>${rk.name}</b></div><div class="bar"><i style="width:${nx ? ((prof.xp - rk.xp) / (nx.xp - rk.xp) * 100) : 100}%"></i></div><small>${prof.xp} XP${nx ? ' · ' + (nx.xp - prof.xp) + ' to ' + nx.name + (nx.text ? ' (' + nx.text + ')' : '') : ' · MAX'}</small></div>`;
  }
  UI.title = () => {
    TM.Main.state = 'title'; UI.bossBar(false); document.body.classList.remove('playing');
    const prof = TM.S.profile, auto = TM.S.hasAuto(), dj = prof.daily; const today = U.todayKey(); const doneToday = dj.solvedToday === today;
    const s = UI.screen(`
      <div class="title">
        <div class="logo"><div class="eye"></div><h1>TECHNOMANCERS</h1><div class="tagline">CASE 01 · RAINCASTER, MARYLAND · 1996</div></div>
        <div class="menu">
          ${auto ? `<button class="btn big" data-go="continue">CONTINUE CASE</button>` : ''}
          <button class="btn ${auto ? 'ghost' : 'big'}" data-go="new">NEW CASE</button>
          <button class="btn ghost daily ${doneToday ? '' : 'pulse'}" data-go="daily">DAILY JAM <span class="flame">${dj.streak > 0 ? '🔥 ' + dj.streak : ''}</span>${doneToday ? ' <small>✓ today</small>' : ' <small>new puzzle</small>'}</button>
          <div class="menurow"><button class="btn ghost" data-go="codex">CODEX <small>${Object.keys(prof.codex).length}/${Object.keys(TM.CODEX).length}</small></button><button class="btn ghost" data-go="ach">FEATS <small>${Object.keys(prof.ach).length}/${Object.keys(TM.ACH).length}</small></button></div>
          <div class="menurow"><button class="btn ghost" data-go="load" ${TM.S.hasManual() ? '' : 'disabled'}>LOAD SAVE</button><button class="btn ghost" data-go="settings">SETTINGS</button></div>
          ${deferredInstall ? '<button class="btn ghost" data-go="install">INSTALL APP</button>' : ''}
        </div>
        ${rankBlock()}
        <div class="foot">Headphones recommended. Keyboard, gamepad or touch.</div>
      </div>`, 'titlescreen');
    s.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { TM.Audio.init(); TM.Audio.play('ui'); const g = b.dataset.go;
      if (g === 'continue') TM.Main.continueGame(); else if (g === 'new') UI.charSelect(); else if (g === 'daily') TM.Daily.open(); else if (g === 'codex') UI.codex(UI.title); else if (g === 'ach') UI.achievements(UI.title); else if (g === 'settings') UI.settings(UI.title); else if (g === 'load') TM.Main.loadManual(); else if (g === 'install') UI.install(); });
    UI.onEsc = null;
  };
  UI.charSelect = () => {
    const prof = TM.S.profile;
    const card = (k) => { const C = TM.CHARS[k]; const gr = TM.LEVELS.map(L => prof.grades[k + ':' + L.id] || '·').join(' ');
      return `<button class="charcard" data-c="${k}"><div class="sprite"><canvas data-spr="${k}" width="20" height="34"></canvas></div><div class="cinfo"><h2>${C.name}</h2><div class="ctitle">${C.title}</div><p>${U.esc(C.blurb)}</p>
        <table>${Object.entries(C.stats).map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table><div class="special">${U.esc(C.special)}</div>
        <div class="grades">${prof.completed[k] ? '★ CASE CLOSED · ' : ''}GRADES ${gr}</div></div></button>`; };
    const s = UI.screen(`<div class="select"><h2 class="stitle">CHOOSE YOUR INVESTIGATOR</h2><p class="sub">Same streets, different case. Close it as both to see everything.</p><div class="chars">${card('augie')}${card('jester')}</div><button class="btn ghost" data-back>BACK</button></div>`);
    s.querySelectorAll('canvas[data-spr]').forEach(c => { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(TM.R.sheets[c.dataset.spr], 0, 0, 20, 34, 0, 0, 20, 34); });
    s.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { TM.Audio.play('deduce'); if (TM.S.hasAuto() && !confirm('Start a new case? Your current autosave will be replaced (your rank, feats and codex are kept).')) return; TM.Main.newGame(b.dataset.c); });
    s.querySelector('[data-back]').onclick = UI.title; UI.onEsc = UI.title;
  };
  UI.pause = () => {
    TM.Audio.play('ui');
    const el = UI.modal('pause', `<h2>PAUSED</h2>${rankBlock()}
      <div class="menu"><button class="btn big" data-p="resume">RESUME</button><button class="btn ghost" data-p="board">EVIDENCE BOARD</button><button class="btn ghost" data-p="save">SAVE GAME</button>
      <button class="btn ghost" data-p="controls">CONTROLS</button><button class="btn ghost" data-p="settings">SETTINGS</button><button class="btn ghost" data-p="codex">CODEX</button><button class="btn ghost" data-p="quit">QUIT TO TITLE</button></div>`);
    el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const g = b.dataset.p; TM.Audio.play('ui');
      if (g === 'resume') UI.close(); else if (g === 'board') { UI.close(); TM.Forensics.board(); } else if (g === 'save') { TM.S.manualSave(); UI.toast('Saved.', 'sys'); } else if (g === 'settings') { UI.close(); UI.settings(() => { UI.closeScreen(); }); } else if (g === 'codex') { UI.close(); UI.codex(() => UI.closeScreen()); } else if (g === 'controls') UI.controls(); else if (g === 'quit') { UI.close(); TM.S.autosave(); UI.title(); } });
  };
  UI.controls = () => {
    const k = TM.S.profile.keys, n = TM.In.keyName;
    const el = UI.modal('controls', `<h2>CONTROLS</h2><div class="ctl">
      <div><b>MOVE</b> ${n(k.up)}${n(k.left)}${n(k.down)}${n(k.right)} / arrows · <b>SPRINT</b> ${n(k.sprint)}</div>
      <div><b>INTERACT / TALK / INSPECT</b> ${n(k.interact)} (hold for locks & safes)</div>
      <div><b>ATTACK</b> ${n(k.attack)} / Space · <b>SWAP ${'HEAD'}</b> ${n(k.swap)}</div>
      <div><b>USE KIT</b> ${n(k.kit)} · <b>CYCLE KIT</b> ${n(k.cycle)}</div>
      <div><b>REALITY ANCHOR</b> ${n(k.anchor)} · <b>DETECTIVE MODE</b> ${n(k.detective)} · <b>FLASHLIGHT</b> ${n(k.light)}</div>
      <div><b>EVIDENCE BOARD</b> ${n(k.board)} · <b>PAUSE</b> ${n(k.pause)}</div>
      <hr><div><b>THE RULE:</b> when a magenta glyph burns over a T-Mancer, they're casting. Hit them with the matching counter <i>while it burns</i>.</div>
      <div class="matrix">${Object.values(TM.ENEMIES).filter(e => e.lang && e.lang !== 'beam').map(e => `<div><b>${e.name}</b> <span class="mag">${TM.LANG[e.lang].name}</span><br><small>${e.counterText}</small></div>`).join('')}</div>
      <div><b>GAMEPAD</b> A talk · X attack · B kit · Y swap · LB cycle · RB anchor · RT sprint · LT detective · Back board · Start pause</div>
      <div><b>TOUCH</b> left stick (push to the rim to sprint) · buttons on the right</div></div><div class="row"><button class="btn" data-close>OK</button></div>`);
    el.querySelector('[data-close]').onclick = UI.pause;
  };
  UI.settings = (back) => {
    const st = TM.S.profile.settings, keys = TM.S.profile.keys;
    const tog = (k, l) => `<label class="set"><span>${l}</span><input type="checkbox" data-s="${k}" ${st[k] ? 'checked' : ''}></label>`;
    const rng = (k, l, min, max, step) => `<label class="set"><span>${l}</span><input type="range" data-r="${k}" min="${min}" max="${max}" step="${step}" value="${st[k]}"></label>`;
    const s = UI.screen(`<div class="settings"><h2 class="stitle">SETTINGS</h2>
      <section><h3>AUDIO</h3>${tog('sound', 'Sound')}${rng('music', 'Music', 0, 1, .05)}${rng('sfx', 'Effects', 0, 1, .05)}</section>
      <section><h3>ACCESSIBILITY</h3>${tog('shake', 'Screen shake')}${rng('textSpeed', 'Text speed', .5, 3, .25)}${tog('contrast', 'High contrast')}${tog('scanlines', 'CRT scanlines')}${tog('haptics', 'Vibration')}</section>
      <section><h3>KEYS <small>(tap, then press a key)</small></h3><div class="keys">${TM.In.ACTIONS.map(a => `<button class="keyb" data-k="${a}"><span>${TM.In.LABELS[a]}</span><b>${TM.In.keyName(keys[a])}</b></button>`).join('')}</div><button class="btn ghost small" data-reset-keys>RESET KEYS</button></section>
      <section><h3>DATA</h3><button class="btn ghost small danger" data-wipe>ERASE ALL PROGRESS</button></section>
      <button class="btn" data-back>BACK</button></div>`);
    s.querySelectorAll('[data-s]').forEach(i => i.onchange = () => { st[i.dataset.s] = i.checked; TM.S.saveProfile(); applySettings(); });
    s.querySelectorAll('[data-r]').forEach(i => i.oninput = () => { st[i.dataset.r] = +i.value; TM.S.saveProfile(); applySettings(); });
    s.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { b.querySelector('b').textContent = '...'; TM.In.listen(code => { keys[b.dataset.k] = code; TM.S.saveProfile(); b.querySelector('b').textContent = TM.In.keyName(code); }); });
    s.querySelector('[data-reset-keys]').onclick = () => { TM.S.profile.keys = { ...TM.S.defaultKeys }; TM.S.saveProfile(); UI.settings(back); };
    s.querySelector('[data-wipe]').onclick = () => { if (confirm('Erase rank, feats, codex, streak and saves? This cannot be undone.')) { TM.S.wipeAll(); applySettings(); UI.title(); } };
    s.querySelector('[data-back]').onclick = back; UI.onEsc = back;
  };
  function applySettings() { const st = TM.S.profile.settings; document.body.classList.toggle('contrast', st.contrast); document.body.classList.toggle('noscan', !st.scanlines); TM.Audio.applyVolume(); }
  UI.applySettings = applySettings;
  UI.codex = (back) => {
    const prof = TM.S.profile; const cats = [...new Set(Object.values(TM.CODEX).map(c => c.cat))];
    const s = UI.screen(`<div class="codex"><h2 class="stitle">CODEX</h2><p class="sub">${Object.keys(prof.codex).length}/${Object.keys(TM.CODEX).length} unlocked · glyph fragments and story moments open entries</p>
      ${cats.map(c => `<h3>${c}</h3><div class="cx">${Object.entries(TM.CODEX).filter(([, v]) => v.cat === c).map(([k, v]) => prof.codex[k] ? `<details><summary>${U.esc(v.title)}</summary><p>${U.fmt(v.text)}</p></details>` : `<div class="locked">??? <small>locked</small></div>`).join('')}</div>`).join('')}
      <button class="btn" data-back>BACK</button></div>`);
    s.querySelector('[data-back]').onclick = back; UI.onEsc = back;
  };
  UI.achievements = (back) => {
    const prof = TM.S.profile;
    const s = UI.screen(`<div class="achs"><h2 class="stitle">FEATS</h2><p class="sub">${Object.keys(prof.ach).length}/${Object.keys(TM.ACH).length} earned</p>
      <div class="alist">${Object.entries(TM.ACH).map(([k, a]) => `<div class="ach ${prof.ach[k] ? 'got' : ''}"><b>${prof.ach[k] ? '◆' : '◇'} ${U.esc(a.name)}</b><small>${U.esc(a.desc)}</small><em>+${a.xp}</em></div>`).join('')}</div>
      <h3>RANKS & PERKS</h3><div class="alist">${TM.RANKS.map((r, i) => `<div class="ach ${TM.S.rankIndex() >= i ? 'got' : ''}"><b>${r.name}</b><small>${r.text || 'Starting rank'}</small><em>${r.xp} XP</em></div>`).join('')}</div>
      <button class="btn" data-back>BACK</button></div>`);
    s.querySelector('[data-back]').onclick = back; UI.onEsc = back;
  };
  UI.dead = (src) => {
    TM.Audio.play('sting'); TM.Audio.setMood('horror');
    const el = UI.modal('dead', `<div class="deadscr"><h2 class="red">YOU DIDN'T MAKE IT</h2><p>${U.esc(src || 'Raincaster')} got you.</p><p class="dim">Restart from the last checkpoint. You keep every clue and deduction you'd saved.</p><button class="btn big" data-r>TRY AGAIN</button><button class="btn ghost" data-q>QUIT TO TITLE</button></div>`);
    el.querySelector('[data-r]').onclick = () => { UI.close(); TM.G.respawn(); UI.bossBar(false); };
    el.querySelector('[data-q]').onclick = () => { UI.close(); UI.title(); };
  };
  UI.levelComplete = (gr, next) => {
    const L = TM.G.W.L, prof = TM.S.profile;
    const el = UI.modal('grade', `<div class="gradescr"><div class="kicker">${L.name} · CLEARED</div><div class="grade g${gr.g}">${gr.g}</div>
      <div class="gstats"><div><small>TIME</small><b>${U.fmt(U.fmtTime(gr.time))}</b><em>par ${U.fmtTime(L.par)}</em></div><div><small>DAMAGE</small><b>${gr.dmg}</b></div><div><small>WRONG LINKS</small><b>${gr.wrong}</b></div><div><small>MAX SUSPICION</small><b>${gr.susp}%</b></div><div><small>COUNTERS</small><b>${gr.counters}</b></div><div><small>FRAGMENTS</small><b>${gr.frags}/${gr.ftot}</b></div></div>
      ${gr.g !== 'S' ? `<p class="dim">S needs: under par, little damage, no wrong links, no lockdown, fragments and bonus objectives.</p>` : '<p class="mag">Clean work.</p>'}
      ${rankBlock()}<button class="btn big" data-n>CONTINUE</button></div>`);
    el.querySelector('[data-n]').onclick = () => { UI.close(); next(); };
  };
  UI.ending = () => {
    const run = TM.S.run, prof = TM.S.profile; const other = run.char === 'augie' ? 'jester' : 'augie';
    const grades = TM.LEVELS.map(L => `<div><small>${L.name}</small><b>${prof.grades[run.char + ':' + L.id] || '—'}</b></div>`).join('');
    const s = UI.screen(`<div class="ending"><div class="kicker">TECHNOMANCERS · CASE 01</div><h2 class="stitle">CASE CLOSED</h2>
      <p>${run.flags.destroyed ? 'You chose to destroy it. The basement is quiet. You don\'t believe the quiet.' : 'You chose to contain it. The salt ring held. The thing inside it didn\'t.'}</p>
      <div class="gstats"><div><small>CLUES</small><b>${run.clues.length}/${Object.keys(TM.CLUES).length}</b></div><div><small>DEDUCTIONS</small><b>${run.deds.length}/${TM.DEDUCTIONS.length}</b></div><div><small>WRONG LINKS</small><b>${run.wrongLinks}</b></div><div><small>COUNTERS</small><b>${run.total.counters}</b></div><div><small>TIME</small><b>${U.fmtTime(run.total.time)}</b></div><div><small>FRAGMENTS</small><b>${Object.values(run.frags).reduce((a, b) => a + b.length, 0)}</b></div></div>
      <div class="gstats grades">${grades}</div>${rankBlock()}
      <div class="tease"><b>CASE 02 · THE SCIENTIST</b><p>${U.fmt('Four records. One handwriting. Dead, captured, escaped, *became*.')}</p></div>
      ${!prof.completed[other] ? `<p class="mag">Now close it as ${TM.CHARS[other].name}. Different eyes, different lies, different ending to the same night.</p><button class="btn big" data-o>PLAY AS ${TM.CHARS[other].name}</button>` : ''}
      <button class="btn ${prof.completed[other] ? 'big' : 'ghost'}" data-t>TITLE</button></div>`);
    const o = s.querySelector('[data-o]'); if (o) o.onclick = () => TM.Main.newGame(other);
    s.querySelector('[data-t]').onclick = UI.title;
  };
  UI.install = async () => { if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) { } deferredInstall = null; UI.title(); };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (TM.Main && TM.Main.state === 'title' && screenOpen) UI.title(); });
  return UI;
})();

/* =========================================================================
   DAILY JAM — a new casting-code bug hunt every day (date-seeded).
   Find the line that will make the cast fail. Streaks, XP, feats.
   ========================================================================= */
TM.Daily = (() => {
  const U = TM.U; const D = {};
  const T = [
    (r) => { const bug = U.pick(r, ['boson', 'grav', 'assert', 'order']); const b = bug === 'boson' ? (1.1 + r() * .4).toFixed(2) : (.3 + r() * .5).toFixed(2); const g = bug === 'grav' ? '0.00' : (.5 + r() * .4).toFixed(2);
      const L = ['lag = TemporalLag(', `    duration_s = ${5 + ((r() * 10) | 0)},`, `    graviton_density = ${g},`, `    boson_shift = ${b},`, `    anima_cost = ${20 + ((r() * 30) | 0)})`, "scan = omnibox.scan(['graviton', 'boson'])", bug === 'assert' ? 'assert anima.reserve <= lag.anima_cost' : 'assert anima.reserve >= lag.anima_cost', 'omnibox.execute(lag)'];
      if (bug === 'order') { L.splice(5, 1); L.push("scan = omnibox.scan(['graviton', 'boson'])"); }
      const bad = { boson: 3, grav: 2, assert: 6, order: 6 }[bug];
      return { title: 'CHRONOMANCER · TEMPORAL LAG', lang: 'temporaltext', lines: L, bad, why: { boson: 'BOSON redlines at 1.0. Past it, a Temporal Lag shakes apart.', grav: 'Zero gravitons — there\'s no space-time to bend. The scan will fail.', assert: 'The anima check is backwards: it only passes when the reserve is too LOW.', order: 'It executes before it scans. Every cast must SCAN → VALIDATE → EXECUTE.' }[bug] }; },
    (r) => { const bug = U.pick(r, ['collide', 'anchor', 'order']); const L = [`redirect = Redirect(target=projectile.coords, to=(${(r() * 90) | 0}, ${(r() * 90) | 0}))`, `tumble = Tumbling(dest=${bug === 'anchor' ? "anchor_point('NaN')" : 'anchor_point(3)'}, collision_check=${bug === 'collide' ? 'False' : 'True'})`, 'assert anima.reserve >= redirect.cost + tumble.cost', 'omnibox.execute(redirect)', 'omnibox.execute(tumble)'];
      if (bug === 'order') { L[3] = 'omnibox.execute(tumble)'; L[4] = 'omnibox.execute(redirect)'; }
      return { title: 'VOIDWALKER · REDIRECT + TUMBLE', lang: 'foldspeak', lines: L, bad: { collide: 1, anchor: 1, order: 3 }[bug], why: { collide: 'No collision check — he Tumbles into a wall.', anchor: 'Corrupt Anchor Point coordinates. If the coordinates are corrupt, nobody knows where he lands.', order: 'Tumble fires first, so the projectile is never redirected. Redirect must execute first.' }[bug] }; },
    (r) => { const bug = U.pick(r, ['area', 'depth', 'radius', 'scan']); const L = [bug === 'scan' ? 'env = None' : 'env = omnibox.scan_environment()', `veil = RealityVeil(type='${U.pick(r, ['dense jungle', 'empty hall', 'brick wall', 'flooded room'])}', center=coords, radius=${bug === 'radius' ? '-' : ''}${4 + ((r() * 8) | 0)})`, `infil = omnibox.ai.infiltrate_target_cortex(target_id=t, focus_area='${bug === 'area' ? 'cerebellum' : 'prefrontal_cortex'}', depth=${bug === 'depth' ? '1.40' : (.5 + r() * .4).toFixed(2)})`, 'assert anima.reserve >= veil.cost', 'omnibox.execute([veil, infil], blend=env)'];
      return { title: 'HOLOILLUSIONIST · REALITY VEIL', lang: 'whisper', lines: L, bad: { area: 2, depth: 2, radius: 1, scan: 0 }[bug], why: { area: 'Illusion lives in the prefrontal cortex — perception and decisions. The cerebellum just keeps you balanced.', depth: 'Infiltration depth above 1.0 — the AI will refuse to go that deep.', radius: 'A negative radius. The Veil has no area to paint.', scan: 'No environment scan. The illusion can\'t blend with terrain, light and weather — it\'ll look fake.' }[bug] }; },
    (r) => { const bug = U.pick(r, ['count', 'spent', 'phase']); const L = ['pods = suit.pods.' + (bug === 'spent' ? 'spent()' : 'full()'), `swarm = NanoSwarm(count=${bug === 'count' ? 0 : 200 + ((r() * 800) | 0)}, source=pods)`, 'assert len(pods) > 0', 'assert anima.reserve >= swarm.cost', bug === 'phase' ? 'omnibox.execute(swarm, while_phased=True)' : 'omnibox.execute(swarm)'];
      return { title: 'NANOMANCER · NANO SWARM', lang: 'nanohive', lines: L, bad: { count: 1, spent: 0, phase: 4 }[bug], why: { count: 'Zero bots. A swarm of nothing.', spent: 'Spent pods go clear — there are no bots in them to release.', phase: 'A phased Nanomancer\'s bots are folded through his own body. He can\'t release a swarm mid-Phase.' }[bug] }; },
  ];
  function puzzles(day) { const r = U.rng(U.hash('jam' + day)); const order = [0, 1, 2, 3].sort(() => r() - .5); return order.slice(0, 3).map(i => T[i](r)); }
  D.open = () => {
    const day = U.todayKey(), prof = TM.S.profile, dj = prof.daily; const set = puzzles(day); let i = 0, score = 0, t0 = performance.now(), tl = 60, iv;
    const already = dj.solvedToday === day;
    const render = () => {
      const p = set[i]; const left = Math.max(0, tl - (performance.now() - t0) / 1000);
      const s = TM.UI.screen(`<div class="jam"><div class="kicker">DAILY JAM · ${day}</div><h2 class="stitle">${p.title}</h2><p class="sub">Puzzle ${i + 1}/3 · Tap the line that makes this cast <b class="mag">fail</b>. ${already ? '(Practice — today\'s streak already counted.)' : ''}</p>
        <div class="timer"><i id="jt" style="width:${left / tl * 100}%"></i></div>
        <pre class="code">${p.lines.map((l, k) => `<button class="cl" data-l="${k}"><span>${k + 1}</span>${U.esc(l)}</button>`).join('')}</pre>
        <div id="jamout"></div><div class="row"><button class="btn ghost" data-q>QUIT</button></div></div>`, 'jamscreen');
      s.querySelector('[data-q]').onclick = () => { clearInterval(iv); TM.UI.title(); };
      s.querySelectorAll('[data-l]').forEach(b => b.onclick = () => answer(+b.dataset.l, s));
    };
    const answer = (k, s) => {
      const p = set[i]; const ok = k === p.bad; if (ok) score++; TM.Audio.play(ok ? 'deduce' : 'wrong');
      s.querySelectorAll('[data-l]').forEach(b => { b.disabled = true; if (+b.dataset.l === p.bad) b.classList.add('right'); else if (+b.dataset.l === k) b.classList.add('wrong'); });
      s.querySelector('#jamout').innerHTML = `<div class="jamwhy ${ok ? 'ok' : 'bad'}"><b>${ok ? 'JAMMED.' : 'MISSED.'}</b> ${U.esc(p.why)}</div><button class="btn big" data-next>${i < 2 ? 'NEXT' : 'RESULTS'}</button>`;
      s.querySelector('[data-next]').onclick = () => { i++; if (i < 3) render(); else finish(); };
    };
    const finish = () => {
      clearInterval(iv); const secs = (performance.now() - t0) / 1000; const pass = score >= 2;
      let xp = 0, streakMsg = '';
      if (pass && !already) {
        const last = dj.last; dj.streak = last && U.dayDiff(last, day) === 1 ? dj.streak + 1 : 1; dj.last = day; dj.solvedToday = day; dj.best = Math.max(dj.best, dj.streak);
        xp = 40 + score * 20 + Math.max(0, Math.round((60 - secs))) + dj.streak * 10; TM.S.saveProfile(); TM.S.addXP(xp, 'daily jam');
        TM.S.unlock('daily1'); if (dj.streak >= 3) TM.S.unlock('streak3'); if (dj.streak >= 7) TM.S.unlock('streak7');
        streakMsg = `🔥 STREAK ${dj.streak} · best ${dj.best}`;
      }
      const s = TM.UI.screen(`<div class="jam"><div class="kicker">DAILY JAM · ${day}</div><h2 class="stitle">${score}/3 JAMMED</h2><p>${pass ? (already ? 'Nice practice run.' : 'Solved. Come back tomorrow to keep the streak alive.') : 'Two out of three counts. Try again — the puzzles stay the same all day.'}</p>
        ${xp ? `<p class="mag">+${xp} XP</p>` : ''}<p class="big">${streakMsg}</p><div class="row"><button class="btn" data-again>${pass ? 'PLAY AGAIN' : 'RETRY'}</button><button class="btn ghost" data-t>TITLE</button></div></div>`, 'jamscreen');
      s.querySelector('[data-again]').onclick = D.open; s.querySelector('[data-t]').onclick = TM.UI.title;
    };
    render(); TM.UI.onEsc = () => { clearInterval(iv); TM.UI.title(); };
    iv = setInterval(() => { const el = document.getElementById('jt'); const left = tl - (performance.now() - t0) / 1000; if (el) el.style.width = Math.max(0, left / tl * 100) + '%'; if (left <= 0) { clearInterval(iv); score = Math.min(score, 1); finish(); } }, 200);
  };
  D.puzzles = puzzles;
  return D;
})();
