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
 'holo': dict(base='wanderer', scale=1.0, fallback='gray', map={
   '#271f1b': '#4a4e58', '#171819': '#2d3142', '#14121d': '#23262f', '#333941': '#6f7887', '#242234': '#3a3e47',
   '#422433': '#8a1f5a', '#3b1725': '#5a1240', '#71413b': '#565c68', '#b28b78': '#5a90c0', '#e9b5a3': '#7ab8e8',
   '#8e5252': '#4a7ab0', '#f1f2ff': '#ffd0ea', '#8aa1f6': '#ff2a8d', '#c9d4fd': '#ff7bd5', '#bb7547': '#6f7887',
   '#d6a851': '#d6338a', '#282c3c': '#3a3e47', '#363c44': '#565c68', '#181c19': '#2a2d34', '#000000': '#000000', '#050403': '#050403'}),
 'chrono': dict(base='kunoichi', scale=.86, map={
   '#ffc2a1': '#7ab8e8', '#bd6a62': '#5a90c0',
   '#291d2b': '#4a4e58', '#3d2936': '#5a606c', '#52333f': '#6f7887', '#4f1d4c': '#40444e', '#283540': '#3a3e47', '#2c354d': '#3a3e47',
   '#3b7d4f': '#22232a', '#2f5753': '#16171c', '#1b1f21': '#16171c',
   '#3b2027': '#141418', '#21181b': '#0c0c0f', '#7d3833': '#1d1e24',
   '#ffae70': '#c8d0d8', '#ab5130': '#6f7887', '#8f4d57': '#6f7887',
   '#ad2f45': '#d6338a', '#781d4f': '#8a1f5a', '#cc2f7b': '#ff2a8d', '#dfe0e8': '#cfe8ff'}),
 'nano': dict(base='marauder', scale=1.02, map={
   '#141013': '#2d3142', '#322b28': '#565c68', '#221c1a': '#2d3142', '#73172d': '#4a4e58', '#3b1725': '#3a3e47',
   '#242234': '#4a4e58', '#403353': '#565c68', '#bb7547': '#d6338a',
   '#e9b5a3': '#7ab8e8', '#ba756a': '#5a90c0', '#8e5252': '#4a7ab0',
   '#dba463': '#fc00fc', '#71413b': '#fc00fc'}),
 'void': dict(base='outrider', scale=1.0, map={
   '#8e5252': '#22232a', '#422433': '#6f7887', '#3b1725': '#4a4e58', '#122020': '#3a3e47', '#24523b': '#565c68', '#333941': '#565c68',
   '#bb7547': '#2a2d34', '#71413b': '#1a1c22', '#5b3138': '#5a606c', '#403353': '#d6338a', '#ba756a': '#7ab8e8', '#221c1a': '#2a2d34', '#242234': '#4a4e58', '#141013': '#1a1c22'}),
 'bernard': dict(base='courier', scale=1.18, stretch=1.28, map={
   '#cbc6c1': '#7a7096', '#464762': '#2a2638', '#1b2447': '#211d2c', '#14121d': '#3b3550', '#242234': '#4c4562', '#282c3c': '#4c4562',
   '#fca570': '#8a80a8', '#bd6a62': '#6a6288', '#2d1b1e': '#fe01fe', '#0e0c0c': '#8a80a8', '#612721': '#1a1820', '#27412d': '#2a2638', '#61a53f': '#2a2638'}),
 'grunt': dict(base='marauder', scale=1.0, map={'#73172d': '#2a3a5a', '#3b1725': '#1f2c45', '#dba463': '#c4c4c4'}),
 'calloway': dict(base='fixer', scale=1.0, map={'#464762': '#fe00fe', '#1b2447': '#fd00fd', '#5e718e': '#fe00fe', '#14121d': '#fd00fd'}),
 'frank': dict(base='courier', scale=1.04, map={'#cbc6c1': '#5d6e45', '#27412d': '#3a3d48', '#61a53f': '#6f7887'}),
 'seung': dict(base='courier', scale=.98, map={'#27412d': '#2a3a5a', '#61a53f': '#4a6aa0'}),
 'carl': dict(base='courier', scale=1.0, map={'#cbc6c1': '#a09a6a', '#050403': '#050403', '#2d1b1e': '#7a7a7a', '#464762': '#4a4a52', '#1b2447': '#36363c', '#27412d': '#6a2a3a', '#61a53f': '#8a3a4a'}),
 'dez': dict(base='boss', scale=1.02, map={'#fca570': '#6a4430', '#bd6a62': '#4a2c1c', '#d6a851': '#1a1a1a', '#b47538': '#101010', '#4f342f': '#1e1e24', '#2d1b1e': '#121216', '#7d3833': '#4a2c1c', '#73172d': '#e6ecf0'}),
 'hale': dict(base='boss', scale=1.08, map={'#4f342f': '#2a3555', '#2d1b1e': '#1c2236', '#d6a851': '#a8a8a8', '#b47538': '#7a7a7a', '#73172d': '#e6ecf0', '#3b1725': '#d8c070'}),
 'marquis': dict(base='boss', scale=1.06, map={'#fca570': '#4e3020', '#bd6a62': '#331e12', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#331e12', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#141414', '#b47538': '#0a0a0a'}),
 'crew1': dict(base='boss', scale=1.0, map={'#fca570': '#e6b89c', '#bd6a62': '#b9846a', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#b9846a', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#7a2a1a', '#b47538': '#561c10'}),
 'crew2': dict(base='boss', scale=1.02, map={'#fca570': '#c99a6a', '#bd6a62': '#9a6c44', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#9a6c44', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#1a1410', '#b47538': '#0e0a08'}),
 'crew3': dict(base='boss', scale=.98, map={'#fca570': '#f0c8a8', '#bd6a62': '#c89a80', '#4f342f': '#26272e', '#2d1b1e': '#131418', '#7d3833': '#c89a80', '#73172d': '#2d3039', '#3b1725': '#1d1f26', '#b4202a': '#9aa4b2', '#d6a851': '#d8d0c0', '#b47538': '#a8a090'}),
 'dolores': dict(base='storm', scale=.98, map={'#71413b': '#5a4e5a', '#3b2027': '#3a2e3a', '#422433': '#4a3e4a', '#73172d': '#6a5a6a', '#ad2f45': '#7a6a7a', '#460414': '#3a2e3a',
   '#fff089': '#c8bcb4', '#f8c53a': '#9a8c84', '#a08662': '#6a5e58', '#8aa1f6': '#ff2a8d', '#ab2f45': '#7a6a7a', '#723535': '#4a3e4a', '#ab5130': '#5a4e5a', '#a95130': '#5a4e5a'}),
 'britt': dict(base='storm', scale=.95, map={'#71413b': '#4a2a4a', '#3b2027': '#2a1a2a', '#73172d': '#7a3a6a', '#ad2f45': '#a04a8a', '#460414': '#2a1a2a'}),
 'tee': dict(base='marauder', scale=.95, map={'#322b28': '#e8e8e8', '#221c1a': '#c8c8c8', '#73172d': '#2a2a2f'}),
 'cop': dict(base='courier', scale=1.05, map={'#cbc6c1': '#2a3555', '#27412d': '#1c2236', '#61a53f': '#d8c070', '#464762': '#1c2236', '#1b2447': '#141a2a'}),
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
    if not c.get('creature'): costume.apply(cid, im, anims, fs, fs, c['map'])
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
open(os.path.join(OUT, '..', '..', 'js', '01-sprites.js'), 'w').write('/* generated by tools/build_sprites.py — do not edit */\nwindow.TM = window.TM || {};\nTM.SPR = ' + json.dumps(meta) + ';\n')
print('built', len(meta))
