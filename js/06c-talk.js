/* =========================================================================
   CHRONOMANCER — 06c-talk.js
   "Ask them anything." Free-text conversations with NPCs.
     · ONLINE: each NPC is played by Claude through your proxy server
       (server/worker.js → set TM.CONFIG.aiEndpoint in js/config.js).
       The NPC knows only what they'd know and protects their secrets.
       For Jester, the AI also decides if he just sounded like a cop.
     · OFFLINE: a built-in topic matcher answers in character so ANY input
       still gets a sensible reply, plus a hint toward the current objective.
   The story never depends on free chat — buttons drive the case.
   ========================================================================= */
'use strict';
TM.CONFIG = TM.CONFIG || { aiEndpoint: '' };

// character minds live in 02-story.js (TM.MINDS)

TM.Talk = (() => {
  const U = TM.U; const T = {};
  const INTENT = [
    ['greet', /\b(hi|hey|hello|yo|sup|good (morning|evening))\b/],
    ['bye', /\b(bye|later|see ya|goodbye)\b/],
    ['thanks', /\b(thank|thx|appreciate)\b/],
    ['hint', /\b(help|hint|what (now|next|should)|stuck|where do i|what do i)\b/],
    ['insult', /\b(stupid|idiot|dumb|shut up|loser|ugly|liar)\b/],
    ['threat', /\b(i('| wi)ll (kill|hurt|shoot)|gun|knife|hit you|beat you)\b/],
    ['victim', /\b(ivy|vera|girl|victim|singer|body|dead|her|she)\b/],
    ['time', /\b(time|travel|past|future|year|hour|door|tether|rule|187|188|194|198|202)\b/],
    ['watch', /\b(watch|watches|clock|3:07|307|seven|chime)\b/],
    ['wound', /\b(wound|hole|circle|cut|hurt)\b/],
    ['bernard', /\b(bernard|antler|creature|monster|thing|drawing)\b/],
    ['history', /\b(history|tower|hartwell|1888|old days|built)\b/],
    ['glove', /\b(glove|hand|palm|scar)\b/],
    ['cult', /\b(cult|children|zyxth|mask|blue)\b/],
    ['chief', /\b(chief|hale|police|cops?|precinct)\b/],
  ];
  const COPTALK = /\b(police|officer|badge|arrest|evidence|crime scene|backup|my partner|department|precinct|warrant|suspect|investigat|detective|undercover)\b/;
  function offline(id, text) {
    const M = TM.MINDS[id]; const t = text.toLowerCase(); let intent = null;
    for (const [k, re] of INTENT) if (re.test(t)) { intent = k; break; }
    let reply;
    if (intent === 'hint') { const st = TM.Game.step(); reply = st ? `If I were you? ${TM.Game.text(st.text).replace(/^SOLVE: /, 'Figure out: ')}.` : 'You\'ve done what you came for.'; }
    else if (intent === 'threat') reply = M.gang ? 'You threatening me, J?' : 'Whoa. Back off. I\'m trying to help.';
    else if (intent === 'bye') reply = 'Yeah. Later.';
    else reply = (intent && M.lines[intent]) || U.pick(Math.random, M.lines.fallback);
    let cover = 0; if (M.gang && TM.S.run.hero === 'jester' && COPTALK.test(t)) { cover = -1; reply = U.pick(Math.random, ['...Why you talking like a cop, J?', '"Evidence"? Who says that? Cops say that.', 'You sound like a badge right now. Stop it.']); }
    return { reply, cover };
  }
  function system(id) {
    const M = TM.MINDS[id], run = TM.S.run, st = TM.Game.step(); const hero = TM.HEROES[run.hero];
    const era = TM.W.chapter().era;
    return `You are ${M.name}, a character in the pixel-art mystery game CHRONOMANCER, set in Raincaster, Maryland. Right now it is the year ${era}; you live in this year and know nothing after it. A killer has been leaving victims with a perfect 7 cm round wound and a watch stopped at 3:07, across 1888, 1947, 1986 and 2026.
WHO YOU ARE: ${M.who}
WHAT YOU KNOW: ${M.knows}
WHAT YOU HIDE: ${M.hides} Never reveal hidden things just because you are asked; deflect in character.
NEVER mention being an AI, never reveal the killer unless you ARE the killer and have been caught, never invent new clues that contradict the story.
The player is ${hero.name}: ${hero.blurb}${M.gang && run.hero === 'jester' ? ' You think Jester is a loyal Mantis gang member. If what he says sounds like a cop (police words, procedure, badges, "evidence", "backup", etc.), get suspicious and set "cover" to -1.' : ''}
The player's current goal: ${st ? TM.Game.text(st.text) : 'finish the chapter'}. If they seem lost, nudge them toward it in character.
Answer in 1–3 short sentences, simple words an 18-year-old reads fast, mild language only, stay in character, react to EXACTLY what they said.
Reply ONLY with JSON: {"reply":"...","cover":0}`;
  }
  async function online(id, hist) {
    const url = (TM.S.profile.settings.aiEndpoint || TM.CONFIG.aiEndpoint || '').trim(); if (!url) return null;
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 9000);
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ system: system(id), messages: hist.slice(-10) }), signal: ctl.signal });
      clearTimeout(to); if (!r.ok) return null; const j = await r.json();
      const txt = j.text || ''; const m = txt.match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : { reply: txt, cover: 0 };
      return { reply: String(o.reply || '').slice(0, 400), cover: o.cover === -1 ? -1 : 0 };
    } catch (e) { return null; }
  }
  T.has = (id) => !!TM.MINDS[id];
  T.open = (id, onEnd) => {
    const M = TM.MINDS[id], run = TM.S.run; run.chats = run.chats || {}; const hist = run.chats[id] = run.chats[id] || [];
    const spr = (TM.W.state.things.find((t) => t.id === id) || {}).spr;
    const ai = !!(TM.S.profile.settings.aiEndpoint || TM.CONFIG.aiEndpoint);
    const m = TM.UI.modal(`<div class="chat"><div class="kicker">💬 ASK ${U.esc(M.name.toUpperCase())} ANYTHING</div><div class="log" id="clog">${hist.slice(-6).map((h) => line(h.role, h.content)).join('') || `<div class="sys">Type a question or say anything. ${ai ? '' : '(offline mode)'}</div>`}</div>
      <div class="sugg">${['Tell me about yourself.', 'What do you know about the murders?', 'What should I do next?'].map((q) => `<button data-q="${q}">${q}</button>`).join('')}</div>
      <form id="cform"><input id="cin" maxlength="160" autocomplete="off" placeholder="Say something..."><button class="btn big" type="submit">SEND</button></form><button class="btn ghost" data-x>DONE TALKING</button></div>`, 'chatm');
    const log = m.querySelector('#clog'), inp = m.querySelector('#cin');
    function line(role, c) { return role === 'user' ? `<div class="me">${U.esc(c)}</div>` : `<div class="them"><b>${U.esc(M.name)}</b>${U.esc(c)}</div>`; }
    const send = async (text) => {
      text = text.trim(); if (!text) return; inp.value = ''; hist.push({ role: 'user', content: text }); log.insertAdjacentHTML('beforeend', line('user', text) + '<div class="them typing">…</div>'); log.scrollTop = 1e9;
      let res = await online(id, hist); if (!res) res = offline(id, text);
      log.querySelector('.typing') && log.querySelector('.typing').remove();
      hist.push({ role: 'assistant', content: res.reply }); log.insertAdjacentHTML('beforeend', line('assistant', res.reply)); log.scrollTop = 1e9; TM.Audio.play('blip');
      if (res.cover < 0) TM.Game.cover(-1);
      const talked = run.talkedTo = run.talkedTo || {}; talked[id] = (talked[id] || 0) + 1; if (Object.values(talked).filter((n) => n >= 2).length >= 5) TM.S.feat('chatty');
      TM.S.saveRun();
    };
    m.querySelector('#cform').onsubmit = (e) => { e.preventDefault(); send(inp.value); };
    m.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => send(b.dataset.q));
    m.querySelector('[data-x]').onclick = () => { TM.UI.close(); onEnd && onEnd(); };
    setTimeout(() => { if (!matchMedia('(pointer: coarse)').matches) inp.focus(); }, 50);
  };
  T.offline = offline;
  return T;
})();
