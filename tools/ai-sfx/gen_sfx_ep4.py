"""absurd-cases EP3 round 2: better foley. For each cue, several prompts x 8 takes with AudioLDM2,
each take scored with CLAP (audio vs the cue text, minus the best match to unwanted texts).
Writes out3/<cue>_r1..r4.wav (best first) + out3/scores.json + progress to gen_log.txt."""
import sys, time, json, pathlib
import numpy as np, torch, scipy.io.wavfile as wavfile
from scipy.signal import resample_poly
from diffusers import AudioLDM2Pipeline

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'out3'; OUT.mkdir(exist_ok=True)
LOG = open(HERE / 'gen_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

# cue, seconds, what it should be (CLAP target), prompts
CUES = [
    ('fridge_open', 2.0, 'a refrigerator door being opened', [
        'opening a refrigerator door, rubber seal unsticking with a soft suction pop, then the fridge hum, close up foley',
        'a fridge door pulled open at night, seal pop and bottles rattle in the door']),
    ('fridge_hum', 6.0, 'a refrigerator humming', ['a refrigerator motor humming quietly in a dark kitchen at night']),
    ('door_crash', 2.5, 'a door being kicked in and crashing to the floor', [
        'a wooden door is kicked in, splinters, and slams flat onto the floor with a heavy crash',
        'police breach a door with a battering ram, loud wooden crash']),
    ('swat_boots', 3.0, 'many people running in boots', ['a squad of police officers in heavy boots rushing into a room, gear rattling']),
    ('mask_breath', 3.0, 'breathing through a gas mask', ['heavy breathing through a gas mask respirator, darth vader like hiss, close up']),
    ('tape_unroll', 2.0, 'tape being unrolled', ['plastic barrier tape being pulled and unrolled quickly, crinkling plastic, close up']),
    ('smell_puff', 2.0, 'a gust of air', ['a thick gassy puff of air released, soft whoosh with a low rumble']),
    ('body_fall', 2.0, 'a person falling onto the floor', ['a man collapses and falls flat on his back onto a hard floor, heavy thud']),
    ('night_kitchen', 8.0, 'a quiet room at night', ['a quiet kitchen at night, faint distant crickets outside, very quiet room tone']),
]
NEG = 'low quality, noise, distorted, music, speech, talking'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 8

def main():
    dev = 'cuda'
    log(time.strftime('%H:%M:%S'), 'EP4 start', torch.cuda.get_device_name(0))
    pipe = AudioLDM2Pipeline.from_pretrained('cvssp/audioldm2', torch_dtype=torch.float16).to(dev)
    clap, tok, fe = pipe.text_encoder, pipe.tokenizer, pipe.feature_extractor
    def text_emb(texts):
        with torch.no_grad():
            t = tok(texts, padding=True, return_tensors='pt').to(dev)
            e = clap.get_text_features(**t); return torch.nn.functional.normalize(e.float(), dim=-1)
    def audio_emb(wavs):
        x = fe([resample_poly(w, 3, 1).astype(np.float32) for w in wavs], sampling_rate=48000, return_tensors='pt').input_features.to(dev, torch.float16)
        with torch.no_grad():
            e = clap.get_audio_features(input_features=x); return torch.nn.functional.normalize(e.float(), dim=-1)
    bad = text_emb(UNWANTED)
    scores = {}
    for name, sec, target, prompts in CUES:
        tgt = text_emb([target]); cands = []
        for pi, prompt in enumerate(prompts):
            g = torch.Generator(dev).manual_seed(100 + pi)
            t0 = time.time()
            wavs = pipe(prompt, negative_prompt=NEG, num_inference_steps=200, audio_length_in_s=sec, guidance_scale=4.0, num_waveforms_per_prompt=N, generator=g).audios
            ae = audio_emb(list(wavs))
            s = (ae @ tgt.T).squeeze(1) - 0.5 * (ae @ bad.T).max(1).values
            for w, sc in zip(wavs, s.tolist()): cands.append((sc, pi, w))
            log(f'{name} p{pi} {N} takes in {time.time() - t0:.1f}s best {max(s.tolist()):.3f}')
        cands.sort(key=lambda c: -c[0])
        scores[name] = []
        for r, (sc, pi, w) in enumerate(cands[:4], 1):
            w = w / max(1e-6, np.abs(w).max()) * 0.9
            wavfile.write(OUT / f'{name}_r{r}.wav', 16000, (w * 32767).astype(np.int16))
            scores[name].append({'rank': r, 'score': round(sc, 4), 'prompt': pi})
        json.dump(scores, open(OUT / 'scores.json', 'w'), indent=1)
    log(time.strftime('%H:%M:%S'), 'EP4 ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
