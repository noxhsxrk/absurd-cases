#!/usr/bin/env python3
"""absurd-cases EP2 premix. No music. Narration is the mix; ambience about -40 dBFS under it; spot SFX land on the cuts.
Long textures come from the AudioLDM2 takes in public/absurd-cases/ep2/sfx_ai (generated on the PC); short hits are synthesized here."""
import json, sys, pathlib
import numpy as np
from scipy import signal
sys.path.insert(0, 'tools')
from mixlib import read, rms_to, peak_to, lp, hp, bp, R, Mix, check, env, db, rms

TL = json.load(open('public/absurd-cases/ep2/ep2_timeline.json')); EV = TL['events']; TOTAL = TL['total'] / TL['fps']
LN = {l['key']: l for l in TL['lines']}; SH = {s['name']: s for s in TL['shots']}
AI = pathlib.Path('public/absurd-cases/ep2/sfx_ai')
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

ZAP, BOOM, SPARK, ZAP_GAIN = 'zap_shock_v1', 'boom_hit_v1', 'power_spark_v1', 0.3
M = Mix(seconds=TOTAL, sfx_dir=str(AI))
# ---------------------------------------------------------------- narration (one tightened take; keeps Fenrir's dynamics)
vo = read('public/absurd-cases/ep2/ep2_narration_tight.wav')
sel = np.abs(vo) > 0.01; vo = vo * 10 ** ((-20.5 - db(vo[sel])) / 20)   # level when voiced (≈ -24 dBFS over the whole clip)
M.put(vo, 0, 0, 0.74)
for r in json.load(open('episodes/absurd-cases/ep2_line_timing.json')):
    for a, b in r['parts']: M.vo_env[int(a * R):int(b * R)] = 1.0

# ---------------------------------------------------------------- ambience: starts on the cut, about -40 dBFS
BED = 0.0038
T = lambda n: SH[n]['t0']; E = lambda n: SH[n]['t1']
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.15)), 0, T('squadWalk'), width=0.2, xf=0.8, fade=0.03)
M.bed(to_st(rms_to(A('crickets_v1'), BED)), T('squadWalk'), T('doorway'), width=0.6, xf=0.6, fade=0.03)
M.bed(to_st(rms_to(A('crickets_v1'), BED * 0.8)), T('soiCut'), EV['out3'], width=0.6, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 0.9)), T('doorway'), T('soiCut'), width=0.2, xf=0.4, fade=0.03)
M.bed(to_st(rms_to(A('flicker_v1'), BED)), T('interroFront'), T('court'), width=0.3, xf=0.8, fade=0.03)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.1)), T('interroFront'), EV['unplug'], width=0.15, xf=0.5, fade=0.03)
M.bed(to_st(rms_to(A('murmur_v1'), BED * 0.8)), T('court'), T('cell19'), width=0.8, xf=0.3, fade=0.03)
M.bed(to_st(rms_to(A('fan_motor_v1'), BED * 1.5)), EV['press3'], T('mosqBlown'), width=0.2, xf=0.5, fade=0.2)
w = to_st(rms_to(lp(A('wind_gust_v1'), 6000), BED * 1.7))
M.bed(w, T('cellBlock'), TOTAL, width=0.8, xf=0.6, fade=0.25)

# ---------------------------------------------------------------- spot SFX. Levels are peaks; the voice peaks around 0.3 here.
P = lambda x, pk, t, pan=0.0: M.put(peak_to(x, pk * 0.9), t, pan)
P(click(), 0.12, EV['press'])
bz = A('electric_buzz_v1')
# the shock: an AI take + a synth layer, runs from the finger shot and stops dead on the cut to the charge
Z0, Z1 = EV['zap'] - 0.03, EV['titleCharge']; nz = int((Z1 - Z0) * R)
zs = rms_to(np.resize(A(ZAP), nz), 0.5) + rms_to(np.resize(A('zap_taser_v1'), nz), 0.34) + rms_to(electric(Z1 - Z0), 0.28)
zk = np.interp(Z0 + np.arange(nz) / R, [Z0, Z0 + 0.02, EV['zapPeak'] - 0.05, EV['zapPeak'] + 0.02, Z1 - 0.008, Z1], [0, 0.15, 0.15, 1, 1, 0])
M.put(zs * zk, Z0, 0, ZAP_GAIN)
# "ตึ้ง": the charge lands on the cut
P(tung() + rms_to(fade_tail(lp(A(BOOM), 700), 1.6, 0.8), rms(tung()) * 0.5)[:len(tung())], 0.55, EV['titleCharge'])
M.put2(to_st(env(int(6.0 * R), [(0, 0), (0.6, 1), (4.2, 1), (6, 0)])[:, 0] * rms_to(A('police_arrive_v1')[:int(6 * R)], 0.011)), EV['dial'] + 0.25, 1.0, width=0.5)
P(click(), 0.08, EV['dial'])
P(fade_tail(A('heavy_boots_v1'), 1.2, 0.3), 0.16, T('squadWalk'))
P(door_kick(), 0.15, EV['door'])
P(fade_tail(A('suit_breath_v1'), 1.2, 0.3), 0.07, T('surround'))
P(fade_tail(A(SPARK), 0.7, 0.2), 0.16, EV['cut'])
for k, pan in (('out1', -0.3), ('out2', 0.2), ('out3', 0)): P(clunk(62, 0.34, 0.6), 0.14, EV[k], pan)
P(fade_tail(A('cuff_click_v1'), 0.6), 0.13, EV['cuff'] - 0.04)
P(clunk(120, 0.14, 0.8), 0.1, EV['cuff'])
for k in (1, 2, 3): P(click(), 0.09, EV['cuff'] + k * 0.055)     # the ratchet
M.bed(to_st(rms_to(A('crickets_v1'), BED * 0.8)), T('cuffECU'), T('interroFront'), width=0.6, xf=0.2, fade=0.03)
P(clunk(85, 0.3, 0.3), 0.14, T('caseFile'))     # folder dropped on the table
yaw_t = np.arange(int((T('plugECU') - T('shakeNo')) * R)) / R
sweep = rms_to(A('fan_motor_v1')[:len(yaw_t)], 0.012)
for t0, pan in ((EV['shake0'], -0.5), (EV['shake0'] + 0.5, 0.5)): M.put(fade_tail(sweep[:int(0.62 * R)], 0.62, 0.25), t0, pan)
P(pop(), 0.15, EV['unplug'])
wd = A('fan_winddown_v1'); wd = wd[:int(2.4 * R)] * np.linspace(1, 0, int(2.4 * R)) ** 1.6
P(wd, 0.1, EV['windDown'] - 0.1)
P(A('thud2_v1')[:int(0.5 * R)] * np.linspace(1, 0.1, int(0.5 * R)), 0.17, EV['stamp'])
P(A('knock_v1')[:int(0.55 * R)] * np.linspace(1, 0.1, int(0.55 * R)), 0.17, EV['gavel'])
P(bolt_lock(), 0.15, EV['cellDoor'])
P(click(), 0.14, EV['press3'])
P(whoosh(0.5), 0.13, EV['peel'] - 0.05)
P(splat(), 0.16, EV['splat'])
P(fade_tail(A('pen_writing_v1'), 2.4, 0.5), 0.08, T('reportForm') + 0.1)
# the answer: must read about 4 dB over the narration around it
ans = buzz(0.8) * 0.8; v1 = A('mosquito_v1'); e = np.abs(signal.hilbert(v1)); i = int(np.argmax(np.convolve(e, np.ones(R // 2), 'same'))); seg = v1[max(0, i - int(0.4 * R)):][:int(0.8 * R)]
ans[:len(seg)] += rms_to(seg, rms(ans) * 0.5)
vo_lvl = rms(M.mix[int(LN['l013']['t0'] * R):int(LN['l013']['t1'] * R)])
ans = rms_to(ans, vo_lvl * 10 ** (4 / 20)); M.put(ans, EV['answer'] + 0.03, 0)

# master: duck beds under the voice, light compression, one static gain to -15 LUFS (no dynamic loudnorm: it pumped the beds up to -21 dB)
import subprocess, re, wave
OUT = pathlib.Path('public/absurd-cases/ep2/mix/ep2_mix.wav'); OUT.parent.mkdir(parents=True, exist_ok=True); RAW = OUT.with_name('raw.wav')
d = lp(np.convolve(M.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2); M.beds *= (1 - 0.7 * np.clip(d, 0, 1))[:, None]
m = (M.mix + M.beds)[:int(TOTAL * R)]; m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
w_ = wave.open(str(RAW), 'wb'); w_.setnchannels(2); w_.setsampwidth(2); w_.setframerate(R); w_.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w_.close()
COMP = 'acompressor=threshold=-22dB:ratio=2.5:attack=10:release=180'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(RAW), '-af', COMP + ',ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); gain = -15 - I
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(RAW), '-af', f'{COMP},volume={gain:.2f}dB,alimiter=limit=0.84:level=disabled', '-ar', '48000', '-c:a', 'pcm_s16le', str(OUT)], check=True); RAW.unlink()
print('gain', round(gain, 2)); check(OUT)
