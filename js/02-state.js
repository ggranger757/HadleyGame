/* =========================================================================
   TECHNOMANCERS — 02-state.js
   Two layers of persistence (localStorage, wrapped in try/catch):
     PROFILE — survives every run: XP/rank, achievements, codex, settings,
               Daily Jam streak, best grades, key bindings.
     RUN     — the current case: character, level, position, inventory,
               clues, deductions, flags, suspicion, nerve. Autosaved per room.
   ========================================================================= */
'use strict';

TM.S = (() => {
  const PKEY = 'technomancers.profile.v1', AKEY = 'technomancers.auto.v1', MKEY = 'technomancers.manual.v1';
  const store = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } },
  };
  const defaultKeys = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', sprint: 'ShiftLeft', interact: 'KeyE', attack: 'KeyF', kit: 'KeyQ', cycle: 'KeyC', swap: 'KeyR', anchor: 'KeyV', detective: 'KeyG', light: 'KeyL', board: 'Tab', pause: 'Escape' };
  function freshProfile() {
    return {
      xp: 0, ach: {}, codex: {}, grades: {}, bestTimes: {}, completed: { augie: false, jester: false }, counters: {},
      daily: { last: null, streak: 0, best: 0, solvedToday: null },
      settings: { sound: true, music: .7, sfx: .8, shake: true, textSpeed: 1, contrast: false, haptics: true, touch: 'auto', scanlines: true },
      keys: { ...defaultKeys }, swaps: 0, totalClues: 0, firstPlay: Date.now(),
    };
  }
  const S = {
    profile: null, run: null, defaultKeys,
    load() {
      const p = store.get(PKEY); S.profile = Object.assign(freshProfile(), p || {});
      S.profile.settings = Object.assign(freshProfile().settings, (p && p.settings) || {});
      S.profile.keys = Object.assign({ ...defaultKeys }, (p && p.keys) || {});
    },
    saveProfile() { store.set(PKEY, S.profile); },
    newRun(char) {
      const C = TM.CHARS[char]; const r = TM.S.rankPerks();
      const kit = { ...C.kit }; if (r.kit) for (const k in kit) if (k !== 'ash' && k !== 'shells') kit[k] += 1;
      S.run = {
        char, level: 0, pos: null, hp: C.hp + (r.hp ? 15 : 0), maxHp: C.hp + (r.hp ? 15 : 0), nerve: 100,
        kit, kitSel: 0, weap: 0, ammo: { taser: 8, shells: char === 'jester' ? 5 : 0 }, scrap: 0,
        clues: [], deds: [], wrongLinks: 0, flags: {}, frags: {}, toolsUsed: {}, killed: {},
        lvl: { time: 0, dmg: 0, maxSusp: 0, wrong: 0, seen: 0 }, total: { time: 0, clues: 0, deds: 0, susp: 0, counters: 0 },
        started: Date.now(), version: 1,
      };
      return S.run;
    },
    autosave() { if (S.run) store.set(AKEY, S.run); },
    manualSave() { if (S.run) return store.set(MKEY, { ...S.run, savedAt: Date.now() }); },
    hasAuto() { return !!store.get(AKEY); }, hasManual() { return store.get(MKEY); },
    loadAuto() { S.run = store.get(AKEY); return S.run; },
    loadManual() { S.run = store.get(MKEY); if (S.run) store.set(AKEY, S.run); return S.run; },
    clearRun() { store.del(AKEY); S.run = null; },
    wipeAll() { store.del(PKEY); store.del(AKEY); store.del(MKEY); S.load(); },

    // ---- rank & perks ----
    rankIndex(xp = S.profile.xp) { let i = 0; TM.RANKS.forEach((r, k) => { if (xp >= r.xp) i = k; }); return i; },
    rankPerks() { const i = S.rankIndex(); const p = {}; for (let k = 0; k <= i; k++) if (TM.RANKS[k].perk) p[TM.RANKS[k].perk] = true; return p; },
    addXP(n, why) {
      if (!n) return; const before = S.rankIndex(); S.profile.xp += Math.round(n); const after = S.rankIndex();
      TM.UI && TM.UI.xpPop(Math.round(n), why);
      if (after > before) TM.UI && TM.UI.rankUp(TM.RANKS[after]);
      S.saveProfile();
    },
    unlock(id) {
      if (!TM.ACH[id] || S.profile.ach[id]) return; S.profile.ach[id] = Date.now(); S.saveProfile();
      TM.UI && TM.UI.achToast(TM.ACH[id]); TM.Audio.play('ach'); S.addXP(TM.ACH[id].xp);
    },
    codex(id) { if (!TM.CODEX[id] || S.profile.codex[id]) return false; S.profile.codex[id] = Date.now(); S.saveProfile(); TM.UI && TM.UI.toast('CODEX · ' + TM.CODEX[id].title, 'codex'); return true; },
    count(k, n = 1) { S.profile.counters[k] = (S.profile.counters[k] || 0) + n; S.saveProfile(); return S.profile.counters[k]; },

    // ---- run helpers ----
    has: (c) => S.run.clues.includes(c), ded: (d) => S.run.deds.includes(d), flag: (f) => !!S.run.flags[f],
    check(cond) { // generic condition object used by dialogue, exits, triggers
      if (!cond) return true; const r = S.run;
      if (cond.char && cond.char !== r.char) return false;
      if (cond.clue && !(Array.isArray(cond.clue) ? cond.clue.every(S.has) : S.has(cond.clue))) return false;
      if (cond.nclue && S.has(cond.nclue)) return false;
      if (cond.ded && !(Array.isArray(cond.ded) ? cond.ded.every(S.ded) : S.ded(cond.ded))) return false;
      if (cond.flag && !(Array.isArray(cond.flag) ? cond.flag.every(S.flag) : S.flag(cond.flag))) return false;
      if (cond.flag2 && !S.flag(cond.flag2)) return false;
      if (cond.nflag && S.flag(cond.nflag)) return false;
      return true;
    },
  };
  return S;
})();
