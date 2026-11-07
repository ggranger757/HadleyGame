"""CHRONOMANCER backgrounds — hand-tuned procedural pixel art, seamless parallax layers.
RURAL NOIR: moonlit small town, back-road farmland, fog, power lines, a lone diner sign.
NEO NOIR:   rain-soaked city canyon, neon, steam, reflections on wet asphalt.
Every layer tiles horizontally (all drawing wraps at W). 480x270, ground line ~ y 232.
usage: python3 tools/bgpaint.py <out bg dir>"""
import sys, os, math, random
from PIL import Image

OUT = sys.argv[1]
W, HH = 480, 270
GROUND = 232
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
H = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


class L:
    def __init__(s, h=HH):
        s.im = Image.new('RGBA', (W, h), (0, 0, 0, 0)); s.px = s.im.load(); s.h = h
    def set(s, x, y, c, a=255):
        if 0 <= y < s.h:
            x %= W
            if a >= 255 or len(c) == 4: s.px[x, y] = (c[0], c[1], c[2], 255 if len(c) == 3 else c[3])
            else:
                o = s.px[x, y]
                if o[3] == 0: s.px[x, y] = (c[0], c[1], c[2], a)
                else:
                    t = a / 255; s.px[x, y] = (round(o[0] + (c[0] - o[0]) * t), round(o[1] + (c[1] - o[1]) * t), round(o[2] + (c[2] - o[2]) * t), max(o[3], a))
    def get(s, x, y): return s.px[x % W, y] if 0 <= y < s.h else (0, 0, 0, 0)
    def rect(s, x, y, w, h, c, a=255):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)): s.set(xx, yy, c, a)
    def dither(s, x, y, c1, c2, t):
        """ordered-dither between two colours, t in 0..1"""
        s.set(x, y, c2 if t * 16 > BAYER[y % 4][x % 4] + .5 else c1)
    def save(s, path): s.im.save(path, optimize=True)


def lerp(a, b, t): return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
def per(x, n, seed=0):   # periodic smooth noise over W
    return sum(math.sin((x / W) * math.tau * k + seed * (k + 1.7)) / k for k in range(1, n + 1))


def sky(lay, top, bot, y1, stars=0, seed=1, moon=None, cloud=None):
    r = random.Random(seed)
    for y in range(y1):
        t = y / max(1, y1 - 1); band = t * 6; lo = int(band); f = band - lo
        c1 = lerp(top, bot, lo / 6); c2 = lerp(top, bot, min(1, (lo + 1) / 6))
        for x in range(W): lay.dither(x, y, c1, c2, f)
    for _ in range(stars):
        x, y = r.randrange(W), r.randrange(int(y1 * .7)); lay.set(x, y, (200, 205, 230) if r.random() < .8 else (255, 240, 200))
        if r.random() < .08: lay.set(x + 1, y, (120, 125, 160)); lay.set(x - 1, y, (120, 125, 160))
    if moon:
        mx, my, mr, mc, halo = moon
        for y in range(my - mr * 4, my + mr * 4):
            for x in range(mx - mr * 4, mx + mr * 4):
                d = math.hypot(x - mx, y - my)
                if d <= mr:
                    shade = (x - mx + mr * .4) ** 2 + (y - my) ** 2 > (mr * .95) ** 2
                    lay.set(x, y, lerp(mc, (90, 96, 120), .35) if shade else mc)
                    if ((x * 7 + y * 13) % 23 == 0) and d < mr - 2: lay.set(x, y, lerp(mc, (150, 150, 170), .5))
                elif d < mr * 3.6:
                    t = 1 - (d - mr) / (mr * 2.6)
                    if t * 16 > BAYER[y % 4][x % 4] + 4: lay.set(x, y, halo, round(70 * t))
    if cloud:
        cc, ch, cy, n = cloud
        for k in range(n):
            cx = r.randrange(W); w = r.randrange(50, 130); hgt = r.randrange(6, 14); yy = cy + r.randrange(-20, 30)
            for x in range(-w // 2, w // 2):
                prof = math.sqrt(max(0, 1 - (2 * x / w) ** 2)) * hgt * (0.7 + 0.3 * math.sin(x * .2 + k))
                for y in range(int(-prof), int(prof * .35) + 1):
                    col = ch if y < -prof * .5 else cc
                    if abs(y) > prof * .75 and BAYER[(yy + y) % 4][(cx + x) % 4] > 8: continue
                    lay.set(cx + x, yy + y, col)


def ridge(lay, base, amp, col, seed, n=5, jag=0, top_col=None):
    for x in range(W):
        h = base - (per(x, n, seed) * amp + amp)
        if jag: h -= abs(math.sin(x * .9 + seed)) * jag * (1 if (x * 7 + seed) % 5 else 2)
        for y in range(int(h), lay.h): lay.set(x, y, col)
        if top_col: lay.set(x, int(h), top_col)


def pines(lay, base, col, rim, seed, dens=.35, hmin=10, hmax=26):
    r = random.Random(seed)
    for x in range(0, W, 3):
        if r.random() > dens: continue
        h = r.randrange(hmin, hmax); cx = x + r.randrange(3)
        for y in range(h):
            w = int((y / h) * (h * .32)) + (1 if y % 3 == 2 else 0)
            for dx in range(-w, w + 1): lay.set(cx + dx, base - h + y, col)
            if y > 2 and y % 3 == 0: lay.set(cx - w, base - h + y, rim)
        for y in range(3): lay.set(cx, base + y, col)
    for x in range(W):
        for y in range(base, lay.h): lay.set(x, y, col)


def text(lay, s, x, y, col, scale=1, glow=None):
    F = FONT
    cx = x
    for ch in s.upper():
        g = F.get(ch, F[' '])
        for j, row in enumerate(g):
            for i, b in enumerate(row):
                if b == '#':
                    for a in range(scale):
                        for c in range(scale): lay.set(cx + i * scale + a, y + j * scale + c, col)
        cx += (len(g[0]) + 1) * scale
    if glow:
        w = cx - x; hgt = 5 * scale
        for yy in range(y - 4, y + hgt + 4):
            for xx in range(x - 4, x + w + 3):
                if lay.get(xx, yy)[:3] != col and BAYER[yy % 4][xx % 4] < 5:
                    d = min(abs(yy - y), abs(yy - (y + hgt)), abs(xx - x), abs(xx - (x + w)))
                    lay.set(xx, yy, glow, 60)
    return cx - x


FONT = {}
_F = """A .#. #.# ### #.# #.#|B ##. #.# ##. #.# ##.|C .## #.. #.. #.. .##|D ##. #.# #.# #.# ##.|E ### #.. ##. #.. ###|F ### #.. ##. #.. #..|G .## #.. #.# #.# .##|H #.# #.# ### #.# #.#|I ### .#. .#. .#. ###|J ..# ..# ..# #.# .#.|K #.# #.# ##. #.# #.#|L #.. #.. #.. #.. ###|M #.# ### ### #.# #.#|N #.# ### ### ### #.#|O .#. #.# #.# #.# .#.|P ##. #.# ##. #.. #..|Q .#. #.# #.# ##. .##|R ##. #.# ##. #.# #.#|S .## #.. .#. ..# ##.|T ### .#. .#. .#. .#.|U #.# #.# #.# #.# ###|V #.# #.# #.# #.# .#.|W #.# #.# ### ### #.#|X #.# #.# .#. #.# #.#|Y #.# #.# .#. .#. .#.|Z ### ..# .#. #.. ###|0 ### #.# #.# #.# ###|1 .#. ##. .#. .#. ###|2 ##. ..# .#. #.. ###|3 ##. ..# .#. ..# ##.|4 #.# #.# ### ..# ..#|5 ### #.. ##. ..# ##.|6 .## #.. ### #.# ###|7 ### ..# .#. .#. .#.|8 ### #.# ### #.# ###|9 ### #.# ### ..# ##.|& .#. #.# .#. #.# .##|' .#. .#. ... ... ...|- ... ... ### ... ...|. ... ... ... ... .#.|  ... ... ... ... ..."""
for e in _F.split('|'):
    ch = e[0]; rows = e[2:].split(' ')
    FONT[ch] = rows
FONT[' '] = ['...'] * 5


def windows(lay, x, y, w, h, lit, dark, seed, p=.3, cols=None, ww=2, wh=3, gx=2, gy=3, blind=None):
    r = random.Random(seed)
    for yy in range(y, y + h - wh, wh + gy):
        for xx in range(x, x + w - ww, ww + gx):
            on = r.random() < p
            c = (r.choice(cols) if cols else lit) if on else dark
            lay.rect(xx, yy, ww, wh, c)
            if on and blind and r.random() < .4: lay.rect(xx, yy + 1, ww, 1, blind)
            if on and r.random() < .1: lay.set(xx, yy + wh - 1, (20, 16, 24))   # someone standing in the window


def lamp(lay, x, ground, col, glow, h=46):
    lay.rect(x, ground - h, 1, h, (14, 14, 20)); lay.rect(x, ground - h, 6, 1, (14, 14, 20)); lay.rect(x + 4, ground - h + 1, 3, 2, col)
    for y in range(ground - h + 3, ground):
        k = (y - (ground - h)) / h; w = int(2 + k * 14)
        for xx in range(x + 5 - w, x + 6 + w):
            if BAYER[y % 4][xx % 4] < 6 - k * 3: lay.set(xx, y, glow, 34)


def wires(lay, x0, x1, y0, sag, col):
    for x in range(x0, x1):
        t = (x - x0) / (x1 - x0); lay.set(x, int(y0 + sag * 4 * t * (1 - t)), col)


def pole(lay, x, ground, h, col):
    lay.rect(x, ground - h, 2, h, col); lay.rect(x - 5, ground - h + 3, 12, 1, col); lay.rect(x - 4, ground - h + 7, 10, 1, col)
    for dx in (-5, -1, 3, 6): lay.set(x + dx, ground - h + 2, (90, 90, 80))


def reflect(src, dst, y_line, darken, streaks=None, seed=3):
    """mirror everything above y_line into the wet ground below it, broken into ripples"""
    r = random.Random(seed)
    for y in range(y_line, dst.h):
        d = y - y_line; sy = y_line - 1 - d
        off = int(math.sin(y * .9) * (1 + d * .05))
        if (y % 3 == 0 and r.random() < .4): continue
        for x in range(W):
            c = src.get(x + off, sy)
            if c[3]: dst.set(x, y, lerp(c[:3], darken[0], darken[1] + min(.35, d * .012)), 255)


def ground_layer(lay, top, col, col2, line=None, rails=False):
    for y in range(top, lay.h):
        for x in range(W): lay.dither(x, y, col, col2, (y - top) / (lay.h - top))
    if line: lay.rect(0, top, W, 1, line)


# =================================================================== RURAL NOIR · TOWN (1986/1947 small town at night)
def rural_town(dst, era='86'):
    os.makedirs(dst, exist_ok=True)
    pal = dict(top=H('#05060f'), bot=H('#2a3048'), hill=H('#121626'), hill2=H('#0c0f1c'), tree=H('#090b14'), rim=H('#2a3350'),
               bld=H('#161824'), bld2=H('#1e2130'), edge=H('#3a4058'), lit=H('#f0c060'), dark=H('#0c0d14'), road=H('#15161e'), road2=H('#0f1016'))
    if era == '47': pal.update(top=H('#060606'), bot=H('#30302e'), lit=H('#e8d8a8'), rim=H('#4a4a48'), edge=H('#565654'))
    if era == '88': pal.update(top=H('#0a0e18'), bot=H('#5a6478'), lit=H('#f0b050'), hill=H('#3a4256'), hill2=H('#2a3040'), tree=H('#1a1e2a'), rim=H('#c8d0e0'))
    # l1 sky + moon + clouds
    l1 = L(); sky(l1, pal['top'], pal['bot'], GROUND, stars=120, seed=11, moon=(360, 52, 12, H('#e8e4d4'), H('#c8d0e8')), cloud=(H('#1c2032'), H('#2c3248'), 70, 7)); l1.save(f'{dst}/l1.png')
    # l2 far hills + water tower
    l2 = L(); ridge(l2, 168, 10, pal['hill'], 3, n=4, top_col=pal['rim'])
    tx = 120
    for y in range(120, 168): l2.rect(tx + 4 + (y > 150) * 0, y, 1, 1, (20, 22, 34)); l2.rect(tx + 20, y, 1, 1, (20, 22, 34))
    for k in range(3): l2.rect(tx + 4, 140 + k * 9, 17, 1, (20, 22, 34))
    l2.rect(tx, 104, 25, 18, pal['hill2']); l2.rect(tx + 2, 100, 21, 4, pal['hill2']); l2.rect(tx + 8, 96, 9, 4, pal['hill2']); l2.rect(tx, 104, 25, 1, pal['rim'])
    text(l2, 'RAINCASTER', tx + 1, 110, H('#5a6280')) if era != '88' else None
    for x in range(tx + 2, tx + 24, 4): l2.set(x, 121, H('#c03040') if (x // 4) % 2 else H('#202434'))
    l2.save(f'{dst}/l2.png')
    # l3 pines + barns + silo
    l3 = L(); pines(l3, 182, pal['tree'], pal['rim'], 7, dens=.55, hmin=14, hmax=34)
    for bx in (40, 300):
        l3.rect(bx, 164, 30, 18, pal['hill2']);
        for i in range(10): l3.rect(bx - 2 + i, 164 - i // 2, 34 - i * 2 if i < 8 else 18, 1, pal['hill2'])
        l3.rect(bx + 12, 172, 6, 10, (8, 8, 12)); l3.rect(bx + 4, 168, 3, 3, pal['lit'])
    l3.rect(260, 140, 10, 42, pal['hill2']); l3.rect(259, 136, 12, 4, pal['hill2']); l3.rect(260, 140, 1, 42, pal['rim'])
    l3.save(f'{dst}/l3.png')
    # l4 main street: low false-front storefronts, gabled houses, gaps with trees, one roadside sign
    l4 = L(); r = random.Random(5 if era == '86' else 8 if era == '47' else 12); x = 4
    lineup = {'86': [('shop', 'DINER', H('#ff4a6a')), ('gap',), ('house',), ('shop', 'HARDWARE', None), ('gas', 'GAS', H('#40d0ff')), ('gap',), ('shop', 'BAR', H('#ffb030')), ('house',)],
              '47': [('shop', 'DINER', H('#e8e8e8')), ('house',), ('gap',), ('shop', 'GROCER', None), ('shop', 'HOTEL', H('#d8d8d8')), ('gap',), ('house',), ('shop', 'BAR', H('#f0f0f0'))],
              '88': [('shop', 'INN', None), ('house',), ('gap',), ('church',), ('shop', 'GENERAL', None), ('gap',), ('house',), ('shop', 'TAVERN', None)]}[era]
    wood = [pal['bld'], pal['bld2'], lerp(pal['bld2'], H('#2a2018'), .5)]
    for item in lineup:
        kind = item[0]
        if kind == 'gap':
            for k in range(2): 
                tx_ = x + 6 + k * 14; th = r.randrange(26, 40)
                for y in range(th):
                    w = int(1 + (y / th) * 6) if y < th - 6 else 1
                    for dx in range(-w, w + 1): l4.set(tx_ + dx, GROUND - th + y, pal['tree'])
            x += 34; continue
        if kind == 'shop':
            w = r.randrange(54, 72); h = r.randrange(36, 50); top = GROUND - h; c = r.choice(wood)
            l4.rect(x, top, w, h, c)
            l4.rect(x, top - 8, w, 8, c); l4.rect(x, top - 8, w, 1, pal['edge'])                 # false front
            for k in range(0, w, 6): l4.rect(x + k, top - 9, 3, 1, c)
            l4.rect(x + 2, top + 4, w - 4, 1, pal['edge'])
            for wx in range(x + 6, x + w - 10, 14):                                               # upstairs windows
                on = r.random() < .45; l4.rect(wx, top + 8, 6, 8, pal['lit'] if on else pal['dark']); l4.rect(wx, top + 12, 6, 1, lerp(c, (0, 0, 0), .4))
                if on and r.random() < .3: l4.rect(wx + 2, top + 10, 2, 6, (18, 14, 20))
            l4.rect(x + 3, GROUND - 17, w - 6, 17, pal['dark'])                                   # storefront
            l4.rect(x + 6, GROUND - 15, w - 22, 10, lerp(pal['lit'], pal['dark'], .45 if r.random() < .6 else .9))
            l4.rect(x + w - 14, GROUND - 15, 8, 15, (8, 8, 12))
            for k in range(w + 4): l4.set(x - 2 + k, GROUND - 19, lerp(pal['edge'], (0, 0, 0), .3)); l4.set(x - 2 + k, GROUND - 20, pal['edge'] if k % 4 < 2 else c)   # awning
            name, neon = item[1], item[2]; sw = len(name) * 4 + 4
            l4.rect(x + (w - sw) // 2 - 1, top - 6, sw, 7, (10, 10, 14)); text(l4, name, x + (w - sw) // 2 + 1, top - 5, neon or H('#a8acbc'), 1, glow=neon)
            if name == 'DINER':
                px_ = x + w + 4; l4.rect(px_, GROUND - 74, 2, 74, (14, 14, 18)); l4.rect(px_ - 9, GROUND - 90, 20, 14, (12, 10, 16))
                text(l4, 'EAT', px_ - 6, GROUND - 86, neon, 1, glow=neon)
                for k in range(0, 20, 2): l4.set(px_ - 9 + k, GROUND - 91, neon if (k // 2) % 2 else lerp(neon, (0, 0, 0), .5))
                x += 10
            x += w + 3; continue
        if kind == 'house':
            w = r.randrange(40, 52); h = r.randrange(26, 34); top = GROUND - h; c = r.choice(wood)
            l4.rect(x, top, w, h, c)
            for i in range(w // 2 + 2): l4.rect(x - 2 + i, top - i * 2 // 3, w + 4 - i * 2, 1, lerp(c, (0, 0, 0), .25))   # gable
            l4.rect(x + 4, top + 8, 6, 7, pal['lit'] if r.random() < .5 else pal['dark']); l4.rect(x + w - 12, top + 8, 6, 7, pal['dark'])
            l4.rect(x + w // 2 - 3, GROUND - 12, 6, 12, (8, 8, 12)); l4.rect(x, GROUND - 14, w, 1, pal['edge'])       # porch
            for k in range(x, x + w, 5): l4.rect(k, GROUND - 13, 1, 13, lerp(c, (0, 0, 0), .3))
            l4.rect(x + w - 10, top - 14, 4, 8, c); x += w + 6; continue
        if kind == 'gas':
            w = 64; l4.rect(x, GROUND - 40, w, 4, (14, 14, 20)); l4.rect(x, GROUND - 36, w, 1, item[2])
            for k in range(0, w, 3):
                if BAYER[(GROUND - 30) % 4][(x + k) % 4] < 6: l4.set(x + k, GROUND - 30, item[2], 60)
            l4.rect(x + 6, GROUND - 36, 2, 36, (20, 20, 26)); l4.rect(x + w - 8, GROUND - 36, 2, 36, (20, 20, 26))
            l4.rect(x + 22, GROUND - 14, 6, 14, H('#c83a3a')); l4.rect(x + 36, GROUND - 14, 6, 14, H('#c83a3a')); l4.rect(x + 23, GROUND - 12, 4, 3, H('#e8e8e8')); l4.rect(x + 37, GROUND - 12, 4, 3, H('#e8e8e8'))
            text(l4, 'GAS', x + 25, GROUND - 46, item[2], 2, glow=item[2]); x += w + 6; continue
        if kind == 'church':
            w = 44; h = 40; top = GROUND - h; c = wood[0]
            l4.rect(x, top, w, h, c); l4.rect(x + 16, top - 30, 12, 30, c)
            for i in range(8): l4.rect(x + 16 + i * 3 // 4, top - 30 - i * 2, 12 - i * 3 // 2, 2, c)
            l4.rect(x + 21, top - 50, 2, 6, c); l4.rect(x + 19, top - 48, 6, 1, c)
            l4.rect(x + 19, top - 22, 6, 9, pal['lit']); l4.rect(x + 21, top - 22, 2, 9, (40, 30, 20))
            l4.rect(x + 18, GROUND - 14, 8, 14, (8, 8, 12)); x += w + 6; continue
    # power poles + wires across (wraps)
    if era != '88':
        for px_ in (30, 190, 350): pole(l4, px_, GROUND, 70, (12, 12, 16))
        for a, bb in ((30, 190), (190, 350), (350, 510)):
            for k, yy in enumerate((GROUND - 67, GROUND - 63)): wires(l4, a + 1, bb + 1, yy, 10 + k * 2, (18, 18, 24))
    for lx in (150, 330, 470): lamp(l4, lx, GROUND, pal['lit'] if era != '88' else H('#f0a040'), lerp(pal['lit'], (255, 255, 255), .2))
    l4.save(f'{dst}/l4.png')
    # l5 road: wet asphalt with the town reflected in it
    l5 = L(); ground_layer(l5, GROUND, pal['road'], pal['road2'], line=pal['edge'])
    if era == '88':
        for x in range(W):
            drift = int(3 + per(x, 5, 4) * 2)
            for y in range(GROUND - drift, HH):
                d = y - (GROUND - drift)
                c = H('#e8eef6') if d < 2 else lerp(H('#c8d2e0'), H('#7a869c'), min(1, d / 34))
                if d >= 2 and BAYER[y % 4][x % 4] < 3: c = lerp(c, H('#ffffff'), .4)
                l5.set(x, y, c)
        for k in range(0, W, 11): l5.rect(k, GROUND + 9 + (k // 11) % 2 * 3, 3, 1, H('#9aa4b8'))   # footprints
    else:
        merged = L(); [merged.im.alpha_composite(lx.im) for lx in (l4,)]
        reflect(merged, l5, GROUND + 1, (pal['road2'], .55))
        for x in range(0, W, 24): l5.rect(x, GROUND + 18, 12, 1, H('#6a6040') if era != '47' else H('#5a5a58'))
    l5.save(f'{dst}/l5.png')
    return dict(h=HH, ground=GROUND - 2)


# =================================================================== RURAL NOIR · FIELDS (back road, farmhouse, fog)
def rural_fields(dst, era='86'):
    os.makedirs(dst, exist_ok=True)
    top, bot = H('#04050c'), H('#283044')
    if era == '47': top, bot = H('#050505'), H('#343432')
    l1 = L(); sky(l1, top, bot, GROUND, stars=160, seed=21, moon=(90, 46, 9, H('#e8e4d4'), H('#c8d0e8')), cloud=(H('#181c2c'), H('#262c40'), 64, 6)); l1.save(f'{dst}/l1.png')
    l2 = L(); ridge(l2, 176, 8, H('#10131f'), 9, n=3, top_col=H('#262c44'))
    # distant radio tower with a blinking red light
    l2.rect(330, 120, 1, 56, H('#0c0e18'))
    for y in range(124, 176, 6): l2.set(329 + (y // 6) % 2 * 2, y, H('#0c0e18'))
    l2.set(330, 118, H('#ff3040')); l2.set(330, 119, H('#a01828'))
    l2.save(f'{dst}/l2.png')
    l3 = L(); pines(l3, 190, H('#080a12'), H('#202640'), 13, dens=.25, hmin=10, hmax=40)
    # farmhouse: one window lit
    fx = 200
    l3.rect(fx, 160, 46, 30, H('#0c0e16'));
    for i in range(14): l3.rect(fx - 3 + i, 160 - i, 52 - i * 2, 1, H('#0c0e16'))
    l3.rect(fx + 10, 170, 5, 6, H('#f0c060')); l3.rect(fx + 10, 172, 5, 1, H('#a07830')); l3.rect(fx + 32, 170, 5, 6, H('#141620'))
    l3.rect(fx + 36, 140, 4, 8, H('#0c0e16'))
    for k in range(6):   # chimney smoke
        l3.set(fx + 38 + k, 138 - k * 3, H('#3a4058')); l3.set(fx + 39 + k, 137 - k * 3, H('#2a3048'))
    l3.save(f'{dst}/l3.png')
    # l4: fog band + cornfield + fence + telephone poles
    l4 = L()
    for y in range(176, 206):
        k = 1 - abs(y - 190) / 15
        for x in range(W):
            if BAYER[y % 4][x % 4] < k * 9: l4.set(x, y, H('#5a6480'), 70)
    r = random.Random(4)
    for x in range(W):
        h = 18 + int(per(x, 6, 2) * 3) + r.randrange(3)
        for y in range(GROUND - h, GROUND):
            c = H('#2a2a18') if (x + y) % 5 else H('#3a3a20')
            if y < GROUND - h + 3 and x % 2: c = H('#4a4824')
            l4.set(x, y, c)
        if x % 7 == 0:
            for y in range(GROUND - h - 3, GROUND - h): l4.set(x, y, H('#5a5428'))
    for fxp in range(0, W, 16):
        l4.rect(fxp, GROUND - 10, 2, 10, H('#1a1610'));
    l4.rect(0, GROUND - 8, W, 1, H('#1a1610')); l4.rect(0, GROUND - 4, W, 1, H('#1a1610'))
    for px_ in (60, 300): pole(l4, px_, GROUND, 74, H('#0e0e14'))
    for a, bb in ((60, 300), (300, 540)):
        for k, yy in enumerate((GROUND - 71, GROUND - 67)): wires(l4, a + 1, bb + 1, yy, 14 + k * 2, H('#16161e'))
    # a crow on the wire
    l4.rect(140, GROUND - 60, 3, 2, H('#05050a')); l4.set(143, GROUND - 61, H('#05050a'))
    l4.save(f'{dst}/l4.png')
    l5 = L(); ground_layer(l5, GROUND, H('#1c1a16'), H('#121110'), line=H('#2c2a24'))
    for x in range(W):
        if (x * 13) % 17 < 3: l5.set(x, GROUND + 3 + (x % 5), H('#2c2820'))
    for x in range(0, W, 40): l5.rect(x, GROUND + 14, 20, 1, H('#4a4630'))
    l5.save(f'{dst}/l5.png')
    return dict(h=HH, ground=GROUND - 2)


# =================================================================== NEO NOIR · CITY CANYON (2026)
def neo_city(dst, variant='a'):
    os.makedirs(dst, exist_ok=True)
    neon = [H('#ff2a8d'), H('#2ae6ff'), H('#ffb02a'), H('#9a5aff')]
    l1 = L(); sky(l1, H('#07030f'), H('#3a1238'), GROUND, stars=0, seed=31, cloud=(H('#2a0e2c'), H('#4a1844'), 50, 9));
    for y in range(110, GROUND):   # city glow on the low clouds
        for x in range(W):
            if BAYER[y % 4][x % 4] < (y - 110) / 120 * 10: l1.set(x, y, H('#a0306a'), 50)
    l1.save(f'{dst}/l1.png')
    # l2: far towers, blinking aircraft lights, a giant hologram billboard
    l2 = L(); r = random.Random(41); x = 0
    while x < W:
        w = r.randrange(16, 34); h = r.randrange(80, 170); top = GROUND - h
        l2.rect(x, top, w, h, H('#120a1e')); l2.rect(x, top, 1, h, H('#22163a'))
        windows(l2, x + 2, top + 4, w - 4, h - 8, None, H('#0e0818'), r.random() * 999, p=.18, cols=[H('#5a3a7a'), H('#3a5a8a'), H('#8a4a6a')], ww=1, wh=1, gx=2, gy=2)
        if r.random() < .4: l2.rect(x + w // 2, top - 10, 1, 10, H('#120a1e')); l2.set(x + w // 2, top - 11, H('#ff3040'))
        x += w + r.randrange(0, 4)
    hx = 300; l2.rect(hx, 70, 70, 34, H('#0a0614'))
    for y in range(72, 102):
        for xx in range(hx + 2, hx + 68):
            if y % 2 == 0 and BAYER[y % 4][xx % 4] < 9: l2.set(xx, y, H('#2ae6ff'), 90)
    text(l2, 'CHRONO', hx + 12, 78, H('#e0fcff'), 2, glow=H('#2ae6ff')); text(l2, '24/7', hx + 24, 94, H('#ff2a8d'), 1)
    l2.save(f'{dst}/l2.png')
    # l3: mid buildings with vertical neon blades
    l3 = L(); x = 0; signs = ['HOTEL', 'LIQUOR', 'NOODLE', 'PAWN', 'KARAOKE', 'CLUB', 'OPEN']
    while x < W:
        w = r.randrange(34, 60); h = r.randrange(90, 150); top = GROUND - h
        l3.rect(x, top, w, h, H('#160e22')); l3.rect(x, top, w, 1, H('#3a2a52')); l3.rect(x + w - 1, top, 1, h, H('#0a0612'))
        windows(l3, x + 3, top + 5, w - 6, h - 30, None, H('#0c0814'), r.random() * 999, p=.28, cols=[H('#e8b860'), H('#6a9ad0'), H('#d06a9a'), H('#c8c8d8')], ww=2, wh=2, gx=2, gy=3)
        for yy in range(top + 10, GROUND - 20, 9): l3.rect(x + 2, yy, 8, 1, H('#2a1e3a')); l3.rect(x + 2, yy, 1, 9, H('#2a1e3a'))   # fire escape
        if r.random() < .75:
            s = r.choice(signs); c = r.choice(neon); sx = x + w - 9; sy = top + 14
            l3.rect(sx - 1, sy - 2, 7, len(s) * 6 + 2, H('#0a0610'))
            for i, ch in enumerate(s): text(l3, ch, sx + 1, sy + i * 6, c, 1)
            for yy in range(sy - 4, sy + len(s) * 6 + 2):
                for xx in range(sx - 4, sx + 9):
                    if l3.get(xx, yy)[:3] != c and BAYER[yy % 4][xx % 4] < 4: l3.set(xx, yy, c, 50)
        if r.random() < .5:   # rooftop water tank
            l3.rect(x + 6, top - 10, 12, 8, H('#120a1a')); l3.rect(x + 7, top - 2, 1, 2, H('#120a1a')); l3.rect(x + 16, top - 2, 1, 2, H('#120a1a'))
        x += w + r.randrange(2, 10)
    l3.save(f'{dst}/l3.png')
    # l4: street level — awnings, shutters, a noodle bar, steam, rain-wet signage
    l4 = L(); x = 0
    while x < W:
        w = r.randrange(54, 84); h = r.randrange(54, 74); top = GROUND - h; c = r.choice(neon)
        l4.rect(x, top, w - 2, h, H('#1c1228')); l4.rect(x, top, w - 2, 1, lerp(c, H('#1c1228'), .5))
        windows(l4, x + 4, top + 5, w - 10, 20, None, H('#120a1a'), r.random() * 999, p=.4, cols=[H('#f0c070'), H('#a0c8f0')], ww=3, wh=3, gx=3, gy=3)
        l4.rect(x + 3, GROUND - 22, w - 8, 22, H('#0c0812'))
        kind = r.random()
        if kind < .4:     # lit shop window
            l4.rect(x + 6, GROUND - 19, w - 22, 13, lerp(c, H('#0c0812'), .65)); l4.rect(x + 6, GROUND - 19, w - 22, 1, c)
            for k in range(3): l4.rect(x + 9 + k * 8, GROUND - 15, 4, 9, lerp(c, H('#000000'), .5))
        elif kind < .7:   # roll shutter, graffiti
            for yy in range(GROUND - 20, GROUND, 2): l4.rect(x + 5, yy, w - 12, 1, H('#2a2234'))
            l4.rect(x + 10, GROUND - 12, 10, 3, H('#c03a7a')); l4.rect(x + 14, GROUND - 14, 8, 2, H('#3ac0c0'))
        # awning
        for i in range(w - 6):
            l4.set(x + 3 + i, GROUND - 24, c if i % 6 < 3 else lerp(c, (0, 0, 0), .5)); l4.set(x + 3 + i, GROUND - 23, lerp(c, (0, 0, 0), .6))
        name = r.choice(['RAMEN', 'BAR', '24H', 'PAWN', 'VHS', 'CLINIC', 'ARCADE'])
        tw = len(name) * 4; text(l4, name, x + (w - tw) // 2, top + 30, c, 1, glow=c)
        if r.random() < .5:   # steam vent
            vx = x + w // 2
            for k in range(14):
                yy = GROUND - 2 - k * 3; ww2 = 1 + k // 3
                for dx in range(-ww2, ww2 + 1):
                    if BAYER[yy % 4][(vx + dx) % 4] < 8 - k // 2: l4.set(vx + dx + int(math.sin(k) * 2), yy, H('#8a7a9a'), 70)
        x += w + r.randrange(0, 6)
    for lx in (70, 250, 410): lamp(l4, lx, GROUND, H('#c0f0ff'), H('#80d8ff'), h=58)
    l4.save(f'{dst}/l4.png')
    # l5: wet asphalt — the whole street reflected, neon smeared into it
    l5 = L(); ground_layer(l5, GROUND, H('#120c18'), H('#08060c'), line=H('#3a2a52'))
    m = L(); m.im.alpha_composite(l3.im); m.im.alpha_composite(l4.im)
    reflect(m, l5, GROUND + 1, (H('#08060c'), .45))
    for x in range(0, W, 30): l5.rect(x, GROUND + 20, 14, 1, H('#5a4a2a'))
    l5.save(f'{dst}/l5.png')
    return dict(h=HH, ground=GROUND - 2)


# =================================================================== NEO NOIR · ALLEY (2026)
def neo_alley(dst):
    os.makedirs(dst, exist_ok=True)
    l1 = L(); sky(l1, H('#05030a'), H('#24102a'), GROUND, seed=51, cloud=(H('#1e0c22'), H('#2e1434'), 40, 5)); l1.save(f'{dst}/l1.png')
    l2 = L(); r = random.Random(61); x = 0
    while x < W:
        w = r.randrange(40, 90); h = r.randrange(150, 220); top = GROUND - h
        l2.rect(x, top, w, h, H('#100a16')); l2.rect(x, top, 1, h, H('#2a1a36'))
        windows(l2, x + 3, top + 6, w - 6, h - 40, None, H('#0a0610'), r.random() * 999, p=.12, cols=[H('#7a5a3a'), H('#3a5a7a')], ww=2, wh=2, gx=3, gy=4)
        x += w + 1
    l2.save(f'{dst}/l2.png')
    l3 = L()
    # brick wall with pipes, AC units, a dripping neon arrow, posters
    for y in range(GROUND - 120, GROUND):
        for x in range(W):
            mort = (y % 6 == 0) or ((x + (y // 6) % 2 * 6) % 12 == 0)
            l3.set(x, y, H('#1a0f18') if mort else (H('#2a1620') if (x * 3 + y) % 7 else H('#321a26')))
    for px_ in (40, 200, 380):
        l3.rect(px_, GROUND - 120, 3, 120, H('#3a3a44')); l3.rect(px_, GROUND - 120, 1, 120, H('#5a5a66'))
        for yy in range(GROUND - 110, GROUND, 24): l3.rect(px_ - 1, yy, 5, 2, H('#2a2a32'))
    for ax in (90, 300): l3.rect(ax, GROUND - 92, 22, 14, H('#3a3a42'));
    for ax in (90, 300):
        for yy in range(GROUND - 90, GROUND - 80, 2): l3.rect(ax + 2, yy, 18, 1, H('#22222a'))
    text(l3, 'NO EXIT', 150, GROUND - 76, H('#ff2a8d'), 2, glow=H('#ff2a8d'))
    for k in range(5): l3.rect(240 + k * 3, GROUND - 60 + k, 2, 1, H('#2ae6ff'))
    for (pxx, pc) in ((120, H('#c8b090')), (330, H('#b0c8d0')), (420, H('#c89090'))):
        l3.rect(pxx, GROUND - 50, 14, 18, pc); l3.rect(pxx + 2, GROUND - 46, 10, 6, lerp(pc, (0, 0, 0), .5)); l3.rect(pxx + 2, GROUND - 38, 8, 1, lerp(pc, (0, 0, 0), .6))
    l3.save(f'{dst}/l3.png')
    l4 = L()
    for bx in (20, 260):   # dumpsters, crates, trash bags
        l4.rect(bx, GROUND - 20, 40, 20, H('#1e3a2a')); l4.rect(bx - 1, GROUND - 22, 42, 3, H('#2a4a36')); l4.rect(bx + 4, GROUND - 14, 32, 1, H('#14281c'))
    for cx in (110, 360): l4.rect(cx, GROUND - 14, 16, 14, H('#4a3622')); l4.rect(cx, GROUND - 14, 16, 1, H('#6a4e32')); l4.rect(cx, GROUND - 8, 16, 1, H('#3a2a18'))
    for k, bx in enumerate((70, 330, 440)):
        for yy in range(9):
            w = 9 - abs(yy - 5)
            l4.rect(bx - w // 2, GROUND - 9 + yy, w, 1, H('#141418') if yy > 2 else H('#24242c'))
    lamp(l4, 200, GROUND, H('#f0d090'), H('#f0c070'), h=64)
    l4.save(f'{dst}/l4.png')
    l5 = L(); ground_layer(l5, GROUND, H('#100a10'), H('#08060a'), line=H('#2a1a2a'))
    m = L(); m.im.alpha_composite(l3.im); m.im.alpha_composite(l4.im); reflect(m, l5, GROUND + 1, (H('#08060a'), .5))
    l5.save(f'{dst}/l5.png')
    return dict(h=HH, ground=GROUND - 2)


if __name__ == '__main__':
    made = {}
    made['rn_town86'] = rural_town(os.path.join(OUT, 'rn_town86'), '86')
    made['rn_town47'] = rural_town(os.path.join(OUT, 'rn_town47'), '47')
    made['rn_town88'] = rural_town(os.path.join(OUT, 'rn_town88'), '88')
    made['rn_fields'] = rural_fields(os.path.join(OUT, 'rn_fields'))
    made['nn_city'] = neo_city(os.path.join(OUT, 'nn_city'))
    made['nn_alley'] = neo_alley(os.path.join(OUT, 'nn_alley'))
    import json; print(json.dumps(made))
