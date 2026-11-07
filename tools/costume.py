"""Per-frame costume edits that turn Step Quest base sprites into the
Technomancers cast as described in the class sheets / story bible.
Every frame is analysed (head, torso, back, front) and features are drawn on."""
from PIL import Image

H = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
INK = H('#0b0b0f'); BOX = H('#4a4e58'); BOX2 = H('#6f7887'); MAG = H('#ff2a8d'); MAG2 = H('#d6338a')
CLEAR = (0, 0, 0, 0)


class F:
    """one animation frame inside a sheet"""
    def __init__(s, im, ox, oy, fw, fh):
        s.im, s.px, s.ox, s.oy, s.fw, s.fh = im, im.load(), ox, oy, fw, fh
        s.measure()

    def a(s, x, y):
        if not (s.ox <= x < s.ox + s.fw and s.oy <= y < s.oy + s.fh): return 0
        return s.px[x, y][3]

    def c(s, x, y): return s.px[x, y][:3] if s.a(x, y) else None

    def set(s, x, y, col, behind=False):
        if not (s.ox <= x < s.ox + s.fw and s.oy <= y < s.oy + s.fh): return
        if behind and s.px[x, y][3]: return
        s.px[x, y] = col

    def rect(s, x, y, w, h, col, behind=False):
        for yy in range(y, y + h):
            for xx in range(x, x + w): s.set(xx, yy, col, behind)

    def measure(s):
        xs, ys = [], []
        for y in range(s.oy, s.oy + s.fh):
            for x in range(s.ox, s.ox + s.fw):
                if s.px[x, y][3]: xs.append(x); ys.append(y)
        s.ok = bool(xs)
        if not s.ok: return
        s.x0, s.x1, s.y0, s.y1 = min(xs), max(xs), min(ys), max(ys)
        s.ht = s.y1 - s.y0 + 1
        s.hh = max(5, round(s.ht * .16))
        s.neck = s.y0 + s.hh
        row = lambda y: [x for x in range(s.ox, s.ox + s.fw) if s.a(x, y)]
        hr = [x for y in range(s.y0, s.neck) for x in row(y)]
        s.hx0, s.hx1 = (min(hr), max(hr)) if hr else (s.x0, s.x1)
        tr = row(s.neck + 4) or row(s.neck + 2) or [s.x0, s.x1]
        s.tx0, s.tx1 = min(tr), max(tr)
        s.waist = s.neck + round(s.ht * .36)

    def find(s, cols, y0=None, y1=None):
        cols = {c[:3] for c in cols}; out = []
        for y in range(y0 if y0 is not None else s.oy, y1 if y1 is not None else s.oy + s.fh):
            for x in range(s.ox, s.ox + s.fw):
                if s.px[x, y][3] and s.px[x, y][:3] in cols: out.append((x, y))
        return out

    def omnibox(s, w=5, h=9):
        """the OmniBox every T-Mancer carries between the shoulder blades"""
        x = s.tx0 - w + 1; y = s.neck + 2
        s.rect(x - 1, y - 1, w + 1, h + 2, INK, True)
        s.rect(x, y, w, h, BOX); s.rect(x, y, w, 1, BOX2)
        s.set(x + w // 2 - 1, y + h // 2, MAG); s.set(x + w // 2 - 1, y + h // 2 + 1, MAG)
        s.rect(x + w - 1, y + 2, 2, 1, H('#2a2d34'))


def reshape(im, ox, oy, fw, fh, sx, sy):
    """widen / squash a frame around its feet"""
    fr = im.crop((ox, oy, ox + fw, oy + fh)); bb = fr.getbbox()
    if not bb: return
    part = fr.crop(bb); nw, nh = max(1, round(part.width * sx)), max(1, round(part.height * sy))
    part = part.resize((nw, nh), Image.NEAREST)
    clear = Image.new('RGBA', (fw, fh), (0, 0, 0, 0))
    cx = (bb[0] + bb[2]) // 2; px = max(0, min(fw - nw, cx - nw // 2)); py = max(0, bb[3] - nh)
    clear.paste(part, (px, py), part); im.paste(clear, (ox, oy))



def dark(c): return c is not None and sum(c) < 60


def strip(f, marks, fill):
    """remove a held weapon (marked colors): inside the body -> fill, outside -> transparent, then clean stray outline"""
    marks = {m[:3] for m in marks}
    for y in range(f.oy, f.oy + f.fh):
        for x in range(f.ox, f.ox + f.fw):
            if f.c(x, y) in marks:
                l = any(f.c(xx, y) not in marks and f.c(xx, y) is not None and not dark(f.c(xx, y)) for xx in range(x - 4, x))
                r = any(f.c(xx, y) not in marks and f.c(xx, y) is not None and not dark(f.c(xx, y)) for xx in range(x + 1, x + 5))
                f.set(x, y, fill if (l and r and f.tx0 - 2 <= x <= f.tx1 + 2) else CLEAR)
    for _ in range(3):
        kill = []
        for y in range(f.oy, f.oy + f.fh):
            for x in range(f.ox, f.ox + f.fw):
                if dark(f.c(x, y)):
                    n = sum(1 for dx in (-1, 0, 1) for dy in (-1, 0, 1) if (dx or dy) and f.c(x + dx, y + dy) is not None and not dark(f.c(x + dx, y + dy)))
                    if n == 0: kill.append((x, y))
        for (x, y) in kill: f.set(x, y, CLEAR)
    f.measure()


def calloway(f):
    # lose the tommy gun: where it crossed his body, rebuild the coat from the pixels just above/below; the rest goes
    marks = {(0xfe, 0, 0xfe), (0xfd, 0, 0xfd)}
    pts = [(x, y) for y in range(f.oy, f.oy + f.fh) for x in range(f.ox, f.ox + f.fw) if f.c(x, y) in marks]
    def solid(x, y): c = f.c(x, y); return c is not None and c not in marks and not dark(c)
    for (x, y) in pts:
        L = any(solid(xx, y) for xx in range(x - 32, x)); R = any(solid(xx, y) for xx in range(x + 1, x + 32))
        U = any(solid(x, yy) for yy in range(y - 9, y)); D = any(solid(x, yy) for yy in range(y + 1, y + 10))
        if (L and R) or (U and D):
            src = None
            for d in range(1, 10):
                for yy in (y - d, y + d):
                    if solid(x, yy): src = f.px[x, yy]; break
                if src: break
            f.set(x, y, src or H('#612721'))
            f.px[x, y] = f.px[x, y]
        else: f.set(x, y, CLEAR)
    for _ in range(3):   # gun outline left floating outside the body
        kill = [(x, y) for y in range(f.oy, f.oy + f.fh) for x in range(f.ox, f.ox + f.fw)
                if dark(f.c(x, y)) and not any(solid(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
        for q in kill: f.set(*q, CLEAR)
    f.measure()
    hands = f.find([H('#fca570'), H('#bd6a62')], f.neck + 4, f.waist + 8)
    if hands:
        hx, hy = max(hands)
        f.rect(hx - 1, hy - 3, 9, 4, INK); f.rect(hx, hy - 2, 7, 2, H('#4a4d58')); f.rect(hx, hy - 2, 2, 4, INK); f.set(hx + 3, hy - 2, H('#9aa4b2'))

# ------------------------------------------------------------------ cast
def augie(f):
    hair, hair2 = H('#5a3424'), H('#7a4a30')
    # tall black boots: the base sheet reuses the jacket shade on the boots
    for y in range(f.y1 - 11, f.y1 + 1):
        for x in range(f.x0, f.x1 + 1):
            if f.a(x, y) and f.c(x, y) in (H('#5f666e')[:3], H('#8a9199')[:3]): f.set(x, y, H('#15151a') if (x + y) % 4 else H('#3a3a42'))
    # head box from hair + skin only (arms can reach into the head rows)
    hp = f.find([H('#5a3424'), H('#7a4a30'), H('#3a2016'), H('#e9b5a3'), H('#ba756a'), H('#8e5252')], f.y0, f.neck + 2)
    if hp:
        hx0 = min(p[0] for p in hp); hx1 = max(p[0] for p in hp); hy0 = min(p[1] for p in hp)
        # messy curly bun on the back of the crown
        bx, by = hx0, hy0 - 3
        f.rect(bx - 1, by - 1, 6, 5, INK, True); f.rect(bx, by, 4, 3, hair); f.set(bx + 1, by, hair2); f.set(bx + 3, by + 1, hair2); f.set(bx - 1, by + 1, hair2)
        # welder goggles pushed up on the forehead
        gy = hy0 + 2; f.rect(hx0, gy, hx1 - hx0 + 1, 1, H('#2a1d16'))
        lx = hx1 - 4; f.rect(lx, gy - 1, 5, 3, INK); f.set(lx + 1, gy, H('#c07a30')); f.set(lx + 3, gy, H('#c07a30'))
    # oversized parka hood bunched behind the neck
    f.rect(f.tx0 - 2, f.neck - 1, 4, 4, INK, True); f.rect(f.tx0 - 1, f.neck, 3, 3, H('#5f666e'), True)
    # the all-around canvas pouch belt: olive pouches, orange tabs, GG charm
    pants = f.find([H('#1c1c21'), H('#0f0f12')], f.y0 + round(f.ht * .45), f.oy + f.fh)
    wy = (min(p[1] for p in pants) + 1) if pants else f.y0 + round(f.ht * .56)
    xs = [x for x in range(f.ox, f.ox + f.fw) if f.a(x, wy) and f.c(x, wy) not in (H('#6f7887')[:3], H('#9aa4b2')[:3], H('#c8d0d8')[:3])]
    if xs:
        x0, x1 = max(min(xs), f.tx0 - 2), min(max(xs), f.tx1 + 2)
        f.rect(x0 - 1, wy - 2, x1 - x0 + 3, 5, INK)
        f.rect(x0, wy - 1, x1 - x0 + 1, 3, H('#4a5a3a'))
        for x in range(x0, x1 + 1, 3): f.rect(x, wy - 1, 2, 3, H('#5d6e45')); f.set(x, wy - 1, H('#e0752d'))
        f.rect(x0, wy + 2, x1 - x0 + 1, 1, H('#2b3a52'))
        f.set(x1 + 1, wy + 4, H('#d8d8d8')); f.set(x1 + 1, wy + 5, H('#d8d8d8'))
    # Hush Crook Mk III: lengthen the barrel into a staff, sledge head on the muzzle, six-shot drum
    steel = f.find([H('#6f7887'), H('#9aa4b2'), H('#c8d0d8')], f.neck, f.oy + f.fh)
    steel = [p for p in steel if p[0] > f.tx1 - 2 or p[0] < f.tx0 + 2]
    if steel:
        rx, ry = max(steel); lx, ly = min(steel)
        for i in range(1, 12): f.set(rx + i, ry, H('#9aa4b2')); f.set(rx + i, ry + 1, INK, True)
        f.rect(rx + 11, ry - 3, 4, 7, INK); f.rect(rx + 12, ry - 2, 2, 5, H('#565c68'))
        mx, my = (lx + rx) // 2, (ly + ry) // 2 + 2
        f.rect(mx - 2, my - 1, 5, 5, INK); f.rect(mx - 1, my, 3, 3, H('#5a606c')); f.set(mx, my + 1, H('#e0752d'))
        for i in range(1, 5): f.set(lx - i, ly + (i // 2), H('#6f7887'))


def jester(f, bat=True):
    hair = set(HAIR)
    # buzzcut: shave the top of the hair down
    for y in range(f.y0, f.y0 + 3):
        for x in range(f.hx0 - 1, f.hx1 + 2):
            if f.c(x, y) in hair: f.set(x, y, CLEAR)
    for x in range(f.hx0, f.hx1 + 1):  # re-outline the new crown
        for y in range(f.y0 + 3, f.y0 + 6):
            if f.c(x, y) in hair: f.set(x, y - 1, INK, True); break
    skin = SKIN[0] + (255,)
    hp = f.find([c + (255,) for c in SKIN], f.y0, f.neck + 3)
    if hp:
        hy0 = min(p[1] for p in hp); hy1 = max(p[1] for p in hp); cut = hy0 + (hy1 - hy0) * .45
        for (x, y) in f.find([c + (255,) for c in HAIR], int(cut), f.neck + 3): f.set(x, y, skin)
    # studded leather: silver studs along the shoulders and collar
    jack = {H('#26272e')[:3], H('#131418')[:3]}
    for x in range(f.tx0, f.tx1 + 1, 2):
        for y in range(f.neck - 1, f.neck + 6):
            if f.c(x, y) in jack: f.set(x, y, H('#c8d0d8')); break
    # mantis-shrimp crew patch on the back of the jacket
    px, py = f.tx0 + 1, f.neck + 5
    pat = ['.CG.', 'COOC', '.OO.', 'B..B']
    cm = {'C': H('#40c0f0'), 'G': H('#6df0b0'), 'O': H('#f0a040'), 'B': H('#40c0f0')}
    for j, row in enumerate(pat):
        for i, ch in enumerate(row):
            if ch != '.' and f.c(px + i, py + j) in jack: f.set(px + i, py + j, cm[ch])
    # steel-core bat slung across the back, Bowie knife on the hip
    for i in range(18 if bat else 0):
        x, y = f.tx0 - 3 + i // 3, f.neck - 5 + i
        f.set(x, y, H('#8a7a5a') if i < 13 else H('#333338'), True); f.set(x - 1, y, INK, True)
    kx, ky = f.tx1 - 1, f.waist - 1
    f.rect(kx, ky, 3, 8, INK); f.rect(kx + 1, ky + 1, 1, 6, H('#5a3a22')); f.set(kx + 1, ky - 1, H('#9aa4b2'))


def crew(f):
    jester(f, bat=False)


def holo(f):
    for i in range(14):
        f.rect(f.hx0 - 3 - i // 4, f.y0 + 3 + i, 3, 1, H('#141418'), True)
    skin = f.find([H('#7ab8e8'), H('#5a90c0'), H('#4a7ab0')], f.y0, f.neck + 3)
    if skin:
        fx0 = min(p[0] for p in skin); fx1 = max(p[0] for p in skin); fy0 = min(p[1] for p in skin); fy1 = max(p[1] for p in skin)
        f.rect(fx0, fy0, fx1 - fx0 + 2, 2, H('#1a1c22'))          # visor slab over the eyes
        f.set(fx0 - 1, fy0, MAG); f.set(fx1 + 1, fy0 + 1, MAG2)   # temple rings
        f.rect(fx0 - 3, fy1 + 1, fx1 - fx0 + 6, 3, H('#6f7887'))   # stiff wrap collar
        f.rect(fx0 - 3, fy1 + 3, fx1 - fx0 + 6, 1, H('#40444e'))
    # tuning-fork staff: find the staff in front of the body and fork its top
    st = [p for p in f.find([H('#6f7887'), H('#565c68')], f.neck, f.oy + f.fh) if p[0] > f.tx1 + 1]
    if st:
        sx, sy = min(st, key=lambda p: p[1])
        upright = (max(p[1] for p in st) - min(p[1] for p in st)) > f.ht * .45
        top = max(f.oy + 9, f.y0 - 12) if upright else sy   # the staff stands taller than she does
        for y in range(top, sy):
            f.set(sx - 1, y, INK); f.set(sx + 1, y, INK); f.set(sx, y, H('#9aa4b2') if y % 7 else MAG2)
        if upright: f.rect(sx - 1, top + 6, 3, 2, H('#2a2d34'))   # damping collar
        sy = top
        for i in range(7): f.set(sx - 2, sy - i, H('#9aa4b2')); f.set(sx + 2, sy - i, H('#9aa4b2')); f.set(sx - 3, sy - i, INK); f.set(sx + 3, sy - i, INK)
        f.rect(sx - 2, sy, 5, 1, H('#9aa4b2')); f.set(sx - 2, sy - 7, MAG); f.set(sx + 2, sy - 7, MAG)
        for i in range(1, 4): f.set(sx, sy + 1 + i, MAG2)
    f.omnibox()


def nano(f):
    # 18 magenta bot pods studded over the suit
    body = [(x, y) for y in range(f.neck + 3, f.y1 - 6, 7) for x in range(f.tx0 + 2, f.tx1 - 1, 5) if f.a(x, y) and f.c(x, y) not in (INK[:3], (0, 0, 0)) and f.a(x, y + 1) and f.a(x - 1, y) and f.a(x + 1, y)]
    for (x, y) in body[:12]: f.rect(x - 1, y - 1, 3, 4, INK); f.set(x, y, MAG); f.set(x, y + 1, MAG2)
    # ear towers + whip antenna, magenta visor slit
    for x in (f.hx0, f.hx1 - 1):
        f.rect(x - 1, f.y0 - 8, 4, 10, INK); f.rect(x, f.y0 - 7, 2, 8, H('#9aa4b2')); f.set(x, f.y0 - 4, MAG)
    f.rect(f.hx1 + 1, f.y0 - 12, 1, 5, H('#c8d0d8'))
    f.rect(f.hx1 - 3, f.y0 + f.hh // 2, 3, 1, MAG)
    # cast-metal air-walk boots with holes
    for x in range(f.x0, f.x1 + 1):
        for y in range(f.y1 - 3, f.y1 + 1):
            if f.a(x, y) and f.c(x, y) != INK[:3]: f.set(x, y, H('#6f7887') if (x + y) % 3 else H('#2a2d34'))
    f.omnibox(4, 8)


def chrono(f):
    hair = {H('#291d2b')[:3], H('#21181b')[:3], H('#52333f')[:3]}
    # helmet over the hair, antenna blade, two clock-sync stacks
    for y in range(f.y0, f.y0 + f.hh // 2 + 1):
        for x in range(f.hx0, f.hx1 + 1):
            if f.a(x, y) and f.c(x, y) != INK[:3]: f.set(x, y, H('#3a3e47') if y > f.y0 + 1 else H('#565c68'))
    f.rect(f.hx0 - 1, f.y0 - 8, 1, 10, H('#9aa4b2')); f.set(f.hx0, f.y0 + 1, H('#9aa4b2'))
    cy = f.y0 + f.hh // 2; f.rect(f.hx0 - 2, cy - 2, 5, 5, INK); f.rect(f.hx0 - 1, cy - 1, 3, 3, H('#9aa4b2'))
    for i in range(10): f.set(f.hx0 - 2 - i // 2, f.y0 + 3 + i, H('#141418'), True)   # long black hair streaming back
    f.rect(f.hx0 + 2, f.y0 - 2, 1, 2, BOX2); f.rect(f.hx0 + 4, f.y0 - 2, 1, 2, BOX2)
    skin = f.find([H('#9ccbf0'), H('#7ab8e8'), H('#5a90c0')], f.y0, f.neck + 2)
    if skin:
        fx0 = min(p[0] for p in skin); fx1 = max(p[0] for p in skin); fy = min(p[1] for p in skin)
        f.rect(fx0, fy + 1, fx1 - fx0 + 1, 1, H('#cfe8ff'))                      # clear glasses
        f.rect(fx1 - 2, fy + 3, 4, 3, H('#2a2d34')); f.set(fx1 + 1, fy + 4, INK)  # chunky respirator
    # clock gauntlets on both wrists
    hands = f.find([H('#9ccbf0'), H('#7ab8e8'), H('#5a90c0')], f.neck + 4, f.waist + 6)
    done = []
    for (x, y) in sorted(hands, key=lambda p: -p[1]):
        if any(abs(x - a) < 6 and abs(y - b) < 6 for a, b in done): continue
        done.append((x, y))
        f.rect(x - 3, y - 3, 7, 7, INK); f.rect(x - 2, y - 2, 5, 5, H('#f0f0f4')); f.set(x, y, INK); f.set(x, y - 1, INK); f.set(x + 1, y, MAG); f.set(x, y - 2, INK)
        if len(done) >= 2: break
    f.omnibox(4, 8)


def void(f):
    hp = f.find([H('#3a3e47'), H('#565c68'), H('#7ab8e8')], f.y0, f.neck + 2)
    hx0 = min((p[0] for p in hp), default=f.hx0); hx1 = max((p[0] for p in hp), default=f.hx1)
    # visor-block helmet with two fins (one striped magenta) and band cameras
    top = f.y0 - 2
    f.rect(hx0 - 2, top - 1, hx1 - hx0 + 6, f.hh - 1, INK); f.rect(hx0 - 1, top, hx1 - hx0 + 4, f.hh - 3, H('#5a606c'))
    f.rect(hx0, top + 2, hx1 - hx0 + 3, 3, H('#1a1c22')); f.set(hx1 + 1, top + 3, MAG)
    f.rect(hx0 + 1, top - 5, 2, 5, BOX2); f.rect(hx1 - 1, top - 4, 2, 4, BOX2); f.set(hx1 - 1, top - 3, MAG); f.set(hx1, top - 2, MAG)
    f.set(hx0 - 2, top + 3, H('#9aa4b2'))
    # magenta sash across the tunic + a full black robe skirt split at the front
    for i in range(f.waist - f.neck):
        x = f.tx0 + 1 + i * (f.tx1 - f.tx0) // max(1, f.waist - f.neck)
        if f.a(x, f.neck + i): f.set(x, f.neck + i, MAG2)
    for y in range(f.waist, f.y1 - 3):
        xs = [x for x in range(f.ox, f.ox + f.fw) if f.a(x, y)]
        if not xs: continue
        x0, x1 = max(min(xs) - 1, f.tx0 - 3), min(max(xs) + 1, f.tx1 + 3)
        f.rect(x0, y, x1 - x0 + 1, 1, H('#22232a')); f.set(x0 - 1, y, INK); f.set(x1 + 1, y, INK)
        if y % 4 == 0: f.set((x0 + x1) // 2, y, H('#3a3e47'))
    # blocky gate shotgun: thicken the barrel, add a shell window
    gun = [p for p in f.find([H('#2a2d34'), H('#1a1c22')], f.neck + 2, f.waist + 4) if p[0] > f.tx1 - 2]
    for (x, y) in gun: f.set(x, y + 1, H('#2a2d34')); f.set(x, y - 1, H('#40444e'))
    if gun:
        mx = sum(p[0] for p in gun) // len(gun); my = sum(p[1] for p in gun) // len(gun); f.set(mx, my, MAG); f.set(mx + 1, my, MAG)
    f.omnibox(6, 8)


def bernard(f):
    pass


COSTUME = {'augie': (augie, 1.16, 1.0), 'jester': (jester, 1.0, 1.0), 'holo': (holo, 1.0, 1.0), 'nano': (nano, 1.0, 1.0),
           'chrono': (chrono, .95, .86), 'void': (void, 1.16, .9), 'calloway': (calloway, 1.0, 1.0), 'marquis': (crew, 1.22, 1.0), 'crew1': (crew, 1.0, 1.0), 'crew2': (crew, 1.05, 1.0), 'crew3': (crew, .98, 1.0)}


# ------------------------------------------------------------------ redone on same-style bases
def _head_outline(f, cols):
    """after clearing hair: give the exposed crown a 1px ink outline"""
    cols = {c[:3] for c in cols}
    for y in range(f.oy + 1, f.neck + 2):
        for x in range(f.ox + 1, f.ox + f.fw - 1):
            if f.c(x, y) in cols:
                for dx, dy in ((0, -1), (-1, 0), (1, 0)):
                    if not f.a(x + dx, y + dy): f.set(x + dx, y + dy, INK)


def nano3(f):
    """marauder -> Nanomancer: the bat goes, the jacket/shirt/trousers become one fitted charcoal suit,
    the beard goes, then nano2's pods + visor"""
    strip(f, [(0xfc, 0, 0xfc, 255)], H('#3a3e47'))
    SK = [H('#7ab8e8'), H('#5a90c0')]
    hb = [p for p in f.find(SK, f.y0, f.neck + 4)]
    if hb:
        fx0 = min(p[0] for p in hb); fx1 = max(p[0] for p in hb); fy0 = min(p[1] for p in hb); fy1 = max(p[1] for p in hb)
        cut = fy0 + (fy1 - fy0) * .45
        for y in range(int(cut), fy1 + 3):
            for x in range(fx0, fx1 + 1):
                if f.c(x, y) == H('#2d3142')[:3]: f.set(x, y, SK[0] if y <= fy1 else SK[1])
    nano2(f)


def nano2(f):
    """courier -> Nanomancer: full-cover charcoal bodysuit + cowl, blue mask face, magenta nanobot
    pods studded all over the suit, no weapon"""
    suit = {H(h)[:3] for h in ('#4a4e58', '#3a3e47', '#2d3142', '#565c68')}
    k = 0
    for y in range(f.neck, f.y1 - 3, 4):
        k += 1
        for x in range(f.x0 + (k % 2) * 2, f.x1, 4):
            if all(f.c(x + dx, y + dy) in suit for dx in (0, 1) for dy in (0, 1)) and f.c(x - 1, y) is not None and f.c(x + 2, y) is not None:
                f.set(x, y, MAG); f.set(x + 1, y, H('#ff7bd5')); f.set(x, y + 1, MAG2); f.set(x + 1, y + 1, MAG)
    # cowl seam + magenta visor line across the mask
    hb = [p for p in f.find([H('#7ab8e8'), H('#5a90c0')], f.y0, f.neck + 2)]
    if hb:
        fx0 = min(p[0] for p in hb); fx1 = max(p[0] for p in hb); fy0 = min(p[1] for p in hb)
        f.rect(fx0, fy0 + 2, fx1 - fx0 + 1, 1, H('#1a1c22')); f.rect(fx0 + 1, fy0 + 2, fx1 - fx0 - 1, 1, MAG)
    f.omnibox(4, 8)


def chrono2(f):
    """healer (kunoichi) -> Chronomancer, 13: slim black bodysuit, gray tunic over it, black hair,
    clear lenses, clock gauntlets, sync antenna; her lantern becomes a hand clock"""
    SK = {H(h)[:3] for h in ('#9ccbf0', '#7ab8e8', '#5a90c0', '#4a7ab0')}
    # legs below the tunic hem are in the bodysuit, not bare
    hem = f.y0 + round(f.ht * .62)
    for y in range(hem, f.y1 + 1):
        for x in range(f.ox, f.ox + f.fw):
            if f.c(x, y) in SK: f.set(x, y, H('#2d3142') if (x + y) % 5 else H('#3a3e47'))
    hb = skinbox(f, [H('#9ccbf0'), H('#7ab8e8')], f.y0, f.neck + 3)
    if hb:
        fx0, fy0, fx1, fy1 = hb
        f.rect(fx0, fy0 + 3, fx1 - fx0 + 1, 1, H('#cfe8ff')); f.set(fx1, fy0 + 3, INK)   # clear glasses
        f.rect(fx0 + 1, f.y0 - 6, 1, 6, H('#9aa4b2'), True); f.set(fx0 + 1, f.y0 - 7, MAG)   # sync antenna
    # clock gauntlets: one on each wrist
    hands = f.find([H('#9ccbf0'), H('#7ab8e8'), H('#5a90c0')], f.neck + 6, hem)
    done = []
    for (x, y) in sorted(hands, key=lambda p: p[1]):
        if any(abs(x - a) < 7 and abs(y - b) < 7 for a, b in done): continue
        done.append((x, y))
        f.rect(x - 2, y - 4, 5, 5, INK); f.rect(x - 1, y - 3, 3, 3, H('#f0f0f4')); f.set(x, y - 2, INK); f.set(x, y - 3, INK); f.set(x + 1, y - 2, MAG)
        if len(done) >= 2: break
    f.omnibox(4, 8)


def skinbox(f, cols, y0=None, y1=None):
    pts = f.find(list(cols), f.y0 if y0 is None else y0, f.neck + 4 if y1 is None else y1)
    if not pts: return None
    return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)


def bernard2(f):
    """courier -> Bernard, half pulled into another dimension: bald eyeless head, two eyes open
    in his chest, cloven hooves, bands of him simply missing (edged in rift light), no weapon"""
    MARK = (0xfe, 0x01, 0xfe); FLESH, FLESH2 = H('#8a80a8'), H('#6a6288')
    for y in range(f.oy, f.oy + f.fh):
        for x in range(f.ox, f.ox + f.fw):
            if f.c(x, y) == MARK: f.set(x, y, CLEAR if y < f.y0 + f.ht * .5 else H('#1a1820'))
    # no face: any dark feature pixel enclosed by flesh becomes flesh
    for y in range(f.y0, f.neck + 3):
        for x in range(f.ox + 1, f.ox + f.fw - 1):
            if dark(f.c(x, y)) and sum(1 for dx, dy in ((0, 1), (0, -1), (1, 0), (-1, 0)) if f.c(x + dx, y + dy) in (FLESH[:3], FLESH2[:3])) >= 2: f.set(x, y, FLESH)
    fl = {FLESH[:3], FLESH2[:3]}
    for _ in range(2):
        kill = [(x, y) for y in range(f.oy, f.neck + 2) for x in range(f.ox, f.ox + f.fw)
                if dark(f.c(x, y)) and not any(f.c(x + dx, y + dy) in fl for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
        for q in kill: f.set(*q, CLEAR)
    _head_outline(f, [FLESH, FLESH2])
    f.measure()
    # a face in the torso: brow ridge, sunken sockets, two eyes, a nose crease and a wide mouth, all in his flesh
    LITE, SOCK, LID, MOUTH = H('#a89ec4'), H('#5a527a'), H('#3a3450'), H('#241f30')
    cy = f.neck + round(f.ht * .15); cx = (f.tx0 + f.tx1) // 2
    for ex in (cx - 6, cx + 5):
        for y in range(cy - 4, cy + 5):                       # sunken socket
            for x in range(ex - 5, ex + 6):
                if ((x - ex) / 5.2) ** 2 + ((y - cy) / 4.2) ** 2 <= 1 and f.a(x, y): f.set(x, y, SOCK)
        for x in range(ex - 5, ex + 6): f.set(x, cy - 5 + (abs(x - ex) > 3), LITE)   # brow ridge catching light
        f.rect(ex - 3, cy - 1, 7, 3, H('#d8d2e4')); f.set(ex - 4, cy, H('#b8b0cc')); f.set(ex + 4, cy, H('#b8b0cc'))   # almond eye
        f.set(ex - 3, cy + 1, SOCK); f.set(ex + 3, cy + 1, SOCK); f.set(ex - 3, cy - 1, SOCK); f.set(ex + 3, cy - 1, SOCK)
        f.rect(ex - 1, cy - 1, 3, 3, H('#40e0f0')); f.set(ex, cy, MAG)                                                # iris + pupil
        f.rect(ex - 4, cy - 2, 9, 1, LID); f.rect(ex - 2, cy + 2, 5, 1, LID)                                          # heavy lids
    for y in range(cy - 2, cy + 6): f.set(cx, y, SOCK)                     # crease where a nose would be
    f.set(cx - 1, cy + 5, LID); f.set(cx + 1, cy + 5, LID)
    my = cy + round(f.ht * .13)
    for x in range(cx - 7, cx + 8): f.set(x, my + (1 if abs(x - cx) < 4 else 0), MOUTH)   # wide lipless mouth
    for x in range(cx - 4, cx + 5): f.set(x, my + 2, LITE)
    # hooves: the shoes become cloven hooves
    yb = f.y1; cols = sorted({x for x in range(f.ox, f.ox + f.fw) for y in range(yb - 3, yb + 1) if f.a(x, y)})
    groups = []
    for x in cols:
        if groups and x - groups[-1][-1] <= 1: groups[-1].append(x)
        else: groups.append([x])
    for g in groups:
        if len(g) < 3: continue
        gx = (g[0] + g[-1]) // 2
        for y in range(yb - 4, yb + 1):
            for x in range(g[0] - 1, g[-1] + 2): f.set(x, y, CLEAR)
        f.rect(gx - 3, yb - 4, 7, 5, INK); f.rect(gx - 2, yb - 3, 5, 1, H('#5a5068')); f.rect(gx - 2, yb - 2, 5, 2, H('#2a2632')); f.set(gx, yb - 2, INK); f.set(gx, yb - 1, INK)
        f.rect(gx - 1, yb - 7, 3, 3, FLESH2)
    # pieces of him missing
    def gap(y, h, xa, xb):
        for yy in range(y, y + h):
            for x in range(xa, xb): f.set(x, yy, CLEAR)
        for x in range(xa, xb):
            if f.a(x, y - 1): f.set(x, y - 1, H('#40e0f0') if x % 3 else MAG)
            if f.a(x, y + h): f.set(x, y + h, MAG if x % 3 else H('#40e0f0'))
    mid = (f.x0 + f.x1) // 2
    gap(f.y0 + round(f.ht * .40), 2, mid + 2, f.x1 + 1)
    gap(f.y0 + round(f.ht * .63), 2, f.x0, mid)
    gap(f.y0 + round(f.ht * .80), 2, mid + 1, f.x1 + 1)
    f.rect(f.x1 + 3, f.y0 + round(f.ht * .40) - 3, 2, 2, FLESH2); f.set(f.x1 + 5, f.y0 + round(f.ht * .40) - 3, H('#40e0f0'))
    f.rect(f.x0 - 4, f.y0 + round(f.ht * .63) + 3, 2, 2, FLESH2)


COSTUME.update({'nano': (nano3, 1.0, 1.0), 'chrono': (chrono2, .94, 1.0), 'bernard': (bernard2, .9, 1.0)})


HAIR, SKIN = [], []


def apply(cid, im, anims, fw, fh, cmap=None):
    global HAIR, SKIN
    if cmap: HAIR[:] = [H(cmap[k])[:3] for k in ('#d6a851', '#b47538') if k in cmap]; SKIN[:] = [H(cmap[k])[:3] for k in ('#fca570', '#bd6a62') if k in cmap]
    if cid not in COSTUME: return
    fn, sx, sy = COSTUME[cid]
    for an in anims.values():
        for i in range(an['n']):
            ox, oy = i * fw, an['r'] * fh
            if sx != 1 or sy != 1: reshape(im, ox, oy, fw, fh, sx, sy)
            fr = F(im, ox, oy, fw, fh)
            if fr.ok: fn(fr)
