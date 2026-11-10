#!/usr/bin/env python3
"""absurd-cases EP10 premix (คดีเราเตอร์ Wi-Fi). Stable Audio Open foley from the shared store (tools/sfx_index.py pull) + 5 new EP10 takes. No music. Narration is the mix; ambience ≈ −40 dBFS under it; spot SFX on cuts/events.
Synth recipes shared with EP6 (copied). An AudioLDM2 take at public/absurd-cases/ep8/sfx_ai/<name>_r1.wav replaces the synth for that cue."""
import json, sys, pathlib, subprocess, re, wave
import numpy as np
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, db, rms

TL = json.load(open('public/absurd-cases/ep10/ep10_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}; T = lambda n: SH[n]['t0']
AI = pathlib.Path('public/absurd-cases/ep10/sfx_sao')     # Stable Audio Open takes, best CLAP rank = _r1
g = np.random.default_rng(5)
nz = lambda sec: g.standard_normal(int(sec * R))
SC = json.load(open(AI / 'scores.json')) if (AI / 'scores.json').exists() else {}
MIN_SCORE = 0.05   # a CLAP score below this means the take missed the cue: use the synth
def ai(name, synth):
    p = AI / f'{name}_r1.wav'; ok = p.exists()
    return read(p) if ok else synth()
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

def take(name, synth, dur=None, trim=True):
    """AI take (AudioLDM2, best CLAP rank) if present, else the synth; leading silence trimmed, cut to dur, edges faded"""
    x = ai(name, synth)
    if trim:
        e = np.convolve(np.abs(x), np.ones(240) / 240, 'same'); i = int(np.argmax(e > np.max(e) * 0.08)); x = x[max(0, i - 120):]
    if dur: x = x[:int(dur * R)]
    return edge(x, 0.004, min(0.08, len(x) / R * 0.2))
def loopto(x, sec):
    n = int(sec * R); return np.tile(x, n // len(x) + 1)[:n]


def thunder(sec=2.2, crack=1.0):
    t = tt(sec); c = hp(nz(sec), 1200) * np.exp(-t * 18) * crack
    roll = lp(nz(sec), 220) * (np.exp(-t * 2.2) * (1 + 0.6 * np.sin(2 * np.pi * 3.1 * t))) * 3
    return edge(c + roll + 0.6 * thud(36, sec)[:len(t)], 0.0005, 0.4)
def zip_(sec=0.5, f0=300, f1=3000):
    t = tt(sec); f = f0 * (f1 / f0) ** (t / sec); ph = 2 * np.pi * np.cumsum(f) / R
    return edge(np.tanh(2 * np.sin(ph)) * 0.5 + electric(sec) * 0.6)
def spinup(sec, f0=90, f1=1400):
    t = tt(sec); f = f0 + (f1 - f0) * (t / sec) ** 1.6; ph = 2 * np.pi * np.cumsum(f) / R
    return edge(np.tanh(1.5 * (np.sin(ph) + 0.4 * np.sin(2.02 * ph))) * 0.5 + bp(nz(sec), 400, 6000) * (t / sec) * 0.6, 0.05, 0.05)
def rain(sec, seed=21):
    return bed_noise(sec, 1800, 9000, 0.1, seed) + 0.5 * bed_noise(sec, 200, 900, 0.3, seed + 1)
def wind(sec, seed=31):
    return bed_noise(sec, 150, 2500, 0.6, seed)
def alarm(sec):
    return siren(sec, 380, 720, 3.2)
def squeal(sec=1.2):
    t = tt(sec); f = 1900 + 200 * np.sin(2 * np.pi * 7 * t); ph = 2 * np.pi * np.cumsum(f) / R
    return edge((0.4 * np.tanh(2 * np.sin(ph)) + bp(nz(sec), 1500, 6000)) * np.minimum(1, t * 10) * (1 - t / sec) ** 0.5)
def alert_tone(sec=0.9):
    t = tt(sec); f = np.where((t * 6).astype(int) % 2 == 0, 1050, 1400); ph = 2 * np.pi * np.cumsum(f) / R
    return edge(np.sin(ph) * 0.7 * (np.sin(np.pi * 6 * t) > -0.6))


def flap(sec=0.12):
    """แปะ: a flat rubbery slap"""
    t = tt(sec); return edge(bp(nz(sec), 300, 3000) * np.exp(-t * 45) + 0.5 * np.sin(2 * np.pi * 150 * t) * np.exp(-t * 50), 0.0005, 0.02)
def fwip(sec=0.32, f0=1600, f1=380):
    """ฟึ่บ: a quick falling rubber squeak + swish"""
    t = tt(sec); f = f0 * (f1 / f0) ** (t / sec); ph = 2 * np.pi * np.cumsum(f) / R
    return edge(0.6 * np.tanh(2 * np.sin(ph)) * np.sin(np.pi * t / sec) ** 0.5 + 0.5 * bp(nz(sec), 900, 6000) * np.sin(np.pi * t / sec))
def peel(sec=1.1):
    """แคว๊ก: sticky crackle rising in density"""
    t = tt(sec); n = len(t); o = bp(nz(sec), 1500, 8000) * 0.15 * (t / sec); r = np.random.default_rng(4)
    for i in r.integers(0, n - 300, int(sec * 260)): o[i:i + 200] += r.choice([-1, 1]) * np.exp(-np.arange(200) / 25) * r.uniform(0.2, 1)
    return edge(o)
def bell(sec=2.6, f=330):
    t = tt(sec); return edge(sum(np.sin(2 * np.pi * f * r * t) * np.exp(-t * (1.2 + i * 0.8)) / (1 + i) for i, r in enumerate((1, 2.0, 2.76, 4.07, 5.4))) + 0.3 * hp(nz(sec), 2500) * np.exp(-t * 60), 0.001, 0.4)
def trombone(sec=1.1):
    t = tt(sec); f = 233 * 2 ** (-t / sec * 1.0) * (1 + 0.02 * np.sin(2 * np.pi * 5.5 * t)); ph = 2 * np.pi * np.cumsum(f) / R
    x = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 10)); x = np.concatenate([x, np.zeros(int(0.08 * R))])
    return edge(lp(x, 2600) * 0.6) + 0 * x
def ankle_beep():
    return np.concatenate([beep(2300, 0.06), np.zeros(int(0.09 * R)), beep(2300, 0.06)])

M = Mix(seconds=TOTAL, sfx_dir=str(AI))
vo = read('public/absurd-cases/ep10/ep10_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)
VOX = np.zeros_like(M.mix); M.put(vo, 0, 0, 0.74, dst=VOX)
for r in json.load(open('episodes/absurd-cases/ep10_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0
FX = 10 ** (-4.5 / 20)
def P(x, pk, t, pan=0.0):
    x = peak_to(x, pk * 0.9 * FX)
    if t < 0: x = x[int(-t * R):]; t = 0
    M.put(x, t, pan)
BED = 0.0038 * 0.85
amb = lambda n, sec, fb: loopto(take(n, fb, trim=False), sec)
END = TOTAL
# ---- beds per place
M.bed(to_st(rms_to(amb('night_quiet', 12, lambda: bed_noise(8, 2500, 7000, 0.2, 3)), BED * 0.9)), 0, T('interro'), width=0.9, xf=0.3, fade=0.05)
M.bed(to_st(rms_to(amb('room_hum', 7, lambda: hum(5, 100)), BED * 1.0)), T('interro'), T('court'), width=0.3, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(amb('court_amb', 7, lambda: bed_noise(10, 200, 2500, 0.2, 5)), BED * 0.9)), T('court'), T('box'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(amb('cell_hum', 7, lambda: hum(5, 60)), BED * 0.8)), T('box'), T('guardsNet'), width=0.5, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(amb('prison_hall', 7, lambda: hum(5, 60)), BED * 0.9)), T('guardsNet'), T('release'), width=0.6, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(amb('outdoor_prison', 7, lambda: bed_noise(8, 200, 3000, 0.4, 6)), BED * 1.1)), T('release'), T('jobHunt'), width=0.9, xf=0.2, fade=0.03)
M.bed(to_st(rms_to(amb('village_amb', 10, lambda: bed_noise(8, 300, 4000, 0.3, 7)), BED * 1.0)), T('jobHunt'), T('lastLight'), width=0.9, xf=0.2, fade=0.03)
M.bed(to_st(rms_to(amb('crickets', 8, lambda: bed_noise(8, 3500, 7000, 0.5, 8)), BED * 0.9)), T('lastLight'), END, width=0.9, xf=0.3, fade=0.6)
# ---- bed: the router's weak-wifi beeps, then it talks back with a red light
# UI tones are synthesized: the SAO takes for router_beep / error_buzz / power_down came out as hiss / a single chirp / rumble
rb = np.concatenate([beep(2100, 0.07), np.zeros(int(0.07 * R))] * 3)
def err_buzz():
    t = tt(0.13); b = np.sign(np.sin(2 * np.pi * 170 * t)) * 0.6 + np.sin(2 * np.pi * 340 * t) * 0.3; b = edge(lp(b, 3000), 0.004, 0.02)
    return np.concatenate([b, np.zeros(int(0.07 * R)), b])
def pwr_down(sec=0.9):
    t = tt(sec); f = 1100 * (180 / 1100) ** (t / sec); ph = 2 * np.pi * np.cumsum(f) / R
    return np.concatenate([edge(np.sin(ph) * (1 - t / sec) ** 0.6, 0.002, 0.1), click(0.04)])
P(rb, 0.32, EV['red'] - 0.03)
P(take('phone_taps', lambda: click(), 1.0), 0.14, EV['oneBar'] - 0.1)
P(tung(), 0.5, EV['plate1']); P(thud(40, 0.9), 0.28, EV['plate1'] + 0.05)
P(take('phone_taps', lambda: click(), 1.6), 0.18, EV['press'] - 0.35)
# ---- raid
s = loopto(take('siren', lambda: siren(6, 700, 1050, 0.9), trim=False), T('interro') - EV['siren'] + 0.6); s = s * np.interp(np.arange(len(s)) / R, [0, 0.15, len(s) / R - 0.6, len(s) / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(s, 0.005 * FX)), EV['siren'], 1.0, width=0.6)
P(take('door_kick', door_crash, 1.4), 0.6, EV['door'] - 0.02, 0.3)
M.put(rms_to(take('swat_indoor', boots, 2.0), 0.03 * FX), EV['door'] + 0.08, 0.2)
ts = take('table_slam', lambda: thud(90, 0.3), 0.8)
P(ts, 0.6, EV['pin'] - 0.01)
P(take('cable_cinch', lambda: fwip(0.4), 1.4), 0.42, T('lan') + 0.15)
P(take('cable_cinch', lambda: fwip(0.4), 1.4), 0.5, EV['tie'] - 0.08)
# ---- interrogation: the slam, the red blink beeps, the empty scan
P(ts, 0.62, EV['slam'] - 0.01)
P(rb, 0.22, EV['blink'] - 0.02)
P(err_buzz(), 0.3, EV['noSignal'] - 0.02)
# ---- court: phone taps, the error, six gavels, plate
P(take('phone_taps', lambda: click(), 1.6), 0.16, EV['judgeType'])
P(err_buzz(), 0.36, EV['wifiFail'] - 0.02)
gv = take('gavel', lambda: thud(110, 0.3), 0.45)
for i, k in enumerate(['gavel1', 'gavel2', 'gavel3', 'gavel4', 'gavel5', 'gavel6']): P(gv, 0.5 + 0.03 * (i % 3), EV[k] - 0.02, (-0.15, 0.15)[i % 2])
P(tung(), 0.5, EV['plate2']); P(thud(40, 0.9), 0.28, EV['plate2'] + 0.05)
# ---- prison: lid slam, lid opens, wifi back on
P(take('steel_lid_slam', lambda: metal(150, 1.2), 1.6), 0.6, EV['boxShut'] - 0.03)
P(take('cell_door', lambda: metal(220, 0.6), 0.6) if (AI / 'cell_door_r1.wav').exists() else metal(220, 0.6, 6), 0.2, EV['lidOpen'])
P(beep(1800, 0.12), 0.16, EV['guardsNet'])
# ---- street: hops, the 5G hum, rejection, the closer
for k in range(int((T('tower') - T('jobHunt')) * 9 / np.pi)): P(take('knock', lambda: clunk(260, 0.08, 0.9), 0.12), 0.1, T('jobHunt') + k * np.pi / 9, -0.1)
M.put(rms_to(take('electric_buzz', lambda: electric(2.0), 2.0), 0.006 * FX), T('tower') + 0.05, 0.0)
P(err_buzz(), 0.18, EV['reject'])
pd = pwr_down()
for i, k in enumerate(['led1', 'led2', 'led3']): P(beep(1400 - i * 250, 0.08), 0.12, EV[k])
P(pd, 0.32, EV['led4'] - 0.05)

OUT = pathlib.Path('public/absurd-cases/ep10/mix/ep10_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
d = lp(np.convolve(M.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2); M.beds *= (1 - 0.7 * np.clip(d, 0, 1))[:, None]
m = (VOX + M.mix * (1 - 0.3 * np.clip(d, 0, 1))[:, None] + M.beds)[:int(TOTAL * R)]   # spot FX also dip ~3 dB under the voice
on = M.vo_env[:len(m)] > 0.5; rest = m - VOX[:len(m)]
print('voice over everything else while speaking: %.1f dB' % (db(VOX[:len(m)][on]) - db(rest[on])))
m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
w_ = wave.open(str(RAW), 'wb'); w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(R); w_.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w_.close()
COMP = 'acompressor=threshold=-24dB:ratio=3:attack=8:release=180'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(RAW), '-af', COMP + ',ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); gain = -15 - I
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW), '-af', f'{COMP},volume={gain:.2f}dB,alimiter=limit=0.7:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le', str(OUT)], check=True); RAW.unlink()
print('gain', round(gain, 2)); check(OUT)
