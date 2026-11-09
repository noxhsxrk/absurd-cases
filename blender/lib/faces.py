"""Original ink-drawn faces for the box cast (our own design: round bean eyes with a dot pupil, soft brows, stubble dots,
pink hatched cheeks). Drawn with PIL at 4x then downsampled for a soft hand-inked line."""
from PIL import Image, ImageDraw, ImageFilter
import random, math

def face(path, skin=(217, 168, 121), mode='open', stubble=0.9, brows=0.2, seed=7, W=512, H=600):
    S = 4; w, h = W * S, H * S; im = Image.new('RGB', (w, h), skin); d = ImageDraw.Draw(im); r = random.Random(seed)
    ink = (34, 26, 22); lw = 7 * S
    # paper grain + soft value variation
    for _ in range(9000):
        x, y = r.uniform(0, w), r.uniform(0, h); c = r.uniform(-10, 8)
        d.point((x, y), fill=tuple(max(0, min(255, int(v + c))) for v in skin))
    ex = [w * 0.31, w * 0.69]; ey = h * 0.42
    for i, x in enumerate(ex):
        if mode in ('blink', 'closed'):
            d.arc((x - 52 * S, ey - 30 * S, x + 52 * S, ey + 30 * S), 10, 170, fill=ink, width=lw)
        else:
            open_ = 1.25 if mode == 'wide' else 0.62 if mode == 'half' else 1.0
            ry = 34 * S * open_; rx = 46 * S
            d.ellipse((x - rx, ey - ry, x + rx, ey + ry), fill=(250, 248, 240), outline=ink, width=lw)
            pr = 13 * S; px = x + (6 * S if i == 0 else -6 * S)
            d.ellipse((px - pr, ey - pr + 4 * S, px + pr, ey + pr + 4 * S), fill=ink)
            if mode == 'half':   # heavy upper lid: deadpan
                d.rectangle((x - rx - 4 * S, ey - ry - 6 * S, x + rx + 4 * S, ey - ry * 0.15), fill=skin)
                d.line((x - rx, ey - ry * 0.15, x + rx, ey - ry * 0.15), fill=ink, width=lw)
        # brow: a slightly wobbly ink stroke
        bx0, bx1 = x - 58 * S, x + 58 * S; by = ey - (78 + 18 * brows) * S
        tilt = (1 if i == 0 else -1) * 10 * S * (-brows)
        pts = [(bx0 + (bx1 - bx0) * t, by - math.sin(t * math.pi) * 14 * S + tilt * (t - 0.5) * 2 + r.uniform(-2, 2) * S) for t in [k / 10 for k in range(11)]]
        d.line(pts, fill=ink, width=9 * S, joint='curve')
    # nose: a small hook
    d.line([(w * 0.5, h * 0.47), (w * 0.47, h * 0.58), (w * 0.52, h * 0.6)], fill=ink, width=lw, joint='curve')
    # mouth
    my = h * 0.72
    if mode == 'talk': d.ellipse((w * 0.42, my - 22 * S, w * 0.58, my + 30 * S), fill=(70, 30, 28), outline=ink, width=lw)
    elif mode == 'O': d.ellipse((w * 0.46, my - 20 * S, w * 0.54, my + 22 * S), fill=(70, 30, 28), outline=ink, width=lw)
    else: d.line([(w * 0.40, my), (w * 0.5, my + 4 * S), (w * 0.60, my - 2 * S)], fill=ink, width=lw, joint='curve')
    # cheeks: pink hatch
    for cx in (w * 0.2, w * 0.8):
        for k in range(6):
            x0 = cx - 40 * S + k * 14 * S; d.line((x0, h * 0.56, x0 + 22 * S, h * 0.5), fill=(226, 120, 110), width=5 * S)
    # stubble: dots on the lower third
    n = 0
    while n < int(240 * stubble):
        x = r.uniform(w * 0.12, w * 0.88); y = r.uniform(h * 0.62, h * 0.96)
        if abs(x - w * 0.5) < w * 0.13 and abs(y - my) < 26 * S: continue
        edge = min(x - w * 0.12, w * 0.88 - x) / (w * 0.15)          # thinner toward the cheeks
        if r.random() > min(1.0, 0.35 + edge): continue
        rr = r.uniform(1.4, 2.4) * S; d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(78, 62, 50)); n += 1
    im = im.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.4))
    im.save(path); return path

def hair(path, color=(26, 21, 19), W=512, H=512, seed=3):
    """messy hatched hair for the head-top box"""
    S = 2; w, h = W * S, H * S; im = Image.new('RGB', (w, h), color); d = ImageDraw.Draw(im); r = random.Random(seed)
    for _ in range(1400):
        x, y = r.uniform(0, w), r.uniform(0, h); L = r.uniform(18, 46) * S; a = r.uniform(-0.6, 0.6) + math.pi / 2
        c = tuple(min(255, v + r.randint(10, 40)) for v in color)
        d.line((x, y, x + math.cos(a) * L, y + math.sin(a) * L), fill=c, width=3 * S)
    im.resize((W, H), Image.LANCZOS).save(path); return path

if __name__ == '__main__':
    for m in ('open', 'half', 'blink', 'wide', 'talk', 'O'): face(f'/home/claude/blend/tex/nai_{m}.png', mode=m)
    hair('/home/claude/blend/tex/nai_hair.png')
