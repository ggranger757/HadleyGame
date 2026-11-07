# TECHNOMANCERS

**A Raincaster Mystery · Maryland, 1996**

A waitress is found dead in an abandoned mansion. There are glowing shapes on her skin and a perfectly round hole through her body. Play as **Augie**, an engineer who escaped a cult of technomancers, or **Jester**, an undercover cop deep inside the Mantis gang. Work out who killed Lena Marsh, and what came out of the aunt's basement.

A side-scrolling pixel mystery in the style of Step Quest. It's built to be easy to pick up: one button, one goal on screen at a time, and a pink arrow that always shows you where to go.

It's an installable **PWA** that works offline on phones and computers.

---

## How to play

- **Walk** with ◀ ▶ (or A/D or the arrow keys). Press **ACTION** (Space/E) to look, talk, solve or go.
- **Follow the pink arrow.** The box at the top-left always tells you the one thing to do next.
- **Clues** sparkle ✦. Everything you find goes in your 📁 **Case File**.
- **Case questions:** when you have the clues, the game asks what they mean. Choose from 3 answers; a wrong answer gives you a hint.
- **"THAT'S A LIE!":** when someone lies, call it out and pick the clue that proves it.
- **Ask anyone anything:** after someone's first conversation, TALK to them again to type your own questions.
- **Puzzles and memory games:** tune a radio, fix a torn page, remember a crime scene, crack a keypad, match evidence tags, open a safe, restore power, and find the fake brick. Each one has a 💡 HINT.
- **Fights:** turn-based. The enemy always shows its **NEXT MOVE** and what it's **WEAK TO**. Use that gadget to cancel its move and hit hard.
- **Jester is undercover.** His **COVER** meter drops if he talks like a cop around the Mantis gang. If it empties, the gang attacks.

### What keeps you coming back
XP and 7 detective ranks (each one adds max health), 3 stars per chapter, 21 trophies, hidden ◆ glyphs that unlock character files, a **Daily Case** with a streak, and two playable sides of the same story.

---

## Run it

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

## Put it on GitHub Pages

1. Create a repository and upload **everything** in this folder, including `.github/` and `.nojekyll`.
2. **Settings → Pages → Source: GitHub Actions.** The included workflow publishes on every push to `main`.
3. Open `https://<you>.github.io/<repo>/`. On a phone, use **Add to Home Screen**.
4. When you update the game, bump `VERSION` in `sw.js` so installed copies refresh.

## Make the characters truly smart (optional)

Without setup, the characters answer free-typed questions with built-in replies that match each topic. To have them answer **anything** intelligently, they can be played by Claude:

1. Get an API key at <https://console.anthropic.com>.
2. Deploy the tiny proxy in `server/` (a free Cloudflare Worker), which keeps your key secret:
   ```bash
   npm i -g wrangler && wrangler login
   cd server
   wrangler secret put ANTHROPIC_API_KEY
   wrangler deploy
   ```
3. Paste the worker URL into `js/config.js` (`aiEndpoint`), or into **Settings → AI characters server** in the game.
4. Recommended: in `server/wrangler.toml`, set `ALLOWED_ORIGINS` to your GitHub Pages address so only your game can use it.

Each character has a written personality, what they know, and what they hide. They stay in character, won't reveal secrets just because you ask, and nudge lost players toward the next step. With Jester, the AI also decides when he has said something a cop would say. You pay Anthropic for usage; the worker uses a small, inexpensive model.

---

## Project layout

```
index.html, manifest.webmanifest, sw.js, css/style.css
js/00-util.js        helpers + Web Audio (synth music, real sound effects)
js/config.js         AI server address
js/01-sprites.js     sprite sheet metadata (generated)
js/01-bg.js          background layer metadata
js/02-story.js       chapters, scenes, clues, questions, lies, fights, dialogue, trophies, Daily Case
js/03-state.js       saves (localStorage): profile + current game
js/05-world.js       side-view scenes, walking, guidance arrow, stealth guards
js/06-battle.js      turn-based fights, Bernard's 3 phases
js/06b-puzzles.js    puzzles and memory games
js/06c-talk.js       "ask anything" conversations (AI + offline)
js/07-ui.js          dialogue, clue cards, questions, menus, Daily Case, results
js/08-main.js        objectives, stars, cover system, boot
assets/              sprites, backgrounds, fonts, sound effects
server/              Cloudflare Worker proxy for AI characters
tools/               sprite builder (recolors + costumes Step Quest bases into the cast)
```

To rebuild the character sprites after editing `tools/build_sprites.py`, `tools/costume.py` or `tools/bernard.py`:
```bash
python3 tools/build_sprites.py <path-to-Step-Quest> assets/sprites
```

See **CREDITS.md** for asset licenses.
