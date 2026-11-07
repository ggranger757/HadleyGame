/* =========================================================================
   TECHNOMANCERS — 02-story.js
   Everything the player reads: chapters, scenes, clues, case questions,
   lies to catch, fights, dialogue, files, feats, Daily Case.
   Plain words only. *word* = magenta highlight.
   Text can be a string or {a:'Augie line', j:'Jester line'}.
   ========================================================================= */
'use strict';
window.TM = window.TM || {};

/* ------------------------------------------------------------ HEROES */
TM.HEROES = {
  augie: {
    name: 'AUGIE', spr: 'augie', tag: 'The Engineer',
    blurb: 'Grew up inside a cult of technomancers and escaped. Builds gadgets that shut their magic down.',
    hp: 100, atk: 10, perks: ['Gadgets for every kind of enemy', 'Finds extra details on clues'],
    gadgets: { horn: 3, salt: 3, jar: 3, ticks: 3 }, meds: 3,
  },
  jester: {
    name: 'JESTER', spr: 'jester', tag: 'The Undercover Cop',
    blurb: 'Used to be the best detective in Baltimore. Now he\'s undercover in a gang. Hits hard, spots liars.',
    hp: 130, atk: 14, perks: ['Hits harder, takes more hits', 'Sees when people are lying'],
    gadgets: { emp: 3, frag: 2 }, meds: 3,
  },
};
TM.GADGETS = {
  horn: { name: 'HUSH HORN', icon: '📢', beats: ['holo'], text: 'A blast of noise that breaks illusions.' },
  salt: { name: 'STATIC SALT', icon: '🧂', beats: ['void', 'tear'], text: 'A can of metal glitter that jams portals.' },
  jar: { name: 'SWARM JAR', icon: '🫙', beats: ['nano'], text: 'Sucks up swarms of tiny robots.' },
  ticks: { name: 'TICKS', icon: '⏱', beats: ['chrono'], text: 'Clockwork balls that mess up time magic.' },
  emp: { name: 'EMP GRENADE', icon: '⚡', beats: ['holo', 'void', 'nano', 'chrono', 'tear', 'shield'], text: 'Shuts down ANY technomancer\'s magic.' },
  frag: { name: 'FRAG GRENADE', icon: '💥', beats: [], text: 'Big damage to anything.', dmg: 32 },
  ash: { name: 'ASH ROUND', icon: '🔥', beats: ['core'], text: 'One special bullet. Save it for Bernard\'s core.' },
};

/* ------------------------------------------------------------ ENEMIES */
// Each turn the enemy SHOWS what it will do next. Use its weakness to cancel it.
TM.FOES = {
  holo: { name: 'HOLOILLUSIONIST', spr: 'holo', hp: 42, atk: 8, weak: 'horn', kind: 'Illusion caster',
    moves: [{ name: 'FAKE COPIES', tell: 'is splitting into fake copies. Your attacks will probably miss!', dodge: true }, { name: 'MIND TRICK', tell: 'is reaching into your head.', dmg: 11 }] },
  chrono: { name: 'CHRONOMANCER', spr: 'chrono', hp: 36, atk: 7, weak: 'ticks', kind: 'Time caster',
    moves: [{ name: 'SLOW TIME', tell: 'is slowing time. It will get TWO turns!', twice: true }, { name: 'TIME SNAP', tell: 'is about to snap time back on you.', dmg: 10 }] },
  nano: { name: 'NANOMANCER', spr: 'nano', hp: 48, atk: 9, weak: 'jar', kind: 'Robot-swarm caster',
    moves: [{ name: 'NANO SWARM', tell: 'is releasing a swarm of tiny robots.', dmg: 13 }, { name: 'PHASE', tell: 'is turning see-through. Attacks will pass through it!', dodge: true }] },
  void: { name: 'VOIDWALKER', spr: 'void', hp: 54, atk: 10, weak: 'salt', kind: 'Portal caster',
    moves: [{ name: 'PORTAL JUMP', tell: 'is opening a portal to jump behind you.', dmg: 9, dodge: true }, { name: 'GATE SHOT', tell: 'is loading a portal shell into its shotgun.', dmg: 15 }] },
  grunt: { name: 'SAINTS ENFORCER', spr: 'grunt', hp: 40, atk: 9, weak: null, kind: 'Gang muscle with a stolen weapon',
    moves: [{ name: 'AGING BEAM', tell: 'is aiming a gun that makes people old.', dmg: 13 }, { name: 'BAT SWING', tell: 'is winding up a swing.', dmg: 9 }] },
  mantis: { name: 'MANTIS CREW', spr: 'crew2', hp: 55, atk: 10, weak: null, kind: 'Your own gang. They know you\'re a cop.',
    moves: [{ name: 'GANG UP', tell: 'and two friends are closing in.', dmg: 12 }, { name: 'SUCKER PUNCH', tell: 'is winding up a cheap shot.', dmg: 9 }] },
  bernard: { name: 'BERNARD', spr: 'bernard', hp: 70, atk: 13, weak: null, kind: '???', boss: true,
    moves: [{ name: 'WRONG LUNGE', tell: 'is bending in ways a body shouldn\'t.', dmg: 14 }, { name: 'CONFUSED', tell: 'seems lost. It\'s looking for something.', idle: true }] },
};

/* ------------------------------------------------------------ CLUES */
// Plain English. `extra` = what Augie notices (she's the forensics expert).
TM.CLUES = {
  news_report: { t: 'Radio News', i: '📻', d: 'A woman was found dead in the old Hartwell mansion. Strange shapes were drawn on her body and there\'s a perfectly round hole through her.' },
  aged_tee: { t: 'Tee Got Old Overnight', i: '👴', d: 'Tee is 19. Tonight his hair is white and his hands are wrinkled. A rival gang shot him with a weird gun.', extra: 'His arm has a glowing spiral burn. That\'s technomancy.' },
  cartridge: { t: 'Weird Bullet Shell', i: '🔩', d: 'The masked stranger dropped it. It has a police evidence number stamped on it.', extra: 'Somebody is stealing weapons out of the police station.' },
  body: { t: 'Lena\'s Body', i: '🧍', d: 'Lena Marsh, 23. A waitress saving up for art school. Strange glowing lines cover her skin.' },
  wound: { t: 'Perfect Circle Wound', i: '⭕', d: 'A hole exactly 7 cm wide through her stomach. The edges are melted like glass. No gun or knife does that.' },
  blood: { t: 'Blood on Her Back', i: '🩸', d: 'Her blood settled on her BACK, but she was found lying face-DOWN. She was lying somewhere else for hours first.' },
  dust: { t: 'No Drag Marks', i: '👣', d: 'The dusty floor has no drag marks. Someone CARRIED her in.', extra: 'One set of flat, small shoe prints. Probably a woman.' },
  ticket: { t: 'One Train Ticket', i: '🎫', d: 'Hidden in her shoe: one ticket out of town, for tomorrow morning. Just one. She was running away.' },
  chain: { t: 'Cut Chain', i: '⛓', d: 'The front door chain was cut with bolt cutters. Whoever came in didn\'t have a key.', extra: 'Red mud stuck in the lock.' },
  deed: { t: 'Who Owns the House', i: '📜', d: 'The mansion belongs to the family of Dez, Lena\'s boyfriend. The Chief says that makes Dez guilty.' },
  sketchbook: { t: 'Lena\'s Sketchbook', i: '📓', d: 'Page after page of the same creature, drawn in sliced-up pastel colors. Last page: "Gabriel is closer when Aunt D paints me."' },
  dez_said: { t: 'Dez\'s Story', i: '💬', d: 'Dez says: "I worked the door ALL night Thursday."' },
  timecard: { t: 'Dez\'s Timecard', i: '🕘', d: 'Dez clocked OUT at 9:05 PM Thursday — two hours early.' },
  aunt_quote: { t: '"Finish Her Portrait"', i: '🖼', d: 'Lena told Dez: if she stayed in town, her Aunt Dolores would "finish her portrait." She was scared.' },
  carl_said: { t: 'Carl\'s Story', i: '💬', d: 'Carl says: "I was home with my mom all night Thursday."' },
  parking: { t: 'Parking Ticket', i: '🚗', d: 'Carl\'s car got a parking ticket on LENA\'S street at 10:14 PM Thursday.' },
  wagon: { t: 'The Wood-Panel Car', i: '🚙', d: 'Carl saw Lena get into an old wood-paneled station wagon with an older woman at 10:05 PM. She went willingly.' },
  savings: { t: 'Lena\'s Savings', i: '💵', d: '$3,140 hidden in a coffee can, and an art-school acceptance letter. She was planning to leave for a long time.' },
  sketch: { t: 'Frank\'s Drawing', i: '🌀', d: 'The hurt detective can only draw now. He keeps drawing a spiral — the same spiral burned into Tee\'s arm.' },
  tape: { t: 'Calloway\'s Last Tape', i: '📼', d: '"The wagon belongs to Dolores Marsh. Lena\'s AUNT. We\'re going to her house tonight." Then static.' },
  ledger: { t: 'The Chief\'s Secret Notebook', i: '📒', d: 'Chief Hale has been SELLING weapons from the evidence room to the Saints gang. Including the aging gun.' },
  dops: { t: 'Secret Research File', i: '📁', d: 'A file about a creature called GABRIEL. It describes a machine that opens a 7 cm "doorway" through a person to pull the creature in.' },
  child_file: { t: 'Lena\'s Old Patient File', i: '🗂', d: 'Lena was brought here at age 9 by her aunt, for "seeing things." Visits went on for 14 years.' },
  mud: { t: 'Red Mud on the Car', i: '🚙', d: 'Dolores\' old wood-paneled car has red mud in the wheels — the same red mud as the mansion\'s road.' },
  portrait: { t: 'The Painting', i: '🖼', d: 'Dozens of paintings of Lena, all by Dolores. In the newest one there\'s a perfect circle left blank on her stomach.' },
  journal: { t: 'Dolores\' Journal', i: '📔', d: '"Every great leap forward requires a sacrifice. Thursday: she is ready."' },
  scientist: { t: 'Files on "The Scientist"', i: '🧪', d: 'Four files about someone called the Scientist. One says he died. One says captured. One says escaped. One says he BECAME something.' },
};

/* ------------------------------------------------------------ CASE QUESTIONS */
TM.QUESTIONS = {
  q_two: { q: 'Tee aged 40 years in a night. Lena has a perfectly round hole through her. What does that tell you?', hint: 'Look at both clues. Could anything normal do either?',
    a: [{ t: 'Something not normal is going on — strange technology is loose in Raincaster.', ok: true }, { t: 'Tee is lying about how old he is.' }, { t: 'The radio got the story wrong.' }],
    why: 'No normal weapon does either of those things. Somebody in this town has technomancy.' },
  q_moved: { q: 'Was Lena killed here in the mansion?', hint: 'Check where her blood settled, and the floor.',
    a: [{ t: 'No. She was killed somewhere else and carried here.', ok: true }, { t: 'Yes, right where she was found.' }, { t: 'She fell down the stairs.' }],
    why: 'Her blood settled on her back but she was face-down, and nobody dragged her across the dusty floor. Someone carried her here.' },
  q_owner: { q: 'The Chief says Dez\'s family brought her here because they own the house. True?', hint: 'How did the killer get in?',
    a: [{ t: 'No. The chain was cut — the owners have keys, they wouldn\'t need to cut it.', ok: true }, { t: 'Yes. They own it, so it was them.' }, { t: 'Detective Calloway did it.' }],
    why: 'Whoever brought Lena here had no key. They picked this house because it\'s empty and far away.' },
  q_wagon: { q: 'Who did Lena leave with on Thursday night?', hint: 'What did Carl see?',
    a: [{ t: 'An older woman in a wood-paneled station wagon.', ok: true }, { t: 'Dez, her boyfriend.' }, { t: 'Carl, the creepy regular.' }],
    why: 'Dez left at 9:40 and Carl only watched. Lena got into an old woman\'s wagon at 10:05.' },
  q_aunt: { q: 'Whose station wagon was it?', hint: 'Listen to Calloway\'s tape again.',
    a: [{ t: 'Dolores Marsh — Lena\'s aunt.', ok: true }, { t: 'Chief Hale.' }, { t: 'Seung Lee.' }],
    why: 'Calloway traced the wagon to Dolores Marsh right before he died.' },
  q_guns: { q: 'Where did the Saints get the gun that aged Tee?', hint: 'The shell had a police number on it...',
    a: [{ t: 'Chief Hale sold it to them from the police evidence room.', ok: true }, { t: 'Lena\'s aunt made it.' }, { t: 'They found it in the mansion.' }],
    why: 'The Chief\'s notebook lists the sale. He\'s dirty — but the gun and the murder are two different crimes.' },
  q_wound: { q: 'What made the perfect circle wound?', hint: 'Read the secret research file.',
    a: [{ t: 'A machine that opens a "doorway" through a person to pull in a creature.', ok: true }, { t: 'A very big drill.' }, { t: 'The aging gun.' }],
    why: 'The research file describes a 7 cm doorway machine. Lena\'s wound is exactly 7 cm.' },
  q_scene: { q: 'So where was Lena REALLY killed?', hint: 'Where did the journal say "she is ready"?',
    a: [{ t: 'Here — in Dolores\' basement.', ok: true }, { t: 'In the mansion after all.' }, { t: 'At the strip club.' }],
    why: 'Dolores did her experiment down here, then drove Lena\'s body to the mansion to hide it.' },
};

/* ------------------------------------------------------------ CHAPTERS */
// thing types: clue, npc, door, foe, glyph, prop, hide, cop, med, wall(fake)
// steps: the ONE thing to do next. need: {clue|flag|q|fight}. target = thing id the arrow points at.
TM.CHAPTERS = [
  { id: 'ch1', n: 1, title: 'THE ALLEY', mood: 'A body. A boy who got old overnight.', music: 'investigate',
    intro: 'intro1',
    scenes: {
      alley: { bg: 'c1', w: 1300, tint: 'night', rain: true, start: 80, things: [
        { id: 'radio', type: 'puzzle', puzzle: 'tune', x: 150, icon: '📻', then: { dlg: 'radio' }, label: 'TUNE RADIO' },
        { id: 'golem', type: 'npc', x: 60, spr: 'golem', only: 'augie', dlg: 'golem' },
        { id: 'lookout', type: 'npc', x: 330, spr: 'crew1', dlg: 'crew_alley', label: 'TALK' },
        { id: 'tee', type: 'npc', x: 640, spr: 'tee', dlg: 'tee', label: 'TALK' },
        { id: 'scav', type: 'foe', x: 1060, foe: 'holo', fight: 'f_scav', tut: true },
        { id: 'exit', type: 'door', x: 1260, to: 'END', label: 'TO THE MANSION' },
        { type: 'glyph', x: 380, y: 60 }, { type: 'glyph', x: 860, y: 40 }, { type: 'glyph', x: 1200, y: 90 },
        { type: 'med', x: 820 },
      ] },
    },
    steps: [
      { text: { a: 'Tune the radio to the news', j: 'Tune the car radio to the news' }, need: { clue: 'news_report' }, target: 'radio' },
      { text: 'Check in with the Mantis lookout (keep your cover!)', need: { flag: 'cover_alley' }, target: 'lookout', only: 'jester' },
      { text: 'Find Tee in the alley', need: { clue: 'aged_tee' }, target: 'tee' },
      { text: 'Stop the masked stranger', need: { fight: 'f_scav' }, target: 'scav' },
      { text: 'SOLVE: What do the two injuries mean?', need: { q: 'q_two' } },
      { text: 'Head to the mansion', need: { flag: 'END' }, target: 'exit' },
    ] },
  { id: 'ch2', n: 2, title: 'THE MANSION', mood: 'She didn\'t die here.', music: 'investigate', intro: 'intro2', outro: 'outro2',
    scenes: {
      yard: { bg: 'b4', w: 900, tint: 'night', rain: true, start: 60, things: [
        { id: 'calloway', type: 'npc', x: 380, spr: 'calloway', dlg: 'calloway', label: 'TALK' },
        { id: 'chain', type: 'clue', x: 640, clue: 'chain', label: 'LOOK' },
        { id: 'door_in', type: 'door', x: 820, to: 'hall', label: 'GO INSIDE' },
        { type: 'glyph', x: 160, y: 70 },
      ] },
      hall: { bg: 'cold', w: 1100, tint: 'dark', start: 60, things: [
        { id: 'door_out', type: 'door', x: 30, to: 'yard', label: 'OUTSIDE', back: true },
        { id: 'dust', type: 'clue', x: 260, clue: 'dust', label: 'LOOK' },
        { id: 'corpse', type: 'prop', x: 560, art: 'corpse' },
        { id: 'recall', type: 'puzzle', puzzle: 'recall', x: 420, icon: '📸', then: { flag: 'recalled' }, label: 'TAKE A POLAROID' },
        { id: 'body', type: 'clue', x: 500, clue: 'body', label: 'LOOK' },
        { id: 'wound', type: 'clue', x: 560, clue: 'wound', label: 'LOOK' },
        { id: 'blood', type: 'clue', x: 620, clue: 'blood', label: 'LOOK' },
        { id: 'ticket', type: 'clue', x: 680, clue: 'ticket', label: 'LOOK' },
        { id: 'door_east', type: 'door', x: 1060, to: 'east', label: 'EAST WING' },
        { type: 'glyph', x: 900, y: 50 }, { type: 'med', x: 820 },
      ] },
      east: { bg: 'bulk', w: 1000, tint: 'dark', start: 60, things: [
        { id: 'door_hall', type: 'door', x: 30, to: 'hall', label: 'BACK', back: true },
        { id: 'm1', type: 'foe', x: 380, foe: 'holo', fight: 'f_m1' },
        { id: 'm2', type: 'foe', x: 650, foe: 'chrono', fight: 'f_m2' },
        { id: 'sketch', type: 'puzzle', puzzle: 'torn', x: 900, icon: '📄', then: { clue: 'sketchbook' }, label: 'TORN PAGES' },
        { id: 'rival', type: 'npc', x: 760, spr: 'PARTNER', dlg: 'rival', label: '???', hidden: 'need_rival' },
        { type: 'glyph', x: 960, y: 60 },
      ] },
    },
    steps: [
      { text: 'Talk to the detective outside', need: { clue: 'deed' }, target: 'calloway' },
      { text: 'Check the front door', need: { clue: 'chain' }, target: 'chain' },
      { text: 'Go inside', need: { flag: 'seen_hall' }, target: 'door_in' },
      { text: 'Look at the floor by the door', need: { clue: 'dust' }, target: 'dust' },
      { text: 'Photograph the scene — remember what you see', need: { flag: 'recalled' }, target: 'recall' },
      { text: 'Examine Lena\'s body (4 clues)', need: { clue: ['body', 'wound', 'blood', 'ticket'] }, target: ['body', 'wound', 'blood', 'ticket'] },
      { text: 'SOLVE: Was she killed here?', need: { q: 'q_moved' } },
      { text: 'Search the east wing', need: { fight: 'f_m1' }, target: 'm1' },
      { text: 'Get past the second caster', need: { fight: 'f_m2' }, target: 'm2' },
      { text: 'Piece together the torn pages', need: { clue: 'sketchbook' }, target: 'sketch' },
      { text: 'Someone\'s here...', need: { flag: 'rival_done' }, target: 'rival', show: 'need_rival' },
      { text: 'SOLVE: Did the owners do it?', need: { q: 'q_owner' } },
    ] },
  { id: 'ch3', n: 3, title: 'THE PALE RIDER', mood: 'Everybody here is lying about Thursday.', music: 'tension', intro: 'intro3', outro: 'outro3',
    scenes: {
      street: { bg: 'c3', w: 1200, tint: 'neon', rain: true, start: 80, things: [
        { id: 'carcar', type: 'prop', x: 300, art: 'car' },
        { id: 'crewst', type: 'npc', x: 520, spr: 'crew2', dlg: 'crew_street', label: 'TALK' },
        { id: 'parking', type: 'clue', x: 300, clue: 'parking', label: 'LOOK', hidden: 'need_parking' },
        { id: 'saint', type: 'foe', x: 760, foe: 'grunt', fight: 'f_saint' },
        { id: 'club_door', type: 'door', x: 1100, to: 'club', label: 'ENTER CLUB' },
        { type: 'glyph', x: 520, y: 60 }, { type: 'med', x: 620 },
      ] },
      club: { bg: 'miami', w: 1100, tint: 'club', start: 80, things: [
        { id: 'club_out', type: 'door', x: 30, to: 'street', label: 'STREET', back: true },
        { id: 'frank', type: 'npc', x: 260, spr: 'frank', dlg: 'frank', label: 'TALK' },
        { id: 'marquis', type: 'npc', x: 940, spr: 'marquis', dlg: 'marquis_club', label: 'TALK' },
        { id: 'crewb', type: 'npc', x: 980, spr: 'crew3', dlg: 'crew_club', label: 'TALK' },
        { id: 'dez', type: 'npc', x: 480, spr: 'dez', dlg: 'dez', label: 'TALK' },
        { id: 'britt', type: 'npc', x: 640, spr: 'britt', dlg: 'britt', label: 'TALK' },
        { id: 'carl', type: 'npc', x: 820, spr: 'carl', dlg: 'carl', label: 'TALK' },
        { id: 'timecard', type: 'puzzle', puzzle: 'keypad', x: 1000, icon: '🔢', then: { clue: 'timecard' }, label: 'OFFICE DOOR', hidden: 'need_timecard' },
        { id: 'savings', type: 'clue', x: 700, clue: 'savings', label: 'LENA\'S LOCKER' },
        { type: 'glyph', x: 1060, y: 50 }, { type: 'glyph', x: 140, y: 80 },
      ] },
    },
    steps: [
      { text: 'Get past the Saints enforcer', need: { fight: 'f_saint' }, target: 'saint' },
      { text: 'Go into the club', need: { flag: 'seen_club' }, target: 'club_door' },
      { text: 'Marquis is here. Don\'t blow your cover.', need: { flag: 'cover_club' }, target: 'marquis', only: 'jester' },
      { text: 'Talk to Dez, Lena\'s boyfriend', need: { clue: 'dez_said' }, target: 'dez' },
      { text: 'Crack the office keypad', need: { clue: 'timecard' }, target: 'timecard' },
      { text: 'Talk to Dez again — catch his lie', need: { flag: 'dez_broke' }, target: 'dez' },
      { text: 'Talk to Carl, the regular', need: { clue: 'carl_said' }, target: 'carl' },
      { text: 'Check Carl\'s car outside', need: { clue: 'parking' }, target: 'parking' },
      { text: 'Talk to Carl again — catch his lie', need: { flag: 'carl_broke' }, target: 'carl' },
      { text: 'SOLVE: Who did Lena leave with?', need: { q: 'q_wagon' } },
    ] },
  { id: 'ch4', n: 4, title: 'THE PRECINCT', mood: 'Sneak in. Don\'t get caught.', music: 'tension', intro: 'intro4', outro: 'outro4',
    scenes: {
      hallway: { bg: 'ind', w: 1400, tint: 'dark', start: 60, stealth: true, things: [
        { id: 'cop1', type: 'cop', x: 520, x1: 360, x2: 700 },
        { id: 'h1', type: 'hide', x: 300 }, { id: 'h2', type: 'hide', x: 560 }, { id: 'h3', type: 'hide', x: 820 },
        { id: 'cop2', type: 'cop', x: 1050, x1: 900, x2: 1200 },
        { id: 'h4', type: 'hide', x: 1100 },
        { id: 'lab_door', type: 'door', x: 1360, to: 'lab', label: 'CRIME LAB' },
        { type: 'glyph', x: 760, y: 60 },
      ] },
      lab: { bg: 's4n', w: 1100, tint: 'dark', start: 60, things: [
        { id: 'hall_back', type: 'door', x: 30, to: 'hallway', label: 'HALLWAY', back: true },
        { id: 'seung', type: 'npc', x: 300, spr: 'seung', dlg: 'seung', label: 'TALK' },
        { id: 'tape', type: 'puzzle', puzzle: 'match', x: 620, icon: '🗃', then: { clue: 'tape' }, label: 'EVIDENCE BOXES' },
        { id: 'ledger', type: 'puzzle', puzzle: 'wheels', x: 960, icon: '🔒', then: { clue: 'ledger' }, label: 'CHIEF\'S SAFE' },
        { type: 'glyph', x: 820, y: 70 }, { type: 'glyph', x: 160, y: 50 }, { type: 'med', x: 480 },
      ] },
    },
    steps: [
      { text: 'Sneak past the guards (hide when they turn!)', need: { flag: 'seen_lab' }, target: 'lab_door' },
      { text: 'Find Seung in the crime lab', need: { clue: 'sketch' }, target: 'seung' },
      { text: 'Find Calloway\'s evidence box (match the tags)', need: { clue: 'tape' }, target: 'tape' },
      { text: 'Open the Chief\'s safe', need: { clue: 'ledger' }, target: 'ledger' },
      { text: 'SOLVE: Whose wagon was it?', need: { q: 'q_aunt' } },
      { text: 'SOLVE: Where did the aging gun come from?', need: { q: 'q_guns' } },
    ] },
  { id: 'ch5', n: 5, title: 'THE CLINIC', mood: 'Somebody has been studying Lena her whole life.', music: 'horror', intro: 'intro5', outro: 'outro5',
    scenes: {
      clinic: { bg: 'lab', w: 1300, tint: 'lab', start: 60, things: [
        { id: 'c_nano', type: 'foe', x: 360, foe: 'nano', fight: 'f_nano' },
        { id: 'child', type: 'clue', x: 560, clue: 'child_file', label: 'FILE CABINET' },
        { id: 'c_void', type: 'foe', x: 820, foe: 'void', fight: 'f_void' },
        { id: 'dops', type: 'puzzle', puzzle: 'circuit', x: 1050, icon: '⚡', then: { clue: 'dops' }, label: 'POWER PANEL' },
        { id: 'canister', type: 'npc', x: 1180, spr: null, icon: '🛢', dlg: 'canister', label: 'LOOK' },
        { type: 'glyph', x: 220, y: 60 }, { type: 'glyph', x: 700, y: 40 }, { type: 'glyph', x: 1240, y: 70 }, { type: 'med', x: 640 },
      ] },
    },
    steps: [
      { text: 'Get past the Nanomancer', need: { fight: 'f_nano' }, target: 'c_nano' },
      { text: 'Search the old patient files', need: { clue: 'child_file' }, target: 'child' },
      { text: 'Get past the Voidwalker', need: { fight: 'f_void' }, target: 'c_void' },
      { text: 'Restore power to the records room', need: { clue: 'dops' }, target: 'dops' },
      { text: 'Check the sealed canister', need: { flag: 'canister' }, target: 'canister' },
      { text: 'SOLVE: What made the wound?', need: { q: 'q_wound' } },
    ] },
  { id: 'ch6', n: 6, title: 'THE AUNT\'S HOUSE', mood: 'Something is breathing in the basement.', music: 'horror', intro: 'intro6',
    scenes: {
      house: { bg: 'c4', w: 1100, tint: 'night', rain: true, start: 60, things: [
        { id: 'wagoncar', type: 'prop', x: 300, art: 'wagon' },
        { id: 'mud', type: 'clue', x: 300, clue: 'mud', label: 'LOOK' },
        { id: 'portrait', type: 'clue', x: 600, clue: 'portrait', label: 'LOOK IN WINDOW' },
        { id: 'fakewall', type: 'wall', puzzle: 'spot', x: 900, label: 'STRANGE WALL' },
        { id: 'down', type: 'door', x: 1000, to: 'basement', label: 'STAIRS DOWN', hidden: 'wall_open' },
        { type: 'glyph', x: 160, y: 60 }, { type: 'glyph', x: 760, y: 50 },
      ] },
      basement: { bg: 'cold', w: 900, tint: 'ritual', start: 60, things: [
        { id: 'up', type: 'door', x: 30, to: 'house', label: 'UPSTAIRS', back: true },
        { id: 'journal', type: 'clue', x: 260, clue: 'journal', label: 'LOOK' },
        { id: 'dolores', type: 'npc', x: 620, spr: 'dolores', dlg: 'dolores', label: 'CONFRONT', hidden: 'need_dolores' },
        { id: 'bernard', type: 'foe', x: 760, foe: 'bernard', fight: 'f_boss', hidden: 'boss_ready' },
        { type: 'glyph', x: 840, y: 60 }, { type: 'med', x: 420 },
      ] },
    },
    steps: [
      { text: 'Check the old car in the driveway', need: { clue: 'mud' }, target: 'mud' },
      { text: 'Look through the window', need: { clue: 'portrait' }, target: 'portrait' },
      { text: 'Something\'s wrong with that wall...', need: { flag: 'wall_open' }, target: 'fakewall' },
      { text: 'Go down to the basement', need: { flag: 'seen_basement' }, target: 'down' },
      { text: 'Read the journal', need: { clue: 'journal' }, target: 'journal' },
      { text: 'SOLVE: Where was Lena really killed?', need: { q: 'q_scene' } },
      { text: 'Confront Dolores', need: { flag: 'dolores_done' }, target: 'dolores', show: 'need_dolores' },
      { text: 'SURVIVE', need: { fight: 'f_boss' }, target: 'bernard' },
    ] },
  { id: 'ch7', n: 7, title: 'THE PIER', mood: 'Dawn. The rain finally stops.', music: 'calm', intro: 'intro7', epilogue: true,
    scenes: {
      pier: { bg: 'miami', w: 900, tint: 'dawn', start: 60, things: [
        { id: 'partner', type: 'npc', x: 120, spr: 'PARTNER', dlg: 'partner_pier', label: 'TALK' },
        { id: 'hale', type: 'npc', x: 760, spr: 'hale', dlg: 'hale', label: 'TALK' },
        { type: 'glyph', x: 480, y: 50 },
      ] },
    },
    steps: [{ text: 'Walk to the end of the pier', need: { flag: 'case_done' }, target: 'hale' }] },
];

/* ------------------------------------------------------------ DIALOGUE */
// node: {who, text, next | choices:[{t,go}] | lie:{proof, choices:[3 clue ids], ok, believe} , do:[...] , tell (Jester only)}
TM.WHO = {
  augie: 'AUGIE', jester: 'JESTER', golem: 'GOLEM', radio: 'RADIO', tee: 'TEE', calloway: 'DET. CALLOWAY', frank: 'DET. FRANK', dez: 'DEZ', carl: 'CARL', britt: 'BRITT',
  seung: 'SEUNG LEE', crew1: 'RICO (MANTIS)', crew2: 'DRE (MANTIS)', crew3: 'GHOST (MANTIS)', hale: 'CHIEF HALE', dolores: 'DOLORES MARSH', marquis: 'MARQUIS', bernard: 'BERNARD', stranger: 'MASKED STRANGER', narr: '', card: '',
};
TM.DLG = {
  intro1: [
    { who: 'card', text: 'RAINCASTER, MARYLAND · 1996\n\nIt has rained for 41 days.' },
    { who: 'narr', text: { a: 'You are AUGIE. You grew up inside a cult of technomancers — people who use magic built from machines. You escaped. You\'ve been hiding ever since.', j: 'You are JESTER. Undercover cop, deep inside the Mantis gang. Tonight one of your gang got shot with something... strange.' } },
    { who: 'narr', text: 'You\'re UNDERCOVER. Your *COVER* meter is top-right. When the gang asks questions, answer like a gangster, not a cop. If your cover runs out, the gang attacks.', if: { hero: 'jester' } },
    { who: 'narr', text: 'Walk with ◀ ▶. Press the ACTION button to look, talk and go. Follow the *pink arrow* — it always shows you what to do next.' },
  ],
  radio: [
    { who: 'radio', text: '...a young woman found dead in the old Hartwell mansion. Police describe strange shapes drawn on her body and a wound that is "perfectly round"...', do: ['clue:news_report'] },
    { who: 'player', text: { a: 'Strange shapes. Perfect circles. That\'s technomancy. That\'s THEM.', j: 'Perfectly round. And Tee got old overnight. Weird week.' } },
  ],
  golem: [{ who: 'golem', text: '[ ^ ^ ]   (Golem, your little box robot, beeps happily.)' }],
  tee: [
    { who: 'tee', text: 'Who\'s there? My eyes went cloudy... A Saint kid shot me with a gun that glowed. I felt every birthday go by at once.', do: ['clue:aged_tee'] },
    { who: 'tee', text: 'There\'s a weirdo in a robe and a mask down the alley. Picking up what the kid dropped. Its face glows.' },
    { who: 'narr', text: 'Masked people with glowing faces are *technomancers*. Go stop it.' },
  ],
  calloway: [
    { who: 'calloway', text: 'Yes, I used to play a cop on TV. Yes, now I\'m a real one. Go ahead and laugh.' },
    { who: 'calloway', text: 'The Chief wants to blame the boyfriend. Dez\'s family owns this house. Seems too easy to me.', do: ['clue:deed'] },
    { who: 'calloway', text: 'Look around. And be careful — there are masked people in the east wing. They weren\'t here an hour ago.' },
  ],
  rival: [
    { who: 'PARTNER', text: { a: 'Hands where I can see them! You working with the gang that\'s using those freaky guns?', j: 'Get back. You don\'t know what you\'re standing in.' } },
    { who: 'player', text: { a: 'I don\'t sell weapons. I break the people who make them.', j: 'Who are you? You knew what that wound was the second you saw it.' } },
    { who: 'narr', text: { a: 'You throw a flare. Golem covers the door. You\'re gone before he can see again. He\'s wearing a gang jacket... why is a gangster at a murder scene?', j: 'She throws a flare like a tiny sun. When you can see again, she\'s gone. Just a little box robot rolling away.' }, do: ['flag:rival_done'] },
  ],
  outro2: [{ who: 'card', text: 'Downtown, Chief Hale charges Dez with murder.\nHe signs it fast. Too fast.' }],

  crew_alley: [
    { who: 'crew1', text: 'Keep walking, lady. This is Mantis business.', if: { hero: 'augie' }, end: true },
    { who: 'crew1', text: 'Yo, J. Marquis says you been asking a LOT of questions lately.', choices: [
      { t: '"Questions are how we find out who hit Tee."', do: ['xp:15'] },
      { t: '"Just doing my job."', do: ['cover:-1'], say: ['crew1', '...Your "job"? Weird way to say it, man.'] },
      { t: '"Somebody\'s gotta keep you idiots alive."', do: ['xp:15'] }] },
    { who: 'crew1', text: 'Heard a dead girl turned up at the Hartwell place. You going over there?', choices: [
      { t: '"Saints might be in on it. I\'m gonna look."', do: ['xp:15'] },
      { t: '"I need to secure the crime scene."', do: ['cover:-1'], say: ['crew1', 'Secure the... what? You talk like a cop sometimes, J.'] }] },
    { who: 'crew1', text: 'Aight. Watch yourself.', do: ['flag:cover_alley'] },
  ],
  crew_street: [
    { who: 'crew2', text: 'Mantis don\'t talk to strangers.', if: { hero: 'augie' }, end: true },
    { who: 'crew2', text: 'J! You see that Saint with the weird gun down the block? Let\'s jump him.', choices: [
      { t: '"I got him. You watch the street."', do: ['xp:15'] },
      { t: '"Let\'s call it in and wait for backup."', do: ['cover:-1'], say: ['crew2', '"Call it in"? To WHO, man?'] }] },
  ],
  crew_club: [
    { who: 'crew3', text: 'Don\'t look at me. I\'m working.', if: { hero: 'augie' }, end: true },
    { who: 'crew3', text: 'Marquis is in a mood tonight, J. Be cool.' },
  ],
  marquis_club: [
    { who: 'marquis', text: 'You\'re the radio repair lady. Stay out of my way and we\'ll get along fine.', if: { hero: 'augie' }, end: true },
    { who: 'marquis', text: 'My boy Jester. In the Pale Rider. Talking to a Baltimore COP.', choices: [
      { t: '"He\'s buying. I\'m listening. Cops talk when they drink."', do: ['xp:20'] },
      { t: '"He\'s an old friend from the force—"', do: ['cover:-1'], say: ['marquis', '...From the WHAT?'] },
      { t: '"That\'s not a cop. That\'s a tourist."', do: ['xp:20'] }] },
    { who: 'marquis', text: 'The Saints got guns that make my people old. Find out who\'s selling them, and I don\'t care who you drink with.', do: ['flag:cover_club'] },
  ],
  reveal: [
    { who: 'card', text: 'That night, the Mantis crew is waiting for Jester.' },
    { who: 'marquis', text: 'Saw you at the precinct, J. Back door. Like you had a key.' },
    { who: 'marquis', text: 'So tell me what you are. Slow.', choices: [
      { t: '"I\'m a cop. And somebody in that precinct is selling the Saints the guns that aged Tee."' },
      { t: '"I was robbing the place."', say: ['marquis', 'Don\'t. Lie. To me.'] }] },
    { who: 'marquis', text: '...A cop. Four years in my house.' },
    { who: 'marquis', text: 'I should end you. But I want the man selling those guns more. You got till Sunday.' },
  ],
  intro2: [{ who: 'card', text: 'CHAPTER 2\nTHE MANSION' }],
  intro3: [{ who: 'card', text: 'CHAPTER 3\nTHE PALE RIDER' }, { who: 'narr', text: 'Lena worked at this club. Someone here knows where she went Thursday night. Some of them will lie to you. *Catch them.*' }],
  frank: [
    { who: 'frank', text: 'Frank Dabrowski. Baltimore. I\'m Calloway\'s partner. I\'m trying to get home to my wife by Sunday.' },
    { who: 'frank', text: 'Tip: if someone lies to you, hit "THAT\'S A LIE!" and show them the clue that proves it.' },
  ],
  dez: [
    { who: 'dez', text: 'Lena was my girl. I didn\'t hurt her.', if: { nclue: 'dez_said' } },
    { who: 'dez', text: 'Thursday night I worked the door ALL night. Ask anybody.', do: ['clue:dez_said', 'flag:need_timecard'], if: { nclue: 'timecard' }, tell: 'He touched his neck when he said "all night." Lie.' },
    { who: 'narr', text: 'Hmm. Maybe the manager\'s office has his timecard.', if: { nclue: 'timecard' }, end: true },
    { who: 'dez', text: 'I told you, I worked the door all night Thursday!', lie: { proof: 'timecard', choices: ['timecard', 'ticket', 'savings'], ok: 'dez_ok' }, if: { nflag: 'dez_broke' }, tell: 'Sweating. He\'s lying.' },
  ],
  dez_ok: [
    { who: 'dez', text: '...Okay. I left at 9. I went to her place. We screamed at each other. She was leaving town without me.', do: ['flag:dez_broke'] },
    { who: 'dez', text: 'I left at 9:40 and she was ALIVE. She said if she stayed here, her Aunt Dolores would "finish her portrait." She looked scared.', do: ['clue:aunt_quote'] },
  ],
  carl: [
    { who: 'carl', text: 'This is a private booth. I tip well. Lena LIKED me.', if: { nclue: 'carl_said' } },
    { who: 'carl', text: 'Thursday? I was home with my mom. All night.', do: ['clue:carl_said', 'flag:need_parking'], if: { nclue: 'parking' }, tell: 'Rehearsed. Too fast.' },
    { who: 'narr', text: 'He came by car. Maybe check it outside.', if: { nclue: 'parking' }, end: true },
    { who: 'carl', text: 'I already told you. Home. With my mom.', lie: { proof: 'parking', choices: ['parking', 'timecard', 'deed'], ok: 'carl_ok' }, if: { nflag: 'carl_broke' } },
  ],
  carl_ok: [
    { who: 'carl', text: 'FINE. I sat outside her place. I just wanted to see her get home safe!', do: ['flag:carl_broke'] },
    { who: 'carl', text: 'At 10:05 an old wood-paneled station wagon pulled up. An older woman was driving. Lena got in. Nobody forced her.', do: ['clue:wagon'] },
  ],
  britt: [
    { who: 'britt', text: 'I bullied Lena in high school. I was awful. She called me Tuesday — out of nowhere — to say she forgave me.' },
    { who: 'britt', text: 'Her aunt picked her up from school every single day in an ugly wood-paneled car. Lena always went pale.' },
  ],
  outro3: [
    { who: 'card', text: 'That night, Detectives Calloway and Frank go to the aunt\'s house.' },
    { who: 'card', text: 'Something happens there.\n\nCalloway dies.\nFrank lives — but can\'t speak anymore.\n\nThe report calls it a "gas leak."' },
  ],
  intro4: [{ who: 'card', text: 'CHAPTER 4\nTHE PRECINCT' }, { who: 'narr', text: 'The case is "closed." Calloway\'s evidence is inside. Guards patrol the hallway — when a guard turns toward you, *HIDE* behind the cover spots.' }],
  seung: [
    { who: 'seung', text: 'You\'re not a cop? Good. The cops are the problem. I\'m Seung, I work the crime lab. I have two kids. I\'m scared.' },
    { who: 'seung', text: 'Frank keeps drawing this in the hospital. Over and over. A spiral.', do: ['clue:sketch'] },
    { who: 'player', text: { a: 'A spiral... Tee had a spiral burn on his arm.', j: 'That\'s Tee\'s burn. Exactly.' } },
    { who: 'seung', text: 'Calloway\'s tape is in the evidence box. And the Chief keeps checking his safe. Go. I\'ll keep the lights off.' },
  ],
  outro4: [{ who: 'card', text: 'Later that night, Seung\'s car is run off the road.\nHe survives. A police car was following him with its lights off.' }, { who: 'card', text: 'His last note: "MARROW POINT CLINIC. DOLORES. GO."' }],
  intro5: [{ who: 'card', text: 'CHAPTER 5\nTHE CLINIC' }, { who: 'narr', text: 'An abandoned research clinic. The technomancers still use it. You can hear their machines humming in the walls.' }],
  canister: [{ who: 'narr', text: { a: 'A canister labeled "DO NOT OPEN." It\'s exactly what you need to make an *ASH ROUND* — one bullet that can hurt anything. You make one.', j: 'A canister labeled "DO NOT OPEN." You don\'t know what it is, but there\'s a box of EMP grenades next to it. You take two.' }, do: ['flag:canister', 'gadget'] }],
  outro5: [
    { who: 'narr', text: '', if: { hero: 'jester' }, go: 'reveal' },
    { who: 'card', text: 'In the parking lot, in the rain, Augie and Jester finally meet face to face.' },
    { who: 'jester', text: 'My gang found out I\'m a cop. Marquis gave me until Sunday to find who\'s selling those guns.' },
    { who: 'augie', text: 'The cult I escaped killed my family. This isn\'t them. It\'s someone copying them. Dolores.' },
    { who: 'jester', text: 'Her house is ten minutes from here.' },
    { who: 'augie', text: 'Then we go together.' },
  ],
  intro6: [{ who: 'card', text: 'CHAPTER 6\nTHE AUNT\'S HOUSE' }, { who: 'narr', text: 'A neat little house. Porch light on. Something underneath it is breathing.' }],
  wall: [{ who: 'narr', text: { a: 'Your Reality Anchor beeps RED. The wall is an *illusion*! You step right through it.', j: 'Your wrist gadget blinks RED. The wall is FAKE. You push through it like a curtain.' }, do: ['flag:wall_open'] }],
  dolores: [
    { who: 'dolores', text: 'You\'re dripping on my floor. Lena used to do that.' },
    { who: 'dolores', text: 'I haven\'t driven my car in months.', lie: { proof: 'mud', choices: ['mud', 'ticket', 'tape'], ok: 'dol2' }, tell: 'Every word practiced. Lie.' },
  ],
  dol2: [
    { who: 'dolores', text: 'Red mud. It gets everywhere, doesn\'t it.' },
    { who: 'dolores', text: 'Lena and I weren\'t close. I barely knew the girl.', lie: { proof: 'portrait', choices: ['portrait', 'parking', 'dust'], ok: 'dol3' } },
  ],
  dol3: [
    { who: 'dolores', text: 'Fourteen years I painted her. I could see a doorway inside her that nobody else could see.' },
    { who: 'dolores', text: 'Every great leap forward needs a sacrifice. I KNEW it was dangerous. I did it anyway.' },
    { who: 'dolores', text: 'And it worked. She isn\'t gone. She\'s... *becoming*.' },
    { who: 'narr', text: 'Something unfolds out of the dark behind her. Too many joints. No eyes.', do: ['flag:dolores_done', 'flag:boss_ready'] },
  ],
  boss_end: [
    { who: 'narr', text: 'Bernard\'s skin splits open. There\'s no blood underneath — just something gray and humming.' },
    { who: 'bernard', text: '...l...e...n...' },
    { who: 'narr', text: 'It isn\'t attacking anymore. It looks lost. Like it\'s searching for something.', choices: [{ t: 'DESTROY IT. End this now.', go: 'end_destroy' }, { t: 'TRAP IT. Some of Lena might still be in there.', go: 'end_contain' }] },
  ],
  end_destroy: [{ who: 'narr', text: 'You hit it with everything you have left. It folds sideways into a crack in the air and vanishes. The basement goes quiet.', do: ['flag:destroyed', 'ach:destroy', 'clue:scientist'] }, { who: 'narr', text: 'In Dolores\' desk: four files about someone called *the Scientist*.' }],
  end_contain: [{ who: 'narr', text: 'You pour Static Salt in a circle around it. It sits. It waits. You look away for one second — and the circle is empty.', do: ['flag:contained', 'ach:contain', 'clue:scientist'] }, { who: 'narr', text: 'In Dolores\' desk: four files about someone called *the Scientist*.' }],
  intro7: [{ who: 'card', text: 'EPILOGUE\nTHE PIER AT DAWN' }, { who: 'narr', text: 'Dez is free. The murder is "solved." The rain stopped an hour ago. Someone is waiting at the end of the pier.' }],
  partner_pier: [{ who: 'PARTNER', text: { a: 'You did good, engineer. Go see what the Chief wants.', j: 'He\'s waiting for you. Watch his face.' } }],
  hale: [
    { who: 'hale', text: 'Morning. Rain finally stopped. Feels like a sign.' },
    { who: 'narr', text: 'The skin on his jaw is fading from *light blue* back to normal. He was wearing a technomancer mask. Not long ago.' },
    { who: 'player', text: 'We know about the evidence room. The guns. The Saints.' },
    { who: 'hale', text: 'Prove it. Raincaster\'s closed for the season. Go home.' },
    { who: 'card', text: 'The Chief walks away free.\nThe weapons are still out there.\nBernard is still out there.\n\nAnd someone wrote four different endings for THE SCIENTIST.', do: ['flag:case_done'] },
  ],
};

/* ------------------------------------------------------------ FIGHTS */
TM.FIGHTS = {
  f_scav: { foe: 'holo', tip: 'FIGHT TIP: Every turn the enemy shows what it\'s about to do. Use the gadget it\'s WEAK to and you\'ll cancel its move and deal big damage!', drop: 'cartridge' },
  f_m1: { foe: 'holo' }, f_m2: { foe: 'chrono', tip: 'New enemy: CHRONOMANCER. Weak to TICKS (Augie) or EMP (Jester).' },
  f_saint: { foe: 'grunt', tip: 'Gang members have no magic. Just hit them.' },
  f_nano: { foe: 'nano', tip: 'New enemy: NANOMANCER. Weak to the SWARM JAR (Augie) or EMP (Jester).' },
  f_void: { foe: 'void', tip: 'New enemy: VOIDWALKER. Weak to STATIC SALT (Augie) or EMP (Jester).' },
  f_blown: { foe: 'mantis', tip: 'YOUR COVER IS BLOWN! The Mantis crew knows you\'re a cop. Fight your way out.' },
  f_boss: { foe: 'bernard', boss: true, end: 'boss_end' },
};

/* ------------------------------------------------------------ FILES (codex) */
TM.FILES = {
  augie: ['AUGIE', 'Escaped the Children of Zyxth — a cult of technomancers — as a teenager. Fixes electronics for cash. Builds gadgets that break magic. Doesn\'t trust anyone.'],
  jester: ['JESTER', 'Was Baltimore\'s best detective until drugs wrecked his life. Now he\'s undercover inside the Mantis gang, waiting to take down its leader.'],
  tmancers: ['TECHNOMANCERS', 'People who do magic with machines. They wear masks — when the mask is on, their skin turns light blue. Every one carries an OmniBox: a living computer on their back.'],
  holo: ['HOLOILLUSIONIST', 'Makes you see things that aren\'t there: fake walls, fake copies of themselves. Weak to loud noise (Hush Horn).'],
  chrono: ['CHRONOMANCER', 'Bends time — slows it down, snaps it back. The youngest ones are 13. Weak to Ticks.'],
  nano: ['NANOMANCER', 'Controls clouds of tiny robots. Can turn see-through. Weak to the Swarm Jar.'],
  void: ['VOIDWALKER', 'Opens portals. Jumps behind you. Weak to Static Salt, which jams portals for 40 seconds.'],
  lena: ['LENA MARSH', '23. Waitress. Artist. Saved $3,140 for art school. Bought one ticket out of town. Never made the train.'],
  dolores: ['DOLORES MARSH', 'Lena\'s aunt. A painter. Believes every great leap forward needs a sacrifice.'],
  hale: ['CHIEF HALE', 'Police chief. Secret beginner technomancer. Sells stolen weapons to gangs. Not the killer. Still free.'],
  calloway: ['DET. CALLOWAY', 'Played a cop on TV for six years. Everyone thought he was a joke. He was the first to notice the body had been moved.'],
  bernard: ['BERNARD', 'What came out of Dolores\' experiment. Too tall, no eyes, wrong joints. Seems more lost than angry. Searching for something.'],
  gabriel: ['GABRIEL', 'A creature from another dimension. You only ever see pieces of it, like slices — in pastel colors.'],
  scientist: ['THE SCIENTIST', 'Four files. Dead? Captured? Escaped? Became something else? Coming in Case 02.'],
};

/* ------------------------------------------------------------ FEATS */
TM.FEATS = {
  first_clue: ['First Clue', 'Find your first clue.', 20],
  first_solve: ['Detective', 'Answer your first case question right.', 30],
  lie1: ['Liar Liar', 'Catch your first lie.', 30],
  lie5: ['Human Lie Detector', 'Catch 5 lies.', 80],
  super1: ['Super Effective', 'Cancel an enemy move with its weakness.', 30],
  allweak: ['Know Your Enemy', 'Use the weakness of all 4 technomancer types.', 100],
  sneaky: ['Ghost', 'Get through the precinct without getting caught.', 60],
  perfect: ['Perfect Chapter', 'Get 3 stars on a chapter.', 60],
  allstars: ['Gold Badge', 'Get 3 stars on every chapter.', 300],
  glyphs: ['Glyph Hunter', 'Find all hidden glyphs in a chapter.', 40],
  noko: ['Untouchable', 'Finish a chapter without getting knocked out.', 40],
  boss: ['Wrong Body', 'Survive Bernard.', 150],
  destroy: ['Burn It Down', 'Choose to destroy.', 30],
  contain: ['Keep It', 'Choose to trap it.', 30],
  case1: ['Case Closed', 'Finish the story.', 200],
  both: ['Two Sides', 'Finish the story as Augie AND Jester.', 300],
  puzzler: ['Puzzle Master', 'Solve every puzzle and memory game.', 150],
  chatty: ['People Person', 'Have a real conversation with 5 different people.', 60],
  daily1: ['Daily Detective', 'Solve a Daily Case.', 30],
  streak3: ['On a Roll', '3-day Daily Case streak.', 80],
  streak7: ['Habit', '7-day Daily Case streak.', 200],
};
TM.RANKS = [[0, 'ROOKIE'], [200, 'DETECTIVE'], [500, 'INSPECTOR'], [900, 'CASE BREAKER'], [1400, 'T-MANCER HUNTER'], [2100, 'LEGEND'], [3000, 'MYTH']];

/* ------------------------------------------------------------ DAILY CASE pool */
TM.DAILY = [
  { s: 'A man says he walked home in the rain. His shoes and jacket are bone dry.', q: 'What proves he\'s lying?', a: ['His dry clothes', 'His tone of voice', 'He looks tired'], ok: 0 },
  { s: 'A woman says she was asleep at midnight. Her phone shows she sent 14 texts between 11:50 and 12:20.', q: 'What proves she wasn\'t asleep?', a: ['The phone texts', 'She yawned', 'Her bed is messy'], ok: 0 },
  { s: 'A store clerk says the robber was tall. The security camera shows the robber standing next to a 5-foot sign and barely reaching the top.', q: 'Who\'s right?', a: ['The camera — the robber was short', 'The clerk — he was tall', 'You can\'t tell'], ok: 0 },
  { s: 'A teen says he never touched the car. His fingerprints are on the inside of the driver\'s door.', q: 'What\'s the strongest proof he lied?', a: ['Prints INSIDE the door', 'He seems nervous', 'He owns a car too'], ok: 0 },
  { s: 'The cake went missing. Sam has frosting on his sleeve. Mia has an empty plate. Leo was at practice — his coach confirms it.', q: 'Who can you rule OUT?', a: ['Leo', 'Sam', 'Mia'], ok: 0 },
  { s: 'A witness says the getaway car was red. It was 2 AM on a street with no lights.', q: 'Why should you double-check this witness?', a: ['It\'s hard to see color in the dark', 'Red cars are rare', 'Witnesses always lie'], ok: 0 },
  { s: 'A man says he\'s never been to the beach town. His car has a parking pass for the beach lot dated yesterday.', q: 'What proves he was there?', a: ['The parking pass', 'He has a tan', 'He likes beaches'], ok: 0 },
  { s: 'Someone broke the window from the outside. Glass is on the INSIDE floor.', q: 'Does the glass match the story?', a: ['Yes — glass falls away from the hit', 'No — it should be outside', 'Glass doesn\'t matter'], ok: 0 },
  { s: 'A guard says nobody came in after 9 PM. The door log shows a keycard used at 9:47 PM — his own card.', q: 'What should you ask him about?', a: ['Why HIS card was used at 9:47', 'What he ate for dinner', 'If he likes his job'], ok: 0 },
  { s: 'A girl says she found the wallet on the sidewalk and turned it in. The money\'s gone, but she turned it in within 5 minutes and a camera shows her never opening it.', q: 'Is she the likely thief?', a: ['No — the camera shows she never opened it', 'Yes — she had it', 'Yes — everyone steals'], ok: 0 },
  { s: 'A man says he heard the gunshot at 10 PM. Three neighbors say they heard it at 11 PM, and one of them was watching a show that ends at 11.', q: 'Which time is more believable?', a: ['11 PM — several witnesses and a TV show agree', '10 PM — he said it first', 'Neither'], ok: 0 },
  { s: 'Footprints in the mud go TO the shed but none come back.', q: 'What\'s the best guess?', a: ['Whoever made them might still be in the shed', 'They flew away', 'The prints are fake'], ok: 0 },
  { s: 'A painter says she hasn\'t been in the studio for a week. The paint on her newest canvas is still wet.', q: 'What proves she was there recently?', a: ['The wet paint', 'The studio is clean', 'She has paint brushes'], ok: 0 },
  { s: 'A boy says his dog ate his homework. The dog has been at the vet all week, with receipts.', q: 'What proves the story is false?', a: ['The vet receipts', 'Dogs don\'t eat paper', 'He looks guilty'], ok: 0 },
  { s: 'A driver says he was going slow. The skid marks are 40 feet long.', q: 'What do long skid marks usually mean?', a: ['He was going fast', 'He was going slow', 'The road was dry'], ok: 0 },
];
