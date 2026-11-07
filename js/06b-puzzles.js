/* =========================================================================
   TECHNOMANCERS — 06b-puzzles.js
   Hands-on puzzles and memory games. No code, no math. Every one has a HINT.
     tune    — slide the radio dial until the signal locks
     torn    — rotate torn sketch pieces back together
     recall  — memory: study the crime scene, then pick what you saw
     keypad  — office keypad (the code is on the calendar)
     match   — memory: flip evidence tags, find the pairs
     wheels  — 3-wheel safe lock (the number is on a framed photo)
     circuit — rotate wires to bring power to the door
     spot    — find the one fake brick in the illusion wall
   ========================================================================= */
'use strict';
TM.Puzzle = (() => {
  const U = TM.U; const P = {};
  const INFO = {
    tune: ['TUNE THE RADIO', 'Slide the dial until the signal bar fills up.', 'The news station is somewhere past 100.'],
    torn: ['FIX THE TORN PAGE', 'Tap each piece to turn it. Make the drawing whole again.', 'Line up the big circle first — it runs through all four pieces.'],
    recall: ['REMEMBER THE SCENE', 'Study the scene. Then pick what you saw.', 'There were 4 things on the floor. Take your time on the first look.'],
    keypad: ['OFFICE KEYPAD', 'Type the 3-digit door code.', 'Look at the calendar. Which day is circled? Month then day.'],
    match: ['FIND CALLOWAY\'S BOX', 'Flip two tags at a time. Match every pair to find the right box.', 'Remember where each picture was when it flips back.'],
    wheels: ['THE CHIEF\'S SAFE', 'Turn the three wheels to the right number.', 'Proud men frame their badge. Check the photo on the desk.'],
    circuit: ['RESTORE POWER', 'Tap the wire pieces to turn them. Connect ⚡ to the door 🚪.', 'Start from the battery and follow one piece at a time.'],
    spot: ['THE STRANGE WALL', 'One brick isn\'t real. Find it.', 'Watch closely — the fake one flickers for a split second.'],
  };
  P.open = (id, onDone) => {
    const [title, how, hint] = INFO[id];
    const m = TM.UI.modal(`<div class="kicker">🧩 PUZZLE</div><h2>${title}</h2><p class="dim">${how}</p><div class="pz" id="pz"></div><div class="qhint" id="pzh"></div><div class="row"><button class="btn ghost" data-hint>💡 HINT</button><button class="btn ghost" data-x>LATER</button></div>`, 'puzzle');
    const box = m.querySelector('#pz'); let solved = false;
    const win = () => { if (solved) return; solved = true; TM.Audio.play('nova'); TM.S.xp(40, 'puzzle'); const pz = TM.S.profile.puzzles = TM.S.profile.puzzles || {}; pz[id] = 1; TM.S.save(); if (Object.keys(INFO).every((k) => pz[k])) TM.S.feat('puzzler'); box.insertAdjacentHTML('beforeend', '<div class="pzwin">✓ SOLVED!</div>'); setTimeout(() => { TM.UI.close(); onDone && onDone(); }, 900); };
    m.querySelector('[data-hint]').onclick = () => { m.querySelector('#pzh').textContent = '💡 ' + hint; TM.Audio.play('ui'); };
    m.querySelector('[data-x]').onclick = () => { stop(); TM.UI.close(); };
    let timers = []; const stop = () => timers.forEach(clearInterval);
    const G = {
      tune() {
        const target = 104.3;
        box.innerHTML = `<div class="radio"><div class="freq" id="fq">88.0</div><div class="sig"><i id="sg"></i></div><div class="static" id="st">ksshhh...</div><input type="range" min="88" max="108" step=".1" value="88" id="dial"></div>`;
        const d = box.querySelector('#dial');
        d.oninput = () => { const v = +d.value; box.querySelector('#fq').textContent = v.toFixed(1); const k = Math.max(0, 1 - Math.abs(v - target) / 4); box.querySelector('#sg').style.width = k * 100 + '%'; box.querySelector('#st').textContent = k > .95 ? '"...found dead in the Hartwell mansion..."' : k > .6 ? '"...wom...n... f..nd..."' : 'ksshhh...'; if (k > .95) { TM.Audio.play('clue'); d.disabled = true; win(); } else if (Math.random() < .3) TM.Audio.play('blip'); };
      },
      torn() {
        const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
        x.fillStyle = '#e8e2d4'; x.fillRect(0, 0, 160, 160); x.lineWidth = 4;
        x.strokeStyle = '#6df0ff'; x.beginPath(); x.arc(80, 80, 52, 0, 7); x.stroke(); x.strokeStyle = '#ff7bd5'; x.beginPath(); x.arc(80, 80, 30, 0, 7); x.stroke();
        x.fillStyle = '#fff36b'; x.beginPath(); x.ellipse(80, 80, 18, 12, 0, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.ellipse(80, 80, 15, 10, 0, 0, 7); x.fill();
        x.strokeStyle = '#333'; x.lineWidth = 2; x.beginPath(); x.moveTo(10, 150); x.lineTo(150, 10); x.stroke(); x.font = '14px serif'; x.fillStyle = '#333'; x.fillText('GABRIEL', 50, 150);
        const url = c.toDataURL(); const rot = [1, 2, 3, 1];
        const draw = () => { box.innerHTML = `<div class="torn">${[0, 1, 2, 3].map((i) => `<button data-p="${i}" style="background-image:url(${url});background-position:${i % 2 ? '-80px' : '0'} ${i > 1 ? '-80px' : '0'};transform:rotate(${rot[i] * 90}deg)"></button>`).join('')}</div>`;
          box.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { rot[+b.dataset.p] = (rot[+b.dataset.p] + 1) % 4; TM.Audio.play('ui'); if (rot.every((r) => r === 0)) { draw(); win(); } else draw(); }); };
        draw();
      },
      recall() {
        const all = ['🎫 train ticket', '👟 one shoe', '🩸 blood stain', '📓 sketchbook', '🔦 flashlight', '🔑 car keys', '💵 cash', '🕯 candle', '📱 pager', '🧤 glove'];
        const shown = ['🎫 train ticket', '👟 one shoe', '🩸 blood stain', '🕯 candle'];
        box.innerHTML = `<div class="recall"><div class="scene">${shown.map((s) => `<span>${s.split(' ')[0]}<small>${s.slice(s.indexOf(' ') + 1)}</small></span>`).join('')}</div><div class="count" id="cd">Memorize! 6</div></div>`;
        let n = 6; const t = setInterval(() => { n--; const cd = box.querySelector('#cd'); if (cd) cd.textContent = 'Memorize! ' + n; if (n <= 0) { clearInterval(t); ask(); } }, 1000); timers.push(t);
        const ask = () => {
          const opts = all.slice().sort(() => Math.random() - .5); const picked = new Set();
          box.innerHTML = `<p>Which 4 things were there? Tap them.</p><div class="pick">${opts.map((o) => `<button data-o="${o}">${o}</button>`).join('')}</div>`;
          box.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => {
            const o = b.dataset.o; if (shown.includes(o)) { b.classList.add('right'); b.disabled = true; picked.add(o); TM.Audio.play('ui'); if (picked.size === 4) win(); }
            else { b.classList.add('nope'); b.disabled = true; TM.Audio.play('wrong'); if (box.querySelectorAll('.nope').length >= 3) { box.insertAdjacentHTML('beforeend', '<p class="mag">Too many misses — look again.</p>'); setTimeout(() => G.recall(), 1200); } }
          });
        };
      },
      keypad() {
        let code = '';
        box.innerHTML = `<div class="kp"><div class="cal"><b>JULY 1996</b><div class="days">${Array.from({ length: 31 }, (_, i) => `<span class="${i + 1 === 14 ? 'circ' : ''}">${i + 1}</span>`).join('')}</div><small>"Vinnie's B-day!!"</small></div><div><div class="screen" id="ks">_ _ _</div><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '✓'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div></div></div>`;
        const show = () => box.querySelector('#ks').textContent = (code + '___').slice(0, 3).split('').join(' ');
        box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { const k = b.dataset.k; TM.Audio.play('blip');
          if (k === 'C') code = ''; else if (k === '✓') { if (code === '714') return win(); TM.Audio.play('wrong'); box.querySelector('#ks').textContent = 'WRONG'; code = ''; return; } else if (code.length < 3) code += k; show(); });
      },
      match() {
        const icons = ['📼', '🔫', '🧤', '📒', '🔑', '📸'];
        const deck = icons.concat(icons).sort(() => Math.random() - .5); let open = [], found = 0, lock = false;
        box.innerHTML = `<div class="memo">${deck.map((ic, i) => `<button data-i="${i}"><span>${ic}</span></button>`).join('')}</div>`;
        box.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => {
          if (lock || b.classList.contains('up')) return; b.classList.add('up'); TM.Audio.play('ui'); open.push(b);
          if (open.length === 2) { lock = true; const [a, c] = open; if (deck[a.dataset.i] === deck[c.dataset.i]) { a.classList.add('done'); c.classList.add('done'); found++; open = []; lock = false; TM.Audio.play('coin'); if (found === icons.length) win(); }
            else setTimeout(() => { a.classList.remove('up'); c.classList.remove('up'); open = []; lock = false; }, 750); }
        });
      },
      wheels() {
        const v = [0, 0, 0];
        const draw = () => { box.innerHTML = `<div class="safe"><div class="photo">🖼<small>Chief Hale — Badge <b>No. 317</b> — 20 Years of Service</small></div><div class="wheels">${v.map((n, i) => `<div><button data-u="${i}">▲</button><b>${n}</b><button data-d="${i}">▼</button></div>`).join('')}</div></div>`;
          box.querySelectorAll('[data-u]').forEach((b) => b.onclick = () => { v[+b.dataset.u] = (v[+b.dataset.u] + 1) % 10; TM.Audio.play('blip'); check(); });
          box.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { v[+b.dataset.d] = (v[+b.dataset.d] + 9) % 10; TM.Audio.play('blip'); check(); }); };
        const check = () => { draw(); if (v.join('') === '317') { TM.Audio.play('block'); win(); } };
        draw();
      },
      circuit() {
        // pieces: '-' straight, 'L' corner. Route: battery → (1,0) up → (0,0) → (0,1) → (0,2) down → (1,2) → door (middle row)
        const type = [['L', '-', 'L'], ['L', '-', 'L'], ['L', '-', 'L']];
        const want = [[1, 0, 2], [3, null, 0], [null, null, null]];
        const rot = [[0, 1, 0], [0, 0, 2], [1, 0, 3]];
        const glyph = (t, r) => t === '-' ? (r % 2 ? '│' : '─') : ['└', '┌', '┐', '┘'][r];
        const ok = () => want.every((row, y) => row.every((w, x) => w == null || (type[y][x] === '-' ? rot[y][x] % 2 === w % 2 : rot[y][x] === w)));
        const draw = () => { box.innerHTML = `<div class="circ"><span class="bat">⚡</span><div class="grid">${type.map((row, y) => row.map((t, x) => `<button data-c="${y},${x}" class="${want[y][x] != null ? 'path' : ''}">${glyph(t, rot[y][x])}</button>`).join('')).join('')}</div><span class="door">🚪</span></div>`;
          box.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { const [y, x] = b.dataset.c.split(',').map(Number); rot[y][x] = (rot[y][x] + 1) % 4; TM.Audio.play('ui'); draw(); if (ok()) win(); }); };
        draw();
      },
      spot() {
        const fake = Math.floor(Math.random() * 15);
        box.innerHTML = `<div class="bricks">${Array.from({ length: 15 }, (_, i) => `<button data-b="${i}" class="${i === fake ? 'fake' : ''}"></button>`).join('')}</div>`;
        box.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { if (+b.dataset.b === fake) { b.classList.add('right'); win(); } else { b.classList.add('nope'); TM.Audio.play('wrong'); } });
      },
    };
    G[id]();
    const obs = setInterval(() => { if (!document.getElementById('pz')) { stop(); clearInterval(obs); } }, 500);
  };
  return P;
})();
