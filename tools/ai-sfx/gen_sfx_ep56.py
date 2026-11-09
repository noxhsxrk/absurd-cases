"""absurd-cases EP5 (soap) + EP6 (footbridge): real foley with AudioLDM2. For each cue, prompts x 8 takes,
each take scored with CLAP (audio vs the cue text, minus the best match to unwanted texts).
Writes out5/ and out6/<cue>_r1..r4.wav (best first) + scores.json + progress to gen_log.txt."""
import sys, time, json, pathlib
import numpy as np, torch, scipy.io.wavfile as wavfile
from scipy.signal import resample_poly
from diffusers import AudioLDM2Pipeline

HERE = pathlib.Path(__file__).resolve().parent
LOG = open(HERE / 'gen_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

CUES = [  # (episode, cue, seconds, CLAP target, prompts)
    # ---- EP6 · footbridge
    (6, 'traffic_bed', 8.0, 'city traffic on a wide road', ['busy city traffic on a wide eight lane road in daytime, cars passing by, distant horns, no music']),
    (6, 'car_pass', 2.5, 'a car driving past quickly', ['a single car driving past fast on a city road, whoosh pass by']),
    (6, 'tired_steps', 4.0, 'slow footsteps climbing concrete stairs and heavy breathing', ['a tired man slowly climbing concrete stairs, heavy footsteps and loud panting breath', 'slow heavy footsteps up a concrete staircase, out of breath']),
    (6, 'panting', 3.0, 'a man panting out of breath', ['an exhausted man panting heavily, out of breath after running, close up']),
    (6, 'knee_crack', 1.0, 'a loud bone crack', ['a loud knee joint crack, bone popping, close up foley', 'knuckles cracking loudly, crunchy bone pop']),
    (6, 'army_trucks', 6.0, 'heavy diesel trucks engines rumbling', ['several heavy military trucks with diesel engines idling and rumbling, deep engine roar']),
    (6, 'heli_hover', 6.0, 'a helicopter hovering', ['a helicopter hovering overhead, rotor blades thumping loudly']),
    (6, 'police_sirens', 6.0, 'police sirens', ['several police car sirens wailing on a city street']),
    (6, 'traffic_cones', 2.0, 'plastic objects being dropped on the ground', ['plastic traffic cones being placed down quickly on asphalt, hollow plastic knocks']),
    (6, 'saw_concrete', 4.0, 'a circular saw cutting concrete', ['a powerful circular saw cutting through a concrete pillar, high pitched grinding screech with sparks', 'angle grinder cutting concrete and steel, loud whine']),
    (6, 'crane_lift', 4.0, 'a hydraulic crane lifting a heavy load', ['a large hydraulic crane lifting a very heavy concrete load, engine strain, steel cables creaking']),
    (6, 'giant_lock', 2.5, 'a huge heavy metal lock slamming shut', ['a gigantic steel lock slams shut, huge heavy metal clank with ringing echo']),
    (6, 'rubble_fall', 3.0, 'bricks and rubble falling', ['bricks and concrete rubble crumbling and falling to the ground', 'a wall breaking, plaster and bricks falling']),
    (6, 'court_room', 6.0, 'a quiet room with soft murmuring', ['quiet courtroom room tone, soft murmuring of a few people, paper rustle']),
    (6, 'throat_clear', 1.5, 'a man clearing his throat', ['an old man clearing his throat, ahem, close up']),
    (6, 'wind_gap', 3.0, 'wind whistling', ['wind whistling through a narrow gap in a concrete structure, hollow eerie howl']),
    (6, 'gavel_metal', 1.5, 'a wooden hammer striking metal', ['a wooden gavel striking a steel railing, metallic ping with ring']),
    (6, 'concrete_bars', 2.0, 'a heavy object banging against iron bars', ['a heavy concrete block slamming against iron prison bars, loud metal clang and thud']),
    (6, 'chain_rattle', 2.5, 'heavy chains rattling', ['heavy iron chains rattling and being pulled taut, metal links clanking']),
    (6, 'mosquito_swarm', 6.0, 'a swarm of mosquitoes buzzing', ['a huge swarm of mosquitoes buzzing loudly, high pitched whine of many insects', 'a dense cloud of flying insects buzzing']),
    (6, 'outdoor_prison', 6.0, 'an open outdoor area with wind and birds', ['open outdoor area in front of a building, light wind and distant birds, quiet']),
    (6, 'rubber_stamp', 1.0, 'a rubber stamp hitting paper', ['a rubber stamp slammed onto paper on a desk, single thud']),
    # ---- EP5 · soap
    (5, 'shower_bed', 8.0, 'a shower running', ['a shower running in a small tiled bathroom, water splashing on the floor']),
    (5, 'soap_scrub', 3.0, 'wet soap rubbing on skin', ['rubbing a wet soap bar on skin, squeaky wet scrubbing, close up foley']),
    (5, 'soap_slip', 1.5, 'a wet soap bar slipping and squirting out of a hand', ['a wet soap bar squirting out of a hand and sliding across wet tiles, squeaky slide']),
    (5, 'door_crash', 2.5, 'a door being kicked in and crashing', ['a wooden door is kicked in and slams flat onto a tiled floor with a heavy crash']),
    (5, 'swat_boots', 3.0, 'many people running in boots', ['a squad of police officers in heavy boots rushing into a small room, gear rattling']),
    (5, 'slip_falls', 3.0, 'people slipping and falling onto a floor', ['several men slipping on a wet floor one after another and falling with heavy thuds']),
    (5, 'taser', 3.0, 'an electric taser crackling', ['an electric taser crackling and buzzing, sharp electric zaps']),
    (5, 'tongs_creak', 2.0, 'metal tongs squeaking', ['long metal tongs squeaking and creaking as they grip something, close up']),
    (5, 'handcuffs', 1.5, 'handcuffs clicking shut', ['handcuffs clicking shut, metal ratchet clicks, close up']),
    (5, 'bubble_pop', 1.5, 'bubbles popping', ['two soap bubbles popping, tiny wet pops, close up']),
    (5, 'foam_fizz', 6.0, 'foam fizzing and bubbling', ['lots of soap foam fizzing and bubbling, crackling foam']),
    (5, 'cell_door', 2.5, 'a prison cell door slamming', ['a steel prison cell door slams shut, loud metal clang']),
    (5, 'fan_hum', 6.0, 'an electric fan humming', ['an electric fan running on high, motor hum and whirring blades']),
    (5, 'prison_alarm', 6.0, 'a prison alarm siren', ['a prison escape alarm siren wailing in a concrete corridor']),
    (5, 'guard_slip', 2.0, 'a man slipping and falling', ['a man slips on a wet floor and falls hard on his back, thud']),
]
NEG = 'low quality, noise, distorted, music, speech, talking'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 8

def main():
    dev = 'cuda'
    log(time.strftime('%H:%M:%S'), 'EP5+6 start', torch.cuda.get_device_name(0))
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
    scores = {5: {}, 6: {}}
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
    log(time.strftime('%H:%M:%S'), 'EP5+6 ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
