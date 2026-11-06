/* =========================================================================
   TECHNOMANCERS — 05-render.js
   All art is generated in code at boot (no image files): 16×16 tiles,
   4-direction × 4-frame character sheets, glyphs, clue icons, portraits.
   Then: world draw, conical-FOV light mask, rain, entity FX.
   ========================================================================= */
'use strict';

TM.R = (() => {
  const P = TM.PAL, U = TM.U;
  let VW = 480, VH = 270; const TS = 16, CW = 20, CH = 34;
  let cv, ctx, lc, lx, atlas = {}, sheets = {}, iconCache = {}, portCache = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
  const px = (x, X, Y, w, h, c) => { x.fillStyle = c; x.fillRect(X | 0, Y | 0, w, h); };

  /* ------------------------------------------------------------- TILES */
  const OPAQUE = new Set('#WCNw L'.split(''));
  const SOLID = new Set('#WCwNFAKTSBbL '.split(''));
  function tileArt(ch, v, face) {
    const [c, x] = mk(TS, TS); const r = U.rng(ch.charCodeAt(0) * 97 + v * 13 + (face ? 7 : 0));
    const noise = (base, dots, cols) => { px(x, 0, 0, TS, TS, base); for (let i = 0; i < dots; i++) px(x, r() * TS, r() * TS, 1, 1, cols[(r() * cols.length) | 0]); };
    switch (ch) {
      case '.': noise(P.wood, 18, [P.wood2, '#2e2520']); for (let y = 3; y < TS; y += 4) px(x, 0, y, TS, 1, '#2a211c'); px(x, (v * 5) % 16, 0, 1, 4, '#2a211c'); px(x, (v * 9 + 7) % 16, 4, 1, 4, '#2a211c'); break;
      case ',': noise('#1b1f29', 26, ['#232836', '#151821', '#2a3040']); if (v === 1) px(x, 4, 9, 5, 1, '#2d3346'); break;
      case ':': noise('#2a2e36', 8, ['#30343d']); px(x, 0, 0, TS, 1, '#1f2229'); px(x, 0, 0, 1, TS, '#1f2229'); if (v === 2) px(x, 6, 7, 3, 2, '#22252c'); break;
      case '_': noise('#2b1f2c', 30, ['#34253a', '#241a26']); break;
      case '=': px(x, 0, 0, TS, TS, '#1d2027'); for (let i = 0; i < TS; i += 4) { px(x, i, 0, 1, TS, '#2c313c'); px(x, 0, i, TS, 1, '#2c313c'); } break;
      case '~': noise('#1b1f29', 10, ['#232836']); x.fillStyle = '#0e1724'; x.beginPath(); x.ellipse(8, 8, 7, 4.5, 0, 0, 7); x.fill(); px(x, 5, 7, 4, 1, '#2a3a52'); break;
      case 'g': noise(P.clay, 30, ['#6b4636', '#4a3026', '#5f3f31']); break;
      case 'P': px(x, 0, 0, TS, TS, '#3d342c'); for (let y = 0; y < TS; y += 4) { px(x, 0, y, TS, 1, '#2a231d'); } px(x, (v * 6) % 14, 1, 1, 2, '#1d1814'); break;
      case 'A': px(x, 0, 0, TS, TS, P.water); for (let i = 0; i < 4; i++) px(x, r() * 12, r() * 16, 4, 1, '#132338'); break;
      case 'X': px(x, 0, 0, TS, TS, '#2a211c'); for (let y = 0; y < TS; y += 4) { px(x, 0, y, TS, 3, P.wood2); px(x, 0, y + 3, TS, 1, '#15100d'); } break;
      case 'O': px(x, 0, 0, TS, TS, '#16141a'); break; // drawn dynamically (glowing circle)
      case 'D': noise(P.wood, 10, [P.wood2]); px(x, 0, 0, 2, TS, '#1a1411'); px(x, 14, 0, 2, TS, '#1a1411'); px(x, 2, 0, 12, 2, '#1a1411'); break;
      case 'H': noise('#121318', 6, ['#16171d']); break;
      case 'K': px(x, 0, 0, TS, TS, '#1b1f29'); px(x, 1, 2, 14, 13, '#2f3a33'); px(x, 1, 2, 14, 3, '#3b4a40'); px(x, 2, 8, 12, 1, '#222a25'); px(x, 3, 14, 2, 2, '#111'); px(x, 11, 14, 2, 2, '#111'); break;
      case 'T': noise(P.wood, 8, [P.wood2]); px(x, 1, 3, 14, 9, '#4e3d31'); px(x, 1, 3, 14, 2, '#6a5444'); px(x, 2, 12, 2, 3, '#2a1f19'); px(x, 12, 12, 2, 3, '#2a1f19'); break;
      case 'S': px(x, 0, 0, TS, TS, '#1e1a18'); px(x, 1, 0, 14, 15, '#3a2f28'); for (let y = 2; y < 15; y += 4) { px(x, 2, y, 12, 3, '#211b17'); for (let k = 0; k < 4; k++) px(x, 3 + k * 3, y, 2, 3, ['#4a4458', '#5a4a3a', '#3c4c5c', '#6a5a48'][(k + y + v) % 4]); } break;
      case 'B': px(x, 0, 0, TS, TS, '#1e1a18'); px(x, 1, 1, 14, 14, '#3c3a44'); px(x, 2, 2, 12, 4, '#cfd5d8'); px(x, 2, 6, 12, 8, '#4a5266'); break;
      case 'b': px(x, 0, 0, TS, TS, '#20161a'); px(x, 0, 2, TS, 10, '#3a2620'); px(x, 0, 2, TS, 2, '#5a3b2e'); px(x, 3 + v, 4, 2, 3, '#7a8a6a'); break;
      case 'L': px(x, 0, 0, TS, TS, '#1a1c22'); px(x, 1, 0, 14, 15, '#3a4250'); px(x, 7, 0, 1, 15, '#22262e'); for (let y = 2; y < 6; y += 2) { px(x, 3, y, 3, 1, '#22262e'); px(x, 10, y, 3, 1, '#22262e'); } break;
      case 'F': px(x, 0, 0, TS, TS, 'rgba(0,0,0,0)'); for (let i = 0; i < TS; i += 3) { px(x, i, 0, 1, TS, '#5b6370'); } px(x, 0, 2, TS, 1, '#6f7887'); px(x, 0, 12, TS, 1, '#6f7887'); break;
      case 'w': px(x, 0, 0, TS, TS, '#22252f'); px(x, 2, face ? 3 : 1, 12, 9, '#3f5872'); px(x, 7, face ? 3 : 1, 1, 9, '#22252f'); px(x, 2, face ? 7 : 5, 12, 1, '#22252f'); break;
      case 'N': px(x, 0, 0, TS, TS, '#15121a'); if (face) { px(x, 0, 5, TS, 3, P.magenta); px(x, 0, 6, TS, 1, '#ffb3d6'); } break;
      case ' ': px(x, 0, 0, TS, TS, P.ink); break;
      default: { // walls: '#' brick, 'W' plaster, 'C' concrete
        const top = ch === '#' ? '#1b1716' : ch === 'W' ? '#1f2027' : '#1c1e22';
        const fc = ch === '#' ? '#4a2f2a' : ch === 'W' ? '#4a4d58' : '#3c4048';
        if (!face) { px(x, 0, 0, TS, TS, top); px(x, 0, 0, TS, 1, '#2a2b33'); for (let i = 0; i < 4; i++) px(x, r() * 15, r() * 15, 1, 1, '#25262d'); }
        else {
          px(x, 0, 0, TS, 4, top); px(x, 0, 4, TS, 12, fc);
          if (ch === '#') for (let y = 4; y < TS; y += 3) { px(x, 0, y, TS, 1, '#3a2420'); for (let k = (y % 2) * 3; k < TS; k += 6) px(x, k, y, 1, 3, '#3a2420'); }
          else if (ch === 'W') { px(x, 0, 12, TS, 4, '#3b3d47'); px(x, 0, 12, TS, 1, '#5a5d69'); for (let i = 0; i < 6; i++) px(x, r() * 16, 4 + r() * 8, 1, 2, '#43464f'); }
          else { px(x, 0, 9, TS, 1, '#33363d'); for (let i = 0; i < 5; i++) px(x, r() * 16, 4 + r() * 11, 1, 1, '#4a4e57'); }
          px(x, 0, 15, TS, 1, '#111216');
        }
      }
    }
    return c;
  }
  function buildTiles() { for (const ch of '#WCwN.,:_=~gPAXODHKTSBbLF ') for (let v = 0; v < 3; v++) { atlas[ch + v] = tileArt(ch, v, false); atlas[ch + v + 'f'] = tileArt(ch, v, true); } }

  /* ----------------------------------------------------------- SPRITES */
  // humanoid generator → sheet of 4 dirs (down,left,right,up) × 4 frames
  const SPECS = {
    augie: { h: 30, w: 10, skin: P.skinA, hair: '#2a1d16', hs: 'bun', top: P.white, top2: '#c9d2d8', arms: '#1d2433', legs: '#1d2840', shoes: '#111', belt: 'pouch', staff: 'crook' },
    jester: { h: 27, w: 8, skin: P.skinJ, hair: P.blond, hs: 'buzz', top: P.leather, top2: '#24252c', arms: P.leather, legs: '#22242c', shoes: '#0c0c0c', mantis: true, studs: true, staff: 'bat' },
    holo: { h: 26, w: 8, skin: P.maskBlue, hair: '#222', hs: 'visor', top: '#565c68', top2: '#40444e', arms: '#40444e', legs: '#3a3e47', shoes: '#111', robe: true, box: true, collar: true, staff: 'fork', mask: true },
    nano: { h: 28, w: 7, skin: P.maskBlue, hair: '#222', hs: 'full', top: '#2b2e36', top2: '#1f2128', arms: '#2b2e36', legs: '#2b2e36', shoes: '#4a4e58', pods: true, box: true, mask: true },
    chrono: { h: 22, w: 7, skin: P.maskBlue, hair: '#111', hs: 'helmet', top: '#4a4f5a', top2: '#3a3e47', arms: '#4a4f5a', legs: '#2a2d34', shoes: '#111', gauntlets: true, box: true, mask: true },
    void: { h: 23, w: 10, skin: P.maskBlue, hair: '#222', hs: 'visorblock', top: '#5a606c', top2: '#454a55', arms: '#454a55', legs: '#3a3e47', shoes: '#111', robe: true, box: true, staff: 'shotgun', mask: true },
    grunt: { h: 26, w: 8, skin: '#a87c5f', hair: '#1a1a1a', hs: 'short', top: '#2a3a5a', top2: '#1f2c45', arms: '#2a3a5a', legs: '#2a2a30', shoes: '#111', staff: 'beamgun', bandana: true },
    cop: { h: 27, w: 9, skin: P.skinH, hair: '#3a2c22', hs: 'cap', top: '#25324d', top2: '#1c2740', arms: '#25324d', legs: '#1c2236', shoes: '#0a0a0a', badge: true },
    calloway: { h: 28, w: 9, skin: '#d8b090', hair: '#6a4a2a', hs: 'swoop', top: '#7a6a52', top2: '#665844', arms: '#7a6a52', legs: '#3a3a42', shoes: '#2a1f18', coat: true, tie: true },
    frank: { h: 27, w: 10, skin: '#c89070', hair: '#5a5a5a', hs: 'short', top: '#3a4a3a', top2: '#2d3a2d', arms: '#3a4a3a', legs: '#2e2e36', shoes: '#111' },
    dez: { h: 27, w: 9, skin: '#5a3a28', hair: '#111', hs: 'buzz', top: '#1a1a1e', top2: '#111', arms: '#5a3a28', legs: '#2a2a35', shoes: '#ddd' },
    carl: { h: 26, w: 10, skin: '#d9b39a', hair: '#8a7a6a', hs: 'bald', top: '#6a6a4a', top2: '#55553a', arms: '#6a6a4a', legs: '#4a4a52', shoes: '#2a1f18' },
    britt: { h: 25, w: 7, skin: '#e0b8a0', hair: '#c9a24a', hs: 'long', top: '#4a2a4a', top2: '#3a1f3a', arms: '#e0b8a0', legs: '#1a1a22', shoes: '#111' },
    vinnie: { h: 26, w: 10, skin: '#c99a7a', hair: '#111', hs: 'slick', top: '#3a3a3a', top2: '#2a2a2a', arms: '#3a3a3a', legs: '#222', shoes: '#111', tie: true },
    dancer: { h: 25, w: 7, skin: '#c08868', hair: '#2a1a14', hs: 'long', top: '#5a2a4a', top2: '#4a1f3a', arms: '#c08868', legs: '#c08868', shoes: '#111' },
    patron: { h: 26, w: 9, skin: '#b8906e', hair: '#3a2a1a', hs: 'short', top: '#3a3f4a', top2: '#2f333d', arms: '#3a3f4a', legs: '#2a2a30', shoes: '#111' },
    seung: { h: 26, w: 8, skin: P.skinS, hair: '#111', hs: 'short', top: '#e6ecf0', top2: '#c9d0d5', arms: '#e6ecf0', legs: '#3a3a45', shoes: '#222', glasses: true, coat: true },
    hale: { h: 29, w: 11, skin: P.skinH, hair: '#9a9a9a', hs: 'short', top: '#2a3555', top2: '#1f2945', arms: '#2a3555', legs: '#1c2236', shoes: '#0a0a0a', badge: true, jawblue: true },
    dolores: { h: 26, w: 8, skin: P.skinD, hair: '#7a6a62', hs: 'bun', top: '#5a4e5a', top2: '#4a3e4a', arms: '#5a4e5a', legs: '#4a3e4a', shoes: '#2a2026', robe: true, cardigan: true },
    tee: { h: 23, w: 8, skin: '#7a5a46', hair: '#e8e8e8', hs: 'short', top: '#2a2a2f', top2: '#1f1f24', arms: '#7a5a46', legs: '#2a2a30', shoes: '#ccc', mantis: true, sit: true },
    marquis: { h: 28, w: 10, skin: '#4a2e20', hair: '#111', hs: 'bald', top: P.leather, top2: '#222', arms: P.leather, legs: '#222', shoes: '#111', mantis: true },
    partner: null, // resolved at runtime to the other protagonist
  };
  function drawHuman(x, s, dir, f, ox, oy) {
    const H = s.h, w = s.w, bx = ox + CW / 2, by = oy + CH - 1;
    const step = s.sit ? 0 : [0, 1, 0, -1][f];
    const top = by - H, headW = 6, headH = 6;
    const side = dir === 1 || dir === 2, back = dir === 3, flip = dir === 1;
    const tw = side ? Math.max(5, w - 3) : w;
    const tx = Math.round(bx - tw / 2);
    // shadow
    x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(bx, by, w * .7, 2.2, 0, 0, 7); x.fill();
    // legs
    const legTop = by - Math.round(H * .38), legH = by - legTop - 1;
    if (s.robe) { px(x, tx - 1, legTop - 2, tw + 2, legH + 1, s.top2); px(x, tx - 1 + (step > 0 ? 1 : 0), by - 2, 3, 2, s.shoes); px(x, tx + tw - 2 - (step < 0 ? 1 : 0), by - 2, 3, 2, s.shoes); }
    else if (s.sit) { px(x, tx, by - 5, tw + 4, 3, s.legs); px(x, tx + tw + 2, by - 3, 2, 2, s.shoes); }
    else if (side) { px(x, bx - 2 + step, legTop, 2, legH, s.legs); px(x, bx - step, legTop, 2, legH, s.top2 === s.legs ? s.legs : s.legs); px(x, bx - 2 + step + (flip ? -1 : 0), by - 2, 3, 2, s.shoes); px(x, bx - step + (flip ? -1 : 0), by - 2, 3, 2, s.shoes); }
    else { const lg = Math.max(2, Math.floor(tw / 2) - 1); px(x, tx + 1, legTop + (step > 0 ? 1 : 0), lg, legH - (step > 0 ? 1 : 0), s.legs); px(x, tx + tw - 1 - lg, legTop + (step < 0 ? 1 : 0), lg, legH - (step < 0 ? 1 : 0), s.legs); px(x, tx + 1, by - 2, lg, 2, s.shoes); px(x, tx + tw - 1 - lg, by - 2, lg, 2, s.shoes); }
    // torso
    const tTop = top + headH + 1, tH = legTop - tTop + 1;
    px(x, tx, tTop, tw, tH, s.top); px(x, tx, tTop + tH - 2, tw, 2, s.top2);
    if (s.coat) { px(x, tx - 1, tTop, tw + 2, tH + 6, s.top2); px(x, tx, tTop, tw, tH, s.top); }
    if (s.cardigan && !back) px(x, bx - 1, tTop + 1, 2, tH - 1, '#c9b8a8');
    if (s.tie && !back && !side) px(x, bx, tTop + 1, 1, tH - 3, '#6a2a3a');
    if (s.badge && !back && !side) px(x, tx + 1, tTop + 2, 2, 2, '#d8c070');
    if (s.collar) { px(x, tx - 2, tTop - 1, tw + 4, 4, s.top); px(x, tx - 2, tTop + 2, tw + 4, 1, s.top2); }
    if (s.studs) for (let i = 0; i < tw; i += 2) px(x, tx + i, tTop, 1, 1, '#9aa4b2');
    if (s.pods) { const pts = [[1, 2], [tw - 2, 2], [1, 6], [tw - 2, 6], [3, 4]]; for (const [a, b] of pts) px(x, tx + a, tTop + b, 1, 2, P.magenta); }
    if (s.bandana && !back) px(x, tx, tTop + 1, tw, 2, '#c4c4c4');
    // belt
    if (s.belt === 'pouch') { // Augie's all-around pouch belt — bulging hip silhouette
      const byy = legTop - 4; px(x, tx - 2, byy, tw + 4, 6, P.olive); for (let i = 0; i < tw + 4; i += 3) { px(x, tx - 2 + i, byy, 2, 5, P.olive2); px(x, tx - 2 + i, byy + 1, 1, 1, P.tab); }
      px(x, tx - 2, byy + 5, tw + 4, 1, '#2b3a52'); // blue piping
      if (!back) px(x, tx + tw + 1, byy + 5, 2, 2, '#d0d0d0'); // GG charm
    }
    // back details
    if (back) {
      if (s.box) { px(x, bx - 3, tTop + 1, 6, 6, '#4a4e58'); px(x, bx - 3, tTop + 1, 6, 1, '#6f7887'); px(x, bx - 1, tTop + 3, 2, 2, P.glow); }
      if (s.mantis) { px(x, bx - 2, tTop + 2, 4, 1, '#6df0b0'); px(x, bx - 1, tTop + 3, 2, 3, '#f0a040'); px(x, bx - 3, tTop + 3, 1, 2, '#40c0f0'); px(x, bx + 2, tTop + 3, 1, 2, '#40c0f0'); }
    } else if (s.box && side) px(x, flip ? tx + tw : tx - 2, tTop + 1, 2, 6, '#4a4e58');
    // arms
    const armY = tTop + 1, armH = Math.round(tH * .85);
    if (side) { px(x, bx - 1 - step, armY + 1, 2, armH, s.arms); if (s.gauntlets) px(x, bx - 2 - step, armY + armH - 2, 4, 3, '#2a2d34'), px(x, bx - 1 - step, armY + armH - 1, 1, 1, P.glow); }
    else { px(x, tx - 2, armY + (step > 0 ? 1 : 0), 2, armH, s.arms); px(x, tx + tw, armY + (step < 0 ? 1 : 0), 2, armH, s.arms); if (s.gauntlets) { px(x, tx - 3, armY + armH - 2, 3, 3, '#2a2d34'); px(x, tx + tw, armY + armH - 2, 3, 3, '#2a2d34'); px(x, tx - 2, armY + armH - 1, 1, 1, P.glow); px(x, tx + tw + 1, armY + armH - 1, 1, 1, P.glow); } }
    // head
    const hx = Math.round(bx - headW / 2), hy = top;
    px(x, hx, hy, headW, headH, s.skin); px(x, bx - 1, hy + headH, 2, 1, s.skin);
    const hs = s.hs;
    if (hs === 'bun') { px(x, hx, hy, headW, 2, s.hair); if (!side || true) px(x, bx - 1 + (dir === 1 ? 2 : dir === 2 ? -2 : 0), hy - 2, 3, 2, s.hair); if (back) px(x, hx, hy, headW, 5, s.hair); }
    else if (hs === 'buzz') { px(x, hx, hy, headW, 1, s.hair); if (back) px(x, hx, hy, headW, 3, s.hair); }
    else if (hs === 'short' || hs === 'slick' || hs === 'swoop') { px(x, hx, hy, headW, 2, s.hair); if (hs === 'swoop' && !back) px(x, hx + 3, hy + 2, 3, 1, s.hair); if (back) px(x, hx, hy, headW, 4, s.hair); }
    else if (hs === 'long') { px(x, hx - 1, hy, headW + 2, 2, s.hair); px(x, hx - 1, hy, 1, 9, s.hair); px(x, hx + headW, hy, 1, 9, s.hair); if (back) px(x, hx - 1, hy, headW + 2, 9, s.hair); }
    else if (hs === 'cap') { px(x, hx - 1, hy - 1, headW + 2, 3, '#1c2236'); if (!back) px(x, hx, hy + 2, headW, 1, '#111'); }
    else if (hs === 'visor') { px(x, hx - 1, hy - 1, headW + 2, 2, '#3a3e47'); if (!back) { px(x, hx, hy + 1, headW, 2, '#22252c'); px(x, hx - 1, hy + 1, 1, 2, P.magenta); px(x, hx + headW, hy + 1, 1, 2, P.magenta); } else px(x, hx, hy, headW, 5, '#3a3e47'); }
    else if (hs === 'full') { px(x, hx, hy, headW, headH, '#3a3e47'); if (!back) { px(x, hx + 1, hy + 2, 4, 1, '#111'); px(x, hx + 3, hy + 2, 1, 1, P.magenta); px(x, hx + 1, hy + 4, 1, 2, P.maskBlue); } px(x, hx - 1, hy - 2, 1, 4, '#4a4e58'); px(x, hx + headW, hy - 3, 1, 5, '#4a4e58'); }
    else if (hs === 'helmet') { px(x, hx - 1, hy - 1, headW + 2, 3, '#3a3e47'); px(x, hx + headW, hy - 4, 1, 4, '#6f7887'); if (!back) { px(x, hx + 1, hy + 2, 4, 1, '#9fd0f0'); px(x, hx + 1, hy + 4, 4, 2, '#2a2d34'); } else px(x, hx, hy, headW, 6, s.hair); }
    else if (hs === 'visorblock') { px(x, hx - 1, hy - 1, headW + 2, 2, '#3a3e47'); px(x, hx + headW, hy - 2, 1, 2, P.magenta); if (!back) { px(x, hx, hy + 1, headW, 2, '#1a1c22'); px(x, hx + 4, hy + 1, 1, 1, P.glow); px(x, hx + 1, hy + 4, 4, 2, '#2a2d34'); } else px(x, hx, hy, headW, 5, '#3a3e47'); }
    // face
    if (!back && !['visor', 'full', 'helmet', 'visorblock'].includes(hs)) {
      if (side) px(x, flip ? hx + 1 : hx + 4, hy + 3, 1, 1, '#111'); else { px(x, hx + 1, hy + 3, 1, 1, '#111'); px(x, hx + 4, hy + 3, 1, 1, '#111'); }
      if (s.glasses) { px(x, hx, hy + 3, headW, 1, '#7a8a9a'); }
      if (s.jawblue) px(x, hx, hy + 5, headW, 1, P.maskBlue);
    }
    // carried weapon
    if (s.staff === 'crook') { const sx = flip ? tx - 4 : side ? tx + tw + 2 : tx + tw + 2; px(x, sx, top - 5, 1, H + 2, '#6f7887'); px(x, sx - 1, top - 6, 3, 3, '#9aa4b2'); px(x, sx - 1, legTop - 6, 3, 3, '#3a3e47'); }
    if (s.staff === 'bat' && !back) { const sx = flip ? tx - 3 : tx + tw + 2; px(x, sx, legTop - 6, 2, 12, '#8a7a5a'); px(x, sx, legTop + 4, 2, 3, '#333'); }
    if (s.staff === 'fork') { const sx = flip ? tx - 4 : tx + tw + 2; px(x, sx, top - 4, 1, H + 1, '#6f7887'); px(x, sx - 2, top - 6, 1, 3, P.magenta); px(x, sx + 2, top - 6, 1, 3, P.magenta); px(x, sx - 2, top - 4, 5, 1, '#6f7887'); }
    if (s.staff === 'shotgun' && !back) { const sx = flip ? tx - 6 : tx + tw - 1; px(x, sx, tTop + 4, 7, 3, '#2a2d34'); px(x, sx + (flip ? 0 : 5), tTop + 5, 2, 1, P.magenta); }
    if (s.staff === 'beamgun' && !back) { const sx = flip ? tx - 6 : tx + tw - 1; px(x, sx, tTop + 4, 7, 2, '#3a3e47'); px(x, sx + (flip ? 0 : 6), tTop + 4, 1, 2, P.magenta); }
  }
  function buildSheet(key, spec) {
    const [c, x] = mk(CW * 4, CH * 4);
    for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) drawHuman(x, spec, d, f, f * CW, d * CH);
    sheets[key] = c;
  }
  function buildSpecials() {
    // GOLEM — box droid, VFD slit face
    { const [c, x] = mk(CW * 4, CH * 4); for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) { const ox = f * CW, oy = d * CH; x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(ox + 10, oy + 33, 7, 2, 0, 0, 7); x.fill(); px(x, ox + 3, oy + 20 + (f % 2), 14, 12, '#4a5246'); px(x, ox + 3, oy + 20 + (f % 2), 14, 2, '#5d6858'); px(x, ox + 4, oy + 31, 3, 2, '#222'); px(x, ox + 13, oy + 31, 3, 2, '#222'); if (d !== 3) { px(x, ox + 5, oy + 24 + (f % 2), 10, 3, '#0d1512'); px(x, ox + 7, oy + 25 + (f % 2), 1, 1, '#8fe3d0'); px(x, ox + 12, oy + 25 + (f % 2), 1, 1, '#8fe3d0'); } } sheets.golem = c; }
    // RADIO prop
    { const [c, x] = mk(CW * 4, CH * 4); for (let i = 0; i < 16; i++) { const ox = (i % 4) * CW, oy = ((i / 4) | 0) * CH; px(x, ox + 4, oy + 24, 12, 8, '#3a3a3a'); px(x, ox + 5, oy + 25, 6, 5, '#555'); px(x, ox + 12, oy + 26, 3, 3, '#d8b070'); px(x, ox + 14, oy + 16, 1, 8, '#9aa4b2'); } sheets.radio = c; }
    // CANISTER prop
    { const [c, x] = mk(CW * 4, CH * 4); for (let i = 0; i < 16; i++) { const ox = (i % 4) * CW, oy = ((i / 4) | 0) * CH; px(x, ox + 6, oy + 20, 8, 12, '#5a606c'); px(x, ox + 6, oy + 20, 8, 2, '#9aa4b2'); px(x, ox + 7, oy + 25, 6, 2, P.warn); } sheets.canister = c; }
    // BERNARD — eyeless, elongated neck, wrong joints (48px tall frames)
    { const BW = 28, BH = 50; const [c, x] = mk(BW * 4, BH * 4);
      for (let d = 0; d < 4; d++) for (let f = 0; f < 4; f++) {
        const ox = f * BW, oy = d * BH, bx = ox + 14, by = oy + BH - 1, s = [0, 2, 0, -2][f];
        x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(bx, by, 9, 2.5, 0, 0, 7); x.fill();
        const skin = '#b9b4ad', dk = '#8a857e';
        // legs: backward-bent knees
        px(x, bx - 5, by - 16, 3, 8, skin); px(x, bx - 7 + s, by - 8, 3, 8, skin); px(x, bx + 2, by - 16, 3, 8, skin); px(x, bx + 4 - s, by - 8, 3, 8, skin);
        // torso hunched
        px(x, bx - 5, by - 30, 10, 15, skin); px(x, bx - 5, by - 30, 10, 2, dk); px(x, bx - 1, by - 22, 3, 3, '#6a6560');
        // arms to the knees, too many joints
        px(x, bx - 8, by - 29, 3, 10, skin); px(x, bx - 10 + s, by - 19, 3, 12, dk); px(x, bx + 5, by - 29, 3, 10, skin); px(x, bx + 7 - s, by - 19, 3, 12, dk);
        // neck too long, small eyeless head
        const nx = bx - 1 + (d === 1 ? -3 : d === 2 ? 3 : 0);
        px(x, nx, by - 41, 3, 12, skin); px(x, nx - 2, by - 47, 7, 7, skin); px(x, nx - 2, by - 41, 7, 1, dk);
        if (d !== 3) px(x, nx - 1, by - 44, 5, 1, '#9a948c');
      }
      sheets.bernard = c; }
    // generic small props
  }

  /* ------------------------------------------------------------- GLYPHS */
  function glyph(x, kind, cx, cy, s = 1, col = P.glow) {
    x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 1;
    x.beginPath();
    switch (kind) {
      case 'whisper': x.moveTo(-4, 5); x.lineTo(-4, -3); x.lineTo(-1, -6); x.moveTo(4, 5); x.lineTo(4, -3); x.lineTo(1, -6); x.moveTo(-4, 2); x.lineTo(4, 2); x.moveTo(-7, -1); x.arc(0, 0, 7, Math.PI * 1.1, Math.PI * 1.4); break;
      case 'nanohive': for (const [a, b] of [[0, 0], [-4, -3], [4, -3], [-4, 3], [4, 3]]) { x.moveTo(a + 2, b); for (let k = 1; k <= 6; k++) x.lineTo(a + 2 * Math.cos(k * Math.PI / 3), b + 2 * Math.sin(k * Math.PI / 3)); } break;
      case 'temporaltext': x.arc(0, 0, 6, 0, 7); x.moveTo(0, 0); x.lineTo(0, -4); x.moveTo(0, 0); x.lineTo(3, 2); x.moveTo(0, -8); x.lineTo(0, -6); break;
      case 'foldspeak': x.moveTo(-6, -6); x.lineTo(6, -6); x.lineTo(6, 6); x.lineTo(-6, 6); x.closePath(); x.moveTo(-6, -6); x.lineTo(6, 6); x.moveTo(0, -6); x.lineTo(6, 0); break;
      case 'beam': case 'spiral': for (let a = 0; a < 14; a += .3) { const r = a * .5; a === 0 ? x.moveTo(0, 0) : x.lineTo(r * Math.cos(a), r * Math.sin(a)); } break;
      case 'lattice': for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; x.moveTo(0, 0); x.lineTo(7 * Math.cos(a), 7 * Math.sin(a)); } x.moveTo(5, 0); x.arc(0, 0, 5, 0, 7); x.rect(-7, -7, 14, 14); break;
    }
    x.stroke(); x.restore();
  }

  /* -------------------------------------------------------------- ICONS */
  function icon(key) {
    if (iconCache[key]) return iconCache[key];
    const [c, x] = mk(32, 32); px(x, 0, 0, 32, 32, '#14161c'); x.lineWidth = 1;
    const L = (a, b, cc, d, col) => { x.strokeStyle = col; x.beginPath(); x.moveTo(a + .5, b + .5); x.lineTo(cc + .5, d + .5); x.stroke(); };
    switch (key) {
      case 'radio': px(x, 5, 12, 22, 14, '#3a3a3a'); px(x, 7, 14, 10, 9, '#555'); for (let i = 0; i < 4; i++) px(x, 8, 15 + i * 2, 8, 1, '#333'); px(x, 20, 16, 4, 4, '#d8b070'); L(24, 12, 26, 3, '#9aa4b2'); break;
      case 'face': px(x, 9, 6, 14, 18, '#7a5a46'); px(x, 9, 6, 14, 4, '#eee'); px(x, 12, 13, 2, 1, '#222'); px(x, 18, 13, 2, 1, '#222'); L(11, 18, 21, 19, '#4a3326'); L(10, 21, 14, 22, '#5a4030'); L(18, 22, 22, 21, '#5a4030'); glyph(x, 'spiral', 24, 26, .8, P.glow); break;
      case 'cartridge': px(x, 12, 6, 8, 20, '#b08a3a'); px(x, 12, 6, 8, 3, '#d0aa5a'); x.strokeStyle = P.glow; x.beginPath(); x.arc(16, 17, 3, 0, 7); x.stroke(); px(x, 11, 25, 10, 2, '#806020'); break;
      case 'body': px(x, 4, 13, 24, 7, '#cfc8c0'); px(x, 3, 14, 5, 5, '#d8b8a0'); glyph(x, 'lattice', 17, 16, .55, P.glow); px(x, 19, 15, 3, 3, '#000'); break;
      case 'wound': x.fillStyle = '#d8b8a0'; x.fillRect(4, 4, 24, 24); x.fillStyle = '#000'; x.beginPath(); x.arc(16, 16, 7, 0, 7); x.fill(); x.strokeStyle = '#bde8ff'; x.beginPath(); x.arc(16, 16, 7.5, 0, 7); x.stroke(); break;
      case 'wire': px(x, 4, 4, 24, 24, '#d8b8a0'); x.strokeStyle = '#b08a5a'; x.beginPath(); x.moveTo(6, 26); x.bezierCurveTo(12, 10, 18, 22, 26, 6); x.moveTo(14, 18); x.lineTo(8, 10); x.moveTo(20, 13); x.lineTo(26, 18); x.stroke(); break;
      case 'drop': px(x, 4, 18, 24, 8, '#5a2a3a'); x.fillStyle = '#7a2a3a'; x.beginPath(); x.moveTo(16, 5); x.quadraticCurveTo(24, 16, 16, 20); x.quadraticCurveTo(8, 16, 16, 5); x.fill(); break;
      case 'dust': px(x, 0, 0, 32, 32, '#3a2f2a'); for (let i = 0; i < 60; i++) px(x, Math.random() * 32, Math.random() * 32, 1, 1, '#5a4a40'); for (const [a, b] of [[8, 22], [14, 16], [10, 10], [17, 5]]) { px(x, a, b, 4, 6, '#251e1a'); } break;
      case 'lock': px(x, 9, 14, 14, 12, '#7a7a80'); x.strokeStyle = '#9aa4b2'; x.lineWidth = 2; x.beginPath(); x.arc(16, 13, 5, Math.PI, 0); x.stroke(); px(x, 20, 8, 3, 3, '#14161c'); px(x, 15, 18, 2, 4, '#222'); px(x, 11, 24, 4, 2, P.clay); break;
      case 'paper': px(x, 7, 4, 18, 24, '#d9d4c7'); for (let i = 0; i < 7; i++) px(x, 9, 8 + i * 3, 12 - (i % 3) * 2, 1, '#777'); px(x, 18, 22, 5, 4, '#7a2a3a'); break;
      case 'ticket': px(x, 3, 10, 26, 13, '#cfd8e0'); px(x, 3, 10, 26, 3, '#2a4a7a'); for (let i = 0; i < 3; i++) px(x, 6, 15 + i * 2, 14, 1, '#556'); px(x, 23, 15, 1, 7, '#889'); break;
      case 'sketch': px(x, 5, 3, 22, 26, '#e8e2d4'); x.strokeStyle = P.entCyan; x.beginPath(); x.arc(16, 14, 6, 0, 7); x.stroke(); x.strokeStyle = P.entMag; x.beginPath(); x.moveTo(8, 22); x.lineTo(24, 22); x.moveTo(9, 25); x.lineTo(23, 25); x.stroke(); px(x, 13, 12, 6, 4, P.entYellow); px(x, 14, 13, 4, 2, '#000'); break;
      case 'mouth': px(x, 6, 10, 20, 12, '#2a2e36'); px(x, 9, 13, 14, 6, '#7a4a4a'); px(x, 10, 15, 12, 2, '#e6ecf0'); break;
      case 'card': px(x, 6, 4, 20, 24, '#d9d4c7'); px(x, 6, 4, 20, 4, '#5a6a7a'); px(x, 9, 11, 14, 1, '#555'); px(x, 9, 15, 10, 1, '#555'); px(x, 9, 19, 14, 1, '#7a2a3a'); px(x, 9, 23, 8, 1, '#555'); break;
      case 'cash': px(x, 8, 6, 16, 20, '#6a4a2a'); px(x, 8, 6, 16, 3, '#8a6a4a'); px(x, 10, 11, 12, 10, '#5a7a4a'); px(x, 14, 13, 4, 6, '#7a9a6a'); break;
      case 'car': px(x, 4, 12, 24, 9, '#6a4a2a'); px(x, 4, 15, 24, 3, '#8a6a3a'); px(x, 8, 9, 14, 4, '#2a3a4a'); px(x, 6, 20, 5, 4, '#111'); px(x, 21, 20, 5, 4, '#111'); px(x, 6, 23, 5, 2, P.clay); px(x, 21, 23, 5, 2, P.clay); break;
      case 'notes': px(x, 6, 4, 20, 24, '#e6ecf0'); for (let i = 0; i < 8; i++) px(x, 9, 7 + i * 2.6, 10 + (i * 7 % 5), 1, '#3a4a6a'); px(x, 6, 4, 2, 24, '#7a2a3a'); break;
      case 'spiral': px(x, 4, 4, 24, 24, '#e6ecf0'); glyph(x, 'spiral', 16, 16, 1.4, '#333'); for (let k = 0; k < 12; k++) { const a = k / 12 * 7; L(16 + 9 * Math.cos(a), 16 + 9 * Math.sin(a), 16 + 11 * Math.cos(a), 16 + 11 * Math.sin(a), '#333'); } break;
      case 'tape': px(x, 5, 9, 22, 14, '#2a2a2f'); px(x, 8, 12, 16, 6, '#cfd8e0'); px(x, 10, 13, 3, 3, '#333'); px(x, 19, 13, 3, 3, '#333'); break;
      case 'ledger': px(x, 6, 4, 20, 24, '#3a2a22'); px(x, 8, 6, 16, 20, '#d9d4c7'); for (let i = 0; i < 6; i++) { px(x, 10, 9 + i * 3, 6, 1, '#555'); px(x, 18, 9 + i * 3, 4, 1, '#3a6a3a'); } break;
      case 'file': px(x, 4, 6, 24, 20, '#b8a070'); px(x, 4, 4, 10, 3, '#b8a070'); px(x, 7, 10, 18, 12, '#d9d4c7'); px(x, 9, 12, 14, 1, '#444'); px(x, 9, 15, 10, 1, '#444'); px(x, 18, 19, 6, 2, P.warn); break;
      case 'portrait': px(x, 4, 3, 24, 26, '#5a3a2a'); px(x, 6, 5, 20, 22, '#c9b8a8'); px(x, 12, 8, 8, 9, '#d8b8a0'); px(x, 13, 11, 2, 1, P.glow); px(x, 17, 11, 2, 1, P.glow); px(x, 10, 17, 12, 9, '#4a3e4a'); x.fillStyle = '#e6ecf0'; x.beginPath(); x.arc(16, 22, 3, 0, 7); x.fill(); break;
      case 'journal': px(x, 6, 4, 20, 24, '#4a2a3a'); px(x, 8, 4, 2, 24, '#2a1a22'); glyph(x, 'lattice', 18, 16, .7, '#d8c070'); break;
      case 'ring': x.strokeStyle = '#d0aa5a'; x.lineWidth = 3; x.beginPath(); x.arc(16, 16, 8, 0, 7); x.stroke(); x.lineWidth = 1; L(16, 24, 16, 30, P.magenta); L(8, 16, 2, 16, P.magenta); break;
      case 'scrap': px(x, 8, 12, 7, 6, '#6f7887'); px(x, 15, 9, 9, 4, '#9aa4b2'); px(x, 12, 18, 10, 5, '#4a4e58'); px(x, 17, 15, 2, 2, P.tab); break;
      case 'frag': glyph(x, 'lattice', 16, 16, 1.4, P.glow); break;
      default: glyph(x, key, 16, 16, 1.4, P.glow);
    }
    x.strokeStyle = '#2d3142'; x.lineWidth = 1; x.strokeRect(.5, .5, 31, 31);
    return (iconCache[key] = c.toDataURL());
  }
  // kit & weapon icons reuse the glyph/icon drawer
  function kitIcon(key) {
    const k = 'kit_' + key; if (iconCache[k]) return iconCache[k];
    const [c, x] = mk(24, 24);
    switch (key) {
      case 'tattle': px(x, 4, 8, 16, 10, '#3a3a40'); px(x, 8, 5, 8, 3, '#222'); px(x, 6, 10, 4, 4, '#6f7887'); px(x, 14, 11, 4, 2, '#8fe3d0'); break;
      case 'salt': px(x, 7, 3, 10, 18, '#9a4a3a'); px(x, 7, 3, 10, 3, '#ccc'); px(x, 8, 9, 8, 6, '#dfe6ea'); for (let i = 0; i < 6; i++) px(x, 9 + (i * 3) % 7, 10 + i % 4, 1, 1, '#555'); break;
      case 'jar': px(x, 6, 6, 12, 15, '#7a9aa0'); px(x, 6, 4, 12, 3, '#9aa4b2'); px(x, 11, 2, 1, 12, '#ccc'); for (let i = 0; i < 8; i++) px(x, 8 + (i * 5) % 9, 14 + (i % 3) * 2, 1, 1, '#222'); break;
      case 'ticks': x.fillStyle = '#c8e05a'; x.beginPath(); x.arc(12, 12, 8, 0, 7); x.fill(); x.strokeStyle = '#eee'; x.beginPath(); x.arc(12, 12, 8, -1, 1); x.stroke(); px(x, 10, 10, 4, 4, '#ddd'); px(x, 12, 9, 1, 3, '#222'); break;
      case 'flare': px(x, 9, 6, 6, 14, '#c0603a'); px(x, 9, 4, 6, 3, '#ffd080'); px(x, 11, 1, 2, 3, '#fff3a0'); break;
      case 'ash': px(x, 9, 4, 6, 16, '#3a3a3a'); px(x, 9, 4, 6, 3, '#777'); for (let i = 0; i < 4; i++) px(x, 15, 8 + i * 3, 2, 1, '#bbb'); break;
      case 'frag': x.fillStyle = '#4a5a3a'; x.beginPath(); x.ellipse(12, 14, 6, 7, 0, 0, 7); x.fill(); px(x, 10, 4, 4, 4, '#777'); px(x, 14, 5, 4, 1, '#999'); break;
      case 'emp': px(x, 5, 7, 14, 12, '#3a4048'); px(x, 7, 9, 10, 2, '#8fe3d0'); px(x, 9, 4, 1, 3, '#ccc'); px(x, 14, 4, 1, 3, '#ccc'); px(x, 7, 14, 3, 3, '#d8c070'); break;
      case 'shells': for (let i = 0; i < 3; i++) { px(x, 5 + i * 5, 6, 4, 13, '#8a2a2a'); px(x, 5 + i * 5, 16, 4, 3, '#c0a050'); } break;
      case 'knocker': px(x, 10, 10, 2, 13, '#6f7887'); px(x, 5, 3, 12, 8, '#4a4e58'); px(x, 5, 3, 2, 8, '#222'); px(x, 15, 3, 2, 8, '#222'); break;
      case 'crown': px(x, 10, 12, 2, 11, '#6f7887'); x.fillStyle = '#2a2a30'; x.beginPath(); x.arc(11, 10, 6, Math.PI, 0); x.fill(); for (let i = 0; i < 4; i++) px(x, 6 + i * 3, 9, 2, 2, '#c08040'); break;
      case 'horn': px(x, 10, 14, 2, 9, '#6f7887'); x.fillStyle = '#5a606c'; x.beginPath(); x.moveTo(5, 3); x.lineTo(17, 3); x.lineTo(13, 14); x.lineTo(9, 14); x.fill(); px(x, 7, 5, 8, 1, P.magenta); break;
      case 'drum': x.fillStyle = '#5a606c'; x.beginPath(); x.arc(12, 12, 9, 0, 7); x.fill(); for (let k = 0; k < 6; k++) { const a = k / 6 * 7; x.fillStyle = k === 5 ? '#222' : '#c07040'; x.beginPath(); x.arc(12 + 5 * Math.cos(a), 12 + 5 * Math.sin(a), 2, 0, 7); x.fill(); } break;
      case 'bat': x.save(); x.translate(12, 12); x.rotate(-.8); px(x, -2, -11, 4, 15, '#8a7a5a'); px(x, -1, 4, 2, 7, '#333'); x.restore(); break;
      case 'knife': x.save(); x.translate(12, 12); x.rotate(-.8); px(x, -1, -11, 3, 12, '#cfd8e0'); px(x, -3, 1, 7, 2, '#555'); px(x, -1, 3, 3, 7, '#3a2a1a'); x.restore(); break;
      case 'shotgun': px(x, 2, 10, 20, 3, '#2a2d34'); px(x, 2, 13, 8, 4, '#4a3020'); px(x, 12, 13, 5, 2, '#3a3a3a'); break;
    }
    return (iconCache[k] = c.toDataURL());
  }

  /* ---------------------------------------------------------- PORTRAITS */
  const PORT = {
    augie: { skin: P.skinA, hair: '#2a1d16', hs: 'bun', shirt: P.white, jaw: 'strong' },
    jester: { skin: P.skinJ, hair: P.blond, hs: 'buzz', shirt: P.leather, studs: true },
    calloway: { skin: '#d8b090', hair: '#6a4a2a', hs: 'swoop', shirt: '#7a6a52', tie: true, smile: true },
    frank: { skin: '#c89070', hair: '#5a5a5a', hs: 'short', shirt: '#3a4a3a', stubble: true },
    dez: { skin: '#5a3a28', hair: '#111', hs: 'buzz', shirt: '#1a1a1e' },
    carl: { skin: '#d9b39a', hair: '#8a7a6a', hs: 'bald', shirt: '#6a6a4a', glasses: true },
    britt: { skin: '#e0b8a0', hair: '#c9a24a', hs: 'long', shirt: '#4a2a4a' },
    vinnie: { skin: '#c99a7a', hair: '#111', hs: 'slick', shirt: '#3a3a3a', tie: true },
    seung: { skin: P.skinS, hair: '#111', hs: 'short', shirt: '#e6ecf0', glasses: true },
    hale: { skin: P.skinH, hair: '#9a9a9a', hs: 'short', shirt: '#2a3555', jawblue: true, badge: true },
    dolores: { skin: P.skinD, hair: '#7a6a62', hs: 'bun', shirt: '#5a4e5a', intense: true },
    tee: { skin: '#7a5a46', hair: '#e8e8e8', hs: 'short', shirt: '#2a2a2f', old: true },
    marquis: { skin: '#4a2e20', hair: '#111', hs: 'bald', shirt: P.leather, studs: true },
  };
  function portrait(key) {
    if (portCache[key]) return portCache[key];
    const [c, x] = mk(48, 48); px(x, 0, 0, 48, 48, '#0d0e12');
    for (let y = 0; y < 48; y += 2) px(x, 0, y, 48, 1, 'rgba(255,255,255,.02)');
    const s = PORT[key];
    if (key === 'golem') { px(x, 6, 10, 36, 30, '#4a5246'); px(x, 6, 10, 36, 4, '#5d6858'); px(x, 11, 20, 26, 8, '#0d1512'); px(x, 15, 22, 3, 2, '#8fe3d0'); px(x, 30, 22, 3, 2, '#8fe3d0'); }
    else if (key === 'radio') { px(x, 6, 16, 36, 22, '#3a3a3a'); px(x, 9, 19, 16, 15, '#555'); for (let i = 0; i < 5; i++) px(x, 11, 21 + i * 3, 12, 1, '#333'); px(x, 29, 22, 8, 8, '#d8b070'); px(x, 38, 5, 1, 11, '#9aa4b2'); }
    else if (key === 'omnibox') { px(x, 4, 8, 40, 32, '#4a4e58'); px(x, 4, 8, 40, 3, '#6f7887'); px(x, 16, 16, 16, 14, '#1a0d14'); x.fillStyle = P.glow; x.beginPath(); x.arc(24, 23, 5, 0, 7); x.fill(); px(x, 23, 22, 2, 2, '#fff'); }
    else if (key === 'bernard') { px(x, 18, 0, 12, 14, '#b9b4ad'); px(x, 21, 14, 6, 20, '#b9b4ad'); px(x, 10, 34, 28, 14, '#a9a49d'); px(x, 19, 6, 10, 1, '#8a857e'); }
    else if (s) {
      // shoulders
      px(x, 6, 38, 36, 10, s.shirt); if (s.studs) for (let i = 7; i < 42; i += 3) px(x, i, 38, 1, 1, '#9aa4b2'); if (s.tie) px(x, 23, 39, 2, 9, '#6a2a3a'); if (s.badge) px(x, 10, 41, 4, 4, '#d8c070');
      if (key === 'augie') { px(x, 4, 44, 40, 4, P.olive); for (let i = 4; i < 44; i += 4) px(x, i, 44, 1, 1, P.tab); }
      // neck & head
      px(x, 20, 31, 8, 8, s.skin); px(x, 14, 10, 20, 23, s.skin); px(x, 14 + (s.jaw ? 0 : 1), 30, 20 - (s.jaw ? 0 : 2), 3, s.skin);
      // hair
      if (s.hs === 'bun') { px(x, 13, 7, 22, 6, s.hair); px(x, 20, 2, 8, 6, s.hair); }
      else if (s.hs === 'buzz') px(x, 14, 9, 20, 3, s.hair);
      else if (s.hs === 'short' || s.hs === 'slick') px(x, 13, 7, 22, 6, s.hair);
      else if (s.hs === 'swoop') { px(x, 13, 6, 22, 6, s.hair); px(x, 24, 11, 9, 3, s.hair); }
      else if (s.hs === 'long') { px(x, 12, 7, 24, 6, s.hair); px(x, 11, 9, 4, 28, s.hair); px(x, 33, 9, 4, 28, s.hair); }
      // eyes, brows, mouth
      const ey = 19; px(x, 18, ey, 4, 2, '#111'); px(x, 27, ey, 4, 2, '#111'); px(x, 17, ey - 3, 6, 1, s.hair === '#e8e8e8' ? '#ccc' : '#2a1d16'); px(x, 26, ey - 3, 6, 1, s.hair === '#e8e8e8' ? '#ccc' : '#2a1d16');
      if (s.intense) { px(x, 19, ey, 2, 1, P.glow); px(x, 28, ey, 2, 1, P.glow); }
      if (s.glasses) { x.strokeStyle = '#9aa4b2'; x.strokeRect(16.5, 17.5, 7, 5); x.strokeRect(25.5, 17.5, 7, 5); px(x, 23, 19, 3, 1, '#9aa4b2'); }
      px(x, 23, 22, 2, 4, 'rgba(0,0,0,.18)');
      px(x, 20, 27, 8, 1, s.smile ? '#7a3a3a' : '#5a3030'); if (s.smile) { px(x, 19, 26, 1, 1, '#7a3a3a'); px(x, 28, 26, 1, 1, '#7a3a3a'); }
      if (s.stubble) for (let i = 0; i < 30; i++) px(x, 15 + Math.random() * 18, 25 + Math.random() * 7, 1, 1, 'rgba(40,30,30,.5)');
      if (s.old) for (let i = 0; i < 6; i++) px(x, 15 + i * 3, 13 + (i % 2) * 12, 3, 1, 'rgba(60,40,30,.6)');
      if (s.jawblue) px(x, 15, 28, 18, 5, 'rgba(122,184,232,.55)');
    }
    return (portCache[key] = c.toDataURL());
  }

  /* ---------------------------------------------------------- WORLD DRAW */
  const rain = []; for (let i = 0; i < 160; i++) rain.push({ x: Math.random() * VW, y: Math.random() * VH, s: 220 + Math.random() * 140 });
  let cachedSolidFace = null;

  function init() {
    cv = document.getElementById('game'); cv.width = VW; cv.height = VH; ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    [lc, lx] = mk(VW, VH);
    buildTiles();
    for (const k in SPECS) if (SPECS[k]) buildSheet(k, SPECS[k]);
    buildSpecials();
  }
  function isWall(ch) { return '#WCN w'.includes(ch) && ch !== ' '; }

  function drawSprite(key, x, y, dir, frame, opts = {}) {
    const sh = sheets[key]; if (!sh) return;
    if (key === 'bernard') { const BW = 28, BH = 50; ctx.drawImage(sh, frame * BW, dir * BH, BW, BH, Math.round(x - BW / 2), Math.round(y - BH + 4), BW, BH); return; }
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    ctx.drawImage(sh, frame * CW, dir * CH, CW, CH, Math.round(x - CW / 2), Math.round(y - CH + 4), CW, CH);
    ctx.globalAlpha = 1;
  }

  function frame(W, t) {
    const cam = W.cam, p = W.player;
    ctx.save();
    ctx.fillStyle = P.ink; ctx.fillRect(0, 0, VW, VH);
    ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    // shake
    if (W.shake > 0 && TM.S.profile.settings.shake) ctx.translate((Math.random() - .5) * W.shake * 4, (Math.random() - .5) * W.shake * 4);
    const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), x1 = Math.min(W.w - 1, Math.ceil((cam.x + VW) / TS)), y1 = Math.min(W.h - 1, Math.ceil((cam.y + VH) / TS));
    // tiles
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let ch = W.map[y][x]; if (W.veil.has(x + ',' + y)) ch = 'W';
      const v = (x * 7 + y * 13) % 3;
      const below = y + 1 < W.h ? W.map[y + 1][x] : ' ';
      const face = isWall(ch) && !isWall(below) && !W.veil.has(x + ',' + (y + 1));
      const under = '.,:_=gP'.includes(ch) ? null : (W.L.outdoors ? ',' : ':');
      if ('KTSBbLF'.includes(ch) && under) ctx.drawImage(atlas[under + v], x * TS, y * TS);
      ctx.drawImage(atlas[ch + v + (face ? 'f' : '')], x * TS, y * TS);
      if (W.locked.has(x + ',' + y)) { px(ctx, x * TS + 2, y * TS, 12, 16, '#2a211c'); px(ctx, x * TS + 7, y * TS + 7, 2, 3, '#d8c070'); }
      if (ch === '~' && Math.sin(t * 3 + x * 5 + y) > .8) px(ctx, x * TS + 4 + (t * 20 % 6), y * TS + 7, 2, 1, '#3a5070');
      if (ch === 'A' && ((t * 2 + x * .7 + y * 1.3) % 3) < .3) px(ctx, x * TS + 3, y * TS + 8, 6, 1, W.L.dawn ? '#6a7a8a' : '#1e3550');
    }
    // ritual circle (O tiles) — magenta lattice glow
    if (W.circle) { const c = W.circle; ctx.save(); ctx.globalAlpha = .6 + .3 * Math.sin(t * 2); glyph(ctx, 'lattice', c.x, c.y, 3.2, P.magenta); ctx.restore(); }
    // zones
    for (const z of W.zones) {
      if (z.kind === 'slow' && !z.dead) { ctx.strokeStyle = 'rgba(214,51,138,.18)'; for (let k = 0; k < 3; k++) { const r = ((t * 12 + k * 20) % 60); ctx.beginPath(); ctx.arc(z.px + z.pw / 2, z.py + z.ph / 2, r, 0, 7); ctx.stroke(); } }
      if (z.kind === 'pull') { ctx.strokeStyle = 'rgba(154,164,178,.12)'; for (let k = 0; k < 4; k++) { const a = t * 1.5 + k * 1.57; ctx.beginPath(); ctx.arc(z.cx, z.cy, 30 + k * 10, a, a + 1); ctx.stroke(); } }
    }
    // tears (red: reserved)
    for (const tr of W.tears) { ctx.save(); ctx.translate(tr.x, tr.y); ctx.rotate(tr.rot); const o = tr.open; ctx.fillStyle = P.tear; ctx.globalAlpha = .25 + .2 * Math.sin(t * 9 + tr.x); ctx.fillRect(-tr.r, -2 * o, tr.r * 2, 4 * o); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(-tr.r * .8, -o, tr.r * 1.6, 2 * o); ctx.strokeStyle = P.tear; ctx.strokeRect(-tr.r, -2 * o, tr.r * 2, 4 * o); ctx.restore(); }
    // pickups
    for (const it of W.items) {
      if (it.taken) continue; const bob = Math.sin(t * 3 + it.x) * 1.5;
      if (it.t === 'scrap') { px(ctx, it.x - 3, it.y - 2 + bob, 4, 3, '#6f7887'); px(ctx, it.x, it.y - 4 + bob, 4, 2, '#9aa4b2'); px(ctx, it.x - 1, it.y + bob, 2, 1, P.tab); }
      if (it.t === 'frag') { ctx.globalAlpha = .7 + .3 * Math.sin(t * 4); glyph(ctx, 'lattice', it.x, it.y + bob - 2, .6, P.glow); ctx.globalAlpha = 1; }
    }
    // static props
    for (const c of W.props) {
      if (c.t === 'car') { const x = c.x - 14, y = c.y - 8; px(ctx, x, y + 2, 30, 13, '#000'); px(ctx, x, y, 30, 12, c.wood ? '#6a4a2a' : '#3a4a5a'); if (c.wood) px(ctx, x, y + 6, 30, 3, '#8a6a3a'); px(ctx, x + 7, y + 2, 14, 5, '#1a2530'); px(ctx, x + 2, y + 11, 6, 3, '#111'); px(ctx, x + 22, y + 11, 6, 3, '#111'); if (c.wood) { px(ctx, x + 2, y + 12, 6, 2, P.clay); px(ctx, x + 22, y + 12, 6, 2, P.clay); } }
      if (c.t === 'corpse') { const x = c.x - 12, y = c.y - 3; px(ctx, x, y, 24, 7, '#cfc8c0'); px(ctx, x - 5, y + 1, 6, 5, '#d8b8a0'); px(ctx, x - 6, y, 3, 7, '#3a2a22'); ctx.globalAlpha = .5 + .3 * Math.sin(t * 2.4); glyph(ctx, 'lattice', x + 12, y + 3, .45, P.glow); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x + 13, y + 3, 2.2, 0, 7); ctx.fill(); }
      if (c.t === 'bench') { px(ctx, c.x - 8, c.y - 6, 16, 9, '#4a3a2a'); px(ctx, c.x - 8, c.y - 6, 16, 2, '#6a5444'); px(ctx, c.x - 5, c.y - 9, 4, 3, '#9aa4b2'); px(ctx, c.x + 2, c.y - 8, 3, 2, P.tab); }
      if (c.t === 'safe') { px(ctx, c.x - 6, c.y - 8, 12, 12, c.open ? '#2a2a30' : '#5a606c'); px(ctx, c.x - 1, c.y - 4, 3, 3, '#d8c070'); }
    }
    // entities sorted by y
    const list = [];
    for (const n of W.npcs) if (!n.gone) list.push(n);
    for (const e of W.enemies) if (!e.dead) list.push(e);
    if (W.boss && !W.boss.gone) list.push(W.boss);
    list.push(p);
    list.sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e === p) drawPlayer(W, p, t);
      else if (e.isBoss) drawBoss(W, e, t);
      else if (e.isEnemy) drawEnemy(W, e, t);
      else drawSprite(e.spr, e.x, e.y, e.dir || 0, e.moving ? ((t * 6) | 0) % 4 : 0);
    }
    // clue pulse (subtle, pale — NOT magenta: clues aren't technomancy)
    for (const c of W.clues) {
      if (c.got) continue; const near = U.dist(p.x, p.y, c.x, c.y);
      const det = p.detective && near < W.detR;
      const a = det ? .9 : Math.max(0, .5 - near / 260) * (.5 + .5 * Math.sin(t * 4));
      if (a > .02) { ctx.strokeStyle = `rgba(230,236,240,${a})`; ctx.beginPath(); ctx.arc(c.x, c.y, 5 + Math.sin(t * 4) * 1.5, 0, 7); ctx.stroke(); if (det) { ctx.strokeStyle = `rgba(143,227,208,.8)`; ctx.strokeRect(c.x - 7, c.y - 7, 14, 14); } }
    }
    // projectiles & fx (under darkness)
    for (const pr of W.proj) {
      if (pr.kind === 'pellet') px(ctx, pr.x - 1, pr.y - 1, 2, 2, '#ffe8a0');
      else if (pr.kind === 'taser') { px(ctx, pr.x - 1, pr.y - 1, 2, 2, '#bde8ff'); }
      else if (pr.kind === 'throw') { px(ctx, pr.x - 2, pr.y - 2 - pr.h, 4, 4, pr.col || '#ccc'); px(ctx, pr.x - 2, pr.y, 4, 1, 'rgba(0,0,0,.5)'); }
      else if (pr.kind === 'swarm') { for (let i = 0; i < 14; i++) px(ctx, pr.x + Math.sin(t * 9 + i * 2.3) * 7, pr.y + Math.cos(t * 7 + i * 1.7) * 7, 1, 1, P.glow); }
      else if (pr.kind === 'gate') { ctx.strokeStyle = P.magenta; ctx.beginPath(); ctx.arc(pr.x, pr.y, 3, 0, 7); ctx.stroke(); }
    }
    ctx.restore();

    /* ---- LIGHTING ---- */
    lighting(W, t);
    ctx.drawImage(lc, 0, 0);

    /* ---- over-darkness: things that glow ---- */
    ctx.save(); ctx.translate(-Math.round(cam.x), -Math.round(cam.y));
    for (const e of W.enemies) {
      if (e.dead) continue;
      // OmniBox eyes glow magenta in the dark
      if (e.def.lang && e.def.lang !== 'beam') { const d = e.dir; px(ctx, e.x - 1 + (d === 1 ? -2 : d === 2 ? 2 : 0), e.y - 20, 2, 1, `rgba(255,42,141,${.4 + .3 * Math.sin(t * 5 + e.x)})`); }
      if (e.state === 'windup') { const k = e.timer / e.def.windup; ctx.globalAlpha = .5 + .5 * Math.sin(t * 20); glyph(ctx, TM.LANG[e.def.lang].glyph, e.x, e.y - 40 - (1 - k) * 4, 1 + (1 - k) * .4, e.def.lang === 'beam' ? P.magenta : P.glow); ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(255,42,141,.8)'; ctx.fillRect(e.x - 10, e.y - 30, 20 * (1 - k), 2); }
      if (e.def.lang === 'foldspeak' && e.tumbleTo && TM.G.seamGoggles()) { const q = e.tumbleTo; ctx.strokeStyle = P.tear; ctx.globalAlpha = .7; ctx.beginPath(); ctx.moveTo(q.x - 6, q.y - 10); ctx.lineTo(q.x + 2, q.y - 2); ctx.lineTo(q.x - 2, q.y + 2); ctx.lineTo(q.x + 6, q.y + 10); ctx.stroke(); ctx.globalAlpha = 1; }
      if (e.stun > 0) { for (let k = 0; k < 3; k++) px(ctx, e.x + Math.cos(t * 6 + k * 2) * 6, e.y - 30 + Math.sin(t * 6 + k * 2) * 2, 1, 1, '#bde8ff'); }
      if (e.jam > 0) { px(ctx, e.x - 6, e.y - 34, 12, 1, '#dfe6ea'); }
      if (e.alert > 0 && e.alert < 1 && !e.def.nocombat) { ctx.fillStyle = 'rgba(230,236,240,.8)'; ctx.fillRect(e.x - 1, e.y - 38, 2, 5 * e.alert); }
      if (e.def.nocombat && e.alert > 0) { ctx.fillStyle = '#ffd070'; ctx.fillRect(e.x - 1, e.y - 38, 2, 6 * Math.min(1, e.alert)); }
      if (e.state === 'chase' && !e.def.nocombat) { ctx.fillStyle = P.warn; ctx.fillRect(e.x - 1, e.y - 40, 2, 5); ctx.fillRect(e.x - 1, e.y - 33, 2, 2); }
    }
    if (W.boss && !W.boss.gone) drawBossFX(W, W.boss, t);
    // FX particles
    for (const f of W.fx) {
      const k = f.t / f.life;
      if (f.kind === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      else if (f.kind === 'cone') { ctx.fillStyle = f.col; ctx.globalAlpha = (1 - k) * .35; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r * (.4 + .6 * k), f.a - f.arc, f.a + f.arc); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; }
      else if (f.kind === 'beam') { ctx.strokeStyle = P.glow; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1; }
      else if (f.kind === 'text') { ctx.fillStyle = f.col; ctx.globalAlpha = 1 - k; ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.fillText(f.text, f.x, f.y - k * 12); ctx.globalAlpha = 1; }
      else if (f.kind === 'spark') { px(ctx, f.x + f.vx * f.t, f.y + f.vy * f.t, 1, 1, f.col); }
      else if (f.kind === 'swing') { ctx.strokeStyle = f.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, f.a - f.arc * (1 - k), f.a + f.arc * (1 - k * .3)); ctx.stroke(); ctx.lineWidth = 1; ctx.globalAlpha = 1; }
      else if (f.kind === 'slice') { // Gabriel: entity iridescence breaks palette on purpose
        ctx.globalAlpha = (1 - Math.abs(k * 2 - 1)) * .5; const cols = [P.entCyan, P.entMag, P.entYellow];
        for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[i % 3]; ctx.fillRect(f.x - 20 + i * 3, f.y - 30 + Math.sin(t * 3 + i) * 3, 40 - i * 6, 2); }
        ctx.beginPath(); ctx.fillStyle = '#000'; ctx.arc(f.x, f.y - 20, 4, 0, 7); ctx.fill(); ctx.strokeStyle = P.entCyan; ctx.beginPath(); ctx.arc(f.x, f.y - 20, 5, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    // veils: shimmer when anchor pinged
    if (W.anchorPing > 0) for (const k of W.veil) { const [x, y] = k.split(',').map(Number); ctx.fillStyle = `rgba(255,59,59,${W.anchorPing * .5})`; ctx.fillRect(x * TS, y * TS, TS, TS); }
    // player interaction hint
    if (W.hint) { const h = W.hint; ctx.fillStyle = 'rgba(5,6,8,.75)'; ctx.font = '8px monospace'; ctx.textAlign = 'center'; const w = ctx.measureText(h.text).width + 6; ctx.fillRect(h.x - w / 2, h.y - 34, w, 10); ctx.fillStyle = '#e6ecf0'; ctx.fillText(h.text, h.x, h.y - 26); }
    // channel progress (hold E)
    if (p.channel) { ctx.fillStyle = '#000'; ctx.fillRect(p.x - 12, p.y - 36, 24, 3); ctx.fillStyle = '#8fe3d0'; ctx.fillRect(p.x - 12, p.y - 36, 24 * p.channel.k, 3); }
    if (p.swap > 0) { ctx.fillStyle = '#000'; ctx.fillRect(p.x - 12, p.y - 36, 24, 3); ctx.fillStyle = P.tab; ctx.fillRect(p.x - 12, p.y - 36, 24 * (1 - p.swap / p.swapMax), 3); ctx.fillStyle = '#e6ecf0'; ctx.font = '7px monospace'; ctx.textAlign = 'center'; const st = p.swap / p.swapMax; ctx.fillText(st > .66 ? 'PUSH' : st > .2 ? 'QUARTER-TURN' : 'CLICK', p.x, p.y - 40); }
    ctx.restore();

    // rain overlay
    if (W.L.rain && W.L.outdoors) { ctx.strokeStyle = 'rgba(154,164,178,.35)'; ctx.beginPath(); for (const r of rain) { r.y += r.s * W.dt; r.x -= r.s * .18 * W.dt; if (r.y > VH) { r.y = -8; r.x = Math.random() * VW + 40; } ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + 2, r.y - 7); } ctx.stroke(); }
    // nerve vignette & hotwire tint
    const nerve = TM.S.run.nerve;
    if (nerve < 50) { const g = ctx.createRadialGradient(VW / 2, VH / 2, 60, VW / 2, VH / 2, 280); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(50 - nerve) / 55})`); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
    if (p.hotwire > 0) { ctx.fillStyle = `rgba(214,51,138,${.12 + .06 * Math.sin(t * 12)})`; ctx.fillRect(0, 0, VW, VH); }
    if (p.hurtFlash > 0) { ctx.fillStyle = `rgba(255,59,59,${p.hurtFlash * .35})`; ctx.fillRect(0, 0, VW, VH); }
    if (p.slowed) { ctx.fillStyle = 'rgba(214,51,138,.06)'; ctx.fillRect(0, 0, VW, VH); }
    if (W.flash > 0) { ctx.fillStyle = `rgba(255,255,240,${W.flash})`; ctx.fillRect(0, 0, VW, VH); }
    if (W.L.dawn) { const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, 'rgba(255,180,140,.12)'); g.addColorStop(1, 'rgba(120,140,200,.05)'); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH); }
  }

  function lighting(W, t) {
    const cam = W.cam, p = W.player; const L = W.L;
    lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, VW, VH);
    const amb = L.dark;
    const x0 = Math.max(0, Math.floor(cam.x / TS)), y0 = Math.max(0, Math.floor(cam.y / TS)), x1 = Math.min(W.w - 1, Math.ceil((cam.x + VW) / TS)), y1 = Math.min(W.h - 1, Math.ceil((cam.y + VH) / TS));
    lx.fillStyle = '#000'; lx.globalAlpha = 1; lx.fillRect(0, 0, VW, VH);
    // explored tiles are dimly remembered; unexplored stay black-hole black
    lx.globalCompositeOperation = 'destination-out';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (W.explored[y * W.w + x]) { lx.globalAlpha = Math.min(.42, (1 - amb) * 2.2); lx.fillRect(x * TS - cam.x, y * TS - cam.y, TS, TS); }
    lx.globalAlpha = 1;
    const cut = (x, y, r, k = 1) => { const g = lx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${k})`); g.addColorStop(.7, `rgba(0,0,0,${k * .55})`); g.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = g; lx.beginPath(); lx.arc(x, y, r, 0, 7); lx.fill(); };
    // FOV polygon from the flashlight
    if (W.fov && W.fov.length > 2) {
      const ox = p.x - cam.x, oy = p.y - 8 - cam.y; const rng = W.fovRange;
      const g = lx.createRadialGradient(ox, oy, 4, ox, oy, rng); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.75, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = g; lx.beginPath(); lx.moveTo(ox, oy); for (const q of W.fov) lx.lineTo(q[0] - cam.x, q[1] - cam.y); lx.closePath(); lx.fill();
    }
    cut(p.x - cam.x, p.y - 8 - cam.y, p.flashlight ? 30 : 22, .9);
    for (const l of W.lights) {
      let k = l.k || .85; if (l.flicker) k *= .7 + .3 * Math.sin(t * 17 + l.x) * Math.sin(t * 5.3);
      if (l.ttl != null) k *= Math.min(1, l.ttl / 2);
      cut(l.x - cam.x, l.y - cam.y, l.r, k);
    }
    lx.globalCompositeOperation = 'source-over';
    // colored light tint
    for (const l of W.lights) { if (!l.col) continue; const g = lx.createRadialGradient(l.x - cam.x, l.y - cam.y, 0, l.x - cam.x, l.y - cam.y, l.r); g.addColorStop(0, l.col); g.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = g; lx.globalAlpha = .18; lx.fillRect(l.x - cam.x - l.r, l.y - cam.y - l.r, l.r * 2, l.r * 2); lx.globalAlpha = 1; }
  }

  function drawPlayer(W, p, t) {
    const key = TM.S.run.char; const fr = p.moving ? ((p.anim * (p.sprinting ? 10 : 7)) | 0) % 4 : 0;
    if (p.hidden) ctx.globalAlpha = .45;
    if (p.inv > 0 && ((t * 20) | 0) % 2) ctx.globalAlpha = .3;
    drawSprite(key, p.x, p.y, p.dir4, fr); ctx.globalAlpha = 1;
    if (p.aging > 0) { px(ctx, p.x - 3, p.y - 28, 6, 1, '#ddd'); }
  }
  function drawEnemy(W, e, t) {
    const fr = e.moving ? ((t * 7 + e.x) | 0) % 4 : 0;
    if (e.phased) ctx.globalAlpha = .25 + .1 * Math.sin(t * 20);
    if (e.fake) ctx.globalAlpha = .85;
    if (e.flashHit > 0) ctx.filter = 'brightness(3)';
    drawSprite(e.def.spr, e.x, e.y, e.dir, fr);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    if (!e.def.nocombat && e.hp < e.maxHp) { px(ctx, e.x - 8, e.y + 3, 16, 2, '#000'); px(ctx, e.x - 8, e.y + 3, 16 * Math.max(0, e.hp / e.maxHp), 2, e.fake ? '#6f7887' : P.steel); }
  }
  function drawBoss(W, b, t) {
    const fr = b.moving ? ((t * (b.phase === 1 ? 11 : 6)) | 0) % 4 : 0;
    const jitter = b.phase === 1 ? (Math.random() < .2 ? (Math.random() - .5) * 4 : 0) : 0;
    if (b.flashHit > 0) ctx.filter = 'brightness(2.5)';
    drawSprite('bernard', b.x + jitter, b.y, b.dir, fr); ctx.filter = 'none';
    if (b.core) { ctx.strokeStyle = P.entCyan; ctx.globalAlpha = .6 + .4 * Math.sin(t * 8); ctx.beginPath(); ctx.arc(b.x, b.y - 22, 4, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  function drawBossFX(W, b, t) {
    if (b.shield > 0) { ctx.strokeStyle = P.magenta; ctx.globalAlpha = .5 + .3 * Math.sin(t * 6); ctx.beginPath(); ctx.arc(b.x, b.y - 20, 22, 0, 7); ctx.stroke(); glyph(ctx, 'lattice', b.x, b.y - 20, 1.6, P.magenta); ctx.globalAlpha = 1; }
    if (b.lunge && b.lunge.wind > 0) { ctx.strokeStyle = 'rgba(255,107,107,.6)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(b.x, b.y - 10); ctx.lineTo(b.lunge.tx, b.lunge.ty); ctx.stroke(); ctx.setLineDash([]); }
    if (b.core) { ctx.strokeStyle = P.entCyan; ctx.beginPath(); ctx.arc(b.x, b.y - 22, 5 + Math.sin(t * 8), 0, 7); ctx.stroke(); }
    if (W.dolores && W.dolores.casting > 0) { const d = W.dolores; ctx.globalAlpha = .5 + .5 * Math.sin(t * 20); glyph(ctx, 'whisper', d.x, d.y - 40, 1.3, P.glow); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,42,141,.8)'; ctx.fillRect(d.x - 10, d.y - 30, 20 * (1 - d.casting / d.castMax), 2); }
  }

  function setView(w, h) { if (w === VW && h === VH) return false; VW = w; VH = h; cv.width = w; cv.height = h; ctx.imageSmoothingEnabled = false; [lc, lx] = mk(w, h); for (const r of rain) { r.x = Math.random() * VW; r.y = Math.random() * VH; } return true; }
  return { init, frame, icon, kitIcon, portrait, glyph, setView, SPECS, OPAQUE, SOLID, TS, sheets, buildSheet, get VW() { return VW; }, get VH() { return VH; }, get canvas() { return cv; } };
})();
