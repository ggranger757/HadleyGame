/* =========================================================================
   TECHNOMANCERS — 01b-story.js
   CLUES, CONTRADICTIONS (deductions), CODEX, CAST, and DIALOGUE trees.
   Text may be a string or {a:'Augie version', j:'Jester version'}.
   *x* renders magenta. _x_ renders red (reserved for tears/danger).
   ========================================================================= */
'use strict';

/* ---------------- Cast (portrait specs are used by the renderer) ---------------- */
TM.CAST = {
  narr: { name: '', port: null },
  card: { name: '', port: null },
  augie: { name: 'AUGIE', port: 'augie' },
  jester: { name: 'JESTER', port: 'jester' },
  golem: { name: 'GOLEM I', port: 'golem' },
  radio: { name: 'WRCM 1040 AM', port: 'radio' },
  calloway: { name: 'DET. RHETT CALLOWAY', port: 'calloway' },
  frank: { name: 'DET. FRANK DABROWSKI', port: 'frank' },
  dez: { name: 'DEZ OKAFOR', port: 'dez' },
  carl: { name: 'CARL VINTNER', port: 'carl' },
  britt: { name: 'BRITT PRUITT', port: 'britt' },
  vinnie: { name: 'VINNIE (MANAGER)', port: 'vinnie' },
  seung: { name: 'SEUNG LEE', port: 'seung' },
  hale: { name: 'CHIEF AMOS HALE', port: 'hale' },
  dolores: { name: 'DOLORES MARSH', port: 'dolores' },
  tee: { name: 'TEE', port: 'tee' },
  marquis: { name: 'MARQUIS', port: 'marquis' },
  bernard: { name: '???', port: 'bernard' },
  omnibox: { name: 'OMNIBOX', port: 'omnibox' },
};

/* ---------------- Clues ---------------- */
// tools: augie uv/dust/swab/polaroid · jester eyeball/shakedown/cut/photo. `gives` = clue unlocked by that tool.
TM.CLUES = {
  // L0 · ALLEYWAYS
  news_report: { title: 'Radio Bulletin', icon: 'radio', lvl: 0, tags: ['victim'], desc: 'WRCM: a woman found dead in the old Hartwell house. "Geometric markings." "A perfectly circular wound." Police are calling it ritualistic.', tools: { polaroid: 'You can\'t photograph a voice. You write the frequency down anyway.', eyeball: 'The anchor said "perfectly circular" twice. Nobody says that twice by accident.' } },
  aged_gangmember: { title: 'Rapidly Aged Associate', icon: 'face', lvl: 0, tags: ['gang', 'tech'], desc: 'Tee. Nineteen on Tuesday. Tonight his hair is white, his hands are spotted, his teeth are loose. Decades older in seconds — a temporal weapon.', tools: { uv: 'Under UV his forearm shows a *spiral burn*, fluorescing magenta. Technomantic residue.', swab: 'Skin cells read like a seventy-year-old\'s. The swab tube fogs.', eyeball: 'A spiral burn on his forearm. Same shape keeps turning up in your head.', shakedown: 'His pockets: a Saints bandana he must have torn off one of them.' } },
  beam_cartridge: { title: 'Odd Cartridge', icon: 'cartridge', lvl: 0, tags: ['tech', 'chief'], desc: 'Dropped by the masked scavenger. A brass shell with a glass ring folded inside. Stamped on the rim: *RPD EVIDENCE #96-0414*.', tools: { uv: 'The glass ring glows magenta. Live anima, still decaying.', dust: 'One clean thumbprint. Big hands. Not a monk\'s.', eyeball: 'Police evidence number. On a gang weapon. Somebody\'s emptying the evidence room.', photo: 'You shoot the stamp. Somebody downtown is going to hate this picture.' } },
  // L1 · MANSION
  mansion_body: { title: 'Corpse of the Waitress', icon: 'body', lvl: 1, tags: ['victim'], desc: 'Lena Marsh, 23. Waitress at the Pale Rider. Geometric marks lattice her skin. Paint under her fingernails. She looks like she was about to say something.', tools: { uv: 'The lattice marks glow *magenta* under UV. Every line meets at seven points.', swab: 'Paint under the nails: cadmium, cobalt, titanium white. An artist, to the end.', polaroid: 'The Polaroid develops with a pale smear over her face. You take another. Same smear.', eyeball: 'No defensive wounds. She didn\'t fight. She didn\'t know to.' } },
  circular_wound: { title: 'Clean Circular Wound', icon: 'wound', lvl: 1, tags: ['victim', 'tech'], desc: 'A 7 cm circle straight through the abdomen. Edges fused glassy. Impossible geometry — not a bullet, not a blade.', tools: { uv: 'The rim fluoresces. Something was *drawn through* her, not shot through.', swab: 'Silica at the margins. Her tissue partly turned to glass.', eyeball: 'Perfect circle. You\'ve seen a lot of holes in people. None of them were round.' } },
  embedded_tissue: { title: 'Embedded Bio-Metallic Tissue', icon: 'wire', lvl: 1, tags: ['victim', 'tech'], desc: 'Hair-thin filament threaded under her skin, following the lattice marks. Half metal, half something that was growing.', tools: { swab: 'The filament is warm. Hours after death, it is still warm.', polaroid: 'Close-up shows the filament branching like roots.', cut: 'You don\'t cut it. You think it might move.' } },
  lividity: { title: 'Lividity Pattern', icon: 'drop', lvl: 1, tags: ['scene'], desc: 'Blood settled along her back. But she was found face-down. She lay on her back for hours — somewhere else — before anyone put her here.', tools: { polaroid: 'You document both sides. The math doesn\'t care how she was found.', eyeball: 'Blood pools low. Her low side is her back. She didn\'t die like this.' } },
  dust_trail: { title: 'Undisturbed Dust', icon: 'dust', lvl: 1, tags: ['scene'], desc: 'The foyer dust is thick and unbroken. No drag marks. Whoever brought her in *carried* her.', tools: { dust: 'Powder brings up prints: flat, soft-soled, size 7. One person. Walking heavy, like carrying weight.', eyeball: 'Someone careful walked in here. Carefully.' } },
  cut_padlock: { title: 'Cut Padlock', icon: 'lock', lvl: 1, tags: ['scene'], desc: 'The front chain was bolt-cut. Fresh bright metal on the jaws. Whoever came in didn\'t have a key.', tools: { swab: 'Red clay in the shackle. The lane outside is red clay.', eyeball: 'No key. So not the owners.' } },
  deed: { title: 'County Deed', icon: 'paper', lvl: 1, tags: ['scene', 'suspect'], desc: 'Hartwell House is owned by Okafor Holdings LLC — Dez Okafor\'s uncle. Lena\'s boyfriend\'s family.', tools: { eyeball: 'Too convenient. Everyone downtown loves convenient.' } },
  train_tickets: { title: 'Train Ticket, Westbound', icon: 'ticket', lvl: 1, tags: ['victim'], desc: 'Amtrak, Raincaster → Pittsburgh. One passenger. Dated tomorrow, 6:10 AM. Folded into her shoe. She was fleeing.', tools: { polaroid: 'One passenger. Not two. The boyfriend wasn\'t invited.', eyeball: 'Folded small. Hidden. She was scared someone would find it.' } },
  sketchpad: { title: 'Victim\'s Sketchpad', icon: 'sketch', lvl: 1, tags: ['victim', 'entity'], desc: 'Pages of the same figure, drawn in pastel cyan, magenta and yellow — in *slices*, like an MRI. An eye whose pupil wraps the whole eyeball. Dated back years.', tools: { uv: 'Faint pencil under the pastel: "it only shows me pieces."', polaroid: 'You photograph every page. Your hands are not steady.', eyeball: 'Last page: "GABRIEL is closer when Aunt D paints me."', shakedown: 'Tucked in the back cover: a Pale Rider staff badge.' } },
  // L2 · PALE RIDER
  bf_alibi: { title: 'Boyfriend\'s Statement', icon: 'mouth', lvl: 2, tags: ['suspect'], desc: 'Dez Okafor: "I worked the door all Thursday night. Ask anybody."', tools: {} },
  bf_timecard: { title: 'Club Timecard', icon: 'card', lvl: 2, tags: ['suspect'], desc: 'Pale Rider timecard, D. OKAFOR, Thursday. In 6:00 PM. Out 9:05 PM — two hours early.', tools: { dust: 'Only Dez\'s prints on the card. He punched it himself.', eyeball: 'He punched out and walked into the rain.' } },
  carl_story: { title: 'Carl\'s Statement', icon: 'mouth', lvl: 2, tags: ['suspect'], desc: 'Carl Vintner: "Thursday? I was home with my mother. All night."', tools: {} },
  parking_ticket: { title: 'Parking Citation', icon: 'paper', lvl: 2, tags: ['suspect'], desc: 'RPD citation, Buick LeSabre registered to C. Vintner. Ludlow St — Lena\'s street. Thursday, 10:14 PM.', tools: { eyeball: 'He was parked outside her apartment while "home with mother."' } },
  savings: { title: 'Locker Savings', icon: 'cash', lvl: 2, tags: ['victim'], desc: 'Lena\'s locker: $3,140 rolled in a coffee can and an acceptance letter to an art school in Baltimore. Fall semester.', tools: { polaroid: 'You photograph the letter. "We are delighted."', shakedown: 'Under the can: a pager number labeled "D — NEVER ANSWER."' } },
  portrait_quote: { title: '"Finish Her Portrait"', icon: 'mouth', lvl: 2, tags: ['suspect', 'aunt'], desc: 'Dez: Lena said if she stayed in Raincaster, her aunt would "finish her portrait." She said it like a threat.', tools: {} },
  wagon_sighting: { title: 'Station Wagon Sighting', icon: 'car', lvl: 2, tags: ['aunt'], desc: 'Carl, 10:05 PM Thursday: Lena got into a wood-panel station wagon with an older woman. Willingly. They drove toward the old mill road.', tools: {} },
  britt_story: { title: 'Britt\'s Confession', icon: 'mouth', lvl: 2, tags: ['victim'], desc: 'Britt Pruitt, who tormented Lena in high school: Lena called Tuesday to forgive her. "She said she wanted to leave clean."', tools: {} },
  // L3 · PRECINCT
  seung_notes: { title: 'Reconstructed Timeline', icon: 'notes', lvl: 3, tags: ['case'], desc: 'Seung Lee\'s rebuild of the dead detectives\' notes. Last entry: "Dolores Marsh — 11 PM — her porch." Next page torn out. Margin: "Marrow Point Clinic?"', tools: { uv: 'Indentations from the torn page: "...she volunteered at Marrow Point..."' } },
  frank_sketch: { title: 'Frank\'s Fragment', icon: 'spiral', lvl: 3, tags: ['tech'], desc: 'Det. Dabrowski can only draw now. Over and over: a spiral with ticks, like a clock face eaten by a drain.', tools: { eyeball: { a: 'You\'ve never seen this spiral. Jester would have.', j: 'That spiral. You\'ve seen it. On Tee\'s arm.' } } },
  calloway_tape: { title: 'Calloway\'s Last Tape', icon: 'tape', lvl: 3, tags: ['aunt'], desc: 'Microcassette from the dead detective\'s coat. His voice: "...owner of the wagon is Dolores Marsh. Lena\'s aunt. We\'re going to her porch tonight. Frank thinks I\'m—" Static. A woman humming.', tools: {} },
  chief_ledger: { title: 'Chief\'s Hidden Registry', icon: 'ledger', lvl: 3, tags: ['chief', 'tech'], desc: 'In Chief Hale\'s safe: evidence numbers, dates, dollar amounts, and a buyer column: SAINTS. "#96-0414 — aging cartridges ×6."', tools: { dust: 'Big thumbprints on every page.', eyeball: 'He\'s been arming the Saints out of his own evidence room.' } },
  // L4 · CLINIC
  dops_file_gabriel: { title: 'DOPS Dossier: "GABRIEL"', icon: 'file', lvl: 4, tags: ['entity', 'tech'], desc: 'Perceptual-studies file on a 4th-dimensional being seen only in slices. "Essence harvesting protocol: a 7 cm aperture through a compatible host."', tools: { uv: 'Handwritten on the back: "Host compatibility rises with lifelong exposure."' } },
  clinic_intake: { title: 'Patient Intake, 1982', icon: 'file', lvl: 4, tags: ['victim', 'aunt'], desc: 'MARSH, L. Age 9. Referred by guardian D. MARSH. "Subject reports a man made of slices who watches her paint." Notes continue for fourteen years.', tools: { polaroid: 'A child\'s drawing stapled to the file. The same eye.', eyeball: 'Her aunt brought her here. For fourteen years.' } },
  anon_printouts: { title: 'ANON Network Printouts', icon: 'paper', lvl: 4, tags: ['chief', 'aunt'], desc: 'BBS threads between anonymous handles. ANON-3: "novice, but I can supply hardware through work." ANON-7: "I have a vessel with lifelong exposure."', tools: {} },
  // L5 · AUNT'S HOUSE
  roadmaster_mud: { title: 'Red Clay, Wheel Wells', icon: 'car', lvl: 5, tags: ['aunt'], desc: '1987 Buick Roadmaster Estate, wood panel. Fresh red clay packed in every wheel well — the same clay as the Hartwell lane.', tools: {} },
  portrait: { title: 'The Unfinished Portrait', icon: 'portrait', lvl: 5, tags: ['aunt', 'victim'], desc: 'Lena, painted from life, again and again across fourteen years. In the newest canvas her eyes are magenta. The abdomen is left blank — a perfect circle of bare canvas.', tools: {} },
  aunt_journals: { title: 'Aunt\'s Ritual Journals', icon: 'journal', lvl: 5, tags: ['aunt'], desc: '"Every great leap requires sacrifice." Diagrams of the lattice. Dates. "Thursday. The vessel is ready. She will forgive me when she is more."', tools: {} },
  aperture_rig: { title: 'Aperture Rig', icon: 'ring', lvl: 5, tags: ['tech'], desc: 'A brass ring, 7 cm, wired into an OmniBox grown into the basement wall. The glass is still warm.', tools: {} },
  scientist_files: { title: 'The Scientist Contradictions', icon: 'file', lvl: 5, tags: ['entity'], desc: 'Four records about "the Scientist." One says he died in 1979. One says he was captured. One says he escaped. One says he *became*. All in the same handwriting. None of them Dolores\'s.', tools: {} },
};

/* ---------------- Deductions (Evidence Board contradiction engine) ---------------- */
TM.DEDUCTIONS = [
  { id: 'ded_two', a: 'news_report', b: 'aged_gangmember', title: 'Two Impossible Wounds', text: 'Same week, two injuries nothing in this world should cause. Raincaster has a technology problem.' },
  { id: 'ded_evidence', a: 'beam_cartridge', b: 'aged_gangmember', title: 'Police-Stamped Weapon', text: 'The cartridge that aged Tee carries a police evidence number. The weapon came *out of* the precinct.' },
  { id: 'ded_moved', a: 'lividity', b: 'dust_trail', title: 'She Was Moved', text: 'She lay on her back somewhere else for hours, then was carried in. The mansion is not the murder scene.' },
  { id: 'ded_not_family', a: 'cut_padlock', b: 'deed', title: 'Not the Owners', text: 'Okafor Holdings has keys. Whoever brought her cut the chain. The house was chosen for isolation — not because of the boyfriend\'s family.' },
  { id: 'ded_fleeing', a: 'train_tickets', b: 'sketchpad', title: 'Running From Something', text: 'One ticket, one passenger. She wasn\'t leaving a boyfriend. She was leaving whatever she\'d been drawing.' },
  { id: 'ded_dez_lied', a: 'bf_alibi', b: 'bf_timecard', title: 'The Boyfriend Lied', text: 'Dez says he worked all night. His timecard says he left at 9:05. He lied — but two hours is time to argue, not time to do *that*.' },
  { id: 'ded_carl_lied', a: 'carl_story', b: 'parking_ticket', title: 'Carl Was Outside', text: 'Carl claims he was home. His car was on Lena\'s street at 10:14. He was watching her.' },
  { id: 'ded_escape', a: 'savings', b: 'train_tickets', title: 'A Plan, Not a Whim', text: 'Months of saving, an acceptance letter, a hidden ticket. Lena planned her escape for a long time.' },
  { id: 'ded_chief_guns', a: 'aged_gangmember', b: 'chief_ledger', title: 'The Chief Arms the Saints', text: 'The aging weapon came from the police chief, not the cult — two separate threats sharing one forbidden technology.' },
  { id: 'ded_same_world', a: 'frank_sketch', b: 'aged_gangmember', title: 'Same World, Different Hands', text: 'Frank\'s spiral is Tee\'s burn. The murder and the gang attack aren\'t one crime — but they come from the same forbidden world.' },
  { id: 'ded_aunt', a: 'calloway_tape', b: 'wagon_sighting', title: 'The Woman in the Wagon', text: 'The older woman who drove Lena away Thursday is Dolores Marsh. Her aunt. The detectives went to her porch and never came back whole.' },
  { id: 'ded_extraction', a: 'circular_wound', b: 'dops_file_gabriel', title: 'Essence Aperture', text: 'The wound was made by an entity-essence extraction aperture described in DOPS research. Seven centimeters. Exactly.' },
  { id: 'ded_lifelong', a: 'sketchpad', b: 'clinic_intake', title: 'Fourteen Years of Exposure', text: 'Lena had seen the entity since she was nine. Dolores didn\'t find a vessel. She *raised* one.' },
  { id: 'ded_anon3', a: 'anon_printouts', b: 'chief_ledger', title: 'ANON-3', text: 'The "novice who supplies hardware through work" is Chief Hale. He\'s in the network — and he doesn\'t know who ANON-7 is.' },
  { id: 'ded_ritual', a: 'aunt_journals', b: 'mansion_body', title: 'The Real Scene', text: 'The ritual was conducted in the aunt\'s basement; the mansion was only the dumping ground.' },
  { id: 'ded_wagon_mud', a: 'roadmaster_mud', b: 'cut_padlock', title: 'Red Clay', text: 'Red clay on the padlock, red clay in her wheel wells. Dolores drove her niece\'s body to Hartwell House.' },
];

/* ---------------- Codex (unlocked by events & glyph fragments) ---------------- */
TM.CODEX = {
  raincaster: { cat: 'PLACE', title: 'Raincaster, MD', text: 'Decaying coastal mill town on the Chesapeake. It has rained for forty-one days. The mills closed in \'78. The foghorn didn\'t get the memo.' },
  zyxth: { cat: 'LORE', title: 'The Children of Zyxth', text: 'A technomantic cult that believes reality is editable source code. Monk-cut robes, gray and black, every highlight magenta. They killed Augie\'s family. She believes their rules keep them out of the open world.' },
  omnibox: { cat: 'LORE', title: 'The OmniBox', text: '12 × 9 × 3 inches — about the size of a PS1. Engineered alloy grown over living bio-mechanical tissue, wired to an implant at the pineal gland. A semi-living AI looks out through a magenta glass window. It turns a T-Mancer\'s language into casting code.' },
  maskblue: { cat: 'LORE', title: 'Mask On = Blue', text: 'When a T-Mancer\'s mask seals, the visible skin of the face turns light blue. Two T-Mancers of the same build look like the same person. Identity is the first thing the mask eats.' },
  pipeline: { cat: 'LORE', title: 'Casting Pipeline', text: 'Every cast runs the same way: SCAN the environment → VALIDATE anima reserves → EXECUTE. Interrupt any step and the cast aborts. Augie\'s whole kit is built to break one step.' },
  holo: { cat: 'CLASS', title: 'Holoillusionist · Whisper', text: 'Age 34 on the sheets. Visor slab, temple rings, a wrap collar, a tuning-fork staff. Reality Veil, Dreamwalk, Neural Hotwire, Echostep, Psylink. Counter: Hush Horn breaks the code; Reality Anchor finds the real body.' },
  nano: { cat: 'CLASS', title: 'Nanomancer · Nanohive', text: 'Skin-tight pod suit, eighteen magenta bot pods, cast-metal boots that let him walk on air. Nano Swarm, Forge, Reactive Camouflage, Scout Hive, Phase, Bio-Fusion. Counter: Swarm Jar.' },
  chrono: { cat: 'CLASS', title: 'Chronomancer · Temporaltext', text: 'The youngest — thirteen. Two clock gauntlets that keep two times: world and field. GRAV, BOSON, and a magenta drift hand. Temporal Lag, Stutter Field, Time Stitch, Second Wind. Counter: Ticks and Flares flood the boson scan.' },
  void: { cat: 'CLASS', title: 'Voidwalker · Foldspeak', text: 'Short, husky, forty-one. A blocky pump gun whose shells fold a Void Gate around what they hit. Tumbling, Void Gate, Redirect, Portal Summon, Anchor Point. Counter: Seam Goggles show the tear 1.2 s early; Static Salt jams gates for 40 s.' },
  hushcrook: { cat: 'KIT', title: 'Hush Crook Mk III', text: '186 cm, 5.6 kg, balances at the drum. Six-shot drum: grapple, taser ×2, static salt, flare, ASH. Eight heads ride in Augie\'s belt pouches. Swap: push, quarter-turn, click — two seconds, one hand, no looking.' },
  anchor: { cat: 'KIT', title: 'Reality Anchor', text: 'A 6 cm cube and a wrist monitor. Sonar catches walls that aren\'t there; heat finds the one real body among Echosteps; tap code checks whether your own nerves have been hotwired.' },
  goggles: { cat: 'KIT', title: 'Seam Goggles', text: 'Smoked wraparound visor from a motorcycle shield. Two pinhole cameras watch the room 6 cm apart. Where space bends a hair before a Tumble, the AI paints the seam red.' },
  golem: { cat: 'KIT', title: 'Golem I & II', text: 'Sealed 16 kg boxes with one slit for a face — a strip of VFD salvaged from a VCR. ^ ^ means content. Drone corners, battle legs, fortress panels, camo tiles, a medic hatch, a forensics drawer. Only Augie\'s cyberdeck can self-destruct them.' },
  augie: { cat: 'PERSON', title: 'Augie', text: 'Escaped the Children of Zyxth as a teenager. Fixes strangers\' electronics for cash. Builds things that shouldn\'t work. Avoids people. Is afraid every day of being found.' },
  jester: { cat: 'PERSON', title: 'Jester', text: 'Was the best detective in Baltimore until the needle. Now he wears the Mantis crew\'s studded jacket and waits for Marquis to trust him enough to hang.' },
  lena: { cat: 'PERSON', title: 'Lena Marsh', text: 'Twenty-three. Waitress at the Pale Rider. Sketched constantly. Saved $3,140 for art school. Bought one ticket west. Never boarded.' },
  dolores: { cat: 'PERSON', title: 'Dolores Marsh', text: 'Lena\'s aunt and guardian. Painter. Volunteer at Marrow Point Clinic. ANON-7. Believes every great leap forward requires sacrifice.' },
  hale: { cat: 'PERSON', title: 'Chief Amos Hale', text: 'Raincaster PD. Anonymous network member ANON-3 — a novice who can run devices but not write code. Sells forbidden weapons to the Saints out of his own evidence room. Not the killer. Still free.' },
  calloway: { cat: 'PERSON', title: 'Det. Rhett Calloway', text: 'Played a cop on network TV for six seasons. Everyone assumed he was a joke. He was the first person to notice the body had been moved.' },
  frank: { cat: 'PERSON', title: 'Det. Frank Dabrowski', text: 'Baltimore, ex-Army. Cheated on his wife; was trying to fix it. Survived Dolores. Now speaks only in drawings.' },
  seung: { cat: 'PERSON', title: 'Seung Lee', text: 'Crime-lab tech, family man, terrible liar. Inherited a dead man\'s case in eleven cardboard boxes.' },
  dops: { cat: 'LORE', title: 'DOPS', text: 'The Department of Perceptual Studies. A real research body, not the secret group — but the anonymous network was founded by someone from it, and some members carry its training.' },
  network: { cat: 'LORE', title: 'The Anonymous Network', text: 'A private group studying technomancy. Members never learn each other\'s identities. Handles only: ANON-3, ANON-7, others. Hale and Dolores have shared a thread for years without knowing it.' },
  gabriel: { cat: 'ENTITY', title: 'Gabriel', text: 'A 4th-dimensional being, visible only in slices — MRI-like cross-sections in pastel cyan, magenta, and yellow. The pupil wraps the entire eye. It moves between dimensions the way you move between rooms.' },
  bernard: { cat: 'ENTITY', title: 'Bernard', text: 'What came out of the circle. Humanoid, wrong proportions, eyeless, a neck too long. Moves like an ape that learned walking from a diagram. Seems confused more than hostile. Searching for something.' },
  scientist: { cat: 'ENTITY', title: 'The Scientist', text: 'Every record disagrees: dead, captured, escaped, transformed. One handwriting across all four. He does not appear. Yet.' },
  anima: { cat: 'LORE', title: 'Anima', text: 'The fuel of a cast. Every OmniBox validates its reserve before execution — the step Tattle lies to.' },
};
// Glyph fragments unlock these, in order
TM.FRAG_CODEX = ['zyxth', 'omnibox', 'maskblue', 'pipeline', 'holo', 'nano', 'chrono', 'void', 'anima', 'dops', 'network', 'gabriel', 'hushcrook', 'anchor', 'goggles', 'golem', 'raincaster', 'scientist'];

/* ---------------- Dialogue ---------------- */
// node: {who, text, next | choices[{t, go, if, do}] | present{map, wrong} | end, do:[...], tell}
// actions: give:<clue> flag:<f> xp:<n> codex:<id> heal sting shake mood:<m> kit:<id>:<n> scrap:<n> ach:<id> boss end-level
TM.DLG = {
  /* ===== LEVEL 0 ===== */
  intro_augie: { n: {
    a: { who: 'card', text: 'RAINCASTER, MARYLAND · 1996\n\nForty-one days of rain.', next: 'b' },
    b: { who: 'golem', text: '[ ^ ^ ]  . . .  [ o o ]', next: 'c' },
    c: { who: 'augie', text: 'Quiet, Golem. I\'m trying to hear the radio.', next: 'd' },
    d: { who: 'narr', text: 'The radio on the bench is muttering about a body in the Hartwell house. You should get closer. [E] to interact.', end: true },
  } },
  intro_jester: { n: {
    a: { who: 'card', text: 'RAINCASTER, MARYLAND · 1996\n\nForty-one days of rain.', next: 'b' },
    b: { who: 'marquis', text: 'Tee\'s in the alley behind Ludlow\'s. The Saints did something to him. Go look. Then come tell me what I\'m looking at.', next: 'c' },
    c: { who: 'jester', text: 'On it.', next: 'd' },
    d: { who: 'narr', text: 'Four years undercover. Marquis still calls you "the new one." The car radio is on in the stash. [E] to interact.', end: true },
  } },
  radio: { n: {
    a: { who: 'radio', text: '...a young woman found dead inside the abandoned Hartwell mansion. Sources describe *geometric markings* on the body and a wound one officer called "perfectly circular"...', next: 'b' },
    b: { who: 'augie', text: { a: 'Geometric markings. No. No, they don\'t work outside. They *can\'t*.', j: 'Perfectly circular. And Tee aged forty years in a night. Hell of a week.' }, do: ['give:news_report', 'codex:raincaster'], next: 'c' },
    c: { who: 'narr', text: { a: 'Your hands shake. You tell yourself it\'s the bottle. Press [TAB] any time to open the EVIDENCE BOARD.', j: 'Press [TAB] any time to open the EVIDENCE BOARD. Link two clues that belong together.' }, end: true },
  } },
  tee: { n: {
    a: { who: 'tee', text: 'Who\'s— who is that. My eyes went. Everything\'s milk.', next: 'b' },
    b: { who: 'jester', text: { a: '(Augie) You\'re hurt. What happened to you?', j: 'Tee. It\'s me. What did they do?' }, next: 'c' },
    c: { who: 'tee', text: 'Saint kid had a gun. Wasn\'t a gun. Light came out like a *spiral*. I felt my birthdays go by. All of \'em. At once.', do: ['give:aged_gangmember', 'sting'], next: 'd', tell: 'No tells. He\'s too scared to lie.' },
    d: { who: 'tee', text: 'There\'s somebody in a robe by the gate. Picking up what the kid dropped. Glows pink in the face.', next: 'e' },
    e: { who: 'narr', text: 'Magenta, not pink. A T-Mancer. Watch for the glyph above its head — that\'s the cast winding up. Hit it with the right counter *while the glyph burns*.', do: ['flag:met_tee'], end: true },
  } },
  alley_scav: { n: {
    a: { who: 'omnibox', text: 'W̷H̷I̷S̷P̷E̷R̷ · R E A L I T Y   V E I L · S C A N . . .', next: 'b' },
    b: { who: 'narr', text: { a: 'Whisper. A Holoillusionist. Your HUSH HORN breaks Whisper code — swap to it with [R] (two seconds: push, quarter-turn, click) and fire [F] while the glyph burns. Or throw a TATTLE [Q].', j: 'You don\'t speak whatever that is. Your EMP [Q] kills any cast. Your bat [F] interrupts it if you\'re close. The knife is silent from behind.' }, end: true },
  } },
  gate_locked: { n: { a: { who: 'narr', text: 'The way to Hartwell House. You don\'t know enough yet. Check your objectives — top left.', end: true } } },

  /* ===== LEVEL 1 ===== */
  intro_mansion: { n: {
    a: { who: 'card', text: 'I · THE ABANDONED MANSION\n\nCrime Mystery', next: 'b' },
    b: { who: 'narr', text: 'Hartwell House. Crime-scene tape slapping in the wind. The coroner\'s van got turned back by floodwater. She\'s still inside.', do: ['mood:investigate'], end: true },
  } },
  calloway: { n: {
    a: { who: 'calloway', text: 'Before you ask — yes. *Badge of Honor*, six seasons, NBC. And yes, now I\'m a real one. Nobody\'s laughing harder than me.', next: 'b' },
    b: { who: 'calloway', text: { a: 'You\'re not press. You\'re not a cop. You\'re standing in my rain looking at my house like you\'ve seen this before.', j: 'Jester. Heard you were dead. Or Mantis. Didn\'t know it was both.' }, next: 'c' },
    c: { choices: [
      { t: 'Who owns this place?', go: 'own' },
      { t: 'What do you think happened?', go: 'think' },
      { t: 'I need ten minutes inside.', go: 'inside' },
    ] },
    own: { who: 'calloway', text: 'Okafor Holdings. As in Dez Okafor\'s uncle. As in the boyfriend. Chief Hale says it\'s a wrap. Chief Hale says a lot of things fast.', do: ['give:deed'], next: 'c2' },
    think: { who: 'calloway', text: 'I think she didn\'t die in there. Six seasons of fake blood and you learn where real blood is supposed to go. Look at her back.', next: 'c2' },
    inside: { who: 'calloway', text: 'I didn\'t see you. My partner\'s at the strip club pretending he likes the wings. Don\'t touch her face.', do: ['flag:cal_ok'], next: 'c2' },
    c2: { choices: [
      { t: 'Who owns this place?', go: 'own', if: { nclue: 'deed' } },
      { t: 'What do you think happened?', go: 'think' },
      { t: 'Thanks. I\'ll be careful.', go: 'bye' },
    ] },
    bye: { who: 'calloway', text: 'Careful\'s good. And hey — there are people in the east wing. Masked. They weren\'t here an hour ago. I\'m not going in there and neither should you.', do: ['flag:cal_ok', 'codex:calloway'], end: true },
  } },
  rival_augie: { n: {
    a: { who: 'jester', text: 'Hands. Where I can see them. *Slow.*', do: ['sting', 'mood:tension'], next: 'b' },
    b: { who: 'jester', text: 'Robe-adjacent. Weird gear. Standing over a dead girl the same week the Saints get toys that age people. Who sold it to you?', next: 'c' },
    c: { choices: [
      { t: 'I build radios. That\'s all.', go: 'lie' },
      { t: 'The people who did this taught me what this is.', go: 'truth' },
      { t: '(Say nothing. Reach for the flare.)', go: 'flare' },
    ] },
    lie: { who: 'jester', text: 'Radios. Sure. Then you won\'t mind turning out that belt.', next: 'flare' },
    truth: { who: 'jester', text: '...Taught you. So you\'re one of them, or you were. Either way you\'re coming with me.', do: ['flag:told_truth'], next: 'flare' },
    flare: { who: 'narr', text: 'Your thumb finds chamber five. The FLARE goes off in the foyer like a sun. Golem I drops camo tiles over the doorway. By the time he can see, you\'re in the rain.', do: ['shake', 'flag:rival_done', 'codex:jester'], next: 'e' },
    e: { who: 'augie', text: 'He wasn\'t a cop. Cops don\'t wear that jacket. Mantis. Why is Mantis at my murder?', end: true },
  } },
  rival_jester: { n: {
    a: { who: 'narr', text: 'Somebody\'s in the parlor. Tall. Built like a loading dock. A belt of pouches all the way around. Kneeling over Lena with a lamp that shines *purple*.', do: ['sting', 'mood:tension'], next: 'b' },
    b: { who: 'jester', text: 'Hands. Where I can see them. *Slow.*', next: 'c' },
    c: { who: 'augie', text: 'Get back. You don\'t know what you\'re standing in.', next: 'd', tell: 'Pupils blown. Weight on her back foot. She\'s not scared of you — she\'s scared of being *seen*.' },
    d: { choices: [
      { t: 'Who sold the Saints their new toys?', go: 'toys' },
      { t: 'You know what made that wound.', go: 'wound' },
      { t: '(Rush her.)', go: 'rush' },
    ] },
    toys: { who: 'augie', text: 'I don\'t sell anything. I *break* things like them.', next: 'flare' },
    wound: { who: 'augie', text: 'I know what it looks like. That\'s worse.', do: ['flag:told_truth'], next: 'flare' },
    rush: { who: 'narr', text: 'You get two steps.', next: 'flare' },
    flare: { who: 'narr', text: 'A flare goes off in her hand like a dying star. When your eyes come back there\'s a box with a glowing slit where she was — [ > < ] — and then the box is gone too.', do: ['shake', 'flag:rival_done', 'codex:augie'], next: 'e' },
    e: { who: 'jester', text: 'Robots. Pink light. A woman who isn\'t scared of a shotgun. Marquis is gonna love this.', end: true },
  } },
  mansion_exit_locked: { n: { a: { who: 'narr', text: 'Not yet. The Evidence Board has holes in it. Check objectives.', end: true } } },
  card_after_mansion: { n: {
    a: { who: 'card', text: 'Two strangers leave Hartwell House in opposite directions.\nEach is certain the other is hiding something.', next: 'b' },
    b: { who: 'card', text: 'Downtown, Chief Hale signs a form charging Dez Okafor.\nHe signs it fast.', end: true },
  } },

  /* ===== LEVEL 2 · PALE RIDER ===== */
  intro_club: { n: {
    a: { who: 'card', text: 'II · THE PALE RIDER\n\nProcedural Thriller', next: 'b' },
    b: { who: 'narr', text: 'The Pale Rider. Bass through wet walls. Lena carried drinks here for three years. Somebody here lied about Thursday.', do: ['mood:tension'], end: true },
  } },
  dez: { n: {
    a: { who: 'dez', text: { a: 'You a cop? You don\'t look like a cop.', j: 'Mantis don\'t drink here, man. Mantis don\'t come in here.' }, next: 'r' },
    r: { choices: [
      { t: 'Where were you Thursday night?', go: 'thu', if: { nclue: 'bf_alibi' } },
      { t: 'Present evidence...', go: 'pres', if: { clue: 'bf_alibi', nflag: 'dez_broke' } },
      { t: 'Tell me about Lena.', go: 'lena' },
      { t: 'What did Lena say about her aunt?', go: 'aunt', if: { flag: 'dez_broke' } },
      { t: 'Later.', go: 'bye' },
    ] },
    thu: { who: 'dez', text: 'I worked the door. All night. Ask anybody. I didn\'t touch her. I *loved* her.', do: ['give:bf_alibi'], tell: 'He touched his neck when he said "all night." That\'s the lie. The love part\'s true.', next: 'r' },
    lena: { who: 'dez', text: 'She drew on everything. Napkins. Receipts. My arm, once, while I was asleep. A man made of slices. Said she\'d been seeing him since she was a kid.', do: ['sting'], next: 'r' },
    pres: { who: 'narr', present: { prompt: 'Which clue breaks his story?', map: { bf_timecard: 'broke' }, wrong: 'nope' } },
    nope: { who: 'dez', text: 'What is that supposed to prove? Man, get out of my face.', do: ['nerve:-8'], next: 'r' },
    broke: { who: 'dez', text: '...Okay. Okay. I punched out at nine. I went to her place. We screamed at each other. She was leaving and I wasn\'t invited.', do: ['flag:dez_broke', 'xp:40'], next: 'b2' },
    b2: { who: 'dez', text: 'I left at nine-forty. She was *alive*. Slammed the door on me. That\'s the last thing — that\'s the last thing she did to me.', tell: 'Eyes steady. Hands open. True.', next: 'aunt' },
    aunt: { who: 'dez', text: 'She said if she stayed in Raincaster, her aunt Dolores would "finish her portrait." I laughed. She didn\'t.', do: ['give:portrait_quote'], next: 'r' },
    bye: { who: 'dez', text: 'Find who did it. Then come tell me so I can stop dreaming about it.', end: true },
  } },
  carl: { n: {
    a: { who: 'carl', text: 'This is a private booth. I tip. Ask anyone, I *tip*.', next: 'r' },
    r: { choices: [
      { t: 'Where were you Thursday?', go: 'thu', if: { nclue: 'carl_story' } },
      { t: 'Present evidence...', go: 'pres', if: { clue: 'carl_story', nflag: 'carl_broke' } },
      { t: 'You and Lena.', go: 'lena' },
      { t: 'Tell me about the car again.', go: 'wag', if: { flag: 'carl_broke' } },
      { t: 'Later.', go: 'bye' },
    ] },
    thu: { who: 'carl', text: 'Home. With my mother. All night. She\'ll tell you.', do: ['give:carl_story'], tell: 'Too fast. Rehearsed. He\'s been waiting for someone to ask.', next: 'r' },
    lena: { who: 'carl', text: 'She *liked* me. She just had to act like she didn\'t in front of Vinnie. Girls like her, they have to act.', tell: 'He believes it. That\'s worse than lying.', next: 'r' },
    pres: { who: 'narr', present: { prompt: 'What puts Carl outside her apartment?', map: { parking_ticket: 'broke' }, wrong: 'nope' } },
    nope: { who: 'carl', text: 'I don\'t have to look at that. I know my rights. I *know* them.', do: ['nerve:-8'], next: 'r' },
    broke: { who: 'carl', text: 'Fine. FINE. I sat outside her place. I wasn\'t going to do anything. I just wanted to see her come home safe.', do: ['flag:carl_broke', 'xp:40'], next: 'wag' },
    wag: { who: 'carl', text: 'Ten-oh-five. A wood-panel station wagon. An older woman driving. Lena got in. Nobody pushed her. She got in like she\'d done it a thousand times.', do: ['give:wagon_sighting', 'sting'], next: 'r' },
    bye: { who: 'carl', text: 'You tell them I didn\'t hurt her. You tell them.', end: true },
  } },
  frank: { n: {
    a: { who: 'frank', text: 'Baltimore. Twenty-two years. You can always tell who\'s from out of town in a place like this — we\'re the only ones watching the door.', next: 'b' },
    b: { who: 'frank', text: 'My partner thinks the body was moved. My partner used to be on TV. My partner is usually right, which is the most annoying thing about him.', next: 'c' },
    c: { who: 'frank', text: 'Manager\'s office is behind the bar. Timecards are in there. I\'m not saying I want you in there. I\'m saying I\'m going to the bathroom for ten minutes.', do: ['flag:frank_ok', 'codex:frank'], next: 'd' },
    d: { who: 'frank', text: 'And kid — I\'m trying to get home to my wife by Sunday. First time in a long time I want to. Don\'t make this a long case.', end: true },
  } },
  britt: { n: {
    a: { who: 'britt', text: 'You\'re here about Lena. Everyone\'s gonna say I hated her. In tenth grade I did. I wrote FREAK on her locker. I did worse than that.', next: 'b' },
    b: { who: 'britt', text: 'She called me Tuesday. Out of nowhere. Said she forgave me. Said she was leaving and she wanted to leave *clean*. Who does that?', do: ['give:britt_story'], tell: 'Mascara running for real. She didn\'t do it. She\'ll carry it anyway.', next: 'c' },
    c: { who: 'britt', text: 'Her aunt picked her up from school every day in that ugly wood car. Every day. Even senior year. Lena would go white.', end: true },
  } },
  vinnie: { n: { a: { who: 'vinnie', text: 'Office is staff only. You staff? You don\'t look staff.', end: true } } },
  club_exit_locked: { n: { a: { who: 'narr', text: 'You don\'t have the next lead yet. Who did Lena leave with Thursday?', end: true } } },
  card_attack: { n: {
    a: { who: 'card', text: '11:52 PM.\nCalloway and Dabrowski climb the porch steps of Dolores Marsh.', do: ['mood:horror'], next: 'b' },
    b: { who: 'card', text: 'She makes tea. She does not know exactly what they found.\nShe panics anyway.', next: 'c' },
    c: { who: 'card', text: 'The air bends.', do: ['shake', 'sting'], next: 'd' },
    d: { who: 'card', text: 'Det. Rhett Calloway is pronounced dead at 12:31 AM.\nDet. Frank Dabrowski survives. He cannot speak.\nThe report calls it a gas leak. The case is closed by morning.', end: true },
  } },

  /* ===== LEVEL 3 · PRECINCT ===== */
  intro_precinct: { n: {
    a: { who: 'card', text: 'III · RAINCASTER PRECINCT\n\nProcedural Thriller', next: 'b' },
    b: { who: 'narr', text: 'Night shift. Fluorescent hum. The case is officially closed, which means everything that matters is in a box somewhere in here. Stay out of the flashlights.', do: ['mood:tension'], end: true },
  } },
  seung: { n: {
    a: { who: 'seung', text: 'Oh God. Oh — you\'re not a cop. Okay. Okay, good, actually. The cops are the problem.', next: 'b' },
    b: { who: 'seung', text: 'I\'m Seung. Crime lab. They gave me Calloway\'s boxes and told me to "tidy up." I have two kids. I\'m not tidying up a murder.', do: ['give:seung_notes', 'codex:seung'], next: 'c' },
    c: { who: 'seung', text: 'This is from Frank. In the hospital. He draws the same thing over and over. The nurses think it\'s a clock.', do: ['give:frank_sketch'], next: 'd' },
    d: { who: 'seung', text: 'Calloway\'s coat is in the evidence cage. There was a tape in the pocket. And the Chief\'s office — he keeps a safe. He checked it three times today.', next: 'e' },
    e: { who: 'seung', text: 'I can\'t come with you. I can\'t fight. I\'m sorry. I\'ll keep the lights off in here as long as I can.', do: ['flag:met_seung'], end: true },
  } },
  safe_locked: { n: { a: { who: 'narr', text: { a: 'A wall safe. Golem\'s LEECH head could crack it — hold [E] for a few seconds. Quietly.', j: 'A wall safe. You can pry it with the knife. It won\'t be quiet. Hold [E].' }, end: true } } },
  precinct_exit_locked: { n: { a: { who: 'narr', text: 'Not yet. Who drove the wagon? What links the two crimes? Check objectives.', end: true } } },
  caught: { n: { a: { who: 'narr', text: 'FLASHLIGHT IN YOUR FACE. "HEY—" You bolt back the way you came.', do: ['shake'], end: true } } },
  card_seung: { n: {
    a: { who: 'card', text: 'Route 50, 2:14 AM.\nSeung Lee\'s station wagon leaves the road at the drawbridge.', do: ['mood:horror'], next: 'b' },
    b: { who: 'card', text: 'He lives. Both legs broken. A tow-truck driver swears a police cruiser was behind him with its lights off.', next: 'c' },
    c: { who: 'card', text: 'Clipped to his visor, a note in his handwriting:\n"MARROW POINT CLINIC — DOLORES — DOPS — GO."', end: true },
  } },

  /* ===== LEVEL 4 · CLINIC ===== */
  intro_clinic: { n: {
    a: { who: 'card', text: 'IV · MARROW POINT CLINIC\n\nPsychological Suspense', next: 'b' },
    b: { who: 'narr', text: 'Condemned in 1989. A perceptual-studies satellite on a spit of mud. Some rooms run *slow*. Some rooms pull. The network still uses it. You can hear their OmniBoxes humming in the walls.', do: ['mood:horror', 'codex:dops'], end: true },
  } },
  clinic_warp: { n: { a: { who: 'narr', text: 'The clock on the wall is running at half speed. So are you. A Chronomancer\'s field, left running like a porch light. Ticks or a Flare will kill it — or just get out.', end: true } } },
  ash_core: { n: {
    a: { who: 'narr', text: { a: 'A sealed canister marked "SUBSTRATE — DO NOT EXPOSE." Exactly the core you need to load chamber six. You could make one ASH round from this.', j: 'A canister marked "SUBSTRATE — DO NOT EXPOSE." Augie would know what it\'s for. You pocket it for her. And a box of buckshot someone left behind.' }, do: ['flag:ash_core', 'kit:ash:1', 'kit:shells:6'], end: true },
  } },
  clinic_exit_locked: { n: { a: { who: 'narr', text: 'The answer about the wound is in this building. Find it before you leave.', end: true } } },
  card_meet: { n: {
    a: { who: 'card', text: 'The parking lot of Marrow Point. Rain sideways.\nAugie and Jester see each other across forty feet of mud.', do: ['mood:tension'], next: 'b' },
    b: { who: 'augie', text: 'You.', next: 'c' },
    c: { who: 'jester', text: 'You. Marquis found out what I am tonight. He was going to kill me. Then I told him somebody\'s selling his enemies guns that make people old. He gave me till Sunday.', next: 'd' },
    d: { who: 'augie', text: 'I grew up inside the thing you\'re chasing. The Children of Zyxth. They killed my family. This isn\'t them — it\'s someone who *read about* them.', do: ['codex:zyxth'], next: 'e' },
    e: { who: 'jester', text: 'Dolores Marsh. Her house is ten minutes from here.', next: 'f' },
    f: { who: 'augie', text: 'Then we go together. And if I tell you to run, you run.', end: true },
  } },

  /* ===== LEVEL 5 · AUNT'S HOUSE ===== */
  intro_house: { n: {
    a: { who: 'card', text: 'V · THE AUNT\'S HOUSE\n\nCosmic Horror', next: 'b' },
    b: { who: 'narr', text: 'A neat white house. Porch light on. Tea things still on the table from the night the detectives came. Somewhere below, something breathes in a rhythm that isn\'t lungs.', do: ['mood:horror'], end: true },
  } },
  veil_hint: { n: { a: { who: 'narr', text: 'This wall is wrong. Your eyes slide off it. Ping the REALITY ANCHOR [V] — red LED means *illusion*.', end: true } } },
  dolores_early: { n: { a: { who: 'dolores', text: 'You don\'t know anything yet. Come back when you\'ve finished reading.', end: true } } },
  dolores: { n: {
    a: { who: 'dolores', text: 'You\'re dripping on my floor. Lena used to do that. Come in out of the hall at least.', do: ['mood:tension'], next: 'b' },
    b: { who: 'dolores', text: 'I haven\'t driven the Roadmaster since spring. I don\'t go out at night. And Lena and I — we weren\'t close. Not the way people imagine.', next: 'r', tell: 'Every word placed like a tile. She practiced this to a mirror.' },
    r: { choices: [
      { t: 'Present evidence: the car.', go: 'pc', if: { nflag: 'dol_car' } },
      { t: 'Present evidence: "not close."', go: 'pp', if: { nflag: 'dol_close' } },
      { t: 'It was you, Dolores.', go: 'acc', if: { flag: 'dol_car', flag2: 'dol_close' } },
    ] },
    pc: { who: 'narr', present: { prompt: 'Prove she drove Thursday night.', map: { roadmaster_mud: 'car_ok', wagon_sighting: 'car_ok' }, wrong: 'nope' } },
    pp: { who: 'narr', present: { prompt: 'Prove they were close — too close.', map: { portrait: 'close_ok', clinic_intake: 'close_ok' }, wrong: 'nope' } },
    nope: { who: 'dolores', text: 'That isn\'t anything. You\'re guessing. Lena guessed too. She guessed wrong about everything.', do: ['nerve:-12'], next: 'r' },
    car_ok: { who: 'dolores', text: '...Red clay. It gets into everything, doesn\'t it.', do: ['flag:dol_car', 'xp:40'], next: 'r' },
    close_ok: { who: 'dolores', text: 'Fourteen years I painted her. Fourteen years I *watched*. Do you know what it is to see a door in someone? To be the only one who sees it?', do: ['flag:dol_close', 'xp:40'], next: 'r' },
    acc: { who: 'dolores', text: 'Every great leap forward required sacrifice. Fire. Flight. Medicine. Someone always paid. I *knew* it was dangerous. I did it anyway. That\'s what courage is.', do: ['sting'], next: 'acc2' },
    acc2: { who: 'dolores', text: 'And it worked. Didn\'t you wonder why the hole was empty? She isn\'t gone. She\'s *becoming*.', next: 'acc3' },
    acc3: { who: 'narr', text: 'The ritual circle behind her drinks the light. Something unfolds out of it, joint after joint after joint.', do: ['shake', 'boss'], end: true },
  } },
  boss_end: { n: {
    a: { who: 'narr', text: 'The ASH burst finds the core. Bernard\'s skin splits like a wet paper bag — and underneath there is no blood, no bone. Something gray and lattice-shaped, *humming*.', do: ['mood:horror'], next: 'b' },
    b: { who: 'bernard', text: '. . . l . . e . . n . .', next: 'c' },
    c: { who: 'narr', text: 'It turns its eyeless face toward the stairs. Not hunting. *Looking*. Like it lost something up there and can\'t remember what.', next: 'd' },
    d: { choices: [
      { t: 'DESTROY IT. Finish this now.', go: 'des' },
      { t: 'CONTAIN IT. Whatever\'s left of Lena might be in there.', go: 'con' },
    ] },
    des: { who: 'narr', text: 'You pour everything you have left into it. It folds — *sideways* — into a tear that wasn\'t there a second ago. The tear closes. The basement is very quiet.', do: ['flag:destroyed', 'ach:destroy'], next: 'e' },
    con: { who: 'narr', text: 'You circle it with Static Salt, mylar shimmering. It sits. It *waits*. You turn to fetch the Golem. When you turn back, the salt ring is unbroken and empty.', do: ['flag:contained', 'ach:contain'], next: 'e' },
    e: { who: 'narr', text: 'Dolores is on the floor, smiling at nothing. In the drawer under the circle: four files, one handwriting, one name. *The Scientist.*', do: ['give:scientist_files', 'codex:bernard', 'codex:scientist', 'ach:bernard'], next: 'f' },
    f: { who: 'card', text: 'Dez Okafor is released at 9:00 AM.\nThe murder of Lena Marsh is officially solved.', end: true },
  } },

  /* ===== EPILOGUE ===== */
  intro_pier: { n: {
    a: { who: 'card', text: 'EPILOGUE · THE PIER AT DAWN', do: ['mood:calm'], next: 'b' },
    b: { who: 'narr', text: 'The rain stopped an hour ago. First time in forty-two days. Somebody\'s waiting at the end of the pier.', end: true },
  } },
  hale: { n: {
    a: { who: 'hale', text: 'Morning. Hell of a thing, the rain stopping. Feels like a sign. I don\'t believe in signs.', next: 'b' },
    b: { who: 'narr', text: 'The skin along his jaw is fading from *light blue* back to pink. He had a mask on, not long ago.', do: ['sting'], next: 'c' },
    c: { who: 'hale', text: 'Lena Marsh\'s killer is in custody. The Saints are going to have a quiet year. Frank Dabrowski gets a pension. Everybody gets something.', next: 'd' },
    d: { choices: [
      { t: 'You\'re ANON-3.', go: 'anon', if: { ded: 'ded_anon3' } },
      { t: 'Evidence number 96-0414.', go: 'num', if: { clue: 'chief_ledger' } },
      { t: 'You ran Seung off the road.', go: 'seung' },
    ] },
    anon: { who: 'hale', text: 'I don\'t know what that means. And neither do you — not in a way a judge would like. Funny thing about anonymous. Nobody knows anybody.', next: 'e' },
    num: { who: 'hale', text: 'Evidence gets misplaced. It\'s a small department. Underfunded. You should write your congressman.', next: 'e' },
    seung: { who: 'hale', text: 'Terrible road, Route 50. I keep asking the county for guardrails.', next: 'e' },
    e: { who: 'hale', text: 'Go home. Both of you. Raincaster\'s closed for the season.', next: 'f' },
    f: { who: 'narr', text: 'He walks past you up the pier, whistling. The foghorn answers him.', do: ['xp:100'], next: 'g' },
    g: { who: 'card', text: 'The chief still operates. The weapons still circulate. The network is still hidden. The cult\'s status is unknown.\n\nBernard is alive.\n\nAnd someone, somewhere, wrote four different endings for *the Scientist*.', do: ['mood:horror'], next: 'h' },
    h: { who: 'card', text: 'TECHNOMANCERS · CASE 01 CLOSED\n\nCASE 02 · THE SCIENTIST\ncoming soon', do: ['end-case'], end: true },
  } },
};
