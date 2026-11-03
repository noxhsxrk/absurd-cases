"""Layered SFX synthesis recipes (numpy + scipy, deterministic) from lockdown-class EP1: gunshots far/through PA, thuds, door handle, knock, lock, switch, chime, alert, PA hiss/cut, heartbeat, breath, shuffle, chairs, scrape, roomtone, murmur, riser. Set OUT below.
Run: python3 tools/synth_sfx_recipes.py [out_dir]   (default public/sfx_synth)"""
import numpy as np, pathlib
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
import sys
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parents[1] / "public/sfx_synth"; OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
def t(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, o=4): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=4): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=4): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def env(n, a, d, sus=1.0):
    e = np.ones(n) * sus; A = int(a * SR); D = int(d * SR)
    if A: e[:A] = np.linspace(0, 1, A) * (sus if D == 0 else 1)
    if D: e[-D:] *= np.linspace(1, 0, D)
    return e
def verb(x, room=0.35, decay=0.4):
    ir_t = t(decay); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / (decay / 5)); ir = lp(ir, 6000); ir[0] = 1 / room
    y = np.convolve(x, ir)[:len(x) + len(ir) - 1]; return y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x))
def save(name, x, peak=-1.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * (10 ** (peak / 20)); wavfile.write(OUT / f"{name}.wav", SR, (x * 32767).astype(np.int16)); print(name, f"{len(x)/SR:.2f}s")
def noise(d): return rng.standard_normal(int(d * SR))

# 1. emergency alert: harsh two-tone pulses (853 + 960 Hz like broadcast alerts), many phones slightly detuned and offset
def alert_one(d, det, off):
    x = t(d); f = np.where(((x + off) * 2.0 % 1) < 0.5, 853, 960) * det
    ph = 2 * np.pi * np.cumsum(f) / SR; s = np.sign(np.sin(ph)) * 0.6 + np.sin(ph) * 0.4
    gate = (((x + off) * 4) % 1 < 0.82).astype(float); return lp(s * gate, 5200)
a = sum(alert_one(5.4, 1 + rng.uniform(-0.012, 0.012), rng.uniform(0, 0.4)) * rng.uniform(0.3, 1) for _ in range(14))
a = verb(a * env(len(a), 0.01, 0.25), 0.6, 0.5)[:len(a)]; save("alert", a, -3)

# 2. classroom room tone: ceiling fans (whoosh with blade flutter) + faint corridor bustle
d = 40; x = t(d); fan = lp(noise(d), 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 4.2 * x)) + hp(lp(noise(d), 2500), 300) * 0.25
hum = 0.04 * np.sin(2 * np.pi * 100 * x); save("roomtone", fan * 0.5 + hum, -18)

# 3. crowd murmur (syllabic modulated band noise, several voices)
d = 7; x = t(d); m = np.zeros(len(x))
for k in range(9):
    rate = rng.uniform(3, 6); voice = bp(noise(d), rng.uniform(220, 400), rng.uniform(900, 1800))
    m += voice * np.clip(np.sin(2 * np.pi * rate * x + rng.uniform(0, 6)) + rng.uniform(-0.2, 0.4), 0, None) * rng.uniform(0.4, 1)
save("murmur", m * env(len(m), 0.4, 1.5), -14)

# 4. PA chime ding-dong (bell partials) + speaker hiss bed + cut click
def bell(f, d):
    x = t(d); return sum(np.sin(2 * np.pi * f * r * x) * np.exp(-x * (2.2 + r)) * w for r, w in [(1, 1), (2.01, 0.35), (2.76, 0.18), (5.4, 0.08)])
ch = np.concatenate([bell(784, 0.75), bell(622, 1.6)]); ch = bp(ch, 350, 3400); save("chime", verb(ch, 0.4, 0.8)[:len(ch) + 8000], -4)
hiss = hp(noise(30), 1800) * 0.3 + 0.2 * np.sin(2 * np.pi * 50 * t(30)) * 0.3; save("pa_hiss", bp(hiss, 300, 6000), -26)
c = t(0.25); click = (noise(0.25) * np.exp(-c * 60) + np.sin(2 * np.pi * 120 * c) * np.exp(-c * 30)); save("pa_cut", bp(click, 200, 5000), -6)

# 5. light switch clack + fluorescent tubes' tick-down
c = t(0.4); sw = hp(noise(0.4), 1500) * np.exp(-c * 120) + 0.5 * np.sin(2 * np.pi * 1800 * c) * np.exp(-c * 90)
tick = np.zeros(len(c)); tick[int(0.06 * SR):int(0.06 * SR) + 300] = hp(noise(300 / SR), 3000)[:300] * 0.3
save("switch", sw + tick + 0.05 * np.sin(2 * np.pi * 100 * c) * np.exp(-c * 10), -6)

# 6. door lock (thumbturn) clack
c = t(0.35); lk = bp(noise(0.35), 900, 6000) * (np.exp(-c * 80) + 0.7 * np.exp(-np.clip(c - 0.11, 0, None) * 90) * (c > 0.11)); save("lock", verb(lk, 0.5, 0.25)[:len(c) + 4000], -5)

# 7. desk scrape across tiles (stick-slip squeal + rumble)
def scrape(d, seed):
    r = np.random.default_rng(seed); x = t(d); s = bp(r.standard_normal(len(x)), 180, 2600) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * r.uniform(9, 14) * x)))
    sq = np.sin(2 * np.pi * np.cumsum(620 + 80 * np.sin(2 * np.pi * 3 * x)) / SR) * (r.random(len(x)) > 0.0) * 0.12 * np.clip(np.sin(2 * np.pi * 0.7 * x), 0, None)
    jerks = np.clip(np.sin(2 * np.pi * 1.6 * x + 1), 0.1, 1); return (s + sq) * jerks * env(len(x), 0.05, 0.3)
save("scrape1", scrape(3.4, 3), -7); save("scrape2", scrape(2.9, 5), -7)

# 8. crouch shuffle (sneakers squeak + cloth) and chairs pushed back
d = 3.4; x = t(d); sh = np.zeros(len(x))
for k in range(26):
    st = int(rng.uniform(0, d - 0.25) * SR); n = int(0.12 * SR); g = bp(rng.standard_normal(n), 400, 5000) * np.exp(-np.arange(n) / SR * 30) * rng.uniform(0.3, 1)
    if rng.random() > 0.8: g += np.sin(2 * np.pi * rng.uniform(1800, 2600) * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 40) * 0.25
    sh[st:st + n] += g
save("shuffle", sh * env(len(sh), 0.2, 0.6), -10)
d = 1.6; x = t(d); chs = sum(np.roll(bp(noise(d), 200, 1500) * np.exp(-((x - 0.2) ** 2) / 0.02), int(rng.uniform(0, 0.9) * SR)) for _ in range(6)); save("chairs", chs, -12)

# 9. tiny UI tap
c = t(0.08); save("tap", hp(noise(0.08), 2500) * np.exp(-c * 200), -14)

# 10. distant thud (far explosion-like, no detail): low boom + rumble tail
def thud(d, f0):
    x = t(d); boom = np.sin(2 * np.pi * (f0 + 30 * np.exp(-x * 9)) * x) * np.exp(-x * 2.8)
    rum = lp(noise(d), 140) * np.exp(-x * 1.3) * 0.9; return lp(boom + rum, 500) * env(len(x), 0.006, 0.6)
save("thud1", thud(3.2, 44), -3); save("thud2", thud(3.6, 38), -2.5)

# 11. heartbeat (lub-dub) loop at ~78 bpm, and a slower one for the hold
def heart(d, bpm):
    x = t(d); y = np.zeros(len(x)); per = 60 / bpm
    for b in np.arange(0, d - 0.4, per):
        for off, a in [(0, 1.0), (0.17, 0.6)]:
            s = int((b + off) * SR); n = int(0.16 * SR); k = np.arange(n) / SR
            y[s:s + n] += np.sin(2 * np.pi * (55 - 60 * k) * k) * np.exp(-k * 28) * a
    return lp(y, 160)
save("heart", heart(40, 76), -6); save("heart_slow", heart(8, 58), -4)

# 12. running footsteps approaching in the corridor (louder + brighter as they near, then stop by the door)
d = 3.8; x = t(d); ft = np.zeros(len(x)); tt = 0.0; k = 0
while tt < 3.2:
    s = int(tt * SR); n = int(0.09 * SR); prox = (tt / 3.2) ** 1.6
    st = bp(rng.standard_normal(n), 120, 900 + 3500 * prox) * np.exp(-np.arange(n) / SR * 45) * (0.15 + 0.85 * prox)
    ft[s:s + n] += st; tt += 0.30 - 0.06 * prox + rng.uniform(-0.02, 0.02); k += 1
save("steps", verb(ft, 0.25, 0.9)[:len(ft)], -5)

# 13. door handle rattle (metal latch knocking) + two soft knocks
c = t(1.0); hr = np.zeros(len(c))
for s0 in [0.0, 0.08, 0.17, 0.24, 0.33, 0.45]:
    s = int(s0 * SR); n = int(0.07 * SR); kk = np.arange(n) / SR
    hr[s:s + n] += (bp(rng.standard_normal(n), 1500, 7000) * 0.6 + np.sin(2 * np.pi * 3100 * kk) * 0.4) * np.exp(-kk * 70)
save("handle", verb(hr, 0.5, 0.3)[:len(c)], -4)
c = t(0.9); kn = np.zeros(len(c))
for s0 in [0.0, 0.32]:
    s = int(s0 * SR); n = int(0.12 * SR); kk = np.arange(n) / SR; kn[s:s + n] += lp(np.sin(2 * np.pi * 180 * kk) * np.exp(-kk * 45) + bp(rng.standard_normal(n), 200, 2000) * np.exp(-kk * 60) * 0.5, 2500)
save("knock", kn, -8)

# 14. viewer's breath (two shaky breaths)
d = 3.2; x = t(d); br = bp(noise(d), 350, 2800) * (np.clip(np.sin(2 * np.pi * 0.62 * x - 0.6), 0, None) ** 1.5) * (1 + 0.15 * np.sin(2 * np.pi * 9 * x)); save("breath", br, -16)

# 15. outro: low hit + air riser before the decision card
d = 1.4; x = t(d); rs = bp(noise(d), 600, 5000) * (x / d) ** 2.2; save("riser", rs * env(len(x), 0, 0.03), -10)
d = 2.0; x = t(d); hit = lp(np.sin(2 * np.pi * (48 + 40 * np.exp(-x * 7)) * x) * np.exp(-x * 2.2) + lp(noise(d), 300) * np.exp(-x * 3) * 0.5, 600); save("hit", hit, -2)
