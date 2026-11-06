# DEVLOG — Technomancers

## v1.0.0 — first full build

Built from the *Raincaster: Casting in Whisper* prompt suite, the Book 1 synopsis, Class Sheets v7, the Casting Code doc, Augie's Kit sheets and the moodboard. Title changed to **Technomancers** per direction.

### Architecture decisions
- **Zero build, classic scripts.** Plain `<script>` tags sharing a `TM` namespace (not ES modules), so the game also runs from `file://`. The file split follows the prompt's layout, with story and level data broken out into `01b` and `01c`.
- **Procedural art.** Tiles, 4-direction × 4-frame character sheets, Bernard, glyphs, clue icons and portraits are all drawn in code at boot. The palette law is enforced in one place (`TM.PAL`). This kept the build dependency-free and offline-safe. The trade-off is that sprites are placeholder-grade pixel art, not hand-drawn sheets.
- **Synthesized audio.** Web Audio drones crossfade by mood (investigate / tension / horror / boss / calm). Rain, foghorn, heartbeat at low nerve, three footstep surfaces, and per-language cast tones are all generated.
- **Canvas world, DOM interface.** The world renders at 480×270 internal resolution, integer-scaled on desktop. HUD, dialogue, board and menus are DOM, so text stays crisp and accessible on phones.
- **FOV.** 64-ray flashlight cone with wall occlusion, explored-tile memory (unexplored stays black), radial light sources, colored light tints. Enemies outside your light are invisible, but their OmniBox eyes and cast glyphs glow through the dark.
- **Two save layers.** *Profile* (XP, rank, feats, codex, settings, streak, best grades) persists forever. *Run* (case state) autosaves on every room entry, clue and dialogue end. There is also one manual slot.
- **Data separate from logic.** Clues, deductions, dialogue, levels, enemies, kit and ranks are plain data tables.

### Systems implemented
- Character select with distinct stats, loadouts, forensic tools and dialogue branches (Jester's Street Sense tells).
- 7 zones: Alleyways (tutorial), Mansion, Pale Rider, Precinct (stealth, cops can't be fought), Condemned Clinic (time-slow and gravity-pull rooms), Aunt's House and Basement (illusion-masked entry), Pier epilogue.
- Evidence Board with 16 deductions, wrong-link penalties, a "hunch" hint and present-evidence interrogations.
- Counter matrix for the 4 T-Mancer classes plus aging-beam enforcers. Casts telegraph with language glyphs, and counters only abort a cast while the glyph burns. Tattle and EMP are universal but scarce.
- Augie: Hush Crook head swap (~2 s, *push · quarter-turn · click*), Taser/Flare/ASH drum rounds, full Reality Anchor, Seam Goggles (the Voidwalker re-emergence point is painted red before the Tumble), Golem Detective Mode, workbench crafting from scrap.
- Jester: bat (deflects, interrupts), knife (×4 silent backstab), pump shotgun (loud), frags, EMP, LED-only anchor, contacts sell kit for cash.
- Suspicion per zone (lockdown at 100%), hiding shadows, flashlight trade-off, Nerve meter (vignette and heartbeat).
- Bernard: three phases (Wrong Body → Entity Tear → The Sacrifice). Exploit its confusion, seal the red tears, break Dolores' ward cast, then put the ASH round in the exposed core. Destroy or contain; both lead to the epilogue.
- Gamification: XP chains, 8 ranks with perks, S–D grades, 24 feats, 27 codex entries, 19 glyph fragments, Daily Jam (date-seeded casting-code bug hunt with streaks), play-as-the-other-character hook.
- PWA: manifest, offline service worker, install button, touch controls (portrait and landscape), gamepad, key remap, text speed, shake toggle, high-contrast, scanline toggle, haptics.

### Backlog
- Replace procedural sprites with hand-drawn sheets: Augie's all-around pouch belt and hip-reach swap animation, Jester's mantis-shrimp jacket, Bernard multi-phase sheet, Golem VFD emotions.
- Real tilesets (the prompt suggests ansimuz / CraftPix packs), with license credits in the README.
- Composed music tracks to replace the drones.
- Deeper stealth: bodies, alarms and sensors as separate suspicion sources; Golem fortress-panel cover.
- More Daily Jam templates (Dreamwalk, Forge, Time Stitch, Portal Summon).
- Case 02 · *The Scientist*.
