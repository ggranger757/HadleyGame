"""Build Technomancers character sheets from Step Quest's CraftPix sprites.
Each character = a Step Quest base sheet + a palette map (+ optional overlays).
Usage: python3 tools/build_sprites.py <Step-Quest dir> <out dir>"""
import json, sys, os, colorsys
sys.path.insert(0, os.path.dirname(__file__)); import costume
from PIL import Image, ImageDraw
SQ, OUT = sys.argv[1], sys.argv[2]
src = open(os.path.join(SQ, 'js/assets.js')).read()
J = json.loads(src[src.index('{', src.index('ASSETS')): src.rstrip().rstrip(';').rindex('}') + 1])
H = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def gray(c, tint=(0, 4, 10)):  # fallback for unmapped colors: cool desaturated
    r, g, b = c[:3]; l = int(.3 * r + .59 * g + .11 * b); return tuple(min(255, l + t) for t in tint)

CHARS = {
 'augie': dict(base='scavenger', scale=1.15, map={
   '#73172d': '#5a3424', '#b4202a': '#7a4a30', '#3b1725': '#3a2016',
   '#5b3138': '#8a9199', '#422433': '#5f666e', '#71413b': '#15151a',
   '#322b28': '#1c1c21', '#221c1a': '#0f0f12',
   '#bb7547': '#6f7887', '#dba463': '#9aa4b2', '#f4d29c': '#c8d0d8'}),
 'jester': dict(base='boss', scale=1.0, map={
   '#fca570': '#7a4c30', '#bd6a62': '#52321e', '#4f342f': '#26272e', '#2d1b1e': '#131418',
   '#7d3833': '#52321e', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2',
   '#d6a851': '#efd982', '#b47538': '#c9a24a'}),
 'marquis': dict(base='boss', scale=1.06, map={'#fca570': '#4e3020', '#bd6a62': '#331e12', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#331e12', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#141414', '#b47538': '#0a0a0a'}),
 'crew1': dict(base='boss', scale=1.0, map={'#fca570': '#e6b89c', '#bd6a62': '#b9846a', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#b9846a', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#7a2a1a', '#b47538': '#561c10'}),
 'crew2': dict(base='boss', scale=1.02, map={'#fca570': '#c99a6a', '#bd6a62': '#9a6c44', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#9a6c44', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#1a1410', '#b47538': '#0e0a08'}),
 'crew3': dict(base='boss', scale=.98, map={'#fca570': '#f0c8a8', '#bd6a62': '#c89a80', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#c89a80', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#d8d0c0', '#b47538': '#a8a090'}),
 'grunt': dict(base='marauder', scale=1.0, map={'#73172d': '#2a3a5a', '#3b1725': '#1f2c45', '#dba463': '#c4c4c4'}),
 'calloway': dict(base='fixer', scale=1.0, map={'#464762': '#fe00fe', '#1b2447': '#fd00fd', '#5e718e': '#fe00fe', '#14121d': '#fd00fd'}),
 'seung': dict(base='courier', scale=.98, map={'#27412d': '#2a3a5a', '#61a53f': '#4a6aa0'}),
 'hale': dict(base='boss', scale=1.08, map={'#4f342f': '#2a3555', '#2d1b1e': '#1c2236', '#d6a851': '#a8a8a8', '#b47538': '#7a7a7a', '#73172d': '#e6ecf0', '#3b1725': '#d8c070'}),
 'cop': dict(base='courier', scale=1.05, map={'#cbc6c1': '#2a3555', '#27412d': '#1c2236', '#61a53f': '#d8c070', '#464762': '#1c2236', '#1b2447': '#141a2a'}),
 'mina': dict(base='scavenger', scale=.84, map={
   '#73172d': '#2a2a32', '#b4202a': '#3a3a44', '#3b1725': '#141418',
   '#5b3138': '#6f7887', '#422433': '#565c68', '#71413b': '#4a4e58', '#322b28': '#22232a', '#221c1a': '#16171c',
   '#bb7547': '#fc00fc', '#dba463': '#fc00fc', '#f4d29c': '#fc00fc',
   '#e9b5a3': '#7ab8e8', '#ba756a': '#5a90c0', '#8e5252': '#4a7ab0'}),
 'silas88': dict(base='marauder', scale=1.0, hair=['#2a2422', '#463c36'], map={
   '#141013': '#2a2422', '#322b28': '#463c36', '#221c1a': '#2a2422', '#73172d': '#7a1a2e', '#3b1725': '#4a0e1a', '#bb7547': '#9a2a3e',
   '#242234': '#2e2a2a', '#403353': '#4a4440', '#e9b5a3': '#e6c0ac', '#ba756a': '#c09080', '#8e5252': '#9a6a5e',
   '#dba463': '#fc00fc', '#71413b': '#fc00fc'}),
 'silas47': dict(base='marauder', scale=1.0, hair=['#3a3e46', '#5a5f6a'], map={
   '#141013': '#3a3e46', '#322b28': '#5a5f6a', '#221c1a': '#3a3e46', '#73172d': '#7a1a2e', '#3b1725': '#4a0e1a', '#bb7547': '#9a2a3e',
   '#242234': '#30333a', '#403353': '#4a4e58', '#e9b5a3': '#e6c0ac', '#ba756a': '#c09080', '#8e5252': '#9a6a5e',
   '#dba463': '#fc00fc', '#71413b': '#fc00fc'}),
 'silas86': dict(base='marauder', scale=1.0, hair=['#5a4430', '#7a6044'], map={
   '#141013': '#5a4430', '#322b28': '#7a6044', '#221c1a': '#5a4430', '#73172d': '#7a1a2e', '#3b1725': '#4a0e1a', '#bb7547': '#9a2a3e',
   '#242234': '#3a3020', '#403353': '#5a4a34', '#e9b5a3': '#e6c0ac', '#ba756a': '#c09080', '#8e5252': '#9a6a5e',
   '#dba463': '#fc00fc', '#71413b': '#fc00fc'}),
 'silas26': dict(base='marauder', scale=1.0, hair=['#2e3036', '#4a4c54'], map={
   '#141013': '#2e3036', '#322b28': '#4a4c54', '#221c1a': '#2e3036', '#73172d': '#7a1a2e', '#3b1725': '#4a0e1a', '#bb7547': '#9a2a3e',
   '#242234': '#26272c', '#403353': '#3e4048', '#e9b5a3': '#e6c0ac', '#ba756a': '#c09080', '#8e5252': '#9a6a5e',
   '#dba463': '#fc00fc', '#71413b': '#fc00fc'}),
 'ivy': dict(base='kunoichi', scale=.9, map={
   '#291d2b': '#1f6f7a', '#3d2936': '#2a8a96', '#52333f': '#3aa6b0', '#4f1d4c': '#1a5a62', '#283540': '#1a5a62', '#2c354d': '#1a5a62',
   '#ad2f45': '#e0508a', '#781d4f': '#a0306a', '#3b7d4f': '#3a5a8a', '#2f5753': '#2a4068', '#1b1f21': '#2a4068',
   '#3b2027': '#5a3420', '#21181b': '#3a2014', '#7d3833': '#4a2a18', '#ffae70': '#e8e0c8', '#ab5130': '#8a7a5a', '#8f4d57': '#6a5a4a', '#cc2f7b': '#ff5ab0'}),
 'rosa': dict(base='kunoichi', scale=.76, map={
   '#291d2b': '#4a2a6a', '#3d2936': '#5a3a8a', '#52333f': '#7a52aa', '#4f1d4c': '#3a2050', '#283540': '#3a2050', '#2c354d': '#3a2050',
   '#ad2f45': '#ffd040', '#781d4f': '#c09020', '#3b7d4f': '#3a5a8a', '#2f5753': '#2a4068', '#1b1f21': '#2a4068',
   '#ffc2a1': '#c8946a', '#bd6a62': '#9a6a48', '#ffae70': '#d84040', '#ab5130': '#902a2a', '#8f4d57': '#6a1a1a', '#cc2f7b': '#ffd040'}),
 'agnes': dict(base='kunoichi', scale=.92, map={
   '#291d2b': '#1e1e24', '#3d2936': '#2a2a32', '#52333f': '#3a3a44', '#4f1d4c': '#1e1e24', '#283540': '#1e1e24', '#2c354d': '#1e1e24',
   '#ad2f45': '#e8e4dc', '#781d4f': '#c8c4bc', '#3b7d4f': '#1e1e24', '#2f5753': '#141418', '#1b1f21': '#141418',
   '#3b2027': '#6a4a30', '#21181b': '#4a3220', '#7d3833': '#3a2a1e', '#cc2f7b': '#e8e4dc'}),
 'ruth': dict(base='storm', scale=.9, map={
   '#f4d29c': '#d8d8dc', '#a08662': '#a0a0a8', '#73172d': '#7a6a9a', '#ad2f45': '#9a8ab8', '#460414': '#4a3e66', '#723535': '#5a4e7a',
   '#71413b': '#5a5a62', '#3b2027': '#3a3a42', '#422433': '#46464e', '#ab5130': '#6a6a72', '#7d3833': '#4a4a52'}),
 'vera': dict(base='storm', scale=.96, map={
   '#73172d': '#4a2a6a', '#ad2f45': '#7a4aa8', '#460414': '#1e1028', '#723535': '#3a2450',
   '#71413b': '#2a1a3a', '#3b2027': '#120a1e', '#422433': '#1e1028', '#ab5130': '#c8a0e8', '#7d3833': '#2a1a3a'}),
 'danny': dict(base='courier', scale=.76, map={'#cbc6c1': '#c8483a', '#464762': '#3a5a8a', '#1b2447': '#2a4068', '#14121d': '#2a4068', '#242234': '#3a5a8a', '#2d1b1e': '#5a3a22', '#27412d': '#c8483a', '#61a53f': '#e8e0d0'}),
 'leon': dict(base='courier', scale=.74, map={'#cbc6c1': '#d8b040', '#464762': '#2a2a30', '#1b2447': '#1a1a20', '#14121d': '#3a3a44', '#242234': '#4a4a54', '#fca570': '#7a4c30', '#bd6a62': '#52321e', '#2d1b1e': '#141010', '#27412d': '#d8b040', '#61a53f': '#d8b040'}),
 'ray': dict(base='courier', scale=1.05, map={'#cbc6c1': '#9a3030', '#464762': '#3a2a20', '#1b2447': '#2a1e16', '#14121d': '#2a3a5a', '#242234': '#3a4a6a', '#2d1b1e': '#6a4a2a', '#27412d': '#5a1a1a', '#61a53f': '#5a1a1a', '#fca570': '#e8a878', '#bd6a62': '#b87858'}),
 'deputy': dict(base='courier', scale=1.03, map={'#cbc6c1': '#c8b07a', '#464762': '#5a4a30', '#1b2447': '#3a3020', '#14121d': '#3a3a2a', '#242234': '#4a4a38', '#27412d': '#d8c050', '#61a53f': '#e8d870'}),
 'barkeep': dict(base='courier', scale=1.02, map={'#27412d': '#141414', '#61a53f': '#2a2a2a', '#464762': '#5a1a1a', '#1b2447': '#3a1010', '#2d1b1e': '#1a1210'}),
 'goon': dict(base='courier', scale=1.08, map={'#cbc6c1': '#bab4a8', '#464762': '#3a2a20', '#1b2447': '#2a1e16', '#14121d': '#3a2e24', '#242234': '#4a3e30', '#2d1b1e': '#1a1210', '#27412d': '#5a1a1a', '#61a53f': '#7a2a2a'}),
 'vinnie': dict(base='boss', scale=1.06, map={'#4f342f': '#3a3a44', '#2d1b1e': '#26262e', '#7d3833': '#b87858', '#73172d': '#d8d8d8', '#3b1725': '#a8a8a8', '#d6a851': '#1a1414', '#b47538': '#0e0a0a', '#b4202a': '#c8a040'}),
 'foreman': dict(base='boss', scale=1.1, map={'#4f342f': '#5a4030', '#2d1b1e': '#3a281e', '#73172d': '#c8c0b0', '#3b1725': '#9a9284', '#d6a851': '#3a2a1e', '#b47538': '#2a1e14', '#b4202a': '#8a7a5a'}),
 'constable': dict(base='courier', scale=1.05, map={'#cbc6c1': '#2a3a5e', '#464762': '#1a2440', '#1b2447': '#141c34', '#14121d': '#1a2036', '#242234': '#242a40', '#27412d': '#c8b040', '#61a53f': '#e8d060', '#2d1b1e': '#2a1e16'}),
 'bernboy': dict(base='courier', scale=.66, map={'#cbc6c1': '#e8e4dc', '#464762': '#5a4a3a', '#1b2447': '#3a3028', '#14121d': '#3a342e', '#242234': '#4a443e', '#2d1b1e': '#8a6a4a', '#fca570': '#f0d0c0', '#bd6a62': '#c8a090', '#27412d': '#e8e4dc', '#61a53f': '#e8e4dc', '#612721': '#3a2a1e'}),
}
meta = {}
for cid, c in CHARS.items():
    grp = 'creatures' if c.get('creature') else 'avatars'
    a = J[grp][c['base']]; fs = a['fs']
    p = os.path.join(SQ, 'assets', 'cr' if c.get('creature') else 'av', c['base'] + '.png')
    im = Image.open(p).convert('RGBA'); px = im.load()
    M = {H(k): H(v) for k, v in c['map'].items()}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, al = px[x, y]
            if al == 0: continue
            k = (r, g, b)
            if k in M: px[x, y] = M[k] + (al,)
            elif c.get('fallback') == 'gray': px[x, y] = gray(k) + (al,)
    anims = {k: dict(v) for k, v in a['anims'].items()}
    if not c.get('creature'): costume.apply(cid, im, anims, fs, fs, c)
    anch = dict(costume.ANCH)
    if c.get('belt'):  # Augie's all-around canvas pouch belt: olive band, pouches, orange tabs, GG charm
        pants = {H('#1c1c21'), H('#0f0f12')}; shirt = {H('#8a9199'), H('#5f666e')}
        d = ImageDraw.Draw(im)
        for an in anims.values():
            for f in range(an['n']):
                ox, oy = f * fs, an['r'] * fs
                # waist: walk up from the feet through the legs until the shirt starts
                wy = None; seen_leg = False
                for y in range(oy + fs - 1, oy + 10, -1):
                    row = [px[x, y][:3] for x in range(ox, ox + fs) if px[x, y][3]]
                    np_ = sum(1 for q in row if q in pants); ns = sum(1 for q in row if q in shirt)
                    if np_ >= 2: seen_leg = True
                    if seen_leg and ns > np_: wy = y + 1; break
                if wy is None: continue
                xs = [x for x in range(ox, ox + fs) if px[x, wy - 2][3] and px[x, wy - 2][:3] in shirt]
                if len(xs) < 3: xs = [x for x in range(ox, ox + fs) if px[x, wy][3] and px[x, wy][:3] in pants]
                if not xs: continue
                x0, x1 = min(xs) - 2, max(xs) + 2
                d.rectangle([x0, wy - 4, x1, wy + 1], fill=H('#4a5a3a'))
                for x in range(x0, x1 + 1, 3):
                    d.rectangle([x, wy - 4, x + 1, wy + 1], fill=H('#5d6e45')); px[x, wy - 3] = H('#e0752d') + (255,)
                d.rectangle([x0, wy + 1, x1, wy + 1], fill=H('#2b3a52'))
                d.rectangle([x0 - 1, wy - 4, x0 - 1, wy + 1], fill=H('#1d2418')); d.rectangle([x1 + 1, wy - 4, x1 + 1, wy + 1], fill=H('#1d2418'))
                px[x1 + 1, wy + 2] = H('#d8d8d8') + (255,); px[x1 + 1, wy + 3] = H('#d8d8d8') + (255,)
    if c.get('patch'):  # Jester: mantis-shrimp crew patch on the jacket shoulder + studs
        jack = {H('#26272e'), H('#131418')}
        for an in anims.values():
            for f in range(an['n']):
                ox, oy = f * fs, an['r'] * fs; b = an['b']
                ys = range(oy + b[1] + 12, oy + b[1] + 20)
                done = False
                for y in ys:
                    for x in range(ox + b[0], ox + b[0] + b[2]):
                        if px[x, y][3] and px[x, y][:3] in jack and px[x + 1, y][:3] in jack and px[x + 2, y][:3] in jack and px[x, y + 1][:3] in jack:
                            px[x, y] = H('#40c0f0') + (255,); px[x + 1, y] = H('#6df0b0') + (255,); px[x + 2, y] = H('#f0a040') + (255,); px[x + 1, y + 1] = H('#f0a040') + (255,); done = True; break
                    if done: break
    if c.get('stretch'):
        st = c['stretch']; nh = int(fs * st)
        out = Image.new('RGBA', (im.width, nh * (im.height // fs)))
        for r in range(im.height // fs):
            row = im.crop((0, r * fs, im.width, (r + 1) * fs)).resize((im.width, nh), Image.NEAREST); out.paste(row, (0, r * nh))
        im = out
        for an in anims.values(): b = an['b']; an['b'] = [b[0], int(b[1] * st), b[2], int(b[3] * st)]
        meta[cid] = dict(fw=fs, fh=nh)
    else: meta[cid] = dict(fw=fs, fh=fs)
    im.save(os.path.join(OUT, cid + '.png'), optimize=True)
    face = a.get('face', 'left' if c.get('creature') else 'right')
    meta[cid].update(anims={k: dict(r=v['r'], n=v['n'], b=v['b']) for k, v in anims.items()}, scale=c['scale'] * a.get('scale', 1) if not c.get('creature') else c['scale'], face=face)
    if anch:
        for k, v in anims.items():
            meta[cid]['anims'][k]['an'] = [anch.get((i * fs, v['r'] * fs)) for i in range(v['n'])]
meta['bernard'] = costume.bernard_ritual(SQ, J, os.path.join(OUT, 'bernard.png'))
open(os.path.join(OUT, '..', '..', 'js', '01-sprites.js'), 'w').write('/* generated by tools/build_sprites.py — do not edit */\nwindow.TM = window.TM || {};\nTM.SPR = ' + json.dumps(meta) + ';\n')
print('built', len(meta))
