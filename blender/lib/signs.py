"""Sign/paper textures with Thai text (PIL + raqm, Loma font). Run with system python3: python3 lib/signs.py"""
import os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); T = os.path.join(B, 'tex'); F = os.path.join(B, 'fonts')
font = lambda s, bold=True: ImageFont.truetype(os.path.join(F, 'Loma-Bold.otf' if bold else 'Loma.otf'), s)

def grain(im, amt=10, seed=1):
    r = random.Random(seed); px = im.load(); w, h = im.size
    for _ in range(w * h // 6):
        x, y = r.randrange(w), r.randrange(h); c = px[x, y]; d = r.randint(-amt, amt); px[x, y] = tuple(max(0, min(255, v + d)) for v in c[:3]) + c[3:]
    return im

def sign(name, text, w, h, bg, fg, size, border=None, sub=None, subsize=None):
    im = Image.new('RGB', (w, h), bg); d = ImageDraw.Draw(im)
    if border: d.rectangle((8, 8, w - 9, h - 9), outline=border, width=10)
    f = font(size); y = h / 2 if not sub else h * 0.42
    d.text((w / 2, y), text, font=f, fill=fg, anchor='mm', language='th')
    if sub: d.text((w / 2, h * 0.78), sub, font=font(subsize or size // 2, False), fill=fg, anchor='mm', language='th')
    grain(im).save(os.path.join(T, name + '.png'))

def report(name, stamped):
    w, h = 900, 1200; im = Image.new('RGB', (w, h), (238, 233, 220)); d = ImageDraw.Draw(im)
    d.text((w / 2, 110), 'รายงานผลการบำเพ็ญประโยชน์', font=font(58), fill=(30, 30, 35), anchor='mm', language='th')
    d.line((80, 170, w - 80, 170), fill=(60, 60, 70), width=3)
    rows = [('ผู้ต้องโทษ', 'เงา (ของนายคนหนึ่ง)'), ('ข้อหา', 'คุกคามสะกดรอยตาม'), ('งานที่ได้รับ', 'ยืนบังแดดป้ายรถเมล์'), ('ชั่วโมงที่ต้องทำ', '500 ชั่วโมง'), ('ชั่วโมงที่ทำได้', '0 ชั่วโมง'), ('หมายเหตุ', 'หดหายตอนเที่ยงตรง')]
    for i, (k, v) in enumerate(rows):
        y = 260 + i * 120; d.text((90, y), k, font=font(40, False), fill=(70, 70, 80), anchor='lm', language='th')
        d.text((430, y), v, font=font(44), fill=(25, 25, 30), anchor='lm', language='th'); d.line((420, y + 36, w - 90, y + 36), fill=(170, 165, 150), width=2)
    if stamped:
        st = Image.new('RGBA', (560, 230), (0, 0, 0, 0)); sd = ImageDraw.Draw(st)
        sd.rounded_rectangle((10, 10, 550, 220), 24, outline=(196, 30, 36, 235), width=16)
        sd.text((280, 118), 'หนีงาน', font=font(130), fill=(196, 30, 36, 235), anchor='mm', language='th')
        r = random.Random(5); px = st.load()
        for _ in range(9000):
            x, y = r.randrange(560), r.randrange(230)
            if px[x, y][3]: px[x, y] = (196, 30, 36, r.randint(60, 200))
        st = st.rotate(-14, expand=True, resample=Image.BICUBIC); im.paste(st, (w // 2 - st.width // 2, 880 - st.height // 2), st)
    grain(im, 6).save(os.path.join(T, name + '.png'))

if __name__ == '__main__':
    sign('sign_busstop', 'ป้ายรถเมล์', 900, 300, (22, 70, 140), (245, 245, 240), 120, border=(245, 245, 240), sub='สาย 8 · 29 · 510', subsize=56)
    sign('sign_prison', 'เรือนจำกลาง', 1400, 260, (60, 64, 60), (230, 226, 210), 140)
    sign('sign_interro', 'ห้องสอบสวน', 700, 180, (230, 228, 218), (40, 40, 45), 84)
    sign('sign_court', 'ศาลแขวง', 900, 240, (92, 52, 28), (232, 196, 120), 120)
    sign('sign_clock12', '12:00', 400, 200, (20, 20, 22), (255, 120, 60), 140)
    sign('sign_clock10', '10:15', 400, 200, (20, 20, 22), (255, 120, 60), 140)
    report('report_blank', False); report('report_stamped', True)
    print('signs ok')
