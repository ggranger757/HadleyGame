/* =========================================================================
   TECHNOMANCERS — 08-forensics.js
   Clue inspection (Augie: UV / dusting / swab / Polaroid · Jester: eyeball /
   shakedown / knife / photo) and the EVIDENCE BOARD: link two clue cards;
   valid pairs become deductions, wrong links cost nerve and grade.
   ========================================================================= */
'use strict';

TM.Forensics = (() => {
  const U = TM.U, F = {};
  const TOOL = {
    uv: { name: 'UV LAMP', d: 'Reveals fluids and technomantic residue.' }, dust: { name: 'DUSTING', d: 'Powder and lift tape for prints.' },
    swab: { name: 'SWAB', d: 'Sample anything wet, or anything that shouldn\'t be.' }, polaroid: { name: 'POLAROID', d: 'Instant photo. Golem compares it on the deck.' },
    eyeball: { name: 'EYEBALL', d: 'Twenty years of looking at bad things.' }, shakedown: { name: 'SHAKEDOWN', d: 'Turn out pockets, linings, covers.' },
    cut: { name: 'KNIFE', d: 'Open what\'s sealed.' }, photo: { name: 'PHOTO', d: 'Disposable camera from a gas station.' },
  };
  const txt = (v) => v == null ? null : typeof v === 'string' ? v : (TM.S.run.char === 'augie' ? v.a : v.j);

  F.inspect = (id) => {
    const C = TM.CLUES[id]; if (!C) return; TM.G.clue(id);
    const run = TM.S.run, tools = TM.CHARS[run.char].tools; const used = run.toolsUsed[id] = run.toolsUsed[id] || [];
    const el = TM.UI.modal('inspect', `
      <div class="insp">
        <div class="insp-top"><img class="pix big" src="${TM.R.icon(C.icon)}" alt=""><div>
          <div class="tagrow">${C.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          <h2>${U.esc(C.title)}</h2><p>${U.fmt(C.desc)}</p></div></div>
        <div class="tools">${tools.map(t => `<button class="tool ${used.includes(t) ? 'used' : ''}" data-tool="${t}"><b>${TOOL[t].name}</b><small>${TOOL[t].d}</small></button>`).join('')}</div>
        <div class="toolout" id="toolout">${used.map(t => line(C, t)).join('')}</div>
        <div class="row"><button class="btn" data-close>CLOSE</button><button class="btn ghost" data-board>EVIDENCE BOARD</button></div>
      </div>`);
    el.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
      const t = b.dataset.tool; TM.Audio.play(t === 'uv' ? 'taser' : t === 'polaroid' || t === 'photo' ? 'swing' : 'ui');
      const out = el.querySelector('#toolout');
      if (!used.includes(t)) {
        used.push(t); b.classList.add('used'); TM.G.xp(5, 'forensics');
        const tv = C.tools && C.tools[t];
        if (tv && tv.gives) TM.G.clue(tv.gives);
        if (used.length >= tools.length) TM.S.unlock('thorough');
        out.insertAdjacentHTML('afterbegin', line(C, t, true));
      }
    });
    el.querySelector('[data-close]').onclick = () => TM.UI.close();
    el.querySelector('[data-board]').onclick = () => { TM.UI.close(); F.board(); };
  };
  function line(C, t, fresh) { const v = txt(C.tools && C.tools[t]); return `<div class="toolline ${fresh ? 'fresh' : ''}"><b>${TOOL[t].name}</b> ${v ? U.fmt(v) : '<span class="dim">Nothing more here.</span>'}</div>`; }

  /* ----------------------------------------------------------- BOARD */
  let sel = null, filter = 'all';
  F.board = (pickMode) => {
    const run = TM.S.run; sel = null;
    const tags = ['all', ...new Set(run.clues.flatMap(c => TM.CLUES[c].tags))];
    const known = TM.DEDUCTIONS.filter(d => run.deds.includes(d.id));
    const possible = TM.DEDUCTIONS.filter(d => !run.deds.includes(d.id) && run.clues.includes(d.a) && run.clues.includes(d.b)).length;
    const el = TM.UI.modal('board', `
      <div class="board">
        <header><h2>EVIDENCE BOARD</h2><div class="sub">${pickMode ? U.esc(pickMode.prompt) : 'Tap two cards that belong together. Wrong links cost nerve.'}</div>
          <div class="bstats">${run.clues.length} clues · ${known.length} deductions · <span class="${possible ? 'mag' : ''}">${possible ? possible + ' link' + (possible > 1 ? 's' : '') + ' waiting' : 'nothing to link yet'}</span></div></header>
        <div class="filters">${tags.map(t => `<button class="chip ${t === filter ? 'on' : ''}" data-f="${t}">${t}</button>`).join('')}</div>
        <div class="cards">${run.clues.slice().reverse().filter(c => filter === 'all' || TM.CLUES[c].tags.includes(filter)).map(c => card(c)).join('') || '<p class="dim">No clues yet. Inspect things.</p>'}</div>
        ${pickMode ? '' : `<div class="deds"><h3>DEDUCTIONS</h3>${known.map(d => `<div class="ded"><b>${U.esc(d.title)}</b><p>${U.fmt(d.text)}</p></div>`).join('') || '<p class="dim">None yet.</p>'}
          <p class="dim">${TM.DEDUCTIONS.length - known.length} more threads somewhere in Raincaster.</p></div>`}
        <div class="row sticky"><button class="btn" data-close>${pickMode ? 'CANCEL' : 'BACK TO THE STREETS'}</button>${pickMode ? '' : '<button class="btn ghost" data-hint>HUNCH (−15 NERVE)</button>'}</div>
      </div>`);
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; TM.Audio.play('ui'); TM.UI.close(); F.board(pickMode); });
    el.querySelector('[data-close]').onclick = () => { TM.UI.close(); if (pickMode && pickMode.cancel) pickMode.cancel(); };
    const hb = el.querySelector('[data-hint]'); if (hb) hb.onclick = () => hint(el);
    el.querySelectorAll('.card').forEach(c => c.onclick = () => {
      const id = c.dataset.id; TM.Audio.play('ui');
      if (pickMode) { TM.UI.close(); pickMode.pick(id); return; }
      if (!sel) { sel = id; c.classList.add('sel'); return; }
      if (sel === id) { sel = null; c.classList.remove('sel'); return; }
      link(sel, id, el); sel = null;
    });
  };
  function card(id) { const C = TM.CLUES[id]; return `<button class="card" data-id="${id}"><img class="pix" src="${TM.R.icon(C.icon)}" alt=""><b>${U.esc(C.title)}</b><small>${C.tags.join(' · ')}</small></button>`; }
  function link(a, b, el) {
    const run = TM.S.run; const d = TM.DEDUCTIONS.find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a));
    if (d && run.deds.includes(d.id)) { TM.UI.toast('Already linked: ' + d.title, 'sys'); el.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); return; }
    if (d) {
      run.deds.push(d.id); run.total.deds++; TM.Audio.play('deduce'); TM.G.xp(60, 'deduction'); TM.S.unlock('first_ded');
      if (TM.DEDUCTIONS.every(x => run.deds.includes(x.id))) TM.S.unlock('all_ded');
      TM.S.autosave();
      TM.UI.close();
      TM.UI.modal('deduce', `<div class="dedpop"><div class="pair"><img class="pix big" src="${TM.R.icon(TM.CLUES[a].icon)}"><span>+</span><img class="pix big" src="${TM.R.icon(TM.CLUES[b].icon)}"></div><div class="kicker">DEDUCTION</div><h2>${U.esc(d.title)}</h2><p>${U.fmt(d.text)}</p><button class="btn" data-ok>KEEP DIGGING</button></div>`)
        .querySelector('[data-ok]').onclick = () => { TM.UI.close(); F.board(); };
      return;
    }
    run.wrongLinks++; run.lvl.wrong++; run.nerve = Math.max(0, run.nerve - 8); TM.Audio.play('wrong'); TM.G.W && (TM.G.W.chain = 0);
    el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400);
    el.querySelectorAll('.sel').forEach(x => x.classList.remove('sel'));
    TM.UI.toast('Those don\'t connect. Nerve −8.', 'bad');
  }
  function hint(el) {
    const run = TM.S.run; const d = TM.DEDUCTIONS.find(d => !run.deds.includes(d.id) && run.clues.includes(d.a) && run.clues.includes(d.b));
    if (!d) { TM.UI.toast('No hunch. You need more clues — go inspect something.', 'sys'); return; }
    run.nerve = Math.max(0, run.nerve - 15); TM.Audio.play('ui');
    const c = el.querySelector(`.card[data-id="${d.a}"]`); if (c) { c.classList.add('hunch'); c.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    TM.UI.toast('HUNCH · "' + TM.CLUES[d.a].title + '" is half of something.', 'sys');
  }
  // evidence picker for interrogations
  F.pick = (prompt, cb, cancel) => F.board({ prompt, pick: cb, cancel });
  return F;
})();
