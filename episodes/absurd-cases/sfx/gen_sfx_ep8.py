"""absurd-cases EP8 (the man's own shadow, stalking): real foley with AudioLDM2. For each cue, prompts x 8 takes,
each take scored with CLAP (audio vs the cue text, minus the best match to unwanted texts).
Writes out7/<cue>_r1..r4.wav (best first) + scores.json + progress to gen_log.txt."""
import sys, time, json, pathlib
import numpy as np, torch, scipy.io.wavfile as wavfile
from scipy.signal import resample_poly
from diffusers import AudioLDM2Pipeline

HERE = pathlib.Path(__file__).resolve().parent
LOG = open(HERE / 'gen_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

CUES = [  # (episode, cue, seconds, CLAP target, prompts) — EP8 · the man's own shadow (stalking). Reused from out3/5/6/7: traffic_bed, outdoor_prison, swat_boots, police_sirens, handcuffs, light_switch, room_hum, court_room, gavel_metal, mask_breath, rubber_stamp, wind_blast, smell_puff, whoosh_cloud, dial_beeps
    (8, 'street_steps', 3.0, 'footsteps walking on a pavement then stopping', ['a man walking calmly on a concrete sidewalk in a quiet suburb, footsteps, then he stops', 'leather shoes footsteps on pavement, close foley']),
    (8, 'rubber_flap', 2.0, 'a flat rubber sheet slapping on the ground', ['a wet flat rubber sheet slapping softly on concrete twice, flap flap foley', 'flip flops slapping on a pavement, two soft slaps']),
    (8, 'spotlight_on', 2.0, 'huge floodlights switching on with a heavy clunk', ['huge stadium floodlights switching on with a heavy electrical clunk and a rising hum', 'a big industrial power switch thrown, loud metal clunk then buzzing']),
    (8, 'floodlight_hum', 6.0, 'the electrical hum of big floodlights', ['the steady electrical buzz and hum of big outdoor floodlights at night, no music']),
    (8, 'tape_peel', 2.5, 'sticky tape being slowly peeled off a floor', ['a long strip of strong sticky tape slowly peeled off a concrete floor, loud ripping foley', 'peeling a big rubber sticker off the ground, sticky crackling rip']),
    (8, 'sheet_fold', 1.5, 'a heavy rubber sheet being folded', ['folding a heavy flexible rubber mat in half, soft flap and rustle foley']),
    (8, 'rubber_shrink', 1.0, 'a quick rubbery squeak and whoosh', ['a quick rubbery squeak as a balloon shrinks fast, cartoon fwip', 'a fast rubber squeak and swish']),
    (8, 'mask_cough', 2.0, 'a man coughing through a gas mask', ['a man coughing twice through a gas mask, muffled, close up', 'muffled cough behind a respirator mask']),
    (8, 'noon_bell', 4.0, 'a single large bell strike ringing out', ['a single strike of a large clock tower bell at noon, long ringing tail', 'one deep church bell bong ringing out']),
    (8, 'noon_cicadas', 8.0, 'cicadas buzzing on a hot afternoon with distant traffic', ['loud cicadas buzzing on a hot tropical noon, distant traffic at a bus stop, no music', 'hot midday street ambience with cicadas and a far away bus']),
    (8, 'trombone_down', 2.0, 'a comedic trombone sliding down', ['a comedic trombone slide going down, sad cartoon wah wah', 'a slide whistle falling down in pitch, cartoon']),
    (8, 'sizzle', 1.5, 'a short sizzle on a hot surface', ['a short sizzle of something hitting a hot pan, tss', 'quick sizzling burn sound']),
    (8, 'broom_sweep', 3.0, 'a broom sweeping a pavement', ['a straw broom sweeping a concrete pavement, slow strokes foley']),
]
NEG = 'low quality, noise, distorted, music, speech, talking'
NEG_TONAL = 'low quality, noise, distorted, speech, talking'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 8

def main():
    dev = 'cuda'
    log(time.strftime('%H:%M:%S'), 'EP8 start', torch.cuda.get_device_name(0))
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
    scores = {8: {}}
    for ep, name, sec, target, prompts in CUES:
        OUT = HERE / f'out{ep}'; OUT.mkdir(exist_ok=True)
        tgt = text_emb([target]); cands = []
        for pi, prompt in enumerate(prompts):
            g = torch.Generator(dev).manual_seed(100 + pi)
            t0 = time.time()
            wavs = pipe(prompt, negative_prompt=(NEG_TONAL if name in ('trombone_down', 'noon_bell') else NEG), num_inference_steps=200, audio_length_in_s=sec, guidance_scale=4.0, num_waveforms_per_prompt=N, generator=g).audios
            ae = audio_emb(list(wavs))
            s = (ae @ tgt.T).squeeze(1) - 0.5 * (ae @ (bad[1:] if name in ('trombone_down', 'noon_bell') else bad).T).max(1).values
            for w, sc in zip(wavs, s.tolist()): cands.append((sc, pi, w))
            log(f'{name} p{pi} {N} takes in {time.time() - t0:.1f}s best {max(s.tolist()):.3f}')
        cands.sort(key=lambda c: -c[0])
        scores[ep][name] = []
        for r, (sc, pi, w) in enumerate(cands[:4], 1):
            w = w / max(1e-6, np.abs(w).max()) * 0.9
            wavfile.write(OUT / f'{name}_r{r}.wav', 16000, (w * 32767).astype(np.int16))
            scores[ep][name].append({'rank': r, 'score': round(sc, 4), 'prompt': pi})
        json.dump(scores[ep], open(OUT / 'scores.json', 'w'), indent=1)
    log(time.strftime('%H:%M:%S'), 'EP8 ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
