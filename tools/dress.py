"""CHRONOMANCER character builder.
Every character is the owner's 64px Male / Female pixel-art base template (paint-by-part GIFs):
each body part is a flat key colour, so we can dress it: clothing materials per part with
shading, 1px outline, limb separation by depth, then hair, face, hats, coats and props.
Custom animations (staff strikes, shotgun, cane, gauntlet casts) are built from the template
poses with props posed per frame from the hand positions.

usage: python3 tools/dress.py <gif dir> <out sprite dir> [ids]"""
import sys, os, json, colorsys, math
from PIL import Image, ImageSequence

GIF, OUT = sys.argv[1], sys.argv[2]
ONLY = sys.argv[3].split(',') if len(sys.argv) > 3 else None
FW, FH = 112, 96          # common frame for every animation
H = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
INK = (16, 12, 20)

# ---------------------------------------------------------------- template part keys
KEYS = {
    '#d77bba': 'head', '#99e650': 'torso', '#6abe2f': 'chest',
    '#3e3e74': 'nUA', '#fbf235': 'nFA', '#639bff': 'nHand', '#5b6ee2': 'nHand',
    '#8a6f2f': 'fUA', '#76428a': 'fFA', '#eec39a': 'fHand',
    '#df7124': 'pelvis',
    '#ac3131': 'nThigh', '#8f974a': 'nShin', '#daa066': 'nFoot',
    '#36946e': 'fThigh', '#5fcde5': 'fShin', '#663830': 'fFoot', '#8f563a': 'fFoot',
}
KEYS = {H(k): v for k, v in KEYS.items()}
# the short (kid) template: 48px strips, six parts — arms and legs are one colour each
SKEYS = {H('#24aed6'): 'head', H('#fff02b'): 'torso', H('#e45c5f'): 'nUA', H('#82211d'): 'fUA', H('#a6cc34'): 'nThigh', H('#518822'): 'fThigh'}
SANIMS = {'idle': 'Idle/character_idle-', 'walk': 'Walk/character_walk', 'attack': 'Jump/character_jump', 'attack2': 'Run/character_run',
          'hurt': 'Land/character_land', 'dash': 'Roll/character_roll', 'crouch': 'Crouch-Idle/character_crouch-idle', 'death': 'Roll/character_roll'}
DEPTH = {'fHand': 0, 'fFA': 0, 'fUA': 0, 'fFoot': 1, 'fShin': 1, 'fThigh': 1, 'pelvis': 2, 'torso': 3, 'chest': 3,
         'nThigh': 4, 'nShin': 4, 'nFoot': 4, 'head': 5, 'nUA': 6, 'nFA': 6, 'nHand': 6}
FAR = {'fHand', 'fFA', 'fUA', 'fFoot', 'fShin', 'fThigh'}

ANIMS = {   # name: (female gif, male gif, skip frames)
    'idle': ('Female_Pixel_Art_Base_Template_64px_Idle', 'Male_Pixel_Art_Base_Template_64px_Idle'),
    'walk': ('Female Pixel Art Base Template_walk', 'Male_Pixel_Art_Base_Template_64px_walk'),
    'attack': ('Female Pixel Art Base Template_jab', 'Male_Pixel_Art_Base_Template_64px_jab'),
    'attack2': ('Female Pixel Art Base Template_jump', 'Male_Pixel_Art_Base_Template_64px_uppercut'),
    'hurt': ('Female Pixel Art Base Template_hurt', 'Male_Pixel_Art_Base_Template_64px_hurt'),
    'dash': ('Female Pixel Art Base Template_dash', 'Male_Pixel_Art_Base_Template_64px_Dash'),
    'crouch': ('Female Pixel Art Base Template_crouch', 'Male_Pixel_Art_Base_Template_64px_crouch'),
    'death': ('Female Pixel Art Base Template_death', 'Male_Pixel_Art_Base_Template_64px_Death'),
}


def find_gif(name):
    for root, _, files in os.walk(GIF):
        for f in files:
            if f[:-4] == name: return os.path.join(root, f)
    raise FileNotFoundError(name)


def load(sex, anim):
    if sex == 's':
        p = None
        for root, _, files in os.walk(GIF):
            for f in files:
                if os.path.join(root, f).endswith(SANIMS[anim] + '.png'): p = os.path.join(root, f)
        strip = Image.open(p).convert('RGBA'); n = strip.width // 48
        out = []
        for i in range(n):
            fr = strip.crop((i * 48, 0, i * 48 + 48, 48)); out.append(fr.resize((96, 96), Image.NEAREST))   # 2x: same pixel size as adults
        return out
    name = ANIMS[anim][0 if sex == 'f' else 1]
    frs = [x.convert('RGBA') for x in ImageSequence.Iterator(Image.open(find_gif(name)))]
    # drop the pure-white flash frame (the game flashes on its own)
    frs = [f for f in frs if not all(p[:3] == (255, 255, 255) for p in f.getdata() if p[3])]
    return frs


# idle frame 0 sets where the feet sit in the common frame
_REF = {}
def ref(sex):
    if sex not in _REF: _REF[sex] = load(sex, 'idle')[0].getbbox()
    return _REF[sex]


def place(sex, frames):
    """paste each template frame into the common FWxFH frame, aligned on frame 0's standing pose"""
    r = ref(sex); b0 = frames[0].getbbox()
    out = []
    for f in frames:
        c = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
        ox = (FW // 2 - (r[2] - r[0]) // 2 - r[0]) + (r[0] - b0[0])
        oy = (FH - 2 - r[3]) + (r[3] - b0[3])
        c.paste(f, (ox, oy)); out.append(c)
    return out


# ---------------------------------------------------------------- colour helpers
def tone(c, dv=0.0, ds=0.0, dh=0.0):
    r, g, b = [x / 255 for x in c]; h, s, v = colorsys.rgb_to_hsv(r, g, b)
    r, g, b = colorsys.hsv_to_rgb((h + dh) % 1, max(0, min(1, s + ds)), max(0, min(1, v + dv)))
    return (round(r * 255), round(g * 255), round(b * 255))
def shade(c): return tone(c, -.2, .06, -.01)
def light(c): return tone(c, .13, -.06, .01)


class Fr:
    def __init__(s, img, short=False):
        s.im = img; s.px = img.load(); s.part = {}; K = SKEYS if short else KEYS
        for y in range(FH):
            for x in range(FW):
                p = s.px[x, y]
                if p[3] and p[:3] in K: s.part[(x, y)] = K[p[:3]]
        if short:   # give the one-colour limbs hands and shoes: the far end of each limb
            for arm, hand, fa in (('nUA', 'nHand', 'nFA'), ('fUA', 'fHand', 'fFA')):
                P = [p for p, k in s.part.items() if k == arm]
                if not P: continue
                ys = sorted({y for _, y in P}); cut = ys[int(len(ys) * .45)]
                low = max(P, key=lambda p: p[1])
                for p in P:
                    if p[1] > cut: s.part[p] = fa
                    if abs(p[0] - low[0]) + abs(p[1] - low[1]) <= 2: s.part[p] = hand
            for leg, shin, foot in (('nThigh', 'nShin', 'nFoot'), ('fThigh', 'fShin', 'fFoot')):
                P = [p for p, k in s.part.items() if k == leg]
                if not P: continue
                y1 = max(y for _, y in P); y0 = min(y for _, y in P)
                for p in P:
                    if p[1] >= y1 - 3: s.part[p] = foot
                    elif p[1] > (y0 + y1) / 2: s.part[p] = shin
            T = [p for p, k in s.part.items() if k == 'torso']
            if T:
                ty1 = max(y for _, y in T)
                for p in T:
                    if p[1] >= ty1 - 3: s.part[p] = 'pelvis'
        s.short = short
        s.box = {}
        for (x, y), k in s.part.items():
            b = s.box.setdefault(k, [x, y, x, y]); b[0] = min(b[0], x); b[1] = min(b[1], y); b[2] = max(b[2], x); b[3] = max(b[3], y)
        s.col = {}       # final colours
    def pts(s, *ks): return [p for p, k in s.part.items() if k in ks]
    def cen(s, *ks):
        P = s.pts(*ks)
        if not P: return None
        return (sum(p[0] for p in P) / len(P), sum(p[1] for p in P) / len(P))
    def setc(s, x, y, c, over=True):
        if not (0 <= x < FW and 0 <= y < FH): return
        if not over and (x, y) in s.col: return
        s.col[(x, y)] = c
    def rect(s, x, y, w, h, c, over=True):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.setc(xx, yy, c, over)
    def line(s, x0, y0, x1, y1, c, w=1, over=True):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n + 1):
            t = i / max(1, n); x = round(x0 + (x1 - x0) * t); y = round(y0 + (y1 - y0) * t)
            for k in range(w): s.setc(x, y + k, c, over)


# ---------------------------------------------------------------- dressing
def dress(fr, spec):
    """spec['mat'][part] = base colour. far parts darker. shade right/bottom edges, light left/top,
    a separation line where a nearer part covers a farther one."""
    mat = spec['mat']
    for (x, y), k in fr.part.items():
        base = H(mat.get(k, mat.get('_', '#888888')))
        if k in FAR: base = tone(base, -.12)
        nb = lambda dx, dy: fr.part.get((x + dx, y + dy))
        c = base
        r_, b_, l_, t_ = nb(1, 0), nb(0, 1), nb(-1, 0), nb(0, -1)
        if r_ != k or b_ != k: c = shade(base)
        elif (l_ != k or t_ != k) and k not in FAR: c = light(base)
        # nearer limb in front: dark seam on this side
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            o = nb(dx, dy)
            if o and o != k and DEPTH.get(o, 0) > DEPTH.get(k, 0) + 0 and not same_mat(mat, o, k): c = tone(base, -.32); break
        fr.col[(x, y)] = c


def same_mat(mat, a, b):
    return mat.get(a) == mat.get(b) and DEPTH[a] // 10 == DEPTH[b] // 10 and not ({a, b} & FAR and not {a, b} <= FAR)


def head_box(fr):
    return fr.box.get('head')


def facefeat(fr, spec):
    """hair, face, ears, beard, hats — on the pink head blob, character faces right"""
    hb = head_box(fr)
    if not hb: return
    x0, y0, x1, y1 = hb; w = x1 - x0 + 1; h = y1 - y0 + 1
    skin = H(spec['mat']['head']); sk2 = shade(skin)
    hair = H(spec.get('hair', '#2a2018')); hs = shade(hair); hl = light(hair)
    style = spec.get('hairstyle', 'short')
    ey = y0 + round(h * .45); ex = x1 - 1
    upright = h >= w   # lying-down frames (death) get no fine features
    # face
    if upright:
        if spec.get('mask_blue'): pass
        fr.setc(ex, ey, H(spec.get('eye', '#1a1418')))
        if spec.get('glasses'): fr.setc(ex - 1, ey, H('#cfe8ff')); fr.setc(ex, ey - 1, H('#e8f4ff')); fr.setc(ex - 2, ey, INK)
        fr.setc(x1 + 1, ey + 1, skin)                          # nose
        fr.setc(x1 + 1, ey + 2, sk2)
        fr.setc(ex, y0 + round(h * .78), tone(skin, -.28, .1))   # mouth
        if spec.get('lips'): fr.setc(ex, y0 + round(h * .78), H(spec['lips'])); fr.setc(ex - 1, y0 + round(h * .78), H(spec['lips']))
        fr.setc(x0 + w // 2 - 1, ey + 1, sk2)                  # ear
        brow = H(spec.get('brow', spec.get('hair', '#2a2018')))
        if style not in ('bald',) or spec.get('brow'): fr.setc(ex, ey - 2, brow); fr.setc(ex - 1, ey - 2, brow)
    # hair
    def cap(rows, back_rows, colr=hair):
        for y in range(y0 - 1, y0 + rows):
            for x in range(x0, x1 + 1):
                if (x, y) in fr.part and fr.part[(x, y)] == 'head' or y == y0 - 1 and x0 < x < x1: fr.setc(x, y, colr if y > y0 - 1 else hs)
        for y in range(y0, y0 + back_rows):
            for x in range(x0, x0 + max(2, w // 2 - 1)):
                if fr.part.get((x, y)) == 'head': fr.setc(x, y, colr)
        for x in range(x0 + 1, x1, 2): fr.setc(x, y0, hl)
    if style == 'buzz': cap(2, 4)
    elif style == 'short': cap(3, 6)
    elif style == 'slick': cap(3, 6); [fr.setc(x, y0 + 1, hl) for x in range(x0 + 1, x1 - 1)]
    elif style == 'bob':
        cap(3, h); [fr.setc(x0 - 1, y, hair) for y in range(y0 + 1, y1 + 1)]; fr.setc(x1, y0 + 3, hair); fr.setc(x1 - 1, y0 + 3, hair)
    elif style == 'curlybun':
        cap(3, h - 2)
        for y in range(y0 + 1, y1 - 1): fr.setc(x0 - 1, y, hair if y % 2 else hs)
        bx, by = x0 - 2, y0 - 2
        for (dx, dy) in ((0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1), (3, 1), (1, -1), (2, -1), (0, 2), (1, 2), (2, 2)): fr.setc(bx + dx, by + dy, hair if (dx + dy) % 2 else hl)
        for x in range(x0, x1, 2): fr.setc(x, y0 - 1, hl)
    elif style == 'ponytail':
        cap(3, h - 3); fr.setc(x0 - 1, y0 + 2, H(spec.get('scrunchie', '#ff5ab0')))
        for i in range(6): fr.setc(x0 - 2 - (i > 3), y0 + 2 + i, hair if i % 2 else hs)
    elif style == 'long':
        cap(3, h)
        for y in range(y0 + 1, y1 + 8): fr.setc(x0 - 1, y, hair); fr.setc(x0, y, hair if y > y1 else fr.col.get((x0, y), hair))
    elif style == 'waves':
        cap(3, h - 1); [fr.setc(x0 - 1, y, hl if y % 2 else hair) for y in range(y0, y1 + 3)]; fr.setc(x1, y0 + 2, hair)
    elif style == 'gray': cap(2, 5)
    elif style == 'bunold':
        cap(2, 4); fr.rect(x0 - 2, y0 - 1, 3, 3, hair); fr.setc(x0 - 1, y0, hl)
    # beard / mustache
    if upright and spec.get('beard'):
        bc = H(spec['beard'])
        for y in range(y0 + round(h * .62), y1 + 2):
            for x in range(x0 + w // 2, x1 + 2):
                if fr.part.get((x, y)) == 'head' or (x == x1 + 1 and y < y1): fr.setc(x, y, bc if (x + y) % 3 else shade(bc))
    if upright and spec.get('mustache'):
        fr.setc(ex, y0 + round(h * .7), H(spec['mustache'])); fr.setc(x1 + 1, y0 + round(h * .7), H(spec['mustache'])); fr.setc(ex - 1, y0 + round(h * .7), H(spec['mustache']))
    # hats
    hat = spec.get('hat')
    if hat:
        hc = H(spec.get('hatcol', '#2a2a30')); hd = shade(hc); hl2 = light(hc)
        if hat == 'fedora':
            fr.rect(x0 - 2, y0 + 1, w + 4, 1, hd); fr.rect(x0, y0 - 3, w, 4, hc); fr.rect(x0, y0 - 1, w, 1, H(spec.get('band', '#1a1210'))); fr.rect(x0 + 1, y0 - 3, w - 2, 1, hl2)
        elif hat == 'tophat':
            fr.rect(x0 - 1, y0 + 1, w + 2, 1, hd); fr.rect(x0, y0 - 6, w, 7, hc); fr.rect(x0, y0 - 1, w, 1, H('#5a1020')); fr.rect(x0 + 1, y0 - 6, 1, 6, hl2)
        elif hat == 'cap':      # trucker / baseball, brim forward
            fr.rect(x0, y0 - 2, w, 3, hc); fr.rect(x1 - 1, y0 + 1, 4, 1, hd); fr.rect(x0 + 1, y0 - 2, w - 3, 1, hl2)
        elif hat == 'flatcap':
            fr.rect(x0, y0 - 1, w, 2, hc); fr.rect(x1 - 1, y0 + 1, 3, 1, hd)
        elif hat == 'beanie':
            fr.rect(x0, y0 - 2, w, 4, hc); fr.rect(x0, y0 + 1, w, 1, hd); fr.rect(x0 + 1, y0 - 2, w - 2, 1, hl2)
        elif hat == 'helmet':   # custodian helmet
            fr.rect(x0, y0 - 4, w, 6, hc); fr.rect(x0 + 1, y0 - 6, w - 2, 2, hc); fr.rect(x0 + 2, y0 - 7, w - 4, 1, hc); fr.rect(x0 - 1, y0 + 1, w + 2, 1, hd); fr.setc(x0 + w // 2, y0 - 3, H('#d8b040'))
        elif hat == 'maidcap':
            fr.rect(x0, y0 - 1, w, 2, H('#ecebe6')); fr.setc(x0 + 1, y0 - 2, H('#ecebe6')); fr.setc(x1 - 1, y0 - 2, H('#ecebe6'))
        elif hat == 'deputy':
            fr.rect(x0 - 2, y0 + 1, w + 4, 1, hd); fr.rect(x0, y0 - 3, w, 4, hc); fr.setc(x0 + w // 2, y0 - 2, H('#e8d060'))


def wear(fr, spec):
    """clothing that goes past the body: coat skirts, long skirts, scarves, belts, collars, studs"""
    tb = fr.box.get('torso'); pb = fr.box.get('pelvis')
    if not tb or not pb: return
    x0, y0, x1, y1 = tb
    skirt = spec.get('skirt')        # (colour, rows below pelvis, flare)
    if skirt:
        col, rows, flare = H(skirt[0]), skirt[1], skirt[2]
        top = pb[1] + 2
        legs = fr.pts('nThigh', 'fThigh', 'nShin', 'fShin', 'pelvis')
        for y in range(top, pb[3] + rows):
            xs = [x for (x, yy) in legs if yy == y] + [x for (x, yy) in fr.pts('pelvis') if yy == y]
            if not xs: continue
            k = (y - top) / max(1, rows); a, b = min(xs) - round(flare * k), max(xs) + round(flare * k)
            a = max(a, pb[0] - 1 - round(flare * k)); b = min(b, pb[2] + 1 + round(flare * k))
            mid = (a + b) // 2 + 1
            for x in range(a, b + 1): fr.setc(x, y, shade(col) if x in (a, b) or (skirt[3:] and skirt[3] == 'split' and x == mid) else (light(col) if x == a + 1 else col))
            fr.setc(a - 1, y, INK); fr.setc(b + 1, y, INK)
        hem = pb[3] + rows
        xs = [x for (x, y) in fr.col if y == hem - 1]
        if xs: fr.rect(min(xs), hem, max(xs) - min(xs) + 1, 1, INK)
    if spec.get('belt'):
        bc = H(spec['belt']); y = pb[1] + 1
        xs = [x for (x, yy) in fr.pts('pelvis') if yy == y]
        if xs:
            for x in range(min(xs), max(xs) + 1): fr.setc(x, y, bc); fr.setc(x, y + 1, shade(bc))
            if spec.get('pouches'):
                for x in range(min(xs), max(xs) + 1, 3): fr.setc(x, y + 1, H('#5d6e45')); fr.setc(x, y + 2, H('#4a5a3a')); fr.setc(x, y, H('#e0752d'))
            else: fr.setc((min(xs) + max(xs)) // 2 + 1, y, H(spec.get('buckle', '#c8b060')))
    if spec.get('scarf'):
        sc = H(spec['scarf'])
        for y in range(y0, y0 + 3):
            for x in range(x0 + 2, x1):
                if fr.part.get((x, y)) in ('torso', 'chest'): fr.setc(x, y, sc if y < y0 + 2 else shade(sc))
        fr.setc(x1 - 1, y0 + 3, sc); fr.setc(x1 - 1, y0 + 4, shade(sc)); fr.setc(x1 - 2, y0 + 5, sc)
    if spec.get('collar'):
        cc = H(spec['collar'])
        fr.setc(x1 - 2, y0, cc); fr.setc(x1 - 3, y0 + 1, cc); fr.setc(x1 - 1, y0 + 1, cc)
    if spec.get('tie'):
        t = H(spec['tie']); [fr.setc(x1 - 2, y, t) for y in range(y0 + 1, y0 + 7)]
    if spec.get('chain'):
        y = y0 + round((y1 - y0) * .62)
        for x in range(x0 + 3, x1 - 1): fr.setc(x, y + (1 if x0 + 5 < x < x1 - 3 else 0), H('#e0b040'))
    if spec.get('studs'):
        for x in range(x0 + 1, x1, 2): fr.setc(x, y0, H('#d0d6de'))
        for y in range(y0 + 1, y0 + 6, 2): fr.setc(x0, y, H('#d0d6de'))
    if spec.get('patch'):
        px, py = x1 - 4, y0 + 4
        for (dx, dy, c) in ((0, 0, '#40c0f0'), (1, 0, '#6df0b0'), (0, 1, '#f0a040'), (1, 1, '#f0a040'), (-1, 1, '#40c0f0'), (2, 1, '#40c0f0'), (0, 2, '#f0a040')): fr.setc(px + dx, py + dy, H(c))
    if spec.get('stripes'):
        sc = H(spec['stripes'])
        for (x, y) in fr.pts('torso', 'chest', 'nUA', 'fUA'):
            if y % 3 == 0: fr.setc(x, y, sc)
    if spec.get('buttons'):
        for y in range(y0 + 2, y1, 3): fr.setc(x1 - 2, y, H(spec['buttons']))
    if spec.get('apron'):
        for (x, y) in fr.pts('torso', 'chest', 'pelvis'):
            if x > x0 + 3 and y > y0 + 4: fr.setc(x, y, H('#ecebe6') if x < x1 else H('#c8c6c0'))
    if spec.get('vest'):
        vc = H(spec['vest'])
        for (x, y) in fr.pts('torso', 'chest'):
            if not (x1 - 3 <= x <= x1 - 1 and y < y0 + 7): fr.setc(x, y, vc if (x, y) not in fr.col or fr.col[(x, y)] != INK else INK)
    if spec.get('suspenders'):
        sc = H(spec['suspenders'])
        for y in range(y0, y1 + 1): fr.setc(x0 + 3, y, sc); fr.setc(x1 - 3, y, sc)
    if spec.get('sash'):
        y = pb[1]; xs = [x for (x, yy) in fr.col if yy == y and fr.part.get((x, yy)) in ('pelvis', 'torso', 'chest')]
        if xs: fr.rect(min(xs), y, max(xs) - min(xs) + 1, 1, H(spec['sash']))
    if spec.get('lapels'):
        lc = H(spec['lapels'])
        for i in range(6): fr.setc(x1 - 2 - i // 2, y0 + 1 + i, lc)
    if spec.get('hood_down'):
        hc = H(spec['hood_down']); fr.rect(x0 - 1, y0 - 1, 5, 3, hc); fr.rect(x0 - 1, y0 - 1, 5, 1, light(hc))
    if spec.get('omnibox'):     # the living box on a T-Mancer's back
        bx, by = x0 - 4, y0 + 2
        fr.rect(bx - 1, by - 1, 6, 9, INK); fr.rect(bx, by, 4, 7, H('#4a4e58')); fr.rect(bx, by, 4, 1, H('#6f7887'))
        fr.setc(bx + 1, by + 3, H('#ff2a8d')); fr.setc(bx + 2, by + 3, H('#d6338a'))
    if spec.get('headphones'):
        hb = fr.box.get('head')
        if hb: fr.rect(x0 + 2, y0 - 1, (x1 - x0) - 3, 1, H('#3a3a40')); fr.setc(x1 - 2, y0, H('#e05030'))


def gauntlets(fr, spec):
    """clock gauntlets: a white dial on each wrist, magenta hand"""
    for fa, hand in (('fFA', 'fHand'), ('nFA', 'nHand')):
        P = fr.pts(fa); Hd = fr.cen(hand)
        if not P or not Hd: continue
        # the forearm pixel closest to the hand
        x, y = min(P, key=lambda p: (p[0] - Hd[0]) ** 2 + (p[1] - Hd[1]) ** 2)
        if getattr(fr, 'short', False): fr.rect(x - 1, y - 1, 4, 4, INK); fr.rect(x, y, 2, 2, H('#f0f0f4')); fr.setc(x, y, INK); fr.setc(x + 1, y + 1, H('#ff2a8d')); continue
        fr.rect(x - 2, y - 2, 5, 5, INK); fr.rect(x - 1, y - 1, 3, 3, H('#f0f0f4')); fr.setc(x, y, INK); fr.setc(x, y - 1, INK); fr.setc(x + 1, y, H('#ff2a8d'))


def outline(fr):
    body = set(fr.col)
    for (x, y) in list(body):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in body and 0 <= q[0] < FW and 0 <= q[1] < FH: fr.col.setdefault(q, INK)


def render(fr):
    im = Image.new('RGBA', (FW, FH), (0, 0, 0, 0)); px = im.load()
    for (x, y), c in fr.col.items():
        if 0 <= x < FW and 0 <= y < FH: px[x, y] = c + (255,)
    return im


# ---------------------------------------------------------------- props
def hand(fr, which='n'):
    return fr.cen(which + 'Hand') or fr.cen(which + 'FA')


def staff(fr, anim, i, n, meta_an):
    """the Hush Crook Mk III: a long rifle-built staff, gripped in the near hand. idle/walk: held at
    the ready, angled up. attack: thrust forward. attack2: swung up. returns the tip (head mount)."""
    h = hand(fr, 'n')
    if not h: return None
    hx, hy = h
    if anim == 'attack': ang = -0.12 + 0.05 * i
    elif anim == 'attack2': ang = -0.4 - 0.3 * min(i, 3)
    elif anim in ('hurt', 'death', 'crouch', 'dash'): ang = 0.25
    else: ang = -0.55
    dx, dy = math.cos(ang), math.sin(ang)
    f1, f2 = 26, 30
    ax, ay = hx - dx * f2, hy - dy * f2; bx, by = hx + dx * f1, hy + dy * f1
    fr.line(ax, ay + 1, bx, by + 1, INK, 1, over=False)
    fr.line(ax, ay - 1, bx, by - 1, INK, 1, over=False)
    fr.line(ax, ay, bx, by, H('#9aa4b2'))
    fr.line(ax + dx * 4, ay + dy * 4 + 1, bx - dx * 6, by - dy * 6 + 1, H('#565c68'))
    # pile-spike foot at the back end, drum + grip at the hand
    fr.setc(round(ax - dx), round(ay - dy), H('#c8d0d8'))
    mx, my = round(hx - dx * 6), round(hy - dy * 6)
    fr.rect(mx - 2, my - 2, 5, 5, INK); fr.rect(mx - 1, my - 1, 3, 3, H('#5a606c')); fr.setc(mx, my, H('#e0752d'))
    fr.rect(round(hx - dx * 12) - 1, round(hy - dy * 12), 3, 2, H('#4a5a3a'))     # seatbelt sling
    return [round(bx), round(by), round(ang * 100) / 100]


def shotgun(fr, i, n, recoil=True):
    """pump shotgun, two hands, pointing forward from the near hand"""
    h = hand(fr, 'n')
    if not h: return None
    hx, hy = h
    L = 17
    fr.rect(hx - 9, hy - 1, 9, 3, INK); fr.rect(hx - 8, hy, 7, 1, H('#6a3a1e'))         # stock
    fr.rect(hx - 1, hy - 2, L + 2, 4, INK); fr.rect(hx, hy - 1, L, 1, H('#9aa4b2')); fr.rect(hx, hy, L, 1, H('#40444e'))
    fr.rect(hx + 5, hy + 1, 5, 2, INK); fr.rect(hx + 6, hy + 1, 3, 1, H('#6a3a1e'))       # pump
    if i == n - 2 or (n <= 3 and i == n - 1):                                            # muzzle flash
        mx = hx + L + 1
        for (dx, dy, c) in ((0, 0, '#fff6c0'), (1, 0, '#ffd23a'), (2, 0, '#ff8a2a'), (1, -1, '#ffd23a'), (1, 1, '#ffd23a'), (3, 0, '#ff5a1a'), (2, -2, '#ff8a2a'), (2, 2, '#ff8a2a')):
            fr.setc(mx + dx, hy + dy, H(c))
    return [hx + L, hy]


def pistol(fr):
    h = hand(fr, 'n')
    if not h: return
    hx, hy = h
    fr.rect(hx - 1, hy - 2, 8, 3, INK); fr.rect(hx, hy - 1, 6, 1, H('#4a4d58')); fr.rect(hx, hy - 1, 2, 3, INK); fr.setc(hx + 3, hy - 1, H('#9aa4b2'))


def cane(fr, anim, i):
    h = hand(fr, 'n')
    if not h: return
    hx, hy = h
    feet = max(y for (x, y) in fr.part) if fr.part else hy + 30
    if anim in ('attack', 'attack2'): fr.line(hx - 4, hy + 2, hx + 16, hy - 2, H('#3a2414'), 2)
    else: fr.line(hx + 1, hy, hx + 3, feet, H('#3a2414'), 1); fr.line(hx + 2, hy, hx + 4, feet, H('#24160c'), 1)
    fr.rect(hx - 1, hy - 1, 3, 2, H('#c8d0d8'))


def nightstick(fr):
    h = hand(fr, 'n')
    if h: fr.line(h[0], h[1], h[0] + 3, h[1] + 9, H('#2a1a10'), 1)


# ---------------------------------------------------------------- the cast (from the references)
SK = {'pale': '#f0d2be', 'fair': '#e6b89c', 'light': '#dcaa88', 'tan': '#c99a6a', 'olive': '#b88a5e', 'brown': '#8f5c3c', 'dark': '#6e4430', 'deep': '#4e3020', 'blue': '#7ab8e8'}
def M(skin, top, sleeve=None, hands=None, pants='#2a2e3a', boots='#1a1a20', shins=None, chest=None, upper=None, far_hand=None):
    return {'head': SK.get(skin, skin), 'torso': top, 'chest': chest or top, 'nUA': upper or top, 'fUA': upper or top,
            'nFA': sleeve or top, 'fFA': sleeve or top, 'nHand': hands or SK.get(skin, skin), 'fHand': far_hand or hands or SK.get(skin, skin),
            'pelvis': pants, 'nThigh': pants, 'fThigh': pants, 'nShin': shins or pants, 'fShin': shins or pants, 'nFoot': boots, 'fFoot': boots}

GANG = dict(studs=1, patch=1, collar='#3a3c46')
CAST = {
    # ---- heroes
    'augie': dict(sex='f', scale=1.3, mat=M('light', '#8a9199', '#7d848c', None, '#1c1c21', '#121216', shins='#121216'), hair='#3a2418', hairstyle='curlybun',
                  belt='#4a5a3a', pouches=1, goggles=1, hood_down='#6c737c', skirt=('#8a9199', 4, 1, 'split'), prop='staff'),
    'jester': dict(sex='m', scale=1.28, mat=M('dark', '#26272e', '#26272e', None, '#252a36', '#141418', shins='#252a36'), hair='#e8cf6a', hairstyle='buzz', brow='#141416', **GANG, prop='fists'),
    # ---- the Chronomancer (sheet 04: age 13, long sleeves, clock gauntlets, OmniBox, mask on = blue)
    'mina': dict(sex='s', scale=1.42, mat=M('blue', '#6f7887', '#22232a', '#7ab8e8', '#22232a', '#16171c', chest='#6f7887'), hair='#141418', hairstyle='bob',
                 glasses=1, skirt=('#6f7887', 7, 2), sash='#d6338a', omnibox=1, gauntlets=1, mask_blue=1),
    # ---- the Mantis crew (all wear the same thing)
    'marquis': dict(sex='m', scale=1.3, wide=1.24, mat=M('deep', '#26272e', '#26272e', None, '#252a36', '#141418'), hair='#120c08', hairstyle='buzz', beard='#120c08', **GANG),
    'crew1': dict(sex='m', scale=1.26, mat=M('fair', '#26272e', '#26272e', None, '#252a36', '#141418'), hair='#7a3a1a', hairstyle='short', **GANG),
    'crew2': dict(sex='m', scale=1.27, wide=1.05, mat=M('tan', '#26272e', '#26272e', None, '#252a36', '#141418'), hair='#0e0a08', hairstyle='slick', **GANG),
    'crew3': dict(sex='m', scale=1.22, mat=M('pale', '#26272e', '#26272e', None, '#252a36', '#141418'), hair='#e8e4dc', hairstyle='short', **GANG),
    # ---- the killer, in every era. Same burgundy scarf, same gold chain, same cane.
    'silas26': dict(sex='m', scale=1.27, mat=M('fair', '#3e4048', '#3e4048', None, '#2c2d33', '#1a1414'), hair='#b8b8c0', hairstyle='gray', beard='#a8a8b0', scarf='#7a1a2e', chain=1, skirt=('#3e4048', 6, 1, 'split'), prop='cane'),
    'silas86': dict(sex='m', scale=1.27, mat=M('fair', '#6a5036', '#6a5036', None, '#3a3020', '#2a1a10'), hair='#b8b8c0', hairstyle='gray', beard='#a8a8b0', scarf='#7a1a2e', chain=1, hat='flatcap', hatcol='#5a4a34', prop='cane'),
    'silas47': dict(sex='m', scale=1.27, mat=M('fair', '#4a4e58', '#4a4e58', None, '#30333a', '#141418'), hair='#b8b8c0', hairstyle='gray', beard='#a8a8b0', scarf='#7a1a2e', chain=1, skirt=('#4a4e58', 10, 2, 'split'), hat='fedora', hatcol='#3a3e46', prop='cane'),
    'silas88': dict(sex='m', scale=1.27, mat=M('fair', '#2a2422', '#2a2422', None, '#2e2a2a', '#141010'), hair='#b8b8c0', hairstyle='gray', beard='#a8a8b0', scarf='#7a1a2e', chain=1, skirt=('#2a2422', 11, 1, 'split'), hat='tophat', hatcol='#1a1616', prop='cane'),
    # ---- 2026
    'ruth': dict(sex='f', scale=1.18, mat=M('fair', '#7a6a9a', '#7a6a9a', None, '#5a5a62', '#3a3036'), hair='#dcdce2', hairstyle='bunold', skirt=('#5a5a62', 12, 2)),
    'hale': dict(sex='m', scale=1.3, wide=1.08, mat=M('fair', '#243052', '#243052', None, '#1c2236', '#141418'), hair='#9a9aa2', hairstyle='short', buttons='#d8c070', mustache='#8a8a92', belt='#141414'),
    'seung': dict(sex='m', scale=1.24, mat=M('light', '#e8e8ec', '#e8e8ec', None, '#2a2e3a', '#1a1a20'), hair='#141418', hairstyle='short', glasses=1, skirt=('#e8e8ec', 7, 1), tie='#3a5a8a'),
    'grunt': dict(sex='m', scale=1.27, mat=M('brown', '#a82a2a', '#a82a2a', None, '#2a3a5a', '#1a1a20'), hair='#141010', hairstyle='short', hat='beanie', hatcol='#1e1e24'),
    'cop': dict(sex='m', scale=1.27, mat=M('tan', '#1e2a4a', '#1e2a4a', None, '#141c34', '#101014'), hair='#2a1a10', hairstyle='short', buttons='#d8c070', belt='#141414', hat='deputy', hatcol='#141c34'),
    # ---- 1986
    'ivy': dict(sex='f', scale=1.16, mat=M('fair', '#2a8a96', '#2a8a96', None, '#3a5a8a', '#e8e8e8', chest='#2a8a96'), hair='#5a3420', hairstyle='ponytail', scrunchie='#ff5ab0', headphones=1, collar='#e05a9a'),
    'rosa': dict(sex='s', scale=1.36, mat=M('olive', '#6a44a0', '#6a44a0', None, '#3a5a8a', '#e04040'), hair='#141010', hairstyle='long', collar='#ffd040'),
    'danny': dict(sex='s', scale=1.38, mat=M('fair', '#c8483a', '#c8483a', None, '#3a5a8a', '#e8e8e8'), hair='#6a4224', hairstyle='short', stripes='#e8e0d0'),
    'leon': dict(sex='s', scale=1.34, mat=M('dark', '#d8b040', '#d8b040', None, '#3a3a44', '#e8e8e8'), hair='#141010', hairstyle='buzz', hat='cap', hatcol='#c83a3a'),
    'ray': dict(sex='m', scale=1.3, wide=1.08, mat=M('light', '#9a3030', '#9a3030', None, '#2a3a5a', '#3a2a1a'), hair='#6a4a2a', hairstyle='short', mustache='#5a3a1a', stripes='#4a1414', hat='cap', hatcol='#3a5a3a'),
    'deputy': dict(sex='m', scale=1.28, mat=M('tan', '#c8b07a', '#c8b07a', None, '#4a4030', '#2a1e14'), hair='#3a2a1a', hairstyle='short', hat='deputy', hatcol='#6a5a3a', buttons='#8a6a2a', belt='#3a2a1a'),
    # ---- 1947
    'vera': dict(sex='f', scale=1.22, mat=M('fair', '#4a2a6a', '#4a2a6a', None, '#4a2a6a', '#1e1028', chest='#5a347e'), hair='#e2c27a', hairstyle='waves', lips='#c81e3a', skirt=('#4a2a6a', 22, 4)),
    'calloway': dict(sex='m', scale=1.29, mat=M('light', '#6a3a22', '#6a3a22', None, '#3a2a1e', '#1a1210'), hair='#2a1a10', hairstyle='short', hat='fedora', hatcol='#4a3020', tie='#a8202a', collar='#d8ccb0', skirt=('#6a3a22', 12, 2, 'split'), prop='pistol'),
    'vinnie': dict(sex='m', scale=1.3, wide=1.1, mat=M('olive', '#30303a', '#30303a', None, '#26262e', '#0e0e10'), hair='#0e0a0a', hairstyle='slick', mustache='#0e0a0a', stripes='#383842', collar='#e8e8e8', tie='#7a1a2a'),
    'goon': dict(sex='m', scale=1.32, wide=1.12, mat=M('fair', '#bab4a8', '#bab4a8', None, '#3a2e24', '#1a1210'), hair='#2a1a10', hairstyle='short', suspenders='#3a2a20', hat='flatcap', hatcol='#3a3a40'),
    'barkeep': dict(sex='m', scale=1.27, mat=M('light', '#e8e4dc', '#e8e4dc', None, '#1e1e24', '#0e0e10'), hair='#1a1210', hairstyle='slick', vest='#1e1e24', tie='#141414', mustache='#1a1210'),
    # ---- 1888
    'agnes': dict(sex='f', scale=1.18, mat=M('fair', '#1e1e24', '#1e1e24', None, '#1e1e24', '#141418'), hair='#6a4a30', hairstyle='bunold', hat='maidcap', apron=1, skirt=('#1e1e24', 18, 2), collar='#ecebe6'),
    'foreman': dict(sex='m', scale=1.32, wide=1.1, mat=M('light', '#c8c0b0', '#c8c0b0', None, '#3a3028', '#1a1410'), hair='#3a2a1e', hairstyle='short', vest='#5a4030', mustache='#3a2a1e', hat='flatcap', hatcol='#4a3a2a'),
    'constable': dict(sex='m', scale=1.3, mat=M('fair', '#1e2a4a', '#1e2a4a', None, '#1a2036', '#0e0e12'), hair='#2a1e16', hairstyle='short', buttons='#d8b040', belt='#141414', hat='helmet', hatcol='#1a2240', mustache='#2a1e16', skirt=('#1e2a4a', 6, 1), prop='stick'),
    'bernboy': dict(sex='s', scale=1.28, mat=M('pale', '#e8e4dc', '#e8e4dc', None, '#e8e4dc', '#c8b8a8'), hair='#8a6a4a', hairstyle='short', skirt=('#e8e4dc', 9, 1)),
}


def build(cid, spec):
    sex = spec['sex']; sheets = []; meta_anims = {}
    for r, anim in enumerate(ANIMS):
        frames = place(sex, load(sex, anim))
        row = []; anc = []
        for i, f in enumerate(frames):
            if spec.get('wide'):
                bb = f.getbbox(); part = f.crop(bb); nw = round(part.width * spec['wide'])
                part = part.resize((nw, part.height), Image.NEAREST); f = Image.new('RGBA', (FW, FH)); f.paste(part, ((bb[0] + bb[2]) // 2 - nw // 2, bb[1]))
            fr = Fr(f, sex == 's')
            dress(fr, spec); wear(fr, spec)
            if spec.get('gauntlets'): gauntlets(fr, spec)
            facefeat(fr, spec)
            if spec.get('goggles'):
                hb = fr.box.get('head')
                if hb and hb[3] - hb[1] >= hb[2] - hb[0]:
                    gy = hb[1] + 2; fr.rect(hb[0], gy, hb[2] - hb[0] + 1, 1, H('#2a1d16')); fr.rect(hb[2] - 2, gy - 1, 3, 2, INK); fr.setc(hb[2] - 1, gy - 1, H('#c07a30'))
            a = {}
            p = spec.get('prop')
            if p == 'staff': a['tip'] = staff(fr, anim, i, len(frames), a)
            elif p == 'pistol': pistol(fr)
            elif p == 'cane': cane(fr, anim, i)
            elif p == 'stick': nightstick(fr)
            hb = fr.box.get('head')
            if hb: a['face'] = [(hb[0] + hb[2]) / 2 + 1, (hb[1] + hb[3]) / 2, hb[2] - hb[0] + 1]
            h = hand(fr, 'n')
            if h: a['hand'] = [round(h[0]), round(h[1])]
            outline(fr)
            row.append(render(fr)); anc.append(a)
        sheets.append(row)
        bb = row[0].getbbox() or (0, 0, FW, FH)
        meta_anims[anim] = dict(r=r, n=len(row), b=[bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]], an=anc)
    # Jester's shotgun row: the jab poses with a pump shotgun
    if cid in ('jester',):
        frames = place(sex, load(sex, 'attack')); row = []; anc = []
        for i, f in enumerate(frames):
            fr = Fr(f); dress(fr, spec); wear(fr, spec); facefeat(fr, spec)
            a = {'muzzle': shotgun(fr, i, len(frames))}
            hb = fr.box.get('head')
            if hb: a['face'] = [(hb[0] + hb[2]) / 2 + 1, (hb[1] + hb[3]) / 2, hb[2] - hb[0] + 1]
            outline(fr); row.append(render(fr)); anc.append(a)
        sheets.append(row); bb = row[0].getbbox()
        meta_anims['shoot'] = dict(r=len(sheets) - 1, n=len(row), b=[bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]], an=anc)
    cols = max(len(r) for r in sheets)
    sheet = Image.new('RGBA', (cols * FW, len(sheets) * FH), (0, 0, 0, 0))
    for r, row in enumerate(sheets):
        for i, im in enumerate(row): sheet.paste(im, (i * FW, r * FH))
    sheet.save(os.path.join(OUT, cid + '.png'), optimize=True)
    # the standing box drives feet + label height in the game
    idle_b = meta_anims['idle']['b']
    for k, v in meta_anims.items():
        if k not in ('death',): v['b'] = [v['b'][0], idle_b[1], v['b'][2], idle_b[3]] if k != 'idle' else v['b']
        v['b'][3] = (idle_b[1] + idle_b[3]) - v['b'][1]
    return dict(fw=FW, fh=FH, anims=meta_anims, scale=spec['scale'], face='right')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for cid, spec in CAST.items():
        if ONLY and cid not in ONLY: continue
        meta[cid] = build(cid, spec)
    json.dump(meta, open(os.path.join(OUT, '_dress_meta.json'), 'w'))
    print('dressed', len(meta))
