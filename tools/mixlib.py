"""Shared premix helpers for POV episodes (from mrt-train-zero EP1 / lockdown-class premixes).

    import sys; sys.path.insert(0, 'tools'); from mixlib import *
    M = Mix(seconds=TL['total'] / TL['fps'], sfx_dir='public/<slug>/ep1/sfx')
    M.voice(read('public/<slug>/ep1/lines/ep1-l001.wav'), t0, emotion='afraid', pan=-0.25, room=IR_ROOM)
    if M.have('glass_hit'): M.put2(peak_to(M.F('glass_hit'), 0.6), EV['slam'] + 0.1)
    M.bed(rms_to(M.F('train_bed'), 0.02), 0, END, width=0.6)
    M.master('public/<slug>/ep1/mix/ep1_mix.wav', lufs=-14.8)

Everything is placed from the plan's events (never hard-coded seconds). A missing SFX file -> `have()` is False, so a synth
fallback (or nothing) is used and the mix still builds. Levels that worked: beds RMS 0.02-0.026 (drone 0.04), hero impacts peak
0.55-0.6, voices by emotion (TARGET), ducking 4-6 dB, master compressor -24 dB 3:1 -> loudnorm -14..-15 LUFS -> limiter.
"""
import subprocess, pathlib, wave
import numpy as np
from scipy import signal

R = 48000
TARGET = {'whisper': -22, 'calm': -20.5, 'confused': -20.5, 'afraid': -20.2, 'urgent': -19.6, 'shocked': -19.4, 'angry': -19.4,
          'cold': -20.5, 'pa': -21.0, 'radio': -21.0, 'crying': -20}

def read(p, stereo=False):
    """16/24/32-bit WAV (any rate, mono/stereo) -> float64 at 48 kHz. FLAC/MP3 go through ffmpeg."""
    p = pathlib.Path(p)
    if p.suffix.lower() != '.wav':
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(p), '-f', 's16le', '-ac', '2', '-ar', str(R), '-'], capture_output=True, check=True).stdout
        x = np.frombuffer(raw, np.int16).astype(np.float64).reshape(-1, 2) / 32768
        return x if stereo else x.mean(1)
    w = wave.open(str(p)); sr = w.getframerate(); ch = w.getnchannels(); sw = w.getsampwidth(); b = w.readframes(w.getnframes())
    if sw == 3:
        a = np.frombuffer(b, np.uint8).reshape(-1, 3).astype(np.int32); x = a[:, 0] | (a[:, 1] << 8) | (a[:, 2] << 16); x = np.where(x >= 1 << 23, x - (1 << 24), x) / float(1 << 23)
    elif sw == 4: x = np.frombuffer(b, np.int32) / 2.0 ** 31
    else: x = np.frombuffer(b, np.int16).astype(np.float64) / 32768
    x = x.reshape(-1, ch)
    if sr != R: x = signal.resample_poly(x, R, sr, axis=0)
    if stereo: return x if ch == 2 else np.repeat(x, 2, 1)
    return x.mean(1)

def bp(x, lo, hi, o=4): return signal.sosfilt(signal.butter(o, [lo, hi], 'band', fs=R, output='sos'), x, axis=0)
def lp(x, f, o=4): return signal.sosfilt(signal.butter(o, f, 'low', fs=R, output='sos'), x, axis=0)
def hp(x, f, o=4): return signal.sosfilt(signal.butter(o, f, 'high', fs=R, output='sos'), x, axis=0)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
def db(x): return 20 * np.log10(rms(x) + 1e-12)
def peak_to(x, pk): return x / max(np.max(np.abs(x)), 1e-9) * pk
def rms_to(x, r): return x / max(np.sqrt(np.mean(x ** 2)), 1e-9) * r
def ir(sec, damp, seed=1):
    g = np.random.default_rng(seed); n = int(sec * R); e = np.exp(-np.arange(n) / (damp * R)); return g.standard_normal(n) * e / np.sqrt(np.sum(e ** 2))
IR_ROOM, IR_GLASS, IR_LONG, IR_STAIRS = ir(0.35, 0.06, 2), ir(0.5, 0.09, 3), ir(1.6, 0.35, 4), ir(2.2, 0.5, 5)
def verb(x, h, wet): return x * (1 - wet) + signal.fftconvolve(x, h)[:len(x)] * wet
def verb2(x, h, wet): return np.stack([verb(x[:, 0], h, wet), verb(x[:, 1], h, wet)], 1)
def comp(x, thr_db=-24, ratio=3.0):
    env = np.abs(signal.hilbert(x)) if len(x) < R * 20 else np.abs(x)
    env = lp(env, 30, 2); lvl = 20 * np.log10(np.maximum(env, 1e-6)); over = np.maximum(0, lvl - thr_db); g = 10 ** (-(over - over / ratio) / 20); return x * g
def radio(x, seed=3):
    """walkie/phone voice: highpass 420, lowpass 3000, light bitcrush, 6:1 compression, short slap"""
    y = lp(hp(x, 420), 3000); y = np.round(y * 64) / 64; y = comp(y, -30, 6); return verb(y, ir(0.12, 0.02, seed), 0.15)
def pa_speaker(x):
    """voice through ceiling PA speakers: band-limit, slight distortion, longer room"""
    y = bp(x, 380, 3300); y = np.tanh(y * 2.2) / 2.2; return verb(comp(y, -28, 5), IR_LONG, 0.3)
def loop_to(x, n, xf=1.0):
    """equal-power-ish crossfaded loop of a stereo bed to n samples"""
    k = int(xf * R); out = np.zeros((n, 2)); pos = 0; w = np.linspace(0, 1, k)[:, None]
    while pos < n:
        seg = x.copy(); seg[:k] *= w if pos > 0 else 1; seg[-k:] *= w[::-1]
        L = min(len(seg), n - pos); out[pos:pos + L] += seg[:L]; pos += len(seg) - k
    return out
def env(n, pts):
    """piecewise-linear envelope over absolute seconds -> per-sample gain for a clip starting at pts[0][0]"""
    tt = pts[0][0] + np.arange(n) / R; return np.interp(tt, [p[0] for p in pts], [p[1] for p in pts])[:, None]

class Mix:
    def __init__(self, seconds, sfx_dir):
        self.N = int(seconds * R) + R; self.sfx = pathlib.Path(sfx_dir)
        self.mix = np.zeros((self.N, 2)); self.beds = np.zeros((self.N, 2)); self.vo_env = np.zeros(self.N)
        self.t = np.arange(self.N) / R
    def have(self, name): return (self.sfx / f'{name}.wav').exists()
    def F(self, name): return read(self.sfx / f'{name}.wav', stereo=True)
    def pick(self, name, synth): return read(self.sfx / f'{name}.wav') if self.have(name) else synth()
    def put(self, x, t, pan=0.0, gain=1.0, dst=None):
        """mono x at time t with constant-power pan (-1 left .. 1 right)"""
        dst = self.mix if dst is None else dst; i = int(t * R); x = x * gain
        if i >= len(dst): return
        x = x[:len(dst) - i]; L = np.cos((pan + 1) * np.pi / 4); Rr = np.sin((pan + 1) * np.pi / 4)
        dst[i:i + len(x), 0] += x * L * 1.41; dst[i:i + len(x), 1] += x * Rr * 1.41
    def put2(self, x, t0, gain=1.0, dst=None, width=1.0):
        """stereo x at t0; width < 1 narrows, > 1 widens"""
        dst = self.mix if dst is None else dst; i = int(t0 * R)
        if i >= len(dst) or i + len(x) <= 0: return
        if i < 0: x = x[-i:]; i = 0
        x = x[:len(dst) - i] * gain; m = x.mean(1, keepdims=True); x = m + (x - m) * width; dst[i:i + len(x)] += x
    def bed(self, x, t0, t1, width=0.6, xf=1.5, fade=0.6):
        """loop a stereo bed from t0 to t1 into the (duckable) bed bus"""
        b = loop_to(x, int((t1 - t0) * R), xf); b *= env(len(b), [(t0, 0), (t0 + fade, 1), (t1 - fade, 1), (t1, 0)]); self.put2(b, t0, 1.0, self.beds, width)
    def voice(self, x, t0, emotion='calm', pan=0.0, room=None, wet=0.18, chain=None):
        """level a line to its emotion target, compress lightly, place it in its room; tracks the voice envelope for ducking"""
        if chain: x = chain(x)
        x = comp(x * 10 ** ((TARGET.get(emotion, -20.5) - db(x[np.abs(x) > 0.01] if np.any(np.abs(x) > 0.01) else x)) / 20), -26, 3)
        if room is not None: x = verb(x, room, wet)
        x = x * 10 ** ((TARGET.get(emotion, -20.5) - db(x[np.abs(x) > 0.01] if np.any(np.abs(x) > 0.01) else x)) / 20)
        self.put(x, t0, pan); i = int(t0 * R); self.vo_env[i:i + len(x)] = np.maximum(self.vo_env[i:i + len(x)], 1.0)
    def master(self, out, lufs=-14.0, duck=0.45, quiet=(), end_gain=None):
        """duck beds under voices (≈ -5 dB), drop beds ~9 dB in `quiet` [(t0, t1)] windows, compressor -> loudnorm -> limiter"""
        d = lp(np.convolve(self.vo_env, np.ones(int(0.25 * R)) / (0.25 * R), 'same'), 8, 2)
        self.beds *= (1 - duck * np.clip(d, 0, 1))[:, None]
        for a, b in quiet: self.beds[(self.t >= a) & (self.t < b)] *= 0.35
        m = self.mix + self.beds
        if end_gain: m[self.t >= end_gain[0]] *= end_gain[1]
        m = m / max(np.max(np.abs(m)), 1e-9) * 0.7
        out = pathlib.Path(out); out.parent.mkdir(parents=True, exist_ok=True); raw = out.with_name(out.stem + '_raw.wav')
        w = wave.open(str(raw), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(R); w.writeframes((np.clip(m, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-af', f'acompressor=threshold=-24dB:ratio=3:attack=10:release=200,loudnorm=I={lufs}:LRA=6:TP=-1.5,alimiter=limit=0.8:level=disabled:attack=1:release=50', '-ar', '48000', str(out)], check=True)
        raw.unlink(); print('wrote', out)

def check(path):
    """integrated loudness / LRA / true peak + 400 ms RMS spread and dead-air share"""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = r[r.rfind('Summary:'):]; print(tail.strip())
    x = read(path, stereo=True); m = x.mean(1); s = (x[:, 0] - x[:, 1]) / 2; n = int(0.4 * R)
    blk = np.array([db(m[i:i + n]) for i in range(0, len(m) - n, n)])
    print(f'RMS400 p5 {np.percentile(blk, 5):.1f} dB · p95 {np.percentile(blk, 95):.1f} dB · <-45 dB {np.mean(blk < -45) * 100:.1f}% · side/mid {db(s) - db(m):.1f} dB')
