#!/usr/bin/env python3
"""absurd-cases EP3 premix. No music. Narration is the mix; ambience about -40 dBFS under it; spot SFX land on the cuts.
Long textures come from the AudioLDM2 takes in public/absurd-cases/ep3/sfx_ai (generated on the PC); short hits are synthesized here."""
import json, sys, pathlib
import numpy as np
from scipy import signal
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, env, db, rms

TL = json.load(open('public/absurd-cases/ep3/ep3_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}
AI = pathlib.Path('public/absurd-cases/ep3/sfx_ai')
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
    y = x[:int(keep * R)].copy(); k = int(f * R); y[-k:] *= np.linspace(1, 0, k); return y
def to_st(x): return np.stack([x, x], 1)

M = Mix(seconds=TOTAL, sfx_dir=str(AI))
# ---------------------------------------------------------------- narration
vo = read('public/absurd-cases/ep3/ep3_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)
M.put(vo, 0, 0, 0.74)
for r in json.load(open('episodes/absurd-cases/ep3_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0

def whine(sec=1.4, f=3400):
    """the accused's answer: a thin, dry, high whine into silence"""
    n = int(sec * R); t = np.arange(n) / R; ph = 2 * np.pi * np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 5 * t))) / R
    return edge((np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.exp(-t * 0.9), 0.08, 0.4)
def hammer():
    a = clunk(160, 0.18, 1.0); b = clunk(420, 0.08, 0.6); o = np.zeros(int(0.3 * R)); o[:len(a)] += a; o[:len(b)] += b * 0.5; return edge(o)
def beeps(n=3):
    o = np.zeros(int((0.14 * n + 0.1) * R))
    for i in range(n):
        k = int(0.14 * i * R); m = int(0.08 * R); tt = np.arange(m) / R; o[k:k + m] += np.sin(2 * np.pi * 1400 * tt) * np.exp(-tt * 20)
    return edge(o)
def ring():
    n = int(0.9 * R); t = np.arange(n) / R; return edge((np.sin(2 * np.pi * 425 * t) * (t < 0.6)) * 0.6, 0.01, 0.1)


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

# ---------------------------------------------------------------- ambience beds (~ -40 dBFS), starting on the cuts
BED = 0.0038
T = lambda n: SH[n]['t0']; E = lambda n: SH[n]['t1']
bd = A('morning_birds_v1'); bn = int(T('helis') * R); bd = np.resize(bd, bn); tt = np.arange(bn) / R
ok = np.clip((tt - EV['window']) / 0.5, 0, 1); bd = lp(bd, 1800) * (1 - ok) * 0.55 + bd * ok
M.put2(to_st(rms_to(bd, BED * 1.25)), 0, 1.0, width=0.7)
M.bed(to_st(rms_to(A('flicker_v1'), BED)), T('jarLid'), T('court'), width=0.3, xf=0.4, fade=0.03)
M.bed(to_st(rms_to(A('murmur_v1'), BED * 0.8)), T('court'), T('cellBlock'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('prison_hall_v1'), BED)), T('cellBlock'), T('escape'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.3)), T('cell19'), T('escape'), width=0.2, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('prison_hall_v1'), BED)), T('plateNail'), TOTAL, width=0.8, xf=0.3, fade=0.3)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.2)), T('plateNail'), TOTAL, width=0.2, xf=0.3, fade=0.4)

# ---------------------------------------------------------------- spot SFX (peaks; the voice peaks around 0.3)
P = lambda x, pk, t, pan=0.0: M.put(peak_to(x, pk * 0.9), t, pan)
P(latch(), 0.1, EV['window'] - 0.07)
w2 = R2('window_open'); P(fade_tail(excite(onset_trim(hp(w2, 150))), 1.0, 0.3) if w2 is not None else fade_tail(A('window_creak_v2'), 1.1, 0.3), 0.15, EV['window'])
M.put(rms_to(air_swell(0.9), 0.006), EV['window'] + 0.05, 0)
M.put(rms_to(breath_syn(), 0.006), 1.1, 0)
# the speck drifting: a faint thin whine while it floats in
fl = floaty(SH['noseCU']['t0'] + 0.2 - SH['dustAir']['t0']); M.put(rms_to(fl, 0.014), SH['dustAir']['t0'] + 0.05, -0.3)
M.put(rms_to(floaty(EV['sniff'] - EV['dustIn'] + 0.1), 0.011), EV['dustIn'] - 0.05, 0.25)
sf = R2('sniff'); P(fade_tail(excite(onset_trim(hp(sf, 200))), 0.5, 0.12) if sf is not None else sniff_syn(), 0.1, EV['sniff'] - 0.08)
sn = R2('sneeze'); sn = A('sneeze_v2') if sn is None else excite(hp(sn, 90), 0.22)
e = np.convolve(np.abs(sn), np.ones(R // 40), 'same'); i = int(np.argmax(e)); pre = 0.45
snz = fade_tail(sn[max(0, i - int(pre * R)):], pre + 0.45, 0.2); snz[int(pre * R):int(pre * R) + int(0.06 * R)] += thump() * np.abs(snz).max() * 0.35
P(snz, 0.22, EV['sneeze'] - pre)
P(tung() + rms_to(fade_tail(lp(A('boom_hit_v1'), 700), 1.6, 0.8), rms(tung()) * 0.5)[:len(tung())], 0.55, EV['titleCharge'])
P(beeps(3), 0.08, EV['dial'])
P(ring(), 0.06, EV['callUI'] + 0.05)
# helicopters: broadband rise on the cut, held through the vacuum shots
h = A('helicopter_v1'); hn = int((T('jarLid') - T('helis')) * R); hs = np.resize(h, hn) * np.interp(np.arange(hn) / R, [0, 0.35, (hn / R) - 0.4, hn / R], [0.2, 1, 1, 0])
M.put2(to_st(rms_to(hs, 0.03)), T('helis'), 1.0, width=0.6)
M.put2(to_st(env(int(5 * R), [(0, 0), (0.8, 1), (3.5, 1), (5, 0)])[:, 0] * rms_to(A('police_arrive_v1')[:int(5 * R)], 0.006)), EV['dial'] + 0.3, 1.0, width=0.5)
# the vacuum: roar from switch-on to the pop
v = A('vacuum_roar_v1'); vn = int((EV['pop'] - EV['vacOn']) * R); vs = np.resize(v, vn) * np.interp(np.arange(vn) / R, [0, 0.25, vn / R - 0.05, vn / R], [0, 1, 1, 0.6])
M.put(rms_to(vs, 0.05), EV['vacOn'], 0)
P(pop(), 0.2, EV['pop'])
P(clunk(140, 0.18, 0.9), 0.08, T('jarLid') + 0.2)          # lid on
jl = R2('jar_lid')
if jl is not None: P(fade_tail(excite(onset_trim(jl)), 0.6, 0.15), 0.12, T('jarLid') + 0.18)
P(fade_tail(A('cuff_click_v1'), 0.6), 0.13, EV['cuff'] - 0.04)
P(clunk(120, 0.14, 0.8), 0.1, EV['cuff'])
for k in (1, 2, 3): P(click(), 0.09, EV['cuff'] + k * 0.055)
# court
P(clunk(85, 0.3, 0.3), 0.1, T('caseFile') + 0.05)
an = whine(1.5, 3400); vo_lvl = rms(M.mix[int(LN['l008']['t0'] * R):int(LN['l008']['t1'] * R)]); M.put(rms_to(an, vo_lvl * 10 ** (2 / 20)) * np.linspace(1, 0.35, len(an)), EV['answer'], 0)
P(A('knock_v1')[:int(0.55 * R)] * np.linspace(1, 0.1, int(0.55 * R)), 0.17, EV['gavel'])
# cells
P(whoosh(0.3), 0.06, EV['tipIn'] - 0.05)
P(bolt_lock(), 0.1, EV['barsShut'])
M.put(rms_to(lp(fade_tail(A('boom_hit_v1'), 0.9, 0.5), 900), 0.02), EV['barsShut'], 0)
cd = R2('cell_door')
if cd is not None: e = np.convolve(np.abs(cd), np.ones(R // 50), 'same'); i = int(np.argmax(e)); P(fade_tail(excite(cd[max(0, i - int(0.25 * R)):]), 1.1, 0.4), 0.2, EV['barsShut'] - 0.25)
fg = R2('fan_gear'); P(fade_tail(excite(onset_trim(hp(fg, 150))) if fg is not None else A('gear_creak_v2'), 1.0, 0.3), 0.09, EV['turn0'])
P(clunk(200, 0.1, 0.9), 0.08, EV['turnLock'])
wg = to_st(rms_to(lp(A('wind_gust_v1'), 6000), BED * 3)); M.bed(wg, EV['turnLock'], T('escape') + 0.3, width=0.8, xf=0.2, fade=0.1)
P(whoosh(0.6), 0.16, EV['blow'])
s = A('prison_siren_v2'); sn_ = int((T('plateNail') - EV['siren'] + 0.3) * R); ss = np.resize(s, sn_) * np.interp(np.arange(sn_) / R, [0, 0.2, sn_ / R - 0.3, sn_ / R], [0, 1, 1, 0])
M.put2(to_st(rms_to(ss, 0.03)), EV['siren'], 1.0, width=0.6)
hm = R2('hammer'); hm1 = fade_tail(excite(onset_trim(hm)), 0.3, 0.1) if hm is not None else None
for k in ('nail1', 'nail2'):
    P(hammer(), 0.12, EV[k])
    if hm1 is not None: P(hm1, 0.13, EV[k] - 0.015)
for i in range(3):
    P(fade_tail(A('cuff_click_v1'), 0.45), 0.1, EV['cuffs3'] + i * 0.22 - 0.03)
    for k in (1, 2): P(click(), 0.07, EV['cuffs3'] + i * 0.22 + k * 0.05)
P(fade_tail(excite(onset_trim(hp(fg, 150))) if fg is not None else A('gear_creak_v2'), 1.2, 0.5), 0.05, TOTAL - 1.6)

# master: duck beds under the voice, light compression, one static gain to -15 LUFS (no dynamic loudnorm: it pumped the beds up to -21 dB)
import subprocess, re, wave
OUT = pathlib.Path('public/absurd-cases/ep3/mix/ep3_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
d = lp(np.convolve(M.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2); M.beds *= (1 - 0.7 * np.clip(d, 0, 1))[:, None]
m = (M.mix + M.beds)[:int(TOTAL * R)]; m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
w_ = wave.open(str(RAW), 'wb'); w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(R); w_.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w_.close()
COMP = 'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=180'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(RAW), '-af', COMP + ',ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); gain = -15 - I
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW), '-af', f'{COMP},volume={gain:.2f}dB,alimiter=limit=0.84:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le', str(OUT)], check=True); RAW.unlink()
print('gain', round(gain, 2)); check(OUT)
