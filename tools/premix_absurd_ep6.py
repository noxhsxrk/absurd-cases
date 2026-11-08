#!/usr/bin/env python3
"""absurd-cases EP6 premix (คดีบังคับใช้แรงงาน). No music. Narration is the mix; ambience ≈ −40 dBFS under it; spot SFX land on cuts/events.
Round 1 is fully synthesized here (no AudioLDM2 takes yet). If public/absurd-cases/ep6/sfx_ai/<name>_r1.wav exists it replaces the synth for that cue
(prompts in episodes/absurd-cases/sfx/gen_sfx_ep6.py, run on the PC)."""
import json, sys, pathlib, subprocess, re, wave
import numpy as np
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, db, rms

TL = json.load(open('public/absurd-cases/ep6/ep6_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}; T = lambda n: SH[n]['t0']
AI = pathlib.Path('public/absurd-cases/ep6/sfx_ai')
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

def traffic(sec, seed=11):
    r = np.random.default_rng(seed); x = bed_noise(sec, 80, 2500, 0.15, seed); n = len(x); o = x * 0.6
    for k in range(int(sec / 1.6)):
        p = whoosh(1.4, 200, 3000) * r.uniform(0.4, 1.0); i = int(r.uniform(0, sec - 1.4) * R); o[i:i + len(p)] += p
    return o
def engine(sec, f=42):
    t = tt(sec); return np.tanh(2 * sum(np.sin(2 * np.pi * f * k * t * (1 + 0.01 * np.sin(2 * np.pi * 0.7 * t))) / k for k in (1, 2, 3, 5))) + 0.3 * bp(nz(sec), 60, 600)
def rotor(sec, rate=11):
    t = tt(sec); return bp(nz(sec), 60, 900) * (0.4 + 0.6 * np.abs(np.sin(np.pi * rate * t)) ** 4)
def saw_whine(sec):
    t = tt(sec); f = 2400 + 300 * np.sin(2 * np.pi * 3 * t); ph = 2 * np.pi * np.cumsum(f) / R
    return np.tanh(2 * (np.sin(ph) + 0.4 * np.sin(2.01 * ph))) * 0.5 + bp(nz(sec), 2000, 8000) * (0.5 + 0.5 * (np.sin(2 * np.pi * 9 * t) > 0)) * 0.6
def knee_crack():
    o = np.zeros(int(0.2 * R))
    for k, d in enumerate((0, 0.025, 0.06)): c = click(0.03) * (1 - k * 0.2); i = int(d * R); o[i:i + len(c)] += c
    return edge(o + 0.6 * clunk(180, 0.2, 1.0)[:len(o)])
def wind_whistle(sec):
    t = tt(sec); f = 520 + 140 * np.sin(2 * np.pi * 0.6 * t) + 60 * np.sin(2 * np.pi * 2.3 * t); ph = 2 * np.pi * np.cumsum(f) / R
    env = np.sin(np.pi * t / sec) ** 0.7
    return (0.5 * np.sin(ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 4.7 * t)) + bp(nz(sec), 400, 2400) * 0.8) * env
def swarm_buzz(sec):
    t = tt(sec); o = np.zeros(len(t))
    for k in range(9): f = 420 + k * 23 + 15 * np.sin(2 * np.pi * (0.3 + k * 0.07) * t + k); o += np.tanh(2 * np.sin(2 * np.pi * np.cumsum(f) / R + k))
    return bp(o / 9, 250, 5000)

M = Mix(seconds=TOTAL, sfx_dir=str(AI))
vo = read('public/absurd-cases/ep6/ep6_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)
M.put(vo, 0, 0, 0.74)
for r in json.load(open('episodes/absurd-cases/ep6_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0
def P(x, pk, t, pan=0.0):
    x = peak_to(x, pk * 0.9)
    if t < 0: x = x[int(-t * R):]; t = 0
    M.put(x, t, pan)
BED = 0.0038
# ---- beds
M.bed(to_st(rms_to(traffic(14), BED * 1.5)), 0, T('cranes'), width=0.8, xf=0.4, fade=0.05)
M.bed(to_st(rms_to(engine(12) * 0.6 + bed_noise(12, 100, 1500, 0.1, 3) * 0.4, BED * 1.6)), T('cranes'), T('courtExt'), width=0.7, xf=0.4, fade=0.05)
M.bed(to_st(rms_to(bed_noise(5, 200, 3000, 0.2, 4), BED * 0.8)), T('courtExt'), T('courtIn'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(bed_noise(10, 200, 2500, 0.2, 5), BED * 0.8)), T('courtIn'), T('cellPush'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(hum(4, 58) + bed_noise(4, 300, 3000, 0.0, 6) * 0.5, BED * 1.2)), T('cellPush'), T('prisonFront'), width=0.3, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(bed_noise(10, 150, 4000, 0.25, 7), BED)), T('prisonFront'), T('notice') + 0.3, width=0.8, xf=0.3, fade=0.3)
# ---- street
P(whoosh(0.9, 200, 3500), 0.12, EV['cars'], -0.4)
P(knee_crack(), 0.36, EV['knee'])
P(tung(), 0.55, EV['plate']); P(thud(40, 0.9), 0.3, EV['plate'] + 0.05)
P(beep(1300), 0.07, EV['phoneUp'] + 0.1); P(click(), 0.1, EV['press']); P(beep(1650, 0.12), 0.06, EV['press'] + 0.05)
s = siren(T('courtExt') - EV['siren'], 700, 1050, 0.9); s *= np.interp(np.arange(len(s)) / R, [0, 0.15, len(s) / R - 0.3, len(s) / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(s, 0.006)), EV['siren'], 1.0, width=0.6)
M.put(rms_to(engine(2.0, 36), 0.03), EV['cranes'], -0.2)
hr = rotor(T('lanes') + 1 - T('heli')); M.put(rms_to(hr, 0.02), T('heli') - 0.3, 0.3)
for i in range(16): P(clunk(600 + i * 15, 0.06, 0.6), 0.05, EV['cones'] + i * 0.06, -0.6 + i * 0.08)
sw = saw_whine(T('cuffs') - EV['saw']); M.put(rms_to(sw, 0.035), EV['saw'], 0); P(clunk(220, 0.2, 1.0), 0.18, EV['sawCut'])
M.put(rms_to(engine(1.6, 30), 0.025), EV['lift'], 0)
P(metal(70, 1.6, 2.2), 0.42, EV['cuff']); P(thud(38, 0.8), 0.3, EV['cuff'])
# ---- court
for k in range(6): P(clunk(300 + k * 40, 0.1, 0.8), 0.08, EV['rubble'] + k * 0.2, 0.6 if k % 2 else -0.6)
P(bp(nz(0.3), 200, 1500) * np.hanning(int(0.3 * R)), 0.06, EV['ahem'])
vo_l = rms(M.mix[int(LN['l010']['t0'] * R):int(LN['l010']['t1'] * R)])
ans = wind_whistle(1.1); M.put(rms_to(ans, vo_l * 10 ** (4 / 20) * 0.5), EV['answer'], 0)
P(metal(880, 0.6, 6), 0.3, EV['gavel'])
# ---- cells, prison
for k in range(3): P(thud(60, 0.4) + 0.5 * metal(160, 0.4, 8)[:int(0.4 * R)], 0.3, EV['thump'] + k * 0.55)
P(metal(120, 1.4, 3), 0.25, EV['chain'])
dur = EV['notice'] - EV['swarm']; bz = swarm_buzz(dur + 0.4); bz *= np.interp(np.arange(len(bz)) / R, [0, 0.8, len(bz) / R - 0.4, len(bz) / R], [0, 1, 1, 0])
M.put(rms_to(bz, 0.02), EV['swarm'], 0.2)
P(bp(nz(0.25), 1500, 8000) * np.hanning(int(0.25 * R)), 0.05, T('notice'))
P(thud(90, 0.35) + 0.5 * bp(nz(0.35), 300, 3000) * np.exp(-tt(0.35) * 40), 0.36, EV['stamp'] + 0.1)

OUT = pathlib.Path('public/absurd-cases/ep6/mix/ep6_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
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
