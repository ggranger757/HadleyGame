"""Cast line-up at true in-game relative scale. usage: preview.py [ids] [anim] [out]"""
import json, sys
from PIL import Image, ImageDraw
s = open('js/01-sprites.js').read(); M = json.loads(s[s.index('{', s.index('TM.SPR')):s.rindex('}') + 1])
names = sys.argv[1].split(',') if len(sys.argv) > 1 and sys.argv[1] else list(M)
anim = sys.argv[2] if len(sys.argv) > 2 else 'idle'
out = sys.argv[3] if len(sys.argv) > 3 else '/home/claude/work/tm2_chars.png'
Z = 3; cells = []
for n in names:
    m = M[n]; im = Image.open(f'assets/sprites/{n}.png'); an = m['anims'].get(anim) or m['anims']['idle']
    fr = im.crop((0, an['r'] * m['fh'], m['fw'], (an['r'] + 1) * m['fh']))
    bb = fr.getbbox(); fr = fr.crop(bb)
    if m['face'] == 'left': fr = fr.transpose(Image.FLIP_LEFT_RIGHT)
    k = m['scale'] * Z; fr = fr.resize((max(1, round(fr.width * k)), max(1, round(fr.height * k))), Image.NEAREST)
    cells.append((n, fr))
W = sum(max(130, f.width + 20) for _, f in cells); Hh = max(f.height for _, f in cells) + 40
C = Image.new('RGBA', (W, Hh), (70, 74, 86, 255)); d = ImageDraw.Draw(C); x = 0
for n, f in cells:
    w = max(130, f.width + 20); C.paste(f, (x + (w - f.width) // 2, Hh - 24 - f.height), f); d.text((x + 6, Hh - 18), n, fill='white'); x += w
C.save(out); print(out, C.size)
