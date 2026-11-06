/* =========================================================================
   TECHNOMANCERS — 03-input.js
   Keyboard (remappable) + touch (virtual stick & buttons) + Gamepad API.
   Game code reads TM.In.axis(), TM.In.held(action), TM.In.hit(action).
   ========================================================================= */
'use strict';

TM.In = (() => {
  const held = {}, hits = {}, keyHeld = {};
  let stick = { x: 0, y: 0, active: false }, padPrev = {}, listenCb = null, touchMode = false;
  const ACTIONS = ['up', 'down', 'left', 'right', 'sprint', 'interact', 'attack', 'kit', 'cycle', 'swap', 'anchor', 'detective', 'light', 'board', 'pause'];
  const LABELS = { up: 'Move up', down: 'Move down', left: 'Move left', right: 'Move right', sprint: 'Sprint', interact: 'Interact / Inspect', attack: 'Attack / Fire', kit: 'Use kit item', cycle: 'Cycle kit', swap: 'Swap head / weapon', anchor: 'Reality Anchor ping', detective: 'Detective mode', light: 'Flashlight', board: 'Evidence Board', pause: 'Pause' };
  const ALT = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Space: 'attack', Enter: 'interact', ShiftRight: 'sprint', KeyB: 'board' };

  function actionFor(code) { const k = TM.S.profile.keys; for (const a in k) if (k[a] === code) return a; return ALT[code] || null; }
  function press(a) { if (!held[a]) hits[a] = true; held[a] = true; }
  function release(a) { held[a] = false; }

  window.addEventListener('keydown', e => {
    TM.Audio.init();
    if (listenCb) { e.preventDefault(); const cb = listenCb; listenCb = null; cb(e.code); return; }
    if (TM.UI && TM.UI.onKey && TM.UI.onKey(e)) { e.preventDefault(); return; }
    const a = actionFor(e.code); if (!a) return;
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || a === 'board') e.preventDefault();
    keyHeld[e.code] = true; press(a); setTouch(false);
  });
  window.addEventListener('keyup', e => { keyHeld[e.code] = false; const a = actionFor(e.code); if (a) release(a); });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; stick = { x: 0, y: 0, active: false }; });

  /* ---------------- touch controls ---------------- */
  function setTouch(on) { touchMode = on; document.body.classList.toggle('touch', on); }
  function buildTouch() {
    const wrap = document.getElementById('touch'); if (!wrap) return;
    const base = wrap.querySelector('.stick'), nub = wrap.querySelector('.nub');
    let id = null, cx = 0, cy = 0;
    const R = 46;
    base.addEventListener('pointerdown', e => { TM.Audio.init(); id = e.pointerId; base.setPointerCapture(id); const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); setTouch(true); });
    base.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
    const end = e => { if (e.pointerId !== id) return; id = null; stick = { x: 0, y: 0, active: false }; nub.style.transform = 'translate(-50%,-50%)'; release('sprint'); };
    base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
    function move(e) {
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      stick = { x: dx / R, y: dy / R, active: true }; nub.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      // push the stick to the rim to sprint
      if (d > R * 1.05) press('sprint'); else release('sprint');
    }
    wrap.querySelectorAll('[data-act]').forEach(b => {
      const a = b.dataset.act;
      b.addEventListener('pointerdown', e => { e.preventDefault(); TM.Audio.init(); setTouch(true); press(a); b.classList.add('on'); TM.U.vibrate(8); });
      const up = () => { release(a); b.classList.remove('on'); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    });
    if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) setTouch(true);
  }

  /* ---------------- gamepad ---------------- */
  const PADMAP = { 0: 'interact', 2: 'attack', 1: 'kit', 3: 'swap', 4: 'cycle', 5: 'anchor', 7: 'sprint', 6: 'detective', 8: 'board', 9: 'pause', 10: 'light' };
  function pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; const p = pads && [...pads].find(Boolean); if (!p) return;
    for (const b in PADMAP) { const on = p.buttons[b] && p.buttons[b].pressed; const a = PADMAP[b]; if (on && !padPrev[b]) { press(a); if (TM.UI && TM.UI.onPad) TM.UI.onPad(a); } if (!on && padPrev[b]) release(a); padPrev[b] = on; }
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0; const dz = .2;
    if (Math.hypot(ax, ay) > dz) stick = { x: ax, y: ay, active: true, pad: true }; else if (stick.pad) stick = { x: 0, y: 0, active: false };
    // dpad
    const d = { 12: 'up', 13: 'down', 14: 'left', 15: 'right' }; for (const b in d) { const on = p.buttons[b] && p.buttons[b].pressed; if (on) press(d[b]); else if (padPrev[b]) release(d[b]); padPrev[b] = on; }
  }

  return {
    ACTIONS, LABELS, buildTouch, pollPad,
    get touch() { return touchMode; },
    axis() {
      let x = (held.right ? 1 : 0) - (held.left ? 1 : 0), y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (stick.active) { x = stick.x; y = stick.y; }
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } return { x, y };
    },
    held: a => !!held[a],
    hit: a => { if (hits[a]) { hits[a] = false; return true; } return false; },
    peek: a => !!hits[a],
    clearHits() { for (const k in hits) hits[k] = false; },
    listen(cb) { listenCb = cb; },
    keyName(code) { return (code || '—').replace(/^Key/, '').replace(/^Digit/, '').replace('Left', ' L').replace('Right', ' R').replace('Arrow', '').replace('Escape', 'Esc'); },
  };
})();
