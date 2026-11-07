#!/usr/bin/env python3
"""absurd-cases EP4 premix. No music. Narration is the mix; ambience about -40 dBFS under it; spot SFX land on the cuts.
Long textures come from the AudioLDM2 takes in public/absurd-cases/ep4/sfx_ai (generated on the PC); short hits are synthesized here."""
import json, sys, pathlib
import numpy as np
from scipy import signal
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, env, db, rms

TL = json.load(open('public/absurd-cases/ep4/ep4_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}
AI = pathlib.Path('public/absurd-cases/ep4/sfx_ai')
A = lambda n: read(AI / f'{n}.wav')
g = np.random.default_rng(7)

def edge(x, a=0.004, b=0.06):
    x = x.copy(); n0, n1 = int(a * R), int(b * R)
    x[:n0] *= np.linspace(0, 1, n0); x[-n1:] *= np.linspace(1, 0, n1); return x
def clunk(f=70, sec=0.32, click=0.5):
    n = int(sec * R); t = np.arange(n) / R
    body = np.sin(2 * np.pi * f * t * (1 + 0.5 * np.exp(-t * 40))) * np.exp(-t * 16)
    tick = hp(g.standard_normal(n), 900) * np.exp(-t * 120) * click
    return edge(body + tick)
def click(sec=0.06):
    n = int(sec * R); t = np.arange(n) / R; return edge(hp(g.standard_normal(n), 1800) * np.exp(-t * 170) + 0.5 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 220), 0.0005, 0.01)
def pop():
    n = int(0.16 * R); t = np.arange(n) / R; return edge(np.sin(2 * np.pi * 240 * t * np.exp(-t * 18)) * np.exp(-t * 34) + 0.7 * hp(g.standard_normal(n), 2500) * np.exp(-t * 110), 0.0005, 0.02)
def whoosh(sec=0.45):
    n = int(sec * R); t = np.linspace(0, 1, n); x = bp(g.standard_normal(n), 500, 5200); return edge(x * np.sin(np.pi * t) ** 1.5, 0.01, 0.03)
def splat():
    n = int(0.2 * R); t = np.arange(n) / R; return edge(np.sin(2 * np.pi * 110 * t) * np.exp(-t * 34) + 0.35 * bp(g.standard_normal(n), 900, 4000) * np.exp(-t * 46), 0.0005, 0.02)
def door_kick():
    n = int(0.5 * R); t = np.arange(n) / R; return edge(np.sin(2 * np.pi * 88 * t) * np.exp(-t * 14) + 0.55 * np.sin(2 * np.pi * 171 * t) * np.exp(-t * 26) + 0.4 * bp(g.standard_normal(n), 300, 2600) * np.exp(-t * 30))
def bolt_lock():
    a = clunk(130, 0.2, 0.9); b = clunk(95, 0.3, 0.8); o = np.zeros(int(0.5 * R)); o[:len(a)] += a; i = int(0.12 * R); o[i:i + len(b)] += b; return edge(o)
def buzz(sec=1.0, f=560):
    """the mosquito's answer: a thin saw with a nervous pitch"""
    n = int(sec * R); t = np.arange(n) / R; ph = 2 * np.pi * np.cumsum(f * (1 + 0.035 * np.sin(2 * np.pi * 7.3 * t) + 0.012 * np.sin(2 * np.pi * 23 * t))) / R
    s = sum(np.sin(k * ph) / k for k in range(1, 9)); return edge(bp(s, 300, 6000), 0.03, 0.2)
def electric(sec):
    """mains-hum buzz with random snaps"""
    n = int(sec * R); t = np.arange(n) / R; f = 120 * (1 + 0.02 * np.sin(2 * np.pi * 37 * t))
    ph = 2 * np.pi * np.cumsum(f) / R; hum = np.tanh(3 * sum(np.sin(k * ph) / k for k in range(1, 26)))
    gate = np.repeat(g.random(n // 240 + 1) > 0.42, 240)[:n]; nz_ = bp(g.standard_normal(n), 1500, 7500) * gate
    snaps = np.zeros(n); 
    for i in g.integers(0, max(1, n - 400), int(sec * 34)): snaps[i:i + 300] += g.choice([-1, 1]) * np.exp(-np.arange(300) / 45)
    return bp(hum, 90, 6500) * 0.55 + nz_ * 0.7 + snaps * 0.9
def tung():
    """the dramatic sting: a pitched-down drum body, a sub tail and a hard attack"""
    n = int(1.3 * R); t = np.arange(n) / R; f = 46 + 125 * np.exp(-t * 24); ph = 2 * np.pi * np.cumsum(f) / R
    body = np.tanh(2.2 * np.sin(ph) * np.exp(-t * 4.6)); oct2 = 0.28 * np.sin(2 * ph + 0.4) * np.exp(-t * 7)
    att = 0.55 * bp(g.standard_normal(n), 900, 5200) * np.exp(-t * 95)
    return edge(body + oct2 + att, 0.0005, 0.2)
def fade_tail(x, keep, f=0.15):
    x = x[:int(keep * R)].copy(); n = min(len(x), int(f * R))
    if n > 0: x[-n:] *= np.linspace(1, 0, n)
    return x
    y = x[:int(keep * R)].copy(); k = int(f * R); y[-k:] *= np.linspace(1, 0, k); return y
def to_st(x): return np.stack([x, x], 1)

M = Mix(seconds=TOTAL, sfx_dir=str(AI))
vo = read('public/absurd-cases/ep4/ep4_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)
M.put(vo, 0, 0, 0.74)
for r in json.load(open('episodes/absurd-cases/ep4_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0
# ---------------------------------------------------------------- round 2 foley: CLAP-ranked AI takes + designed layers
rng = np.random.default_rng(7)
def R2(name, rank=1):
    p = AI / f'{name}_r{rank}.wav'
    return read(p) if p.exists() else None
def onset_trim(x, pre=0.02, th=0.12):
    e = np.convolve(np.abs(x), np.ones(int(0.005 * R)) / int(0.005 * R), 'same'); i = int(np.argmax(e > th * e.max()))
    return x[max(0, i - int(pre * R)):]
def excite(x, amt=0.18):
    """16 kHz AI audio is dull: add a little synthetic air above 5 kHz"""
    return x + amt * rms(x) / max(rms(hp(np.tanh(3 * x / (np.abs(x).max() + 1e-9)), 5000)), 1e-9) * hp(np.tanh(3 * x / (np.abs(x).max() + 1e-9)), 5000)
def latch():
    n = int(0.05 * R); t = np.arange(n) / R; nz = hp(rng.standard_normal(n), 2500) * np.exp(-t * 160)
    return edge(nz + 0.5 * np.sin(2 * np.pi * 3300 * t) * np.exp(-t * 90) + 0.3 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 60), 0.0005, 0.01)
def air_swell(sec=0.8):
    n = int(sec * R); t = np.arange(n) / R; x = bp(rng.standard_normal(n), 300, 5000, 2)
    return x * np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2
def floaty(sec=1.6):
    """a speck drifting: soft breathy air with a slow swirl, plus a faint glassy shimmer"""
    n = int(sec * R); t = np.arange(n) / R
    air = bp(rng.standard_normal(n), 1800, 6500, 2) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.6 * t)) * np.sin(np.pi * t / sec)
    sh = sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (0.5 + 0.5 * np.sin(2 * np.pi * (3 + i) * t + i)) for i, f in enumerate((4200, 5300, 6650)))
    return air / rms(air) + 0.12 * sh * np.sin(np.pi * t / sec) / max(rms(sh), 1e-9)
def sniff_syn():
    o = np.zeros(int(0.42 * R))
    for k0, d in ((0.0, 0.13), (0.2, 0.17)):
        n = int(d * R); t = np.arange(n) / R; x = bp(rng.standard_normal(n), 700, 3200, 3) * np.sin(np.pi * t / d) ** 0.7 * (0.6 + t / d)
        o[int(k0 * R):int(k0 * R) + n] += x
    return edge(o)
def breath_syn():
    """a slow nose inhale of fresh air, a beat, a soft exhale"""
    a, b = 0.95, 0.8; n = int((a + 0.25 + b) * R); o = np.zeros(n)
    t = np.arange(int(a * R)) / R; o[:len(t)] += bp(rng.standard_normal(len(t)), 600, 2800, 2) * (t / a) ** 1.5 * (1 - np.clip((t - a + 0.08) / 0.08, 0, 1))
    t2 = np.arange(int(b * R)) / R; k = int((a + 0.25) * R); o[k:k + len(t2)] += 0.6 * bp(rng.standard_normal(len(t2)), 250, 1500, 2) * np.sin(np.pi * t2 / b) ** 1.2
    return o
def thump(f=60, sec=0.06):
    n = int(sec * R); t = np.arange(n) / R; return np.sin(2 * np.pi * f * t) * np.exp(-t * 50)


def around_peak(x, pre, post):
    e = np.convolve(np.abs(x), np.ones(R // 50), 'same'); i = int(np.argmax(e)); return fade_tail(x[max(0, i - int(pre * R)):], pre + post, min(0.2, post * 0.5)), pre
def boots(sec=1.4, n=10, seed=3):
    g = np.random.default_rng(seed); o = np.zeros(int((sec + 0.3) * R))
    for k in range(int(n * sec)):
        t0 = k / n + g.uniform(-0.03, 0.03); s = clunk(g.uniform(70, 110), 0.12, 0.7) * g.uniform(0.6, 1.0); i = int(max(0, t0) * R); o[i:i + len(s)] += s[:len(o) - i]
        gr = hp(g.standard_normal(int(0.05 * R)), 1500) * np.exp(-np.arange(int(0.05 * R)) / R * 60) * 0.25; o[i:i + len(gr)] += gr[:len(o) - i]
    return o
BED = 0.0038
T = lambda n: SH[n]['t0']
def P(x, pk, t, pan=0.0):
    x = peak_to(x, pk * 0.9)
    if t < 0: x = x[int(-t * R):]; t = 0
    M.put(x, t, pan)
# ---- ambience beds, starting on the cuts
M.bed(to_st(rms_to(A('fridge_hum_r1'), BED * 0.8)), 0, EV['siren'], width=0.3, xf=0.5, fade=0.03)
M.bed(to_st(rms_to(A('night_kitchen_r1') + 1e-4 * np.random.default_rng(1).standard_normal(len(A('night_kitchen_r1'))), BED * 0.6)), 0, EV['siren'], width=0.8, xf=0.5, fade=0.03)
M.bed(to_st(rms_to(A('flicker_v1'), BED)), T('interro'), T('court'), width=0.3, xf=0.4, fade=0.03)
M.bed(to_st(rms_to(A('murmur_v1'), BED * 0.8)), T('court'), T('cell20'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('prison_hall_v1'), BED)), T('cell20'), TOTAL, width=0.8, xf=0.3, fade=0.4)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.3)), T('fan19'), TOTAL, width=0.2, xf=0.3, fade=0.4)
# ---- kitchen
fo, pre = around_peak(excite(hp(A('fridge_open_r1'), 120)), 0.5, 0.5); P(fo, 0.16, EV['doorOpen'] + 0.1 - pre)
M.put(rms_to(air_swell(0.6), 0.004), EV['doorOpen'], 0)
sp, pre = around_peak(excite(A('smell_puff_r2')), 0.3, 0.8); P(sp, 0.16, EV['blast'] - pre)
P(fade_tail(lp(A('boom_hit_v1'), 300), 1.0, 0.6), 0.25, EV['blast'])          # low gut-punch under the smell
sn = A('sneeze_r1')
P(tung() + rms_to(fade_tail(lp(A('boom_hit_v1'), 700), 1.6, 0.8), rms(tung()) * 0.5)[:len(tung())], 0.5, EV['plate'])   # the plate lands
P(beeps(3) if 'beeps' in dir() else click(), 0.08, T('phone') + 0.12)
P(click(), 0.1, T('phone') + 0.42)
# the interrupted line: 0.3 s of true digital silence after "ตำ—" (zero everything but the voice)
cs, ce = int((EV['cutoff'] + 0.01) * R), int(EV['doorBurst'] * R)
# ---- the breach
dc, pre = around_peak(excite(A('door_crash_r2')), 0.08, 1.2); P(dc, 0.36, EV['doorBurst'] - pre)
P(fade_tail(lp(A('boom_hit_v1'), 500), 1.2, 0.6), 0.3, EV['doorBurst'] + 0.32)
M.put(rms_to(boots(1.6, 9), 0.03), EV['doorBurst'] + 0.15, 0.2)
M.put(rms_to(boots(1.2, 11, 7), 0.022), T('swatWide') + 0.05, -0.2)
M.put2(to_st(rms_to(A('mask_breath_r1'), 0.01)), T('swatMasks'), 1.0, width=0.6)
s = A('prison_siren_v2'); sn_ = int((T('interro') - EV['siren']) * R); ss = np.resize(s, sn_) * np.interp(np.arange(sn_) / R, [0, 0.15, sn_ / R - 0.3, sn_ / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(lp(ss, 3500), 0.012)), EV['siren'], 1.0, width=0.6)
tp = excite(A('tape_unroll_r1')); P(fade_tail(onset_trim(tp, th=0.05), 1.0, 0.3), 0.12, EV['tape0'])
for i in range(3): P(fade_tail(onset_trim(tp, th=0.05), 0.6, 0.2), 0.08, EV['tapeTop'] - 0.6 + i * 0.25)
P(fade_tail(A('cuff_click_v1'), 0.6), 0.14, EV['cuff'] - 0.04); P(clunk(120, 0.14, 0.8), 0.1, EV['cuff'])
for i in range(5): P(fade_tail(A('cuff_click_v1'), 0.35), 0.1, EV['lobes'] - 0.35 + i * 0.06)
# ---- interrogation: the answer is a smell
an, pre = around_peak(excite(A('smell_puff_r1')), 0.1, 1.2); vo_l = rms(M.mix[int(LN['l008']['t0'] * R):int(LN['l008']['t1'] * R)])
M.put(rms_to(an, vo_l * 10 ** (3 / 20)), EV['answer'] - pre, 0)
M.put(rms_to(lp(fade_tail(A('boom_hit_v1'), 1.4, 0.8), 200), vo_l * 0.6), EV['answer'], 0)
for k, pan in (('faint0', -0.3), ('faint1', 0.3), ('faint2', 0.0)):
    bf, pre = around_peak(excite(A('body_fall_r1')), 0.05, 0.6); P(bf, 0.24, EV[k] + 0.42 - pre, pan)
# ---- court + cells
P(A('knock_v1')[:int(0.55 * R)] * np.linspace(1, 0.1, int(0.55 * R)), 0.17, EV['gavel'])
P(bolt_lock(), 0.12, EV['place'] + 0.2)
P(clunk(200, 0.1, 0.9), 0.08, EV['flow'] - 0.05)
M.put(rms_to(air_swell(1.6), 0.008), EV['flow'] - 0.2, -0.4)
M.put(rms_to(whoosh(0.7), 0.01), EV['peel'], -0.5)
P(clunk(300, 0.06, 0.4), 0.06, EV['peel'] + 0.5)           # the mosquito lands
M.mix[cs:ce] = 0
# master: duck beds under the voice, light compression, one static gain to -15 LUFS (no dynamic loudnorm: it pumped the beds up to -21 dB)
import subprocess, re, wave
OUT = pathlib.Path('public/absurd-cases/ep4/mix/ep4_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
d = lp(np.convolve(M.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2); M.beds *= (1 - 0.7 * np.clip(d, 0, 1))[:, None]
m = (M.mix + M.beds)[:int(TOTAL * R)]; m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
w_ = wave.open(str(RAW), 'wb'); w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(R); w_.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w_.close()
COMP = 'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=180'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(RAW), '-af', COMP + ',ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); gain = -15 - I
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW), '-af', f'{COMP},volume={gain:.2f}dB,alimiter=limit=0.84:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le', str(OUT)], check=True); RAW.unlink()
print('gain', round(gain, 2)); check(OUT)
