/* =========================================================================
   TECHNOMANCERS — 03-state.js
   PROFILE (forever): XP, feats, files, stars, settings, daily streak.
   RUN (this playthrough): hero, chapter, scene, clues, flags, hp, gadgets.
   ========================================================================= */
'use strict';
TM.S = (() => {
  const PK = 'tm2.profile', RK = 'tm2.run';
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const S = {
    profile: null, run: null,
    load() {
      const p = get(PK) || {};
      S.profile = Object.assign({ xp: 0, feats: {}, files: {}, stars: {}, done: {}, lies: 0, weak: {}, daily: { last: null, streak: 0, best: 0 }, settings: {} }, p);
      S.profile.settings = Object.assign({ sound: true, music: .6, sfx: .8, textSpeed: 1, shake: true, haptics: true }, p.settings || {});
    },
    save() { put(PK, S.profile); },
    saveRun() { if (S.run) put(RK, S.run); },
    loadRun() { S.run = get(RK); return S.run; },
    hasRun() { return !!get(RK); },
    clearRun() { try { localStorage.removeItem(RK); } catch (e) { } S.run = null; },
    wipe() { try { localStorage.removeItem(PK); localStorage.removeItem(RK); } catch (e) { } S.load(); },
    newRun(hero) {
      const H = TM.HEROES[hero]; const bonus = S.rank().i;
      S.run = { hero, ch: 0, scene: null, x: null, hp: H.hp + bonus * 10, maxHp: H.hp + bonus * 10, clues: [], flags: {}, glyphs: {}, wins: {}, solved: {}, gadgets: {}, meds: H.meds, chStats: {} };
      S.refill(); return S.run;
    },
    refill() { const H = TM.HEROES[S.run.hero]; const b = S.rank().i >= 3 ? 1 : 0; for (const k in H.gadgets) S.run.gadgets[k] = Math.max(S.run.gadgets[k] || 0, H.gadgets[k] + b); S.run.meds = Math.max(S.run.meds, H.meds); },
    rank(xp = S.profile.xp) { let i = 0; TM.RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; }); const nx = TM.RANKS[i + 1]; return { i, name: TM.RANKS[i][1], cur: TM.RANKS[i][0], next: nx ? nx[0] : null, nextName: nx ? nx[1] : null }; },
    xp(n, why) {
      n = Math.round(n); if (!n) return; const before = S.rank().i; S.profile.xp += n; S.save();
      TM.UI && TM.UI.xp(n, why);
      const after = S.rank(); if (after.i > before) { TM.UI && TM.UI.rankUp(after); if (S.run) { S.run.maxHp += 10; S.run.hp += 10; } }
    },
    feat(id) { const f = TM.FEATS[id]; if (!f || S.profile.feats[id]) return; S.profile.feats[id] = Date.now(); S.save(); TM.UI && TM.UI.feat(f); S.xp(f[2]); },
    file(id) { if (!TM.FILES[id] || S.profile.files[id]) return; S.profile.files[id] = 1; S.save(); },
    has: (c) => S.run.clues.includes(c), flag: (f) => !!S.run.flags[f],
    check(c) {
      if (!c) return true;
      if (c.clue && ![].concat(c.clue).every(S.has)) return false;
      if (c.nclue && S.has(c.nclue)) return false;
      if (c.flag && ![].concat(c.flag).every(S.flag)) return false;
      if (c.nflag && S.flag(c.nflag)) return false;
      if (c.q && !S.run.solved[c.q]) return false;
      if (c.fight && !S.run.wins[c.fight]) return false;
      return true;
    },
    stat(k, n = 1) { const cs = S.run.chStats[S.run.ch] = S.run.chStats[S.run.ch] || { wrong: 0, ko: 0, caught: 0 }; cs[k] += n; },
  };
  return S;
})();
