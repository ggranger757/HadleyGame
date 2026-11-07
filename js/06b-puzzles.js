/* =========================================================================
   CHRONOMANCER — 06b-puzzles.js
   Hands-on puzzles and memory games, driven by TM.PUZZLES in 02-story.js.
   No code, no math. Every one has a HINT.
     tune     — slide a dial until the signal locks (scanner, walkie-talkie)
     recall   — memory: study the scene, then pick what you saw
     order    — put photos in time order (history)
     match    — memory: flip pairs
     sequence — listen to the chime, play it back (the killer's seven notes)
     wheels   — 3-wheel lock with a clue in the room
     keypad   — 3-digit code with a clue in the room
     cipher   — turn a decoder ring until a telegram reads right
     clock    — set the hands to the right minute
     circuit  — rotate pieces to connect the drive
     spot     — find the one hollow panel
     torn     — rotate torn pieces back together
   ========================================================================= */
'use strict';
TM.Puzzle = (() => {
  const U = TM.U; const P = {};
  P.open = (id, onDone) => {
    const D = TM.PUZZLES[id]; if (!D) { onDone && onDone(); return; }
    const m = TM.UI.modal(`<div class="kicker">🧩 PUZZLE</div><h2>${D.title}</h2><p class="dim">${D.how}</p><div class="pz" id="pz"></div><div class="qhint" id="pzh"></div><div class="row"><button class="btn ghost" data-hint>💡 HINT</button><button class="btn ghost" data-x>LATER</button></div>`, 'puzzle');
    const box = m.querySelector('#pz'); let solved = false; const timers = []; const stop = () => timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
    const win = () => { if (solved) return; solved = true; stop(); TM.Audio.play('nova'); TM.S.xp(40, 'puzzle'); const pz = TM.S.profile.puzzles = TM.S.profile.puzzles || {}; pz[id] = 1; TM.S.save(); if (Object.keys(TM.PUZZLES).every((k) => pz[k])) TM.S.feat('puzzler'); box.insertAdjacentHTML('beforeend', '<div class="pzwin">✓ SOLVED!</div>'); setTimeout(() => { TM.UI.close(); onDone && onDone(); }, 900); };
    m.querySelector('[data-hint]').onclick = () => { m.querySelector('#pzh').textContent = '💡 ' + D.hint; TM.Audio.play('ui'); };
    m.querySelector('[data-x]').onclick = () => { stop(); TM.UI.close(); };
    const G = {
      tune() {
        const step = D.step || .1, dec = step < 1 ? 1 : 0;
        box.innerHTML = `<div class="radio"><div class="freq" id="fq">${D.min.toFixed(dec)} ${D.unit}</div><div class="sig"><i id="sg"></i></div><div class="static" id="st">ksshhh...</div><input type="range" min="${D.min}" max="${D.max}" step="${step}" value="${D.min}" id="dial"></div>`;
        const d = box.querySelector('#dial');
        d.oninput = () => { const v = +d.value; box.querySelector('#fq').textContent = v.toFixed(dec) + ' ' + D.unit; const k = Math.max(0, 1 - Math.abs(v - D.target) / ((D.max - D.min) / 6)); box.querySelector('#sg').style.width = k * 100 + '%';
          box.querySelector('#st').textContent = Math.abs(v - D.target) < step * .6 ? D.lock : k > .6 ? '"...' + D.lock.slice(4, 18).replace(/[aeiou]/g, '.') + '..."' : 'ksshhh...';
          if (Math.abs(v - D.target) < step * .6) { TM.Audio.play('clue'); d.disabled = true; win(); } else if (Math.random() < .3) TM.Audio.play('blip'); };
      },
      recall() {
        const shown = D.shown, all = shown.concat(D.decoys);
        box.innerHTML = `<div class="recall"><div class="scene">${shown.map((s) => `<span>${s.split(' ')[0]}<small>${s.slice(s.indexOf(' ') + 1)}</small></span>`).join('')}</div><div class="count" id="cd">Memorize! 6</div></div>`;
        let n = 6; const t = setInterval(() => { n--; const cd = box.querySelector('#cd'); if (cd) cd.textContent = 'Memorize! ' + n; if (n <= 0) { clearInterval(t); ask(); } }, 1000); timers.push(t);
        const ask = () => {
          const opts = all.slice().sort(() => Math.random() - .5); const picked = new Set();
          box.innerHTML = `<p>Which ${shown.length} things were there? Tap them.</p><div class="pick">${opts.map((o) => `<button data-o="${o}">${o}</button>`).join('')}</div>`;
          box.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => {
            const o = b.dataset.o; if (shown.includes(o)) { b.classList.add('right'); b.disabled = true; picked.add(o); TM.Audio.play('ui'); if (picked.size === shown.length) win(); }
            else { b.classList.add('nope'); b.disabled = true; TM.Audio.play('wrong'); if (box.querySelectorAll('.nope').length >= 3) { box.insertAdjacentHTML('beforeend', '<p class="mag">Too many misses — look again.</p>'); setTimeout(() => G.recall(), 1200); } }
          });
        };
      },
      order() {
        let cur = D.items.map((x, i) => i).sort(() => Math.random() - .5); if (cur.every((v, i) => v === i)) cur.reverse(); let sel = null;
        const draw = () => { box.innerHTML = `<div class="order">${cur.map((k, i) => `<button data-i="${i}" class="${sel === i ? 'sel' : ''}"><span>${D.items[k][0]}</span><small>${D.items[k][1]}</small></button>`).join('')}</div><p class="dim">Tap two photos to swap them. Oldest on the left.</p>`;
          box.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const i = +b.dataset.i; TM.Audio.play('ui'); if (sel == null) { sel = i; draw(); return; } [cur[sel], cur[i]] = [cur[i], cur[sel]]; sel = null; draw(); if (cur.every((v, j) => v === j)) win(); }); };
        draw();
      },
      match() {
        const icons = D.icons; const deck = icons.concat(icons).sort(() => Math.random() - .5); let open = [], found = 0, lock = false;
        box.innerHTML = `<div class="memo">${deck.map((ic, i) => `<button data-i="${i}"><span>${ic}</span></button>`).join('')}</div>`;
        box.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => {
          if (lock || b.classList.contains('up')) return; b.classList.add('up'); TM.Audio.play('ui'); open.push(b);
          if (open.length === 2) { lock = true; const [a, c] = open; if (deck[a.dataset.i] === deck[c.dataset.i]) { a.classList.add('done'); c.classList.add('done'); found++; open = []; lock = false; TM.Audio.play('coin'); if (found === icons.length) win(); }
            else setTimeout(() => { a.classList.remove('up'); c.classList.remove('up'); open = []; lock = false; }, 750); }
        });
      },
      sequence() {
        // the Hartwell Chime: seven notes on a music box
        const notes = D.notes, keys = 7; let pos = 0, playing = false;
        box.innerHTML = `<div class="seq"><div class="keys">${Array.from({ length: keys }, (_, i) => `<button data-k="${i}" style="--h:${i * 40}"></button>`).join('')}</div><button class="btn ghost" data-play>▶ LISTEN</button><div class="dim" id="sq">Listen first.</div></div>`;
        const lit = (k) => { const b = box.querySelector(`[data-k="${k}"]`); if (!b) return; b.classList.add('lit'); TM.Audio.chime(k); setTimeout(() => b.classList.remove('lit'), 260); };
        const play = () => { playing = true; pos = 0; notes.forEach((n, i) => timers.push(setTimeout(() => { lit(n); if (i === notes.length - 1) setTimeout(() => { playing = false; box.querySelector('#sq').textContent = 'Your turn. Play it back.'; }, 300); }, 450 * i + 200))); };
        box.querySelector('[data-play]').onclick = play;
        box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { if (playing) return; const k = +b.dataset.k; lit(k);
          if (k === notes[pos]) { pos++; box.querySelector('#sq').textContent = `${pos} / ${notes.length}`; if (pos === notes.length) win(); }
          else { pos = 0; TM.Audio.play('wrong'); box.querySelector('#sq').textContent = 'Wrong note. Listen again.'; } });
        setTimeout(play, 500);
      },
      wheels() {
        const v = [0, 0, 0];
        const draw = () => { box.innerHTML = `<div class="safe"><div class="photo">🪞<small>${D.clueText}</small></div><div class="wheels">${v.map((n, i) => `<div><button data-u="${i}">▲</button><b>${n}</b><button data-d="${i}">▼</button></div>`).join('')}</div></div>`;
          box.querySelectorAll('[data-u]').forEach((b) => b.onclick = () => { v[+b.dataset.u] = (v[+b.dataset.u] + 1) % 10; TM.Audio.play('blip'); check(); });
          box.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { v[+b.dataset.d] = (v[+b.dataset.d] + 9) % 10; TM.Audio.play('blip'); check(); }); };
        const check = () => { draw(); if (v.join('') === D.code) { TM.Audio.play('block'); win(); } };
        draw();
      },
      keypad() {
        let code = '';
        box.innerHTML = `<div class="kp"><div class="cal"><small>${D.clueText}</small></div><div><div class="screen" id="ks">_ _ _</div><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div></div></div>`;
        const show = () => box.querySelector('#ks').textContent = (code + '___').slice(0, 3).split('').join(' ');
        box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { const k = b.dataset.k; TM.Audio.play('blip');
          if (k === 'C') code = ''; else if (k === '✓') { if (code === D.code) return win(); TM.Audio.play('wrong'); box.querySelector('#ks').textContent = 'WRONG'; code = ''; return; } else if (code.length < 3) code += k; show(); });
      },
      cipher() {
        const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const enc = D.plain.replace(/[A-Z]/g, (c) => A[(A.indexOf(c) + D.shift) % 26]); let k = 0;
        const dec = () => enc.replace(/[A-Z]/g, (c) => A[(A.indexOf(c) - k + 26) % 26]);
        const draw = () => { box.innerHTML = `<div class="cipher"><div class="tape">${U.esc(dec())}</div><div class="ring"><button data-m>◀</button><b>${A[k]} → A</b><button data-p>▶</button></div></div>`;
          box.querySelector('[data-m]').onclick = () => { k = (k + 25) % 26; TM.Audio.play('blip'); draw(); chk(); }; box.querySelector('[data-p]').onclick = () => { k = (k + 1) % 26; TM.Audio.play('blip'); draw(); chk(); }; };
        const chk = () => { if (dec() === D.plain) win(); };
        draw();
      },
      clock() {
        let h = 12, mm = 0;
        const draw = () => { const ha = ((h % 12) + mm / 60) * 30, ma = mm * 6;
          box.innerHTML = `<div class="clk"><svg viewBox="-50 -50 100 100" width="170" height="170"><circle r="46" fill="#1a1a22" stroke="#9aa4b2" stroke-width="3"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-1" y="-44" width="2" height="${i % 3 ? 4 : 8}" fill="#c8d0d8" transform="rotate(${i * 30})"/>`).join('')}<line x1="0" y1="0" x2="0" y2="-24" stroke="#e8e4d4" stroke-width="4" transform="rotate(${ha})"/><line x1="0" y1="0" x2="0" y2="-38" stroke="#e8b04a" stroke-width="2" transform="rotate(${ma})"/><circle r="3" fill="#e8e4d4"/></svg>
            <div class="row"><button class="btn ghost" data-h>HOUR +1</button><button class="btn ghost" data-m>MINUTE +1</button></div><div class="dim">${h}:${String(mm).padStart(2, '0')}</div></div>`;
          box.querySelector('[data-h]').onclick = () => { h = h % 12 + 1; TM.Audio.play('blip'); draw(); chk(); }; box.querySelector('[data-m]').onclick = () => { mm = (mm + 1) % 60; TM.Audio.play('blip'); draw(); chk(); }; };
        const chk = () => { if (h === D.h && mm === D.m) { TM.Audio.play('block'); win(); } };
        draw();
      },
      circuit() {
        const type = [['L', '-', 'L'], ['L', '-', 'L'], ['L', '-', 'L']];
        const want = [[1, 0, 2], [3, null, 0], [null, null, null]];
        const rot = [[0, 1, 0], [0, 0, 2], [1, 0, 3]];
        const glyph = (t, r) => t === '-' ? (r % 2 ? '│' : '─') : ['└', '┌', '┐', '┘'][r];
        const ok = () => want.every((row, y) => row.every((w, x) => w == null || (type[y][x] === '-' ? rot[y][x] % 2 === w % 2 : rot[y][x] === w)));
        const draw = () => { box.innerHTML = `<div class="circ"><span class="bat">⚙</span><div class="grid">${type.map((row, y) => row.map((t, x) => `<button data-c="${y},${x}" class="${want[y][x] != null ? 'path' : ''}">${glyph(t, rot[y][x])}</button>`).join('')).join('')}</div><span class="door">🌀</span></div>`;
          box.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { const [y, x] = b.dataset.c.split(',').map(Number); rot[y][x] = (rot[y][x] + 1) % 4; TM.Audio.play('ui'); draw(); if (ok()) win(); }); };
        draw();
      },
      spot() {
        const fake = Math.floor(Math.random() * 15);
        box.innerHTML = `<div class="bricks">${Array.from({ length: 15 }, (_, i) => `<button data-b="${i}" class="${i === fake ? 'fake' : ''}"></button>`).join('')}</div>`;
        box.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { if (+b.dataset.b === fake) { b.classList.add('right'); win(); } else { b.classList.add('nope'); TM.Audio.play('wrong'); } });
      },
      torn() {
        const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
        x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, 160, 160);
        x.strokeStyle = '#3a2a22'; x.lineWidth = 3;   // Ivy's last drawing: the antlered shape, and a boy walking into light
        x.beginPath(); x.moveTo(60, 150); x.lineTo(62, 70); x.lineTo(50, 40); x.moveTo(62, 70); x.lineTo(80, 72); x.lineTo(84, 150); x.stroke();
        x.beginPath(); x.moveTo(56, 44); x.lineTo(44, 14); x.moveTo(50, 30); x.lineTo(38, 26); x.moveTo(68, 44); x.lineTo(80, 12); x.moveTo(74, 28); x.lineTo(88, 24); x.stroke();
        x.fillStyle = '#fff6c0'; x.beginPath(); x.arc(126, 60, 26, 0, 7); x.fill(); x.fillStyle = '#3a2a22'; x.fillRect(118, 92, 6, 22); x.fillRect(116, 84, 10, 9);
        x.font = '12px serif'; x.fillStyle = '#7a1a2e'; x.fillText('bye Bernard', 88, 150);
        const url = c.toDataURL(); const rot = [1, 2, 3, 1];
        const draw = () => { box.innerHTML = `<div class="torn">${[0, 1, 2, 3].map((i) => `<button data-p="${i}" style="background-image:url(${url});background-position:${i % 2 ? '-80px' : '0'} ${i > 1 ? '-80px' : '0'};transform:rotate(${rot[i] * 90}deg)"></button>`).join('')}</div>`;
          box.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { rot[+b.dataset.p] = (rot[+b.dataset.p] + 1) % 4; TM.Audio.play('ui'); if (rot.every((r) => r === 0)) { draw(); win(); } else draw(); }); };
        draw();
      },
    };
    G[D.type]();
    const obs = setInterval(() => { if (!document.getElementById('pz')) { stop(); clearInterval(obs); } }, 500);
  };
  return P;
})();
