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
    ('window_open', 2.5, 'a wooden window being opened', [
        'an old wooden sash window is unlatched and slid open, wood scraping and a small creak, quiet room',
        'opening a wooden window, a latch clicks then the window frame squeaks open, close up',
        'a window being opened, wooden frame rubbing and a short squeak, close microphone, foley']),
    ('sneeze', 2.0, 'a man sneezing', [
        'a man sneezing loudly once, achoo, close up recording',
        'a single loud human sneeze, ah-choo, dry studio recording',
        'a person sneezes, sharp nasal burst, indoors',
        'man sneeze sound effect, one sneeze']),
    ('sniff', 1.5, 'a person sniffing through the nose', [
        'a man sniffs the air through his nose twice, close up',
        'a short nasal inhale, sniffing, close microphone, foley']),
    ('breath_in', 3.0, 'a man taking a deep breath', [
        'a man takes a slow deep breath of fresh air through the nose then exhales softly, close up']),
    ('fan_gear', 2.5, 'an electric fan oscillating mechanism', [
        'an old oscillating desk fan, plastic gear clicking and grinding as the fan head turns, close up',
        'electric fan oscillating mechanism creaking and ticking, motor hum']),
    ('hammer', 2.0, 'a hammer hitting a nail', [
        'a hammer strikes a nail into wood twice, two sharp knocks, close up foley']),
    ('jar_lid', 2.0, 'a lid closing on a glass jar', [
        'a metal lid is placed on a glass jar and twisted shut, close up foley']),
    ('cell_door', 2.5, 'a jail cell door slamming', [
        'a heavy steel jail cell door slides shut and slams with a loud metallic clang']),
    ('air_drift', 3.0, 'a soft gentle breeze', [
        'a soft gentle breeze of air, light airy whoosh, very quiet, no wind gusts']),
]
NEG = 'low quality, noise, distorted, music, speech, talking'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 8

def main():
    dev = 'cuda'
    log(time.strftime('%H:%M:%S'), 'EP3b start', torch.cuda.get_device_name(0))
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
    log(time.strftime('%H:%M:%S'), 'EP3b ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
