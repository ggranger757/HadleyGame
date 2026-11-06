# TECHNOMANCERS

**Case 01 · Raincaster, Maryland · 1996**

A 2D pixel mystery / sci-fi / horror adventure. A waitress is found dead in an abandoned mansion with geometric markings and a perfectly circular wound. Play as **Augie** (reclusive ex-cult engineer, scrap-built counter-tech) or **Jester** (undercover ex-detective in a gang jacket). Investigate crime scenes, link clues on the Evidence Board, break alibis, counter four classes of technomancers, and survive what's in the aunt's basement.

The tone moves from **Crime Mystery → Procedural Thriller → Psychological Suspense → Cosmic Horror**.

It's an installable **PWA**: it works offline on desktop and mobile, with keyboard, gamepad or touch.

---

## Run it

No build step, no dependencies. Pure HTML + CSS + vanilla JS.

```bash
# any static server works
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from disk (`file://`) works too, but install and offline mode need a server (the service worker only registers over http/https).

## Deploy to GitHub Pages

1. Create a new repository and push this folder to `main`.
2. In the repo go to **Settings → Pages → Build and deployment** and choose **GitHub Actions**.
3. The included workflow (`.github/workflows/pages.yml`) deploys on every push to `main`.
4. Open `https://<you>.github.io/<repo>/` and, on mobile, use **Add to Home Screen** (Chrome also shows an **Install** button on the title screen).

All paths are relative, so the game works from any sub-path.

**When you ship an update**, bump `VERSION` in `sw.js` so installed players get the new files.

---

## Controls

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move / sprint | WASD or arrows / Shift | Left stick / RT | Stick (push to the rim to sprint) |
| Interact, talk, inspect (hold for locks & safes) | E / Enter | A | ◉ |
| Attack / fire | F / Space | X | weapon button |
| Use kit item / cycle kit | Q / C | B / LB | kit button / ⟳ |
| Swap Hush Crook head (Augie, ~2 s) / weapon (Jester) | R | Y | ⇄ |
| Reality Anchor ping | V | RB | ⌖ |
| Detective Mode | G | LT | ◎ |
| Flashlight | L | R3 | ☼ |
| Evidence Board | Tab / B | Back | ⚑ |
| Pause | Esc | Start | ❚❚ |

All keys can be remapped in **Settings**.

## How to play

- **Investigate.** Inspected objects become clue cards. Augie has UV, dusting, swab and Polaroid tools; Jester has eyeball, shakedown, knife and photo. Each reveals different details.
- **Evidence Board.** Tap two cards that belong together. A valid pair becomes a **deduction** and opens the way forward. A wrong link costs nerve and lowers your grade.
- **Interrogate.** When a witness lies, use *Present evidence* to show the clue that breaks their story. Jester's **Street Sense** shows each witness's tells.
- **Counter the casters.** A magenta glyph over a T-Mancer means a cast is winding up. Hit them with the matching counter **while it burns**:
  - Holoillusionist (Whisper) → Hush Horn · Reality Anchor
  - Nanomancer (Nanohive) → Swarm Jar
  - Chronomancer (Temporaltext) → Ticks · Flare
  - Voidwalker (Foldspeak) → Static Salt (jams gates for 40 s) · Seam Goggles show the tear early
  - Tattle and EMP work on any cast.
- **Stay unseen.** Each zone has a suspicion meter. Turn the flashlight off, hide in deep shadow, and don't fire the shotgun indoors.

## Gamification

- **XP and 8 investigator ranks**, each with a permanent perk (more HP, bigger kit, faster swaps, slower nerve drain, and more).
- **Action chains**: consecutive successes multiply XP.
- **S/A/B/C/D grade** on every level, based on time vs. par, damage, wrong links, suspicion, glyph fragments and bonus objectives.
- **24 feats** (achievements), **27 codex entries**, and **19 hidden glyph fragments**.
- **Daily Jam**: a new casting-code bug hunt every day, with streaks.
- **Two protagonists**: close the case as both to unlock everything.

---

## Project layout

```
index.html              app shell, HUD, touch controls
manifest.webmanifest    PWA manifest
sw.js                   offline service worker (bump VERSION on release)
css/style.css           palette tokens, HUD, menus, responsive/touch layout
js/00-util.js           math, seeded RNG, Web Audio synth (all sound is generated)
js/01-data.js           characters, weapons, kit, enemies, counter matrix, ranks, feats
js/01b-story.js         clues, deductions, codex, cast, dialogue trees
js/01c-levels.js        7 tilemaps + entity placement
js/02-state.js          profile + run saves (localStorage)
js/03-input.js          keyboard (remappable), touch, gamepad
js/04-engine.js         world, collision, LOS, FOV raycast, suspicion, damage, grading
js/05-render.js         procedural pixel art: tiles, sprites, glyphs, icons, portraits, lighting
js/06-player.js         Augie / Jester controller, weapons, kit, anchor, interaction
js/07-ai.js             T-Mancer casting state machines, cops, Bernard (3 phases)
js/08-forensics.js      inspection tools + Evidence Board
js/09-ui.js             dialogue, menus, settings, codex, feats, Daily Jam, grades
js/10-main.js           boot, loop, scaling, level flow
icons/                  app icons
```

All art and audio are generated in code at runtime, so there are no third-party assets to credit. If you add free packs later (for example ansimuz or CraftPix), list their licenses here.

## Palette law

Gray and black bodies. Every technomancy highlight is **magenta** (`#d6338a` family). **Red is reserved** for reality tears, entity corruption, damage and warnings. Masked T-Mancer skin is **mask blue** (`#7ab8e8`). Entity moments (Gabriel) break the palette on purpose with pastel cyan, magenta and yellow.
