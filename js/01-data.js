/* =========================================================================
   TECHNOMANCERS — 01-data.js
   Systems data: palette, playable characters, weapons, kit, enemies,
   counter matrix, ranks/perks, achievements. Story lives in 01b, maps in 01c.
   ========================================================================= */
'use strict';

TM.PAL = {
  ink: '#050608', slate: '#2d3142', slate2: '#404663', ash: '#6f7887', steel: '#9aa4b2', pale: '#e6ecf0',
  magenta: '#d6338a', glow: '#ff2a8d', maskBlue: '#7ab8e8',
  tear: '#ff3b3b', warn: '#ff6b6b',           // RED IS RESERVED: tears, entity corruption, damage, warnings
  entCyan: '#6df0ff', entMag: '#ff7bd5', entYellow: '#fff36b',
  // world-only neutrals (never used for technomancy)
  wood: '#3a2f2a', wood2: '#4b3b31', clay: '#5a3b2e', olive: '#4a5a3a', olive2: '#5d6e45', tab: '#e0752d',
  skinA: '#c99a7a', skinJ: '#7a5236', skinD: '#d8b8a0', skinH: '#c8a088', skinS: '#d6b08a', skinT: '#8c6a50',
  neon: '#d6338a', denim: '#2b3b5c', white: '#dfe6ea', leather: '#16171c', blond: '#e8d27a', water: '#0b1622',
};

/* ---------------- Playable characters (Appendix B) ---------------- */
TM.CHARS = {
  augie: {
    name: 'AUGIE', title: 'Engineering Investigator',
    blurb: 'Reclusive ex-cult engineer. 5\'11", built like a wall. Scrap-built counter-tech for every T-Mancer class. Forensics expert. Drinks to sleep.',
    hp: 100, speed: 66, sprint: 1.55, swap: 2.0,
    weapons: ['knocker', 'stun', 'horn', 'taser'],
    kit: { tattle: 2, salt: 2, jar: 1, ticks: 2, flare: 1, ash: 0 },
    tools: ['uv', 'dust', 'swab', 'polaroid'],
    special: 'WORKSHOP CRAFT — rebuild kit from scrap at any workbench. GOLEM drone runs Detective Mode.',
    stats: { HP: 100, SPEED: 'Medium', FORENSICS: 'High', MELEE: 'Hush Crook', RANGED: 'Drum: Taser / Flare / ASH', ANCHOR: 'Full suite' },
  },
  jester: {
    name: 'JESTER', title: 'Undercover Bruiser',
    blurb: 'Ex-ace detective, ex-addict, now deep inside the Mantis crew. Mantis-shrimp jacket, steel-core bat, a knife and a pump gun. Reads liars like headlines.',
    hp: 140, speed: 80, sprint: 1.5, swap: 0.5,
    weapons: ['bat', 'knife', 'shotgun'],
    kit: { frag: 2, emp: 1, shells: 8 },
    tools: ['eyeball', 'shakedown', 'cut', 'photo'],
    special: 'STREET SENSE — sees the tells when witnesses lie. Gang contacts sell kit for cash.',
    stats: { HP: 140, SPEED: 'Fast', FORENSICS: 'Low', MELEE: 'Bat + Bowie knife', RANGED: 'Pump shotgun 4+1', ANCHOR: 'LED checker' },
  },
};

/* ---------------- Weapons ---------------- */
// kind: melee | cone | shot | spread
TM.WEAPONS = {
  knocker: { name: 'KNOCKER', icon: 'knocker', kind: 'melee', dmg: 22, range: 22, arc: 1.3, cd: .55, knock: 70, noise: 10, sfx: 'hit', desc: 'Sledgehammer head. Rubber faces. Blunt, heavy.' },
  stun: { name: 'STUN CROWN', icon: 'crown', kind: 'melee', dmg: 8, range: 20, arc: 1.1, cd: .7, stun: 2.4, noise: 6, sfx: 'taser', desc: 'Rubber dome, copper studs. Jab and squeeze.' },
  horn: { name: 'HUSH HORN', icon: 'horn', kind: 'cone', dmg: 5, range: 96, arc: .75, cd: 1.1, counters: ['whisper'], noise: 18, sfx: 'horn', desc: 'Coil-wound cone. Breaks Whisper casting code at 6 m.' },
  taser: { name: 'DRUM · TASER', icon: 'drum', kind: 'shot', dmg: 6, stun: 2.6, speed: 260, cd: .8, ammo: 'taser', noise: 8, sfx: 'taser', desc: 'Chambers 2–3. Barbs on wire. Stuns.' },
  bat: { name: 'STEEL BAT', icon: 'bat', kind: 'melee', dmg: 26, range: 24, arc: 1.5, cd: .7, knock: 95, deflect: true, interrupt: true, noise: 14, sfx: 'hit', desc: 'Taped grip, steel core. Knocks bodies and bullets out of the air.' },
  knife: { name: 'BOWIE KNIFE', icon: 'knife', kind: 'melee', dmg: 12, range: 16, arc: .9, cd: .28, backstab: 4, noise: 0, sfx: 'knife', desc: 'Fast and silent. x4 on anyone who never saw you.' },
  shotgun: { name: 'PUMP SHOTGUN', icon: 'shotgun', kind: 'spread', dmg: 13, pellets: 5, range: 90, arc: .5, speed: 330, cd: .95, ammo: 'shells', knock: 80, interrupt: true, noise: 40, sfx: 'shotgun', desc: '4+1. Loud. Anything close stops being close.' },
};

/* ---------------- Kit (Q to use, C to cycle) ---------------- */
TM.KIT = {
  tattle: { name: 'TATTLE', icon: 'tattle', max: 3, cost: 2, desc: 'Speaker magnet + pager. Hisses into an OmniBox feedback line — any cast in range second-guesses itself and aborts.', counters: ['whisper', 'nanohive', 'temporaltext', 'foldspeak'], radius: 70, throw: true },
  salt: { name: 'STATIC SALT', icon: 'salt', max: 3, cost: 3, desc: 'Soda can of shredded mylar and iron filings. Jams Voidwalker gates for 40 s. Also seals entity tears.', counters: ['foldspeak'], radius: 56, throw: true },
  jar: { name: 'SWARM JAR', icon: 'jar', max: 2, cost: 3, desc: 'Mason jar, ionizer needle. Vacuums nanobots. A phased Nanomancer collapses inside the pull.', counters: ['nanohive'], radius: 60, throw: true },
  ticks: { name: 'TICKS', icon: 'ticks', max: 3, cost: 2, desc: 'Tennis balls with quartz clocks. Flood a boson scan so Temporaltext casts won\'t hold.', counters: ['temporaltext'], radius: 64, throw: true },
  flare: { name: 'FLARE ROUND', icon: 'flare', max: 2, cost: 2, desc: 'Drum chamber 5. Lights a room for 10 s, blinds Veils, floods boson scans.', counters: ['temporaltext', 'whisper'], radius: 90, throw: true, light: 10 },
  ash: { name: 'ASH ROUND', icon: 'ash', max: 1, cost: 0, desc: 'Drum chamber 6. Four filed notches. The one that kills. Bursts inside the target, leaves no slug.', ash: true },
  frag: { name: 'FRAG', icon: 'frag', max: 3, cost: 3, desc: 'Pineapple from the Mantis armory. Loud. Final.', radius: 40, dmg: 45, throw: true, noise: 50 },
  emp: { name: 'EMP CHARGE', icon: 'emp', max: 2, cost: 4, desc: 'Jury-rigged disruptive charge. Kills any cast in the blast, stuns OmniBoxes, collapses tears.', counters: ['whisper', 'nanohive', 'temporaltext', 'foldspeak', 'beam'], radius: 70, throw: true },
  shells: { name: 'SHELLS', icon: 'shells', max: 12, cost: 1, desc: 'Buckshot for the pump gun.', ammoOnly: true },
};

/* ---------------- Enemies & counter matrix (Appendix C) ---------------- */
TM.ENEMIES = {
  holo: { name: 'HOLOILLUSIONIST', lang: 'whisper', hp: 60, speed: 30, sight: 120, castRange: 120, windup: 1.4, casts: ['echostep', 'hotwire'], spr: 'holo', counterText: 'HUSH HORN breaks Whisper · ANCHOR ping finds the real body' },
  nano: { name: 'NANOMANCER', lang: 'nanohive', hp: 70, speed: 38, sight: 130, castRange: 130, windup: 1.2, casts: ['swarm', 'phase'], spr: 'nano', counterText: 'SWARM JAR vacuums the bots · a phased Nanomancer collapses in the jar' },
  chrono: { name: 'CHRONOMANCER', lang: 'temporaltext', hp: 45, speed: 34, sight: 120, castRange: 120, windup: 1.3, casts: ['lag', 'stutter'], spr: 'chrono', counterText: 'TICKS or FLARE flood the boson scan · the cast won\'t hold' },
  void: { name: 'VOIDWALKER', lang: 'foldspeak', hp: 90, speed: 28, sight: 125, castRange: 140, windup: 1.2, casts: ['tumble', 'gateshell'], spr: 'void', counterText: 'SEAM GOGGLES show re-emergence · STATIC SALT jams gates 40 s' },
  grunt: { name: 'SAINTS ENFORCER', lang: 'beam', hp: 50, speed: 44, sight: 110, castRange: 115, windup: .9, casts: ['beam'], spr: 'grunt', conventional: true, counterText: 'Conventional fire works · EMP kills the aging beam · bat interrupts' },
  cop: { name: 'NIGHT SHIFT', lang: null, hp: 9999, speed: 30, sight: 100, castRange: 0, windup: 0, casts: [], spr: 'cop', nocombat: true, counterText: 'You don\'t hit cops. Stay out of the light.' },
};
TM.LANG = {
  whisper: { name: 'WHISPER', glyph: 'whisper' }, nanohive: { name: 'NANOHIVE', glyph: 'nanohive' },
  temporaltext: { name: 'TEMPORALTEXT', glyph: 'temporaltext' }, foldspeak: { name: 'FOLDSPEAK', glyph: 'foldspeak' }, beam: { name: 'AGING BEAM', glyph: 'beam' },
};

/* ---------------- Ranks & perks (persist across saves) ---------------- */
TM.RANKS = [
  { xp: 0, name: 'UNIFORM', perk: null },
  { xp: 250, name: 'DETECTIVE', perk: 'hp', text: '+15 max HP' },
  { xp: 600, name: 'CASE BREAKER', perk: 'kit', text: '+1 capacity on every kit item' },
  { xp: 1100, name: 'SEAM READER', perk: 'swap', text: 'Head swaps & reloads 30% faster' },
  { xp: 1800, name: 'ANCHOR', perk: 'nerve', text: 'Nerve drains 35% slower' },
  { xp: 2700, name: 'GHOST', perk: 'ghost', text: 'Suspicion builds 30% slower' },
  { xp: 3800, name: 'OMNISCIENT', perk: 'scan', text: 'Detective Mode reaches 50% farther' },
  { xp: 5200, name: 'T-MANCER HUNTER', perk: 'dmg', text: '+20% damage to anything that casts' },
];

/* ---------------- Achievements ---------------- */
TM.ACH = {
  first_clue: { name: 'Something Doesn\'t Fit', desc: 'Log your first clue.', xp: 20 },
  first_ded: { name: 'Red String', desc: 'Make your first deduction on the Evidence Board.', xp: 30 },
  thorough: { name: 'Thorough', desc: 'Use every forensic tool on a single clue.', xp: 40 },
  c_whisper: { name: 'Speaks Whisper', desc: 'Abort a Holoillusionist cast with its counter.', xp: 50 },
  c_nanohive: { name: 'Speaks Nanohive', desc: 'Abort a Nanomancer cast with its counter.', xp: 50 },
  c_temporaltext: { name: 'Speaks Temporaltext', desc: 'Abort a Chronomancer cast with its counter.', xp: 50 },
  c_foldspeak: { name: 'Speaks Foldspeak', desc: 'Abort a Voidwalker cast with its counter.', xp: 50 },
  polyglot: { name: 'Polyglot', desc: 'Counter all four casting languages.', xp: 150 },
  backstab: { name: 'Never Saw It', desc: 'Land a silent knife backstab.', xp: 30 },
  ghost: { name: 'Ghost', desc: 'Clear a level without suspicion ever reaching 100%.', xp: 60 },
  untouched: { name: 'Untouched', desc: 'Clear a level without taking damage.', xp: 80 },
  s_rank: { name: 'Case Closed, Clean', desc: 'Earn an S grade on any level.', xp: 100 },
  frags_level: { name: 'Glyph Hunter', desc: 'Find all 3 glyph fragments in one level.', xp: 50 },
  frags_all: { name: 'The Whole Lattice', desc: 'Find every glyph fragment in the case.', xp: 300 },
  swapper: { name: 'Push · Quarter-Turn · Click', desc: 'Swap Hush Crook heads 25 times.', xp: 40 },
  bernard: { name: 'Wrong Body', desc: 'Survive Bernard.', xp: 200 },
  destroy: { name: 'Burn It Down', desc: 'Choose to destroy.', xp: 50 },
  contain: { name: 'Keep It', desc: 'Choose to contain.', xp: 50 },
  both: { name: 'Two Sides of Raincaster', desc: 'Close the case as both Augie and Jester.', xp: 300 },
  all_ded: { name: 'Every Thread', desc: 'Make every deduction in the case.', xp: 200 },
  daily1: { name: 'Jammer', desc: 'Solve a Daily Jam.', xp: 30 },
  streak3: { name: 'Habit', desc: 'Keep a 3-day Daily Jam streak.', xp: 80 },
  streak7: { name: 'Ritual', desc: 'Keep a 7-day Daily Jam streak.', xp: 200 },
  night_owl: { name: 'Night Shift', desc: 'Play between midnight and 4 AM.', xp: 25 },
};

/* craft recipes (scrap cost) — Augie at workbenches, Jester via contacts */
TM.CRAFT = {
  augie: ['tattle', 'salt', 'jar', 'ticks', 'flare', 'taserAmmo', 'medic'],
  jester: ['shells', 'frag', 'emp', 'medic'],
  extra: {
    taserAmmo: { name: 'TASER ROUNDS ×4', cost: 1, desc: 'Barbs for drum chambers 2–3.' },
    medic: { name: 'FIELD MEDIC', cost: 2, descA: 'Golem II medic mode: trauma pouch and surgical arms. +50 HP.', descJ: 'A bottle and a needle-and-thread from a crew medic. +50 HP.' },
  },
};
