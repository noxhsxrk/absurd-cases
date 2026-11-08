#!/usr/bin/env python3
"""absurd-cases EP5 premix (คดีวางกับดักลื่น). No music. Narration is the mix; ambience ≈ −40 dBFS under it; spot SFX land on cuts/events.
Round 1 is fully synthesized here (no AudioLDM2 takes yet). If public/absurd-cases/ep5/sfx_ai/<name>_r1.wav exists it replaces the synth for that cue
(prompts in episodes/absurd-cases/sfx/gen_sfx_ep5.py, run on the PC)."""
import json, sys, pathlib, subprocess, re, wave
import numpy as np
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, db, rms

TL = json.load(open('public/absurd-cases/ep5/ep5_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}; T = lambda n: SH[n]['t0']
AI = pathlib.Path('public/absurd-cases/ep5/sfx_ai')
g = np.random.default_rng(5)
nz = lambda sec: g.standard_normal(int(sec * R))
def ai(name, synth):
    p = AI / f'{name}_r1.wav'; return read(p) if p.exists() else synth()
def edge(x, a=0.003, b=0.05):
    x = x.copy(); n0, n1 = min(len(x), int(a * R)), min(len(x), int(b * R))
    if n0: x[:n0] *= np.linspace(0, 1, n0)
    if n1: x[-n1:] *= np.linspace(1, 0, n1)
    return x
def tt(sec): return np.arange(int(sec * R)) / R
def clunk(f=70, sec=0.32, click=0.5):
    t = tt(sec); return edge(np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t * 40))) * np.exp(-t * 16) + hp(nz(sec), 900) * np.exp(-t * 120) * click)
def click(sec=0.05):
    t = tt(sec); return edge(hp(nz(sec), 1800) * np.exp(-t * 170) + 0.5 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 220), 0.0005, 0.01)
def whoosh(sec=0.45, lo=500, hi=5200):
    u = np.linspace(0, 1, int(sec * R)); return edge(bp(nz(sec), lo, hi) * np.sin(np.pi * u) ** 1.5, 0.01, 0.03)
def slip_squeak(sec=0.32, f0=1400, f1=3200):
    """the cartoon slip: a rubbery rising squeak over a wet swish"""
    t = tt(sec); f = f0 + (f1 - f0) * (t / sec) ** 0.6; ph = 2 * np.pi * np.cumsum(f) / R
    sq = np.tanh(2 * np.sin(ph)) * np.sin(np.pi * t / sec) ** 0.8
    return edge(0.5 * sq + 0.6 * bp(nz(sec), 1200, 7000) * np.sin(np.pi * t / sec))
def splat(sec=0.22):
    t = tt(sec); return edge(np.sin(2 * np.pi * 120 * t) * np.exp(-t * 30) + 0.5 * bp(nz(sec), 700, 4500) * np.exp(-t * 40), 0.0005, 0.03)
def thud(f=55, sec=0.45):
    t = tt(sec); return edge(np.sin(2 * np.pi * f * t * (1 + 0.8 * np.exp(-t * 30))) * np.exp(-t * 9) + 0.35 * bp(nz(sec), 200, 1800) * np.exp(-t * 35))
def tung():
    t = tt(1.3); f = 46 + 125 * np.exp(-t * 24); ph = 2 * np.pi * np.cumsum(f) / R
    return edge(np.tanh(2.2 * np.sin(ph) * np.exp(-t * 4.6)) + 0.28 * np.sin(2 * ph + 0.4) * np.exp(-t * 7) + 0.55 * bp(nz(1.3), 900, 5200) * np.exp(-t * 95), 0.0005, 0.2)
def door_crash():
    t = tt(0.9); body = np.sin(2 * np.pi * 82 * t) * np.exp(-t * 10) + 0.6 * np.sin(2 * np.pi * 163 * t) * np.exp(-t * 18)
    crack = bp(nz(0.9), 300, 6000) * np.exp(-t * 14); slam = np.zeros_like(t); i = int(0.3 * R); slam[i:] = thud(48, 0.9 - 0.3)[:len(t) - i] * 1.2
    return edge(body + 0.9 * crack + slam)
def metal(fund=180, sec=1.2, decay=3.5):
    """bars/door clang: inharmonic partials"""
    t = tt(sec); return edge(sum(np.sin(2 * np.pi * fund * r * t + i) * np.exp(-t * decay * (1 + i * 0.4)) / (1 + i * 0.6) for i, r in enumerate((1, 2.76, 5.4, 8.93, 13.3))) + 0.4 * hp(nz(sec), 2000) * np.exp(-t * 60))
def ratchet(n=7, sec=0.28):
    o = np.zeros(int(sec * R) + 2000)
    for k in range(n): c = click(0.03) * (0.6 + 0.4 * (k == n - 1)); i = int(k * sec / n * R); o[i:i + len(c)] += c
    return edge(o + 0.6 * np.pad(clunk(320, 0.1, 0.9), (int(sec * R), 0))[:len(o)])
def electric(sec):
    t = tt(sec); f = 120 * (1 + 0.02 * np.sin(2 * np.pi * 37 * t)); ph = 2 * np.pi * np.cumsum(f) / R
    hum = np.tanh(3 * sum(np.sin(k * ph) / k for k in range(1, 26))); n = len(t)
    gate = np.repeat(g.random(n // 240 + 1) > 0.4, 240)[:n]; snaps = np.zeros(n)
    for i in g.integers(0, max(1, n - 400), int(sec * 40)): snaps[i:i + 300] += g.choice([-1, 1]) * np.exp(-np.arange(300) / 45)
    return edge(bp(hum, 90, 6500) * 0.5 + bp(nz(sec), 1500, 7500) * gate * 0.7 + snaps, 0.005, 0.05)
def creak(sec=0.9, f0=420, f1=300):
    """steel tongs closing: a slow squeaky stick-slip creak (กึก… แอ๊ดดด)"""
    t = tt(sec); f = f0 + (f1 - f0) * t / sec + 25 * np.sin(2 * np.pi * 5 * t); ph = 2 * np.pi * np.cumsum(f) / R
    stick = (np.sin(2 * np.pi * 23 * t) > 0.3).astype(float); x = np.tanh(3 * np.sin(ph)) * (0.4 + 0.6 * stick)
    o = np.concatenate([clunk(260, 0.12, 1.0), np.zeros(int(0.15 * R)), bp(x, 300, 4000) * np.sin(np.pi * t / sec) ** 0.5]); return edge(o)
def pop_bubble(f=520, sec=0.12):
    t = tt(sec); return edge(np.sin(2 * np.pi * f * t * np.exp(-t * 14)) * np.exp(-t * 40) + 0.5 * hp(nz(sec), 2500) * np.exp(-t * 130), 0.0005, 0.02)
def blub(sec=0.22, f0=280, f1=720):
    """ปุด: a wet bubble rising (pitch up)"""
    t = tt(sec); f = f0 + (f1 - f0) * (t / sec) ** 2; ph = 2 * np.pi * np.cumsum(f) / R; return edge(np.sin(ph) * np.sin(np.pi * t / sec) ** 0.6, 0.002, 0.03)
def fizz(sec):
    t = tt(sec); n = len(t); x = hp(nz(sec), 3000) * 0.3; pops = np.zeros(n)
    for i in g.integers(0, max(1, n - 1200), int(sec * 90)): p = pop_bubble(g.uniform(900, 2600), 0.02); pops[i:i + len(p)] += p * g.uniform(0.2, 0.7)
    return x + pops
def slide_long(sec=1.4):
    """ฟรี้ดดด: soap gliding on wet tiles — a squeaky band of noise with a slowly falling centre"""
    t = tt(sec); u = t / sec; x = bp(nz(sec), 900, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) ** 2
    f = 2600 - 900 * u; sq = np.sin(2 * np.pi * np.cumsum(f) / R) * 0.25
    return edge((x + sq) * np.minimum(1, u * 8) * (1 - u) ** 0.4, 0.01, 0.2)
def scrub(sec=2.6, rate=1.75):
    """ฟืด-ฟืด: soap on skin, wet friction strokes"""
    t = tt(sec); stroke = np.abs(np.sin(np.pi * rate * t)) ** 3
    return bp(nz(sec), 1500, 7000) * stroke * 0.8 + bp(nz(sec), 400, 1500) * stroke * 0.3
def beep(f=1400, sec=0.09):
    t = tt(sec); return edge(np.sin(2 * np.pi * f * t), 0.003, 0.02)
def siren(sec, lo=640, hi=980, per=1.1):
    t = tt(sec); f = lo + (hi - lo) * (0.5 + 0.5 * np.sin(2 * np.pi * t / per)); ph = 2 * np.pi * np.cumsum(f) / R
    return lp(np.tanh(1.5 * (np.sin(ph) + 0.3 * np.sin(2 * ph))), 4000)
def boots(sec=1.4, n=10, seed=3):
    r = np.random.default_rng(seed); o = np.zeros(int((sec + 0.3) * R))
    for k in range(int(n * sec)):
        s = clunk(r.uniform(70, 110), 0.12, 0.7) * r.uniform(0.6, 1.0); i = int(max(0, k / n + r.uniform(-0.03, 0.03)) * R); o[i:i + len(s)] += s[:len(o) - i]
    return o
def bed_noise(sec, lo, hi, mod=0.0, seed=0):
    r = np.random.default_rng(seed); x = bp(r.standard_normal(int(sec * R)), lo, hi, 2); t = tt(sec)
    return x * (1 + mod * np.sin(2 * np.pi * 0.17 * t + seed))
def hum(sec, f=100):
    t = tt(sec); return sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3)) + 0.3 * bp(np.random.default_rng(9).standard_normal(len(t)), 200, 1200, 2)
def to_st(x): return np.stack([x, x], 1)

def take(name, synth, dur=None, trim=True):
    """AI take (AudioLDM2, best CLAP rank) if present, else the synth; leading silence trimmed, cut to dur, edges faded"""
    x = ai(name, synth)
    if trim:
        e = np.convolve(np.abs(x), np.ones(240) / 240, 'same'); i = int(np.argmax(e > np.max(e) * 0.08)); x = x[max(0, i - 120):]
    if dur: x = x[:int(dur * R)]
    return edge(x, 0.004, min(0.08, len(x) / R * 0.2))
def loopto(x, sec):
    n = int(sec * R); return np.tile(x, n // len(x) + 1)[:n]

M = Mix(seconds=TOTAL, sfx_dir=str(AI))
vo = read('public/absurd-cases/ep5/ep5_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)
M.put(vo, 0, 0, 0.74)
for r in json.load(open('episodes/absurd-cases/ep5_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0
def P(x, pk, t, pan=0.0):
    x = peak_to(x, pk * 0.9)
    if t < 0: x = x[int(-t * R):]; t = 0
    M.put(x, t, pan)
BED = 0.0038
# ---- ambience beds, on the cuts
M.bed(to_st(rms_to(loopto(take('shower_bed', lambda: bed_noise(12, 800, 9000, 0.15, 1), trim=False), 14), BED * 1.6)), 0, EV['kick'] + 0.2, width=0.6, xf=0.5, fade=0.05)
M.bed(to_st(rms_to(bed_noise(30, 120, 900, 0.1, 2), BED * 0.7)), EV['kick'], T('interro'), width=0.8, xf=0.5, fade=0.05)
M.bed(to_st(rms_to(hum(8, 100), BED)), T('interro'), T('court'), width=0.3, xf=0.4, fade=0.03)
M.bed(to_st(rms_to(bed_noise(8, 200, 2500, 0.2, 3), BED * 0.8)), T('court'), T('cell18'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(bed_noise(20, 80, 1500, 0.1, 4), BED)), T('cell18'), T('report'), width=0.8, xf=0.3, fade=0.3)
M.bed(to_st(rms_to(loopto(take('fan_hum', lambda: hum(10, 58), trim=False), 12), BED * 1.5)), T('fan19'), T('report'), width=0.2, xf=0.3, fade=0.3)
# ---- shower
M.put(rms_to(loopto(take('soap_scrub', lambda: scrub(3), trim=False), EV['slip'] - 0.05), 0.014), 0.0, -0.1)
P(take('soap_slip', lambda: whoosh(0.32, 900, 6000), 1.0), 0.14, EV['slip'] - 0.02, -0.1); P(splat(), 0.16, EV['slip'] + 0.34); P(slide_long(0.6), 0.07, EV['slip'] + 0.36, 0.1)
P(tung(), 0.5, EV['plate'])
P(beep(1300), 0.07, EV['phoneUp'] + 0.1); P(click(), 0.1, EV['press']); P(beep(1650, 0.12), 0.06, EV['press'] + 0.05)
for k in range(3): P(clunk(90, 0.25, 0.8), 0.22, EV['bang'] + k * 0.32)          # bangs on the door
# ---- the raid
P(take('door_crash', door_crash, 1.8), 0.45, EV['kick']); P(thud(45, 0.6), 0.3, EV['kick'] + 0.3)
s = siren(T('interro') - EV['siren'], 700, 1050, 0.9); s *= np.interp(np.arange(len(s)) / R, [0, 0.15, len(s) / R - 0.3, len(s) / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(s, 0.006)), EV['siren'], 1.0, width=0.6)
M.put(rms_to(take('swat_boots', lambda: boots(1.8, 12), 2.2), 0.035), EV['kick'] + 0.1, 0.2); M.put(rms_to(boots(1.4, 9, 8), 0.02), T('domino'), -0.2)
for i in range(5):
    ts = EV['slip0'] + i * 0.16
    P(slip_squeak(0.25, 1300 + i * 120, 3000 + i * 150), 0.09, ts, -0.4 + i * 0.2); P(thud(50 + i * 4, 0.5), 0.24, ts + 0.42, -0.4 + i * 0.2)
P(take('slip_falls', lambda: thud(50, 1.0), 2.4), 0.3, EV['slip0'] + 0.3, 0)
P(clunk(500, 0.08, 0.8), 0.08, EV['slip0'] + 0.18)          # the wet-floor sign tips over
M.put(rms_to(loopto(take('taser', lambda: electric(3), trim=False), T('tongs') - EV['taser']), 0.035), EV['taser'], 0)
P(take('tongs_creak', lambda: creak(0.9), 1.2), 0.14, EV['grab'] - 0.05)
P(click(0.04), 0.1, EV['lock']); P(clunk(400, 0.08, 0.9), 0.12, EV['lock'])
P(np.concatenate([pop_bubble(300, 0.1), whoosh(0.3, 1500, 7000)]), 0.18, EV['squirt']); P(splat(0.18), 0.14, EV['squirt'] + 0.2, 0.5)
hc = take('handcuffs', lambda: ratchet(6, 0.16), 0.4)
for k in range(3): P(hc, 0.16, EV['cage'] + k * 0.13)
# ---- interrogation: the answer is two bubbles, ~4 dB over the voice around it
vo_l = rms(M.mix[int(LN['l010']['t0'] * R):int(LN['l010']['t1'] * R)])
ans = np.zeros(int(0.9 * R)); b1 = blub(0.24); ans[:len(b1)] += b1
p1 = pop_bubble(560); i = int((EV['pop'] - EV['answer']) * R); ans[i:i + len(p1)] += p1 * 1.2
p2 = pop_bubble(740, 0.1); j = int((EV['pop'] - EV['answer'] + 0.24) * R); ans[j:j + len(p2)] += p2
M.put(rms_to(ans, vo_l * 10 ** (4 / 20) * 0.6), EV['answer'], 0)
P(take('bubble_pop', lambda: pop_bubble(560), 0.8), 0.12, EV['pop'] - 0.05)
P(thud(70, 0.5) * 0.6 + metal(260, 0.5, 9)[:int(0.5 * R)] * 0.2, 0.28, EV['gavel'])
P(whoosh(0.3), 0.06, EV['peel']); P(clunk(260, 0.08, 0.6), 0.07, EV['peel'] + 0.45); P(clunk(160, 0.12, 0.9), 0.12, EV['stick'])
P(take('cell_door', lambda: metal(150, 1.4, 3), 1.6), 0.28, EV['clang'])
P(clunk(200, 0.1, 0.9), 0.08, EV['fanTurn'])
M.put(rms_to(loopto(take('foam_fizz', lambda: fizz(6), trim=False), T('report') - EV['foam']), 0.014) * np.interp(np.arange(int((T('report') - EV['foam']) * R)) / R, [0, 0.8, 50], [0.2, 1, 1]), EV['foam'], 0.1)
M.put(rms_to(whoosh(1.6, 300, 5000), 0.012), EV['foam'] - 0.1, -0.4)
P(slide_long(EV['chase'] - EV['glide'] + 0.2), 0.16, EV['glide'])
P(slide_long(1.2), 0.12, EV['chase'], 0.3)
P(take('guard_slip', lambda: thud(48, 0.6), 1.5), 0.32, EV['guardSlip'], -0.2)
ps_ = loopto(take('prison_alarm', lambda: siren(6, 520, 820, 1.4), trim=False), T('report') - EV['prisonSiren'] + 0.4); ps_ *= np.interp(np.arange(len(ps_)) / R, [0, 0.1, len(ps_) / R - 0.4, len(ps_) / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(ps_, 0.009)), EV['prisonSiren'], 1.0, width=0.7)
# ---- the report: paper rustle on the cut, the stamp, then silence to the end
P(bp(nz(0.25), 1500, 8000) * np.hanning(int(0.25 * R)), 0.05, T('report'))
P(thud(90, 0.35) + 0.5 * bp(nz(0.35), 300, 3000) * np.exp(-tt(0.35) * 40), 0.36, EV['stamp'] + 0.1)

OUT = pathlib.Path('public/absurd-cases/ep5/mix/ep5_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
d = lp(np.convolve(M.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2); M.beds *= (1 - 0.7 * np.clip(d, 0, 1))[:, None]
m = (M.mix + M.beds)[:int(TOTAL * R)]
st = int((EV['stamp'] + 0.6) * R); m[st:] *= np.linspace(1, 0, len(m) - st)[:, None] ** 2   # silence after the stamp
m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
w_ = wave.open(str(RAW), 'wb'); w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(R); w_.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w_.close()
COMP = 'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=180'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(RAW), '-af', COMP + ',ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); gain = -15 - I
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW), '-af', f'{COMP},volume={gain:.2f}dB,alimiter=limit=0.84:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le', str(OUT)], check=True); RAW.unlink()
print('gain', round(gain, 2)); check(OUT)
