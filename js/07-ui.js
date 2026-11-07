/* =========================================================================
   CHRONOMANCER — 07-ui.js
   Everything on top of the canvas: HUD, dialogue (portraits, choices,
   "THAT'S A LIE!"), clue cards, case questions, menus, Case File, Daily Case,
   chapter results, ending. Big buttons, plain words.
   ========================================================================= */
'use strict';
TM.UI = (() => {
  const U = TM.U, $ = (s) => document.querySelector(s);
  const UI = {}; let modal = false, screen = false, dlg = null, battleOn = false, chaseOn = false;
  UI.blocking = () => modal || screen || !!dlg || battleOn || chaseOn;
  UI.modalOpen = () => modal;
  UI.chaseOn = (on) => { chaseOn = on; document.body.classList.toggle('chasing', on); };

  /* ---------------- layers ---------------- */
  UI.modal = (html, cls = '') => { const m = $('#modal'); m.className = 'modal on ' + cls; m.innerHTML = `<div class="panel">${html}</div>`; modal = true; return m; };
  UI.close = () => { const m = $('#modal'); m.className = 'modal'; m.innerHTML = ''; modal = false; TM.In.clear(); };
  UI.screen = (html, cls = '') => { const s = $('#screen'); s.className = 'screen on ' + cls; s.innerHTML = html; screen = true; s.scrollTop = 0; document.body.classList.remove('playing'); return s; };
  UI.closeScreen = () => { const s = $('#screen'); s.className = 'screen'; s.innerHTML = ''; screen = false; TM.In.clear(); };
  UI.toast = (t) => { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = U.fmt(t); $('#toasts').appendChild(d); setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3100); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); };
  UI.banner = (t, k = 'mag') => { const b = $('#banner'); b.className = 'banner on ' + k; b.textContent = t; clearTimeout(b._t); b._t = setTimeout(() => b.className = 'banner', 2000); };
  UI.xp = (n, why) => { const d = document.createElement('div'); d.className = 'xpp'; d.textContent = `+${n} XP${why ? ' · ' + why : ''}`; $('#xpfeed').appendChild(d); setTimeout(() => d.remove(), 1700); };
  UI.rankUp = (r) => { TM.Audio.play('rank'); UI.banner('RANK UP: ' + r.name); UI.toast('You ranked up! +10 max health.'); };
  UI.feat = (f) => { TM.Audio.play('win'); UI.toast(`🏆 *${f[0]}* — ${f[1]}`); };
  UI.timejump = (from, to, cb) => {
    const f = $('#tj'); const a = +from || 2026, b = +to || 2026; f.className = 'tj on'; f.innerHTML = `<div class="tjclock"><i></i><b></b></div><div class="tjyear">${a}</div><div class="tjsub">${b < a ? 'BACK' : 'FORWARD'} THROUGH THE HOUR</div>`;
    TM.Audio.play('portal'); TM.Audio.play('tear'); const y = f.querySelector('.tjyear'); let k = 0; const n = 38;
    const iv = setInterval(() => { k++; const e = k / n; const v = Math.round(a + (b - a) * (1 - Math.pow(1 - e, 3))); y.textContent = v; if (k % 3 === 0) TM.Audio.play('blip'); if (k >= n) { clearInterval(iv); y.textContent = b; TM.Audio.play('clue'); setTimeout(() => { f.className = 'tj'; f.innerHTML = ''; cb && cb(); }, 900); } }, 45);
  };
  UI.fade = (cb) => { const f = $('#fade'); f.classList.add('on'); setTimeout(() => { cb(); f.classList.remove('on'); }, 260); };
  UI.notice = (title, text, cb) => {
    const m = UI.modal(`<div class="notice"><h2>${U.esc(title)}</h2><p>${U.fmt(text)}</p><button class="btn big" data-ok>GOT IT</button></div>`);
    m.querySelector('[data-ok]').onclick = () => { UI.close(); cb && cb(); };
  };
  UI.action = (label) => { const b = $('#act'); b.textContent = label || '·'; b.classList.toggle('live', !!label); const h = $('#acthint'); if (h) h.textContent = label ? 'SPACE: ' + label : ''; };
  UI.battle = (on) => { battleOn = on; $('#battle').className = on ? 'battle on' : 'battle'; document.body.classList.toggle('fighting', on); };

  /* ---------------- HUD ---------------- */
  UI.hud = () => {
    const run = TM.S.run; if (!run) return; const ch = TM.CHAPTERS[run.ch]; const st = TM.Game.step();
    $('#chap').textContent = `${ch.era} · CH ${ch.n} · ${ch.title}`;
    $('#obj').innerHTML = st ? `<span>▶</span> ${U.esc(TM.Game.text(st.text))} ${TM.Game.progress(st)}` : '<span>✓</span> Chapter complete';
    $('#obj').classList.toggle('solve', !!(st && st.need.q));
    $('#hp i').style.width = (run.hp / run.maxHp * 100) + '%'; $('#hp b').textContent = Math.ceil(run.hp);
    const cv = $('#cover'); const past = ch.era !== '2026';
    if (past) { cv.hidden = false; cv.className = 'cover blend'; cv.innerHTML = 'BLEND ' + [0, 1, 2].map((i) => `<i class="${i < (run.blend == null ? 3 : run.blend) ? 'on' : ''}"></i>`).join(''); }
    else if (run.hero === 'jester') { cv.hidden = false; cv.className = 'cover'; cv.innerHTML = 'COVER ' + [0, 1, 2].map((i) => `<i class="${i < run.cover ? 'on' : ''}"></i>`).join(''); } else cv.hidden = true;
    $('#glyphs').textContent = '◆ ' + TM.W.glyphCount();
  };

  /* ---------------- dialogue ---------------- */
  const portCache = {};
  function portrait(id) {
    if (!id || !TM.SPR[id]) return '';
    if (portCache[id]) return portCache[id];
    const m = TM.SPR[id], a = m.anims.idle, im = new Image(); im.src = 'assets/sprites/' + id + '.png';
    const c = document.createElement('canvas'); c.width = 48; c.height = 48; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const draw = () => { const b = a.b; const hw = Math.min(b[2], 30), hh = Math.round(Math.min(b[3] * .38, 34)); const sx = b[0] + b[2] / 2 - hw / 2; x.clearRect(0, 0, 48, 48); x.drawImage(im, sx, a.r * m.fh + b[1] - 2, hw, hh, 24 - hw * 48 / hh / 2 * .9, 0, hw * 48 / hh * .9, 48 * .9 + 4); portCache[id] = c.toDataURL(); };
    if (im.complete) draw(); else im.onload = () => { draw(); document.querySelectorAll(`img[data-port="${id}"]`).forEach((e) => e.src = portCache[id]); };
    return portCache[id] || '';
  }
  UI.talk = (id, thing, onEnd) => {
    const D = TM.DLG[id]; if (!D) { onEnd && onEnd(); return; }
    dlg = { id, list: D, i: 0, thing, onEnd, after: [], stack: [] }; $('#dialog').className = 'dialog on'; next(0);
  };
  function cond(n) { const c = n.if; if (!c) return true; if (c.hero && c.hero !== TM.S.run.hero) return false; return TM.S.check(c); }
  function doActs(list) {
    if (!list) return; const run = TM.S.run;
    for (const a of list) {
      const [k, v] = a.split(':');
      if (k === 'clue') dlg.after.push(() => UI.clue(v, true));
      else if (k === 'flag') run.flags[v] = true;
      else if (k === 'xp') TM.S.xp(+v, 'nice');
      else if (k === 'ach') TM.S.feat(v);
      else if (k === 'cover') TM.Game.cover(+v);
      else if (k === 'blend') TM.Game.blend(+v);
    }
  }
  function next(i) {
    if (!dlg) return; const L = dlg.list; while (i < L.length && !cond(L[i])) i++;
    if (i >= L.length) { const r = dlg.stack.pop(); if (r) { dlg.list = r.list; return next(r.i); } return finish(); }
    const n = L[i]; dlg.i = i; dlg.node = n;
    if (n.go) { dlg.stack.push({ list: L, i: i + 1 }); dlg.list = TM.DLG[n.go]; return next(0); }
    doActs(n.do); show(n);
  }
  function who(n) { const run = TM.S.run; if (n.who === 'player') return run.hero; if (n.who === 'PARTNER') return run.hero === 'augie' ? 'jester' : 'augie'; return n.who; }
  function show(n) {
    dlg.node = n;
    const box = $('#dialog'), run = TM.S.run, w = who(n); let text = n.text; if (text && typeof text === 'object') text = run.hero === 'augie' ? text.a : text.j;
    const card = w === 'card', narr = w === 'narr';
    box.className = 'dialog on' + (card ? ' card' : '') + (narr ? ' narr' : '');
    const name = TM.WHO[w] || (TM.HEROES[w] && TM.HEROES[w].name) || '';
    const tell = n.tell && run.hero === 'jester' ? `<div class="tell">👁 STREET SENSE: ${U.esc(n.tell)}</div>` : '';
    box.innerHTML = card ? `<div class="cardtxt">${U.fmt(text)}</div><div class="tap">TAP TO CONTINUE</div>` :
      `<div class="dbox">${!narr && TM.SPR[w] ? `<img class="port" data-port="${w}" src="${portrait(w)}">` : ''}<div class="dm">${name ? `<div class="who">${name}</div>` : ''}<div class="dt"></div>${tell}<div class="ch"></div></div><div class="tap">▼</div></div>`;
    const el = box.querySelector(card ? '.cardtxt' : '.dt');
    const done = () => { dlg.typing = false; el.innerHTML = U.fmt(text || ''); after(n); };
    if (card) { done(); } else {
      dlg.typing = true; let k = 0; const plain = (text || '').replace(/\*/g, ''); clearInterval(dlg.iv); const me = dlg;
      dlg.iv = setInterval(() => { if (dlg !== me || me.node !== n) return clearInterval(me.iv); k += 2; if (k >= plain.length) { clearInterval(me.iv); done(); return; } el.textContent = plain.slice(0, k); if (k % 6 === 0) TM.Audio.play('blip'); }, 18 / TM.S.profile.settings.textSpeed);
      dlg.finish = () => { clearInterval(me.iv); done(); };
    }
    box.onclick = (e) => { if (e.target.closest('button')) return; advance(); };
  }
  function after(n) {
    const c = $('#dialog .ch'); if (!c) return;
    if (n.choices) {
      c.innerHTML = n.choices.map((ch, i) => `<button class="cbtn" data-i="${i}">${U.fmt(ch.t)}</button>`).join('');
      c.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const ch = n.choices[+b.dataset.i]; TM.Audio.play('ui'); doActs(ch.do); if (ch.go) { dlg.list = TM.DLG[ch.go]; return next(0); } if (ch.say) { show({ who: ch.say[0], text: ch.say[1], _resume: dlg.i + 1 }); return; } next(dlg.i + 1); });
      dlg.wait = true; return;
    }
    if (n.lie) {
      c.innerHTML = `<button class="cbtn lie" data-lie>⚠ THAT'S A LIE!</button><button class="cbtn" data-believe>Believe it</button>`;
      c.querySelector('[data-lie]').onclick = () => lieFlow(n);
      c.querySelector('[data-believe]').onclick = () => { TM.Audio.play('ui'); show({ who: 'narr', text: 'Hmm... something about that doesn\'t add up. Think about your clues. (Tap 📁 CASE FILE to read them.)', _again: dlg.i }); };
      dlg.wait = true; return;
    }
    dlg.wait = false; const t = $('#dialog .tap'); if (t) t.classList.add('on');
  }
  function lieFlow(n) {
    TM.Audio.play('sting');
    const choices = U.shuffle ? U.shuffle(n.lie.choices.slice()) : n.lie.choices.slice().sort(() => Math.random() - .5);
    const m = UI.modal(`<div class="kicker">THAT'S A LIE!</div><h2>Which clue proves it?</h2><div class="cards3">${choices.map((c) => clueCard(c, TM.S.has(c))).join('')}</div>`, 'lie');
    m.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => {
      const id = b.dataset.c;
      if (id === n.lie.proof) { UI.close(); TM.Audio.play('nova'); UI.banner('GOTCHA!'); TM.S.xp(40, 'caught a lie'); TM.S.profile.lies++; TM.S.save(); TM.S.feat('lie1'); if (TM.S.profile.lies >= 5) TM.S.feat('lie5'); dlg.list = TM.DLG[n.lie.ok]; next(0); }
      else { TM.Audio.play('wrong'); TM.S.stat('wrong'); b.classList.add('nope'); b.disabled = true; UI.toast('That doesn\'t prove it. Try another clue.'); }
    });
  }
  function clueCard(id, have = true) { const C = TM.CLUES[id]; return `<button class="ccard" data-c="${id}"><span class="ci">${C.i}</span><b>${U.esc(C.t)}</b><small>${have ? U.esc(C.d) : 'You haven\'t found this yet.'}</small></button>`; }
  function advance() {
    if (!dlg) return; if (dlg.typing) return dlg.finish(); if (dlg.wait) return;
    const n = dlg.node; TM.Audio.play('ui');
    if (n._again != null) return next(n._again); if (n._resume != null) return next(n._resume);
    if (n.end) return finish(); next(dlg.i + 1);
  }
  function finish() {
    if (!dlg) return; const d = dlg; clearInterval(d.iv); dlg = null; $('#dialog').className = 'dialog'; $('#dialog').innerHTML = ''; TM.In.clear();
    const run = TM.S.run; if (run && d.thing && d.thing.id) run.flags['talked_' + d.thing.id] = true;
    const queue = d.after.slice(); const go = () => { const f = queue.shift(); if (f) { f(); waitClose(go); } else { d.onEnd && d.onEnd(); TM.Game.checkSteps(); TM.S.saveRun(); } };
    go();
  }
  function waitClose(cb) { const iv = setInterval(() => { if (!modal) { clearInterval(iv); cb(); } }, 100); }
  UI.onKey = (e) => {
    if (dlg) { if (['Space', 'Enter', 'KeyE'].includes(e.code)) { advance(); return true; } const k = parseInt(e.key); const bs = document.querySelectorAll('#dialog .cbtn'); if (k && bs[k - 1]) { bs[k - 1].click(); return true; } return true; }
    if (modal) { if (e.code === 'Escape') { const c = $('#modal [data-x]'); if (c) c.click(); } if (['Space', 'Enter'].includes(e.code)) { const ok = $('#modal [data-ok]'); if (ok) { ok.click(); return true; } } return true; }
    if (battleOn) return TM.Battle.key(e);
    if (screen) return false;
    return false;
  };

  /* ---------------- clues & questions ---------------- */
  UI.clue = (id, silent) => {
    const run = TM.S.run, C = TM.CLUES[id]; if (!C) return; const isNew = !run.clues.includes(id);
    if (isNew) { run.clues.push(id); TM.Audio.play('clue'); TM.S.xp(15, 'clue'); TM.S.feat('first_clue'); TM.Game.onClue(id); TM.S.saveRun(); }
    const extra = C.extra && run.hero === 'augie' ? `<div class="extra">🤖 GOLEM SCAN: ${U.esc(C.extra)}</div>` : '';
    const m = UI.modal(`<div class="kicker">${isNew ? 'NEW CLUE' : 'CLUE'}</div><div class="bigicon">${C.i}</div><h2>${U.esc(C.t)}</h2><p class="cdesc">${U.fmt(C.d)}</p>${extra}<button class="btn big" data-ok>GOT IT</button>`, 'cluem');
    m.querySelector('[data-ok]').onclick = () => { UI.close(); TM.Game.checkSteps(); };
  };
  UI.question = (qid) => {
    const Q = TM.QUESTIONS[qid]; const opts = Q.a.map((a, i) => ({ ...a, i })).sort(() => Math.random() - .5);
    const kick = Q.kind === 'history' ? `🕰 HISTORY CHECK · ${Q.era}` : Q.kind === 'know' ? '🔬 KNOWLEDGE CHECK' : '🕵 CASE QUESTION';
    const m = UI.modal(`<div class="kicker">${kick}</div><h2>${U.esc(Q.q)}</h2><div class="answers">${opts.map((o) => `<button class="abtn" data-i="${o.i}">${U.esc(o.t)}</button>`).join('')}</div><div class="qhint" id="qhint"></div><button class="btn ghost" data-file>📁 READ MY CLUES FIRST</button>`, 'q');
    m.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => {
      const a = Q.a[+b.dataset.i];
      if (a.ok) {
        TM.Audio.play('nova'); TM.S.run.solved[qid] = true; TM.S.xp(50, 'case solved'); TM.S.feat('first_solve'); TM.Game.onSolve(qid); TM.S.saveRun();
        const r = UI.modal(`<div class="kicker">✓ CORRECT</div><div class="bigicon">💡</div><h2>${U.esc(a.t)}</h2><p class="cdesc">${U.esc(Q.why)}</p><button class="btn big" data-ok>KEEP GOING</button>`, 'q ok');
        r.querySelector('[data-ok]').onclick = () => { UI.close(); TM.Game.checkSteps(); };
      } else { TM.Audio.play('wrong'); TM.S.stat('wrong'); b.disabled = true; b.classList.add('nope'); $('#qhint').innerHTML = '❌ Not quite. HINT: ' + U.esc(Q.hint); }
    });
    m.querySelector('[data-file]').onclick = () => { UI.close(); UI.caseFile(() => UI.question(qid)); };
  };

  /* ---------------- case file ---------------- */
  UI.caseFile = (back) => {
    const run = TM.S.run; let tab = 'clues';
    const render = () => {
      const files = Object.entries(TM.FILES).filter(([k]) => TM.S.profile.files[k] || ['augie', 'jester', 'rules', 'zyxth'].includes(k));
      const m = UI.modal(`<div class="tabs"><button class="${tab === 'clues' ? 'on' : ''}" data-t="clues">CLUES (${run.clues.length})</button><button class="${tab === 'files' ? 'on' : ''}" data-t="files">FILES</button></div>
        ${tab === 'clues' ? `<div class="cards">${run.clues.slice().reverse().map((c) => clueCard(c)).join('') || '<p class="dim">No clues yet. Look for the sparkles ✦.</p>'}</div>` :
          `<div class="files">${files.map(([k, f]) => `<details><summary>${U.esc(f[0])}</summary><p>${U.esc(f[1])}</p></details>`).join('')}<p class="dim">Find hidden ◆ glyphs to unlock more files.</p></div>`}
        <button class="btn big" data-x>BACK</button>`, 'file');
      m.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { tab = b.dataset.t; render(); });
      m.querySelector('[data-x]').onclick = () => { UI.close(); back && back(); };
    };
    render();
  };

  /* ---------------- menus ---------------- */
  function rankBox() { const r = TM.S.rank(), p = TM.S.profile; return `<div class="rank"><small>DETECTIVE RANK</small><b>${r.name}</b><div class="bar"><i style="width:${r.next ? (p.xp - r.cur) / (r.next - r.cur) * 100 : 100}%"></i></div><small>${p.xp} XP${r.next ? ' · ' + (r.next - p.xp) + ' to ' + r.nextName : ''}</small></div>`; }
  UI.title = () => {
    TM.Main.state = 'title'; UI.battle(false); TM.Audio.setMood('title'); document.body.dataset.era = 'title';
    const p = TM.S.profile, has = TM.S.hasRun(), today = U.todayKey(), dj = p.daily;
    const s = UI.screen(`<div class="title"><div class="logo"><div class="eye"></div><h1>CHRONOMANCER</h1><div class="sub">A RAINCASTER MYSTERY · 1888 · 1947 · 1986 · 2026</div></div>
      <div class="menu">${has ? '<button class="btn big" data-g="cont">CONTINUE</button>' : ''}<button class="btn ${has ? 'ghost' : 'big'}" data-g="new">NEW GAME</button>
      <button class="btn ghost" data-g="run">🚗 RAINCASTER RUN ${p.chaseBest ? '· BEST ' + p.chaseBest + ' m' : ''}</button>
      <button class="btn ghost ${dj.last === today ? '' : 'pulse'}" data-g="daily">🕵 DAILY CASE ${dj.streak ? '🔥' + dj.streak : ''} ${dj.last === today ? '✓' : ''}</button>
      <div class="row"><button class="btn ghost" data-g="feats">🏆 ${Object.keys(p.feats).length}/${Object.keys(TM.FEATS).length}</button><button class="btn ghost" data-g="files">📁 FILES</button><button class="btn ghost" data-g="set">⚙</button></div></div>${rankBox()}
      ${UI.installable ? '<button class="btn ghost" data-g="install">📲 INSTALL THE APP</button>' : ''}</div>`, 'tscreen');
    s.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => { TM.Audio.init(); TM.Audio.play('ui'); const g = b.dataset.g;
      if (g === 'run') { UI.closeScreen(); TM.Chase.start('arcade'); } if (g === 'cont') TM.Main.cont(); if (g === 'new') UI.heroSelect(); if (g === 'daily') UI.daily(); if (g === 'feats') UI.feats(); if (g === 'files') UI.files(); if (g === 'set') UI.settings(UI.title); if (g === 'install') UI.install(); });
  };
  UI.heroSelect = () => {
    const card = (k) => { const H = TM.HEROES[k]; const done = TM.S.profile.done[k]; return `<button class="hero" data-h="${k}"><canvas data-spr="${k}" width="80" height="120"></canvas><div><h2>${H.name}</h2><div class="tag">${H.tag}</div><p>${U.esc(H.blurb)}</p><ul>${H.perks.map((x) => `<li>${x}</li>`).join('')}</ul>${done ? '<div class="done">★ CASE CLOSED</div>' : ''}</div></button>`; };
    const s = UI.screen(`<div class="select"><h2 class="st">WHO ARE YOU?</h2><p class="dim">Same mystery, two sides. Play both to see everything.</p><div class="heroes">${card('augie')}${card('jester')}</div><button class="btn ghost" data-b>BACK</button></div>`);
    s.querySelectorAll('canvas[data-spr]').forEach((c) => { const id = c.dataset.spr, m = TM.SPR[id], a = m.anims.idle, im = new Image(); im.src = 'assets/sprites/' + id + '.png'; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; let f = 0; const d = () => { x.clearRect(0, 0, 80, 120); const b = a.b, k = Math.min(78 / b[2], 116 / b[3]); x.drawImage(im, f * m.fw + b[0], a.r * m.fh + b[1], b[2], b[3], 40 - b[2] * k / 2, 120 - b[3] * k, b[2] * k, b[3] * k); }; im.onload = d; const iv = setInterval(() => { if (!document.body.contains(c)) return clearInterval(iv); f = (f + 1) % a.n; d(); }, 140); });
    s.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { if (TM.S.hasRun() && !confirm('Start over? Your saved game will be replaced. (Your rank and trophies stay.)')) return; TM.Main.newGame(b.dataset.h); });
    s.querySelector('[data-b]').onclick = UI.title;
  };
  UI.pause = () => {
    const m = UI.modal(`<h2>PAUSED</h2>${rankBox()}<div class="menu"><button class="btn big" data-p="r">RESUME</button><button class="btn ghost" data-p="f">📁 CASE FILE</button><button class="btn ghost" data-p="s">⚙ SETTINGS</button><button class="btn ghost" data-p="q">QUIT TO TITLE</button></div><p class="dim">The game saves automatically.</p>`);
    m.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { const p = b.dataset.p; UI.close(); if (p === 'f') UI.caseFile(); if (p === 's') UI.settings(() => { UI.closeScreen(); document.body.classList.add('playing'); }); if (p === 'q') { TM.S.saveRun(); UI.title(); } });
  };
  UI.settings = (back) => {
    const st = TM.S.profile.settings;
    const s = UI.screen(`<div class="settings"><h2 class="st">SETTINGS</h2>
      <label>Sound <input type="checkbox" data-s="sound" ${st.sound ? 'checked' : ''}></label>
      <label>Music <input type="range" min="0" max="1" step=".1" data-r="music" value="${st.music}"></label>
      <label>Effects <input type="range" min="0" max="1" step=".1" data-r="sfx" value="${st.sfx}"></label>
      <label>Text speed <input type="range" min=".5" max="3" step=".25" data-r="textSpeed" value="${st.textSpeed}"></label>
      <label>Screen shake <input type="checkbox" data-s="shake" ${st.shake ? 'checked' : ''}></label>
      <label>Vibration <input type="checkbox" data-s="haptics" ${st.haptics ? 'checked' : ''}></label>
      <label class="col">AI characters server (optional) <input type="url" data-t="aiEndpoint" placeholder="${TM.CONFIG.aiEndpoint || 'https://your-worker.workers.dev'}" value="${U.esc(st.aiEndpoint || '')}"><small class="dim">Leave empty to use built-in offline answers. See README.</small></label>
      <button class="btn ghost danger" data-w>ERASE EVERYTHING</button><button class="btn big" data-b>BACK</button></div>`);
    s.querySelectorAll('[data-s]').forEach((i) => i.onchange = () => { st[i.dataset.s] = i.checked; TM.S.save(); TM.Audio.applyVolume(); });
    s.querySelectorAll('[data-r]').forEach((i) => i.oninput = () => { st[i.dataset.r] = +i.value; TM.S.save(); TM.Audio.applyVolume(); });
    s.querySelectorAll('[data-t]').forEach((i) => i.onchange = () => { st[i.dataset.t] = i.value.trim(); TM.S.save(); });
    s.querySelector('[data-w]').onclick = () => { if (confirm('Erase all progress, rank and trophies?')) { TM.S.wipe(); UI.title(); } };
    s.querySelector('[data-b]').onclick = back;
  };
  UI.feats = () => { const p = TM.S.profile; const s = UI.screen(`<div class="list"><h2 class="st">TROPHIES</h2>${Object.entries(TM.FEATS).map(([k, f]) => `<div class="feat ${p.feats[k] ? 'got' : ''}"><b>${p.feats[k] ? '🏆' : '🔒'} ${U.esc(f[0])}</b><small>${U.esc(f[1])}</small><em>+${f[2]} XP</em></div>`).join('')}<button class="btn big" data-b>BACK</button></div>`); s.querySelector('[data-b]').onclick = UI.title; };
  UI.files = () => { const p = TM.S.profile; const s = UI.screen(`<div class="list"><h2 class="st">FILES</h2>${Object.entries(TM.FILES).map(([k, f]) => p.files[k] || ['augie', 'jester', 'rules', 'zyxth'].includes(k) ? `<details><summary>${U.esc(f[0])}</summary><p>${U.esc(f[1])}</p></details>` : '<div class="locked">🔒 Find hidden ◆ glyphs to unlock</div>').join('')}<button class="btn big" data-b>BACK</button></div>`); s.querySelector('[data-b]').onclick = UI.title; };

  /* ---------------- chapter results & ending ---------------- */
  UI.results = (ch, stars, why, cb) => {
    TM.Audio.play('win');
    const m = UI.modal(`<div class="kicker">CHAPTER ${ch.n} COMPLETE</div><h2>${ch.title}</h2><div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}">★</span>`).join('')}</div>
      <ul class="why">${why.map((w) => `<li class="${w[1] ? 'ok' : ''}">${w[1] ? '★' : '☆'} ${U.esc(w[0])}</li>`).join('')}</ul>${rankBox()}<button class="btn big" data-ok>NEXT</button>`, 'res');
    m.querySelector('[data-ok]').onclick = () => { UI.close(); cb(); };
  };
  UI.ending = () => {
    const run = TM.S.run, p = TM.S.profile, other = run.hero === 'augie' ? 'jester' : 'augie';
    const total = TM.CHAPTERS.reduce((a, c) => a + (p.stars[run.hero + ':' + c.id] || 0), 0);
    const s = UI.screen(`<div class="ending"><div class="kicker">CHRONOMANCER · CASE 01</div><h2 class="st">CASE CLOSED</h2><p>${run.flags.home ? 'You brought Bernard home. Something very tall is hiding in Raincaster.' : 'You let him rest. Nothing knocks anymore.'}</p>
      <div class="stats"><div><b>${run.clues.length}</b><small>clues</small></div><div><b>${Object.keys(run.solved).length}</b><small>questions solved</small></div><div><b>${total}/${TM.CHAPTERS.length * 3}</b><small>stars</small></div></div>${rankBox()}
      <div class="tease"><b>CASE 02</b><p>A watch in the rubble, stopped at 3:07. Coming soon.</p></div>
      ${!p.done[other] ? `<p class="mag">Now play as ${TM.HEROES[other].name}. Same nights, a different way through them.</p><button class="btn big" data-o>PLAY AS ${TM.HEROES[other].name}</button>` : ''}<button class="btn ghost" data-t>TITLE</button></div>`);
    const o = s.querySelector('[data-o]'); if (o) o.onclick = () => TM.Main.newGame(other); s.querySelector('[data-t]').onclick = UI.title;
  };

  /* ---------------- Daily Case ---------------- */
  UI.daily = () => {
    const day = U.todayKey(), r = U.rng(U.hash('dc' + day)); const pool = TM.DAILY.map((c, i) => i).sort(() => r() - .5).slice(0, 3);
    let i = 0, score = 0; const dj = TM.S.profile.daily; const already = dj.last === day;
    const q = () => {
      const c = TM.DAILY[pool[i]]; const order = c.a.map((a, k) => k).sort(() => Math.random() - .5);
      const s = UI.screen(`<div class="daily"><div class="kicker">DAILY CASE · ${day} · ${i + 1}/3</div><div class="story">🕵 ${U.esc(c.s)}</div><h2>${U.esc(c.q)}</h2><div class="answers">${order.map((k) => `<button class="abtn" data-k="${k}">${U.esc(c.a[k])}</button>`).join('')}</div><div id="dout"></div><button class="btn ghost" data-x>QUIT</button></div>`);
      s.querySelector('[data-x]').onclick = UI.title;
      s.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => {
        const ok = +b.dataset.k === c.ok; if (ok) score++; TM.Audio.play(ok ? 'nova' : 'wrong');
        s.querySelectorAll('[data-k]').forEach((x) => { x.disabled = true; if (+x.dataset.k === c.ok) x.classList.add('right'); else if (x === b) x.classList.add('nope'); });
        s.querySelector('#dout').innerHTML = `<p class="${ok ? 'mag' : 'dim'}">${ok ? '✓ Nice detective work!' : '✗ The answer was: ' + U.esc(c.a[c.ok])}</p><button class="btn big" data-n>${i < 2 ? 'NEXT' : 'RESULTS'}</button>`;
        s.querySelector('[data-n]').onclick = () => { i++; i < 3 ? q() : end(); };
      });
    };
    const end = () => {
      let msg = ''; if (score >= 2 && !already) { dj.streak = dj.last && U.dayDiff(dj.last, day) === 1 ? dj.streak + 1 : 1; dj.last = day; dj.best = Math.max(dj.best, dj.streak); TM.S.save(); TM.S.xp(30 + score * 15 + dj.streak * 5, 'daily case'); TM.S.feat('daily1'); if (dj.streak >= 3) TM.S.feat('streak3'); if (dj.streak >= 7) TM.S.feat('streak7'); msg = `🔥 STREAK: ${dj.streak} DAY${dj.streak > 1 ? 'S' : ''}`; }
      const s = UI.screen(`<div class="daily"><div class="kicker">DAILY CASE</div><h2 class="st">${score}/3</h2><p>${score >= 2 ? (already ? 'Good practice! Today already counted.' : 'Case solved! Come back tomorrow for a new one.') : 'You need 2 out of 3. Try again!'}</p><p class="big">${msg}</p><button class="btn big" data-a>${score >= 2 ? 'PLAY AGAIN' : 'TRY AGAIN'}</button><button class="btn ghost" data-t>TITLE</button></div>`);
      s.querySelector('[data-a]').onclick = UI.daily; s.querySelector('[data-t]').onclick = UI.title;
    };
    q();
  };
  UI.install = async () => { if (!UI._dip) return; UI._dip.prompt(); try { await UI._dip.userChoice; } catch (e) { } UI._dip = null; UI.installable = false; UI.title(); };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); UI._dip = e; UI.installable = true; if (TM.Main && TM.Main.state === 'title') UI.title(); });
  return UI;
})();
