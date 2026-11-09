"""absurd-cases EP7 (lightning vs the router): real foley with AudioLDM2. For each cue, prompts x 8 takes,
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

CUES = [  # (episode, cue, seconds, CLAP target, prompts) — EP7 · lightning vs the router
    (7, 'rain_window', 8.0, 'heavy rain at night heard from inside a room', ['heavy rain against a bedroom window at night, distant thunder rumbles, quiet room, no music']),
    (7, 'mouse_clicks', 3.0, 'computer mouse clicking', ['fast computer mouse clicking and keyboard tapping, gaming at a desk, close up']),
    (7, 'thunder_close', 4.0, 'a very loud close thunder crack', ['a lightning bolt strikes very close, sharp deafening thunder crack then deep rumble', 'extremely loud nearby thunderclap with crackle']),
    (7, 'glass_burst', 2.0, 'a window bursting open', ['a window bursts open in a storm, glass rattling and wind gust']),
    (7, 'electric_pop', 2.0, 'an electrical device short circuiting and popping', ['a small electronic device short circuits with a loud electric pop, sparks crackling and fizzing', 'a wifi router explodes with an electrical zap and pop']),
    (7, 'electric_crackle', 4.0, 'electricity crackling and buzzing', ['high voltage electricity crackling and buzzing, sparking arcs, tesla coil']),
    (7, 'police_sirens', 6.0, 'police sirens', ['several police car sirens wailing on a rainy city street at night']),
    (7, 'night_street_rain', 8.0, 'rain on a city street at night', ['rain falling on a city street at night, wet tyres in the distance, no music']),
    (7, 'engine_rev', 3.0, 'car engines revving loudly', ['several police cars revving their engines hard at the same time, loud engine roar']),
    (7, 'tyre_squeal', 2.0, 'tyres screeching', ['car tyres spinning and screeching on wet asphalt, burnout']),
    (7, 'jet_takeoff', 4.0, 'a jet engine taking off', ['a jet engine roaring as it takes off, rising powerful whoosh', 'rocket boosters igniting and lifting off with a roar']),
    (7, 'high_wind_rain', 8.0, 'strong wind and rain high in the sky', ['strong wind and heavy rain inside a storm cloud, howling gusts, no music']),
    (7, 'whoosh_cloud', 2.0, 'a fast whoosh through air', ['a fast airy whoosh passing through a cloud, swish']),
    (7, 'car_door_open', 1.5, 'a car door being flung open', ['a car door flung open hard, metal clunk, wind rushing in']),
    (7, 'handcuffs', 1.5, 'handcuffs clicking shut', ['metal handcuffs ratcheting and clicking shut, close up foley', 'police handcuffs closing, ratchet clicks']),
    (7, 'room_hum', 6.0, 'a quiet room with an electrical hum', ['quiet interrogation room, fluorescent light hum, room tone']),
    (7, 'mic_blast', 2.5, 'a microphone exploding with an electric blast', ['a microphone hit by electricity explodes, loud electric zap and bang, then crackling fire', 'an electrical explosion, zap and boom']),
    (7, 'mic_feedback', 1.5, 'microphone feedback squeal', ['microphone feedback squeal, short high pitched whine']),
    (7, 'court_room', 6.0, 'a quiet room with soft murmuring', ['quiet courtroom room tone, soft murmuring of a few people, paper rustle']),
    (7, 'gavel_rubber', 1.0, 'a rubber mallet thud', ['a rubber mallet hitting a wooden desk, dull soft thud']),
    (7, 'cell_door', 2.5, 'a prison cell door slamming', ['a steel prison cell door slams shut, loud metal clang']),
    (7, 'cell_hum', 6.0, 'a quiet concrete corridor', ['quiet concrete prison corridor, faint ventilation hum, distant drip']),
    (7, 'electric_zip', 1.5, 'an electric zap racing along metal', ['an electric zap racing along metal bars, fast zipping crackle']),
    (7, 'fan_spinup', 4.0, 'a motor spinning up faster and faster to a jet whine', ['an electric fan motor spinning up faster and faster until it screams like a jet engine', 'a turbine spinning up to a high pitched whine']),
    (7, 'dial_beeps', 2.0, 'fast electronic beeps', ['a digital counter beeping rapidly, rising electronic beeps']),
    (7, 'wind_blast', 3.0, 'a huge blast of wind', ['a huge blast of wind like a tornado, roaring gust', 'hurricane wind gust roaring']),
    (7, 'wind_high', 8.0, 'wind high in the sky', ['wind blowing high above a city, airy and open, no music']),
    (7, 'national_alarm', 8.0, 'an air raid siren', ['a city wide emergency air raid siren wailing slowly in the distance']),
    (7, 'phone_alert', 2.0, 'a phone emergency alert tone', ['a smartphone emergency alert tone, loud repeating two tone beeps']),
]
NEG = 'low quality, noise, distorted, music, speech, talking'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 8

def main():
    dev = 'cuda'
    log(time.strftime('%H:%M:%S'), 'EP7 start', torch.cuda.get_device_name(0))
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
    scores = {7: {}}
    for ep, name, sec, target, prompts in CUES:
        OUT = HERE / f'out{ep}'; OUT.mkdir(exist_ok=True)
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
        scores[ep][name] = []
        for r, (sc, pi, w) in enumerate(cands[:4], 1):
            w = w / max(1e-6, np.abs(w).max()) * 0.9
            wavfile.write(OUT / f'{name}_r{r}.wav', 16000, (w * 32767).astype(np.int16))
            scores[ep][name].append({'rank': r, 'score': round(sc, 4), 'prompt': pi})
        json.dump(scores[ep], open(OUT / 'scores.json', 'w'), indent=1)
    log(time.strftime('%H:%M:%S'), 'EP7 ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
