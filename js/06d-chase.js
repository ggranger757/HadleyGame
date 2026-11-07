/* =========================================================================
   CHRONOMANCER — 06d-chase.js
   RAINCASTER RUN: a side-scrolling car chase through neo-noir Raincaster.
   ▲ ▼ change lanes · BOOST (limited) · beat the clock to 3:07.
   Traffic to weave through, Hale's cruisers that box you in and ram you,
   puddles that slide you, the bridge barricade with one lane open.
   Story mode (chapter 5) and ARCADE mode (endless, best distance saved).
   ========================================================================= */
'use strict';
TM.Chase = (() => {
  const C = {}; let st = null, raf = 0, last = 0;
  const W = 480, H = 270, LANES = [206, 222, 238], ROAD_TOP = 194;
  const imgs = {}; const img = (s) => { if (!imgs[s]) { const i = new Image(); i.src = s; imgs[s] = i; } return imgs[s]; };
  const keys = {};
  const kd = (e) => { if (!st) return; const k = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'boost', ShiftLeft: 'boost', Escape: 'quit' }[e.code]; if (k) { e.preventDefault(); e.stopPropagation(); if (!keys[k]) press(k); keys[k] = true; } };
  const ku = (e) => { const k = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'boost', ShiftLeft: 'boost' }[e.code]; if (k) keys[k] = false; };

  C.start = (mode, onDone) => {
    const arcade = mode === 'arcade';
    st = { arcade, onDone, x: 0, speed: 120, lane: 1, ly: LANES[1], boost: 3, boostT: 0, time: arcade ? 0 : 82, goal: 7600, cars: [], cops: [], fx: [], puddles: [], hits: 0, slide: 0,
      shake: 0, t: 0, spawn: 1, copSpawn: 6, over: false, msg: arcade ? 'ARCADE: how far can you get?' : 'Get to the Clockworks before 3:07!', msgT: 3, bridge: false };
    const ov = document.getElementById('chase');
    ov.innerHTML = `<canvas id="chcv" width="${W}" height="${H}"></canvas>
      <div class="chud"><span id="chclock">2:44 AM</span><span id="chdist"></span><span id="chboost"></span></div>
      <div class="cctl"><div class="cl"><button data-c="up">▲</button><button data-c="down">▼</button></div><button class="cb" data-c="boost">BOOST</button></div>
      <button class="cx" data-c="quit">✕</button>`;
    ov.className = 'chase on'; TM.UI.chaseOn(true);
    ov.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); TM.Audio.init(); press(b.dataset.c); }));
    window.addEventListener('keydown', kd, true); window.addEventListener('keyup', ku, true);
    fit(); window.addEventListener('resize', fit);
    TM.Audio.setMood('chase'); TM.Audio.setRain(true);
    last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };
  function fit() { const cv = document.getElementById('chcv'); if (!cv) return; const s = Math.min(innerWidth / W, innerHeight / H); cv.style.width = W * s + 'px'; cv.style.height = H * s + 'px'; }
  function press(k) {
    if (!st || st.over) { if (st && st.over && k !== 'quit') return; if (k === 'quit') end(false, true); return; }
    if (k === 'up') st.lane = Math.max(0, st.lane - 1);
    if (k === 'down') st.lane = Math.min(2, st.lane + 1);
    if (k === 'boost' && st.boost > 0 && st.boostT <= 0) { st.boost--; st.boostT = 2.2; TM.Audio.play('nova'); }
    if (k === 'quit') end(false, true);
    TM.Audio.play('ui');
  }
  function laneOf(y) { let b = 0; LANES.forEach((l, i) => { if (Math.abs(l - y) < Math.abs(LANES[b] - y)) b = i; }); return b; }
  const kinds = ['hatch', 'sedan', 'wagon', 'taxi', 'limo'];
  function update(dt) {
    const s = st; s.t += dt; s.msgT -= dt;
    if (!s.arcade) s.time -= dt; else s.time += dt;
    const target = 150 + (s.boostT > 0 ? 120 : 0) + (s.arcade ? Math.min(90, s.t * 1.2) : 0);
    s.speed += (target - s.speed) * Math.min(1, dt * 1.6); s.boostT -= dt;
    s.x += s.speed * dt;
    if (s.slide > 0) { s.slide -= dt; } else s.ly += (LANES[s.lane] - s.ly) * Math.min(1, dt * 9);
    s.shake = Math.max(0, s.shake - dt);
    // traffic: slower cars ahead
    s.spawn -= dt; if (s.spawn <= 0) { s.spawn = Math.max(.45, 1.3 - s.t * .006) + Math.random() * .6; const lane = Math.floor(Math.random() * 3); if (!s.cars.some((c) => c.lane === lane && c.x - s.x > 360)) s.cars.push({ x: s.x + 520, lane, y: LANES[lane], v: 60 + Math.random() * 40, kind: kinds[Math.floor(Math.random() * kinds.length)] }); }
    if (Math.random() < dt * .35) s.puddles.push({ x: s.x + 520, lane: Math.floor(Math.random() * 3) });
    // cops from behind
    s.copSpawn -= dt; if (s.copSpawn <= 0 && s.cops.length < (s.arcade ? 3 : 2)) { s.copSpawn = 7 + Math.random() * 5; s.cops.push({ x: s.x - 120, lane: Math.floor(Math.random() * 3), y: 0, v: 0, ram: 0 }); s.cops[s.cops.length - 1].y = LANES[s.cops[s.cops.length - 1].lane]; TM.Audio.play('sting'); s.msg = 'COPS! Hale\'s cruisers behind you.'; s.msgT = 2; }
    for (const c of s.cars) { c.x += c.v * dt; c.y += (LANES[c.lane] - c.y) * dt * 4; }
    for (const p of s.cops) {
      p.v = s.speed + (p.x < s.x - 40 ? 40 : -10) + Math.sin(s.t * 2) * 10; p.x += p.v * dt;
      // line up with you, then swerve into you
      p.ram -= dt; if (p.ram <= 0 && Math.abs(p.x - s.x) < 50) { p.lane = s.lane; p.ram = 1.4; }
      p.y += (LANES[p.lane] - p.y) * dt * 5;
    }
    // bridge barricade near the end (story)
    if (!s.arcade && !s.bridge && s.x > s.goal - 900) { s.bridge = true; const open = Math.floor(Math.random() * 3); [0, 1, 2].filter((l) => l !== open).forEach((l) => s.cars.push({ x: s.x + 480, lane: l, y: LANES[l], v: 0, kind: 'barrier' })); s.msg = 'BARRICADE! One lane is open.'; s.msgT = 2.5; }
    // collisions
    const pl = laneOf(s.ly);
    const hit = (o, len) => o.lane === pl && Math.abs(o.x - s.x) < len;
    for (const c of s.cars) if (!c.hit && hit(c, c.kind === 'limo' ? 40 : 30)) { c.hit = true; crash(c.kind === 'barrier' ? 4 : 2.5); c.v = s.speed * .4; }
    for (const p of s.cops) if (hit(p, 28) && !p.cool) { p.cool = 1.2; crash(3); p.x -= 30; }
    for (const p of s.cops) if (p.cool) p.cool = Math.max(0, p.cool - dt);
    for (const pd of s.puddles) if (!pd.done && pd.lane === pl && Math.abs(pd.x - s.x) < 14) { pd.done = true; s.slide = .5; const nl = Math.max(0, Math.min(2, s.lane + (Math.random() < .5 ? -1 : 1))); s.lane = nl; s.ly += (LANES[nl] - s.ly) * .4; TM.Audio.play('swing'); }
    s.cars = s.cars.filter((c) => c.x > s.x - 200); s.puddles = s.puddles.filter((p) => p.x > s.x - 100); s.cops = s.cops.filter((p) => p.x > s.x - 300);
    s.fx = s.fx.filter((f) => (f.t += dt) < f.life);
    if (Math.random() < dt * 30) s.fx.push({ x: s.x - 18 + (Math.random() * 6), y: s.ly + 2, vx: -40 - Math.random() * 40, vy: -Math.random() * 20, t: 0, life: .4, c: 'rgba(160,170,200,.6)' });
    // end conditions
    if (!s.arcade && s.x >= s.goal) end(true);
    else if (!s.arcade && s.time <= 0) end(false);
    else if (s.arcade && s.hits >= 6) end(true);
  }
  function crash(sev) {
    const s = st; s.hits++; s.speed *= .45; s.shake = .4; TM.Audio.play('explode'); TM.U.vibrate(60);
    if (!s.arcade) { s.time -= sev * 82 / 23; s.msg = `CRASH! −${Math.round(sev)} min`; } else s.msg = `CRASH! (${6 - s.hits} left)`;
    s.msgT = 1.4; for (let i = 0; i < 14; i++) s.fx.push({ x: s.x + 20, y: s.ly - 4, vx: (Math.random() - .5) * 140, vy: -Math.random() * 90, t: 0, life: .6, c: Math.random() < .5 ? '#ffd23a' : '#ff6b3a' });
  }
  function clock() { const s = st; if (s.arcade) return TM.U.fmtTime(s.time); const el = 23 - Math.max(0, s.time) / 82 * 23; const tm = 164 + Math.floor(el); return `${Math.floor(tm / 60)}:${String(tm % 60).padStart(2, '0')} AM`; }
  function draw() {
    const cv = document.getElementById('chcv'); if (!cv) return; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; const s = st;
    x.save(); if (s.shake > 0) x.translate((Math.random() - .5) * 6, (Math.random() - .5) * 4);
    // parallax neo-noir city
    const bg = TM.BG.nn_city; const facs = [.02, .12, .3, .6];
    for (let i = 0; i < 4; i++) { const im = img(`assets/bg/nn_city/${bg.layers[i]}.png`); if (!im.complete || !im.width) continue; const off = ((s.x * facs[i]) % im.width + im.width) % im.width; for (let px = -off; px < W; px += im.width) x.drawImage(im, Math.round(px), H - im.height - 38); }
    // road
    x.fillStyle = '#120c18'; x.fillRect(0, ROAD_TOP, W, H - ROAD_TOP); x.fillStyle = '#3a2a52'; x.fillRect(0, ROAD_TOP, W, 1);
    for (let i = 0; i < 2; i++) { const y = (LANES[i] + LANES[i + 1]) / 2 + 2; const off = (s.x % 32); for (let px = -off; px < W; px += 32) { x.fillStyle = '#5a4a2a'; x.fillRect(px, y, 14, 1); } }
    x.fillStyle = '#2a1e36'; x.fillRect(0, H - 14, W, 14);
    const cam = s.x - 120; const sx = (wx) => Math.round(wx - cam);
    // neon reflections smeared on the road
    for (let i = 0; i < 8; i++) { const px = ((i * 71 - s.x * .6) % W + W) % W; x.fillStyle = ['rgba(255,79,216,.12)', 'rgba(42,230,255,.1)'][i % 2]; x.fillRect(px, ROAD_TOP + 4, 3, H - ROAD_TOP - 18); }
    for (const p of s.puddles) { x.fillStyle = 'rgba(120,140,190,.35)'; x.fillRect(sx(p.x) - 10, LANES[p.lane] + 2, 20, 2); x.fillStyle = 'rgba(255,79,216,.25)'; x.fillRect(sx(p.x) - 6, LANES[p.lane] + 2, 6, 1); }
    // things sorted by lane depth
    const objs = s.cars.map((c) => ({ ...c, t: 'car' })).concat(s.cops.map((p) => ({ ...p, t: 'cop' }))).concat([{ t: 'me', x: s.x, y: s.ly }]).sort((a, b) => a.y - b.y);
    for (const o of objs) {
      if (o.t === 'car' && o.kind === 'barrier') { const bx = sx(o.x); x.fillStyle = '#100c14'; x.fillRect(bx - 12, o.y - 12, 26, 13); for (let k = 0; k < 24; k += 6) { x.fillStyle = k % 12 ? '#f0f0f0' : '#e03030'; x.fillRect(bx - 11 + k, o.y - 11, 6, 5); } x.fillStyle = (s.t * 4 | 0) % 2 ? '#ff3040' : '#ffb030'; x.fillRect(bx - 10, o.y - 15, 2, 2); x.fillRect(bx + 10, o.y - 15, 2, 2); continue; }
      const kind = o.t === 'me' ? 'wagon' : o.t === 'cop' ? 'police' : o.kind; const c = TM.W.carSprite(kind);
      x.drawImage(c, sx(o.x) - c.width / 2, o.y - c.height + 4);
      if (o.t === 'cop') { const on = (s.t * 6 | 0) % 2; x.fillStyle = on ? 'rgba(255,48,64,.35)' : 'rgba(48,96,255,.35)'; x.beginPath(); x.arc(sx(o.x) - 4, o.y - 16, 14, 0, 7); x.fill(); }
      if (o.t === 'me' && s.boostT > 0) { for (let k = 0; k < 3; k++) { x.fillStyle = ['#ff4fd8', '#ffd23a', '#2ae6ff'][k]; x.fillRect(sx(o.x) - c.width / 2 - 4 - k * 3 - Math.random() * 4, o.y - 6 + k, 4, 1); } }
      if (o.t === 'me') { x.fillStyle = 'rgba(255,246,192,.12)'; x.beginPath(); x.moveTo(sx(o.x) + 20, o.y - 6); x.lineTo(sx(o.x) + 90, o.y - 16); x.lineTo(sx(o.x) + 90, o.y + 4); x.fill(); }
    }
    for (const f of s.fx) { x.fillStyle = f.c; x.fillRect(sx(f.x + f.vx * f.t), f.y + f.vy * f.t + 80 * f.t * f.t, 2, 2); }
    // rain
    x.strokeStyle = 'rgba(170,185,210,.35)'; x.beginPath(); for (let i = 0; i < 90; i++) { const rx = (i * 53 + s.t * 300) % (W + 40) - 20, ry = (i * 97 + s.t * 420) % H; x.moveTo(W - rx, ry); x.lineTo(W - rx - 3, ry - 8); } x.stroke();
    // progress bar
    if (!s.arcade) { x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(80, 8, 320, 6); x.fillStyle = '#ff4fd8'; x.fillRect(80, 8, 320 * Math.min(1, s.x / s.goal), 6); x.fillStyle = '#fff'; x.font = 'bold 8px "Courier New", monospace'; x.textAlign = 'right'; x.fillText('CLOCKWORKS', 400, 24); }
    if (s.msgT > 0) { x.font = 'bold 11px "Courier New", monospace'; x.textAlign = 'center'; x.fillStyle = '#000'; x.fillText(s.msg, W / 2 + 1, 46); x.fillStyle = '#ffd23a'; x.fillText(s.msg, W / 2, 45); }
    x.restore();
    document.getElementById('chclock').textContent = s.arcade ? '⏱ ' + clock() : '🕒 ' + clock();
    document.getElementById('chdist').textContent = s.arcade ? Math.floor(s.x / 10) + ' m' : Math.max(0, Math.floor((s.goal - s.x) / 10)) + ' m to go';
    document.getElementById('chboost').textContent = 'BOOST ' + '●'.repeat(s.boost) + '○'.repeat(Math.max(0, 3 - s.boost));
  }
  function loop(ts) {
    if (!st) return; const dt = Math.min(.05, (ts - last) / 1000); last = ts;
    if (!st.over) update(dt); draw(); raf = requestAnimationFrame(loop);
  }
  function end(ok, quit) {
    const s = st; if (!s || s.over) return; s.over = true;
    const finish = () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true); window.removeEventListener('resize', fit); document.getElementById('chase').className = 'chase'; document.getElementById('chase').innerHTML = ''; TM.UI.chaseOn(false); const cb = s.onDone; st = null; return cb; };
    if (quit) { const cb = finish(); if (!s.arcade && TM.W.state.sc) TM.Audio.setMood(TM.W.sceneMusic()); if (s.arcade) TM.UI.title(); else cb && cb(false); return; }
    if (s.arcade) {
      const dist = Math.floor(s.x / 10), p = TM.S.profile; const best = p.chaseBest || 0; if (dist > best) { p.chaseBest = dist; TM.S.save(); }
      TM.Audio.play(dist > best ? 'rank' : 'lose'); TM.S.xp(Math.floor(dist / 40), 'run');
      const cb = finish();
      const m = TM.UI.modal(`<div class="kicker">RAINCASTER RUN</div><h2>${dist} m</h2><p>${dist > best ? '🏆 NEW BEST!' : 'Best: ' + best + ' m'}</p><button class="btn big" data-a>RUN AGAIN</button><button class="btn ghost" data-t>TITLE</button>`);
      m.querySelector('[data-a]').onclick = () => { TM.UI.close(); C.start('arcade'); }; m.querySelector('[data-t]').onclick = () => { TM.UI.close(); TM.UI.title(); };
      return;
    }
    TM.Audio.play(ok ? 'win' : 'lose');
    setTimeout(() => {
      const cb = finish(); TM.Audio.setMood(TM.W.sceneMusic());
      if (ok) { TM.S.xp(80 + Math.max(0, 6 - s.hits) * 15, 'chase'); TM.UI.notice('YOU MADE IT', s.hits ? `You slide into the Clockworks lot with ${s.hits} dent${s.hits > 1 ? 's' : ''} and seconds to spare.` : 'Not a scratch. Ruth would be proud of her car.', () => cb && cb(true)); }
      else TM.UI.notice('TOO LATE', 'The clock beats you to the bridge. Try again — weave earlier, save your BOOST for the straight, and watch for cruisers lining up in your lane.', () => C.start('tower', cb));
    }, 700);
  }
  C.active = () => !!st; C._st = () => st;
  return C;
})();
