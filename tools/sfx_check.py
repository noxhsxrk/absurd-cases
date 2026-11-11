"""Quick numeric check of generated SFX takes (instead of listening): python tools/sfx_check.py <wav …>
dur, % active, bursts, peak Hz, spectral flatness (> 0.6 = noise), tick rate for periodic sounds."""
import sys, numpy as np, soundfile as sf
for p in sys.argv[1:]:
    x, sr = sf.read(p); x = x.mean(1) if x.ndim > 1 else x
    e = np.sqrt(np.convolve(x ** 2, np.ones(441) / 441, 'same')); th = e.max() * 0.1; act = e > th
    bursts = int(np.sum(np.diff(act.astype(int)) == 1))
    S = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr); pk = f[np.argmax(S)]
    flat = float(np.exp(np.mean(np.log(S + 1e-12))) / (np.mean(S) + 1e-12))
    env = e[::441] - e[::441].mean(); ac = np.correlate(env, env, 'full')[len(env):]; lag = int(np.argmax(ac[5:150])) + 5 if len(ac) > 160 else 0
    print(f"{p.split('/')[-1]:22s} {len(x)/sr:4.1f}s active {act.mean()*100:3.0f}% bursts {bursts:3d} peak {pk:6.0f} Hz flat {flat:.3f} period {lag/100:.2f}s rms {20*np.log10(np.sqrt(np.mean(x**2))+1e-9):.1f} dB")
