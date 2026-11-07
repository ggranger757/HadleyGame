/* =========================================================================
   TECHNOMANCERS — 06c-talk.js
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

TM.MINDS = {
  tee: { name: 'Tee', who: '19-year-old Mantis gang member who was shot with an aging gun and now looks 70. Scared, half-blind, tough-talking.',
    knows: 'A Saints kid shot him with a glowing gun; a masked person with a glowing blue face picked up what the kid dropped; he has a spiral burn on his arm.', hides: 'Nothing.',
    lines: { greet: 'Who\'s that? I can\'t see good no more.', lena: 'Never met her. But a dead girl and me getting old the same week? That ain\'t luck.', tech: 'The gun glowed. Like a spiral. I felt every birthday go by at once.', thursday: 'I was out cold half the week, man.', kill: 'The Saints did ME. I don\'t know about no girl.', aunt: 'Whose aunt? I don\'t know nobody\'s aunt.', thanks: 'Just find who did this to me.', insult: 'I\'m old, not deaf.', fallback: ['My head\'s all foggy. Ask me about the gun or the masked guy.', 'I don\'t know nothin\' about that. I know what that glowing gun did to me.'] } },
  calloway: { name: 'Det. Rhett Calloway', who: 'Former TV cop actor turned real detective. Dry, funny, sharper than people think.',
    knows: 'The body was moved; Dez\'s family owns the mansion; the Chief wants to blame Dez fast; masked people were in the east wing.', hides: 'He suspects the Chief is dirty but won\'t say it outright.',
    lines: { greet: 'Evening. Yes, it\'s me from the TV. No autographs at crime scenes.', lena: 'Lena Marsh. Twenty-three. Saving for art school. She deserved better than this house.', thursday: 'Thursday is the night everybody\'s lying about. Find out where she went after ten.', kill: 'I don\'t think she died here. Look at the blood and the floor.', chief: 'The Chief signs things fast. Fast isn\'t the same as right.', aunt: 'An aunt? Interesting. Families keep the worst secrets.', tech: 'Glowing masks in the east wing. I\'m an actor, not a ghostbuster.', thanks: 'Careful in there.', insult: 'I\'ve had worse reviews.', fallback: ['Six seasons of fake cases taught me one thing: follow what doesn\'t fit.', 'Good question. Wrong detective. Ask the evidence.'] } },
  frank: { name: 'Det. Frank Dabrowski', who: 'Gruff Baltimore detective, ex-Army, trying to fix his marriage, wants to get home by Sunday.',
    knows: 'Timecards are in the manager\'s office; Calloway thinks the body was moved.', hides: 'He cheated on his wife and is ashamed.',
    lines: { greet: 'Baltimore. You?', lena: 'Kid had a plan to get out. One ticket. That says a lot.', thursday: 'Everybody in this club has a Thursday story. Check the paper trail.', wife: 'I\'m getting home Sunday. I made a promise.', kill: 'Not the boyfriend. Too easy. Too dumb.', thanks: 'Don\'t mention it. Seriously, don\'t.', insult: 'Twenty-two years on the job, kid. Try harder.', fallback: ['Facts first, feelings later.', 'If someone lies, show them the proof. Works every time.'] } },
  dez: { name: 'Dez Okafor', who: 'Lena\'s boyfriend, bartender at the Pale Rider. Grieving, defensive, angry.',
    knows: 'He left work at 9:05 Thursday, argued with Lena at her place, left at 9:40 and she was alive; she feared her aunt would "finish her portrait".', hides: 'That he left work early — until shown the timecard.',
    lines: { greet: 'What do you want?', lena: 'She drew on everything. Napkins. My arm. She was gonna be somebody.', thursday: 'I worked the door. ...Mostly.', kill: 'I LOVED her. You think I could do that?', aunt: 'Her aunt Dolores creeped her out. Painted her over and over.', thanks: 'Just find who did it.', insult: 'Watch your mouth about me.', fallback: ['I don\'t wanna talk about that.', 'Ask me something that helps Lena.'] } },
  carl: { name: 'Carl Vintner', who: 'Creepy club regular obsessed with Lena. Self-pitying, defensive.',
    knows: 'He watched Lena\'s apartment Thursday and saw her get into an old wood-paneled station wagon with an older woman at 10:05.', hides: 'That he was outside her place — until shown the parking ticket.',
    lines: { greet: 'This is a private booth.', lena: 'She liked me. She just couldn\'t show it.', thursday: 'Home with my mother.', kill: 'I would NEVER hurt her!', car: 'Cars? I... I don\'t know anything about cars.', thanks: 'Tell them I\'m innocent.', insult: 'I tip well, you know.', fallback: ['I don\'t have to talk to you.', 'Why is everyone always picking on me?'] } },
  britt: { name: 'Britt Pruitt', who: 'Dancer who bullied Lena in high school; guilty and sad.',
    knows: 'Lena called Tuesday to forgive her; Lena\'s aunt picked her up every day in an ugly wood-paneled car.', hides: 'Nothing anymore.',
    lines: { greet: 'Hey. You\'re here about Lena.', lena: 'I was awful to her. She forgave me anyway.', aunt: 'That aunt picked her up every day in a wood-paneled car. Lena went pale every time.', car: 'An old wood-panel station wagon. Ugly thing.', thursday: 'I was dancing all night. Ask anyone.', thanks: 'Find out what happened. Please.', insult: 'I deserve that.', fallback: ['I wish I\'d been nicer to her.', 'I don\'t know. I really don\'t.'] } },
  seung: { name: 'Seung Lee', who: 'Nervous crime-lab tech, family man with two kids, honest.',
    knows: 'Frank keeps drawing a spiral; Calloway\'s tape is in the evidence boxes; the Chief keeps checking his safe.', hides: 'He\'s terrified of the Chief.',
    lines: { greet: 'Oh! You scared me. Keep your voice down.', chief: 'The Chief checks his safe like ten times a day. That\'s not normal.', tech: 'A spiral, over and over. Frank\'s trying to tell us something.', kids: 'I have two kids. I\'m doing this for them.', thanks: 'Just... be careful. Please.', insult: 'I\'m trying to help you!', fallback: ['I just work the lab. I check what\'s in the boxes.', 'Ask me about Frank\'s drawing, or the Chief.'] } },
  dolores: { name: 'Dolores Marsh', who: 'Lena\'s aunt, a painter. Calm, polite, chilling, believes great leaps need sacrifice.',
    knows: 'Everything — she did the experiment in her basement and drove Lena\'s body to the mansion.', hides: 'Everything, until confronted with proof.',
    lines: { greet: 'You\'re dripping on my floor.', lena: 'Lena was... special. She saw things.', thursday: 'I was home. Painting.', kill: 'What a terrible thing to say in someone\'s home.', car: 'I haven\'t driven in months.', tech: 'Science and art are the same thing, really.', thanks: 'You\'re welcome to leave.', insult: 'How rude.', fallback: ['Every great leap forward needs a sacrifice.', 'Some doors only open once.'] } },
  hale: { name: 'Chief Amos Hale', who: 'Corrupt police chief and secret novice technomancer; smug, untouchable.',
    knows: 'He sold weapons to the Saints; he ran Seung off the road.', hides: 'All of it. He admits nothing.',
    lines: { greet: 'Morning.', chief: 'I run a clean department.', tech: 'Masks? Magic? You should get some sleep.', kill: 'The murderer is in custody. Case closed.', thanks: 'Always happy to help the public.', insult: 'Careful. I\'ve got a long memory.', fallback: ['Prove it.', 'Go home. Raincaster\'s closed for the season.'] } },
  marquis: { name: 'Marquis', who: 'Leader of the Mantis gang. Big, calm, dangerous, protective of his people.', gang: true,
    knows: 'Someone sells the Saints guns that age people; Tee was hurt.', hides: 'Whether he suspects Jester.',
    lines: { greet: 'Talk.', tech: 'Those Saints guns made Tee an old man. Somebody\'s selling them.', thanks: 'Don\'t thank me. Earn it.', insult: 'Say that again. Slower.', fallback: ['I don\'t pay you to ask questions.', 'Find who\'s selling those guns.'] } },
  lookout: { name: 'Rico', who: 'Young Mantis lookout, jumpy, loyal, talks a lot.', gang: true, knows: 'Tee got shot by a Saint; a dead girl was found at the Hartwell place.', hides: 'Nothing.',
    lines: { greet: 'Yo.', lena: 'Dead girl at the Hartwell place. Creepy.', tech: 'Tee looks like my grandpa now. That ain\'t right.', fallback: ['I\'m just watching the street, J.', 'Marquis don\'t like questions.'] } },
  crewst: { name: 'Dre', who: 'Mantis enforcer, hot-headed.', gang: true, knows: 'A Saint with a weird gun is down the block.', hides: 'Nothing.', lines: { greet: 'What.', fallback: ['Let\'s go handle that Saint.', 'Talk less, J.'] } },
  crewb: { name: 'Ghost', who: 'Quiet Mantis member who watches everything.', gang: true, knows: 'Marquis is in a bad mood.', hides: 'Nothing.', lines: { greet: '...', fallback: ['...', 'Marquis is watching you, J.'] } },
};

TM.Talk = (() => {
  const U = TM.U; const T = {};
  const INTENT = [
    ['greet', /\b(hi|hey|hello|yo|sup|good (morning|evening))\b/],
    ['bye', /\b(bye|later|see ya|goodbye)\b/],
    ['thanks', /\b(thank|thx|appreciate)\b/],
    ['hint', /\b(help|hint|what (now|next|should)|stuck|where do i|what do i)\b/],
    ['insult', /\b(stupid|idiot|dumb|shut up|loser|ugly|liar)\b/],
    ['threat', /\b(i('| wi)ll (kill|hurt|shoot)|gun|knife|hit you|beat you)\b/],
    ['lena', /\b(lena|girl|victim|girlfriend|waitress|body|dead|her|she|love)\b/],
    ['thursday', /\b(thursday|alibi|where were you|that night|last night|9|ten|10)\b/],
    ['aunt', /\b(aunt|dolores|family|portrait|paint)\b/],
    ['car', /\b(car|wagon|drive|driving|station)\b/],
    ['kill', /\b(kill|killed|murder|who did|did you)\b/],
    ['tech', /\b(magic|technoman|mask|blue|glow|spiral|gun|weapon|arm|burn|shot|hurt|happened|old|age|aged)\b/],
    ['chief', /\b(chief|hale|police|cops?|precinct)\b/],
    ['wife', /\b(wife|married|home)\b/], ['kids', /\b(kids?|family|children)\b/],
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
    return `You are ${M.name}, a character in the pixel-art mystery game TECHNOMANCERS (Raincaster, Maryland, 1996). A woman named Lena Marsh was found dead in an abandoned mansion with glowing shapes on her skin and a perfect round hole through her. Strange people called technomancers do magic with machines.
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
      <div class="sugg">${['Where were you Thursday?', 'Tell me about Lena.', 'What should I do next?'].map((q) => `<button data-q="${q}">${q}</button>`).join('')}</div>
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
