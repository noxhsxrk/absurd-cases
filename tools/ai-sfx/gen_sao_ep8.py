"""EP8 v2 foley with Stable Audio Open 1.0 (44.1 kHz stereo): each cue x N takes, ranked by CLAP (laion/larger_clap_general)
against the cue text minus unwanted texts. Writes out_sao8/<cue>_r1..rN.wav (best first) + scores.json; log -> sao_log.txt.
Needs a one-time `huggingface-cli login` by Nox (hf_login.bat) and the gated licence accepted on the model page."""
import sys, time, json, pathlib
import numpy as np, torch, soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent; OUT = HERE / 'out_sao8'; OUT.mkdir(exist_ok=True)
LOG = open(HERE / 'sao_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

CUES = [  # cue, seconds, CLAP target, prompt
    ('village_amb', 10, 'a quiet residential street in the afternoon with birds', 'Quiet residential neighbourhood street in Thailand on a sunny afternoon, birds chirping, a distant motorbike passing, light breeze, field recording, no music.'),
    ('steps_road', 5, 'footsteps of a man walking on asphalt', 'Close foley of a man in sneakers walking slowly on an asphalt road, clear footsteps, outdoors, no music.'),
    ('steps_stop', 2, 'footsteps that stop', 'A man walking on asphalt takes three steps and stops, sneakers, close foley.'),
    ('swat_run', 4, 'a group of soldiers in boots running', 'A squad of police officers in heavy boots running fast on asphalt, gear and equipment rattling, close, outdoors.'),
    ('siren', 7, 'a police siren close by', 'A police car siren wailing close by on a quiet street, realistic recording.'),
    ('flood_on', 2.5, 'big floodlights switching on with a clunk', 'Heavy industrial floodlights switched on one after another, loud electrical clunks, then a rising electrical hum.'),
    ('flood_hum', 6, 'the electrical hum of floodlights', 'Steady electrical buzz and hum of powerful outdoor floodlights, no music.'),
    ('trowel_scrape', 3, 'a metal trowel scraping on asphalt', 'A steel plaster trowel scraping hard on rough asphalt, close foley, gritty.'),
    ('peel', 3, 'a thick rubber sheet peeled off the ground', 'A thick sticky rubber mat slowly peeled off a road surface, loud sticky ripping and crackling, close foley.'),
    ('fold', 2, 'a rubber mat being folded', 'Folding a heavy flexible rubber mat in half, soft flap and rubbery rustle, close foley.'),
    ('cuffs', 2, 'handcuffs clicking shut', 'Metal handcuffs ratcheting and clicking shut, close foley, crisp.'),
    ('room_tone', 6, 'a quiet room with a fluorescent light hum', 'Interrogation room tone, fluorescent tube light buzzing, quiet, slight air conditioner hum.'),
    ('lamp_click', 1.5, 'a desk lamp switch clicking on', 'A metal desk lamp switch clicked on, single sharp click, close foley.'),
    ('shrink', 1.5, 'a quick rubbery squeak', 'A quick rubbery squeak and squeeze, like a rubber toy being squashed fast, short.'),
    ('court_amb', 6, 'a quiet courtroom with murmurs', 'Quiet courtroom ambience, faint murmurs, paper shuffling, a chair creaking, large wooden room.'),
    ('cough', 2.5, 'an old man coughing', 'An old man coughing twice and clearing his throat in a quiet room.'),
    ('gavel', 2, 'a wooden gavel striking', 'A judge wooden gavel striking a sound block twice, sharp wooden knock, courtroom.'),
    ('vest', 2, 'a fabric vest being put on', 'Putting on a reflective safety vest, fabric rustle and velcro rip, close foley.'),
    ('beep', 2, 'an electronic beep', 'Small electronic ankle monitor beeping twice, short high beeps.'),
    ('noon_amb', 10, 'cicadas on a hot noon with distant traffic', 'Hot tropical noon at a bus stop, loud cicadas, distant traffic and a bus passing, field recording, no music.'),
    ('noon_bell', 5, 'a single large bell strike', 'A single strike of a large bell at noon with a long ringing tail.'),
    ('squash', 2, 'a wet squishy slide', 'A wet rubbery squish and slide on pavement, short.'),
    ('stamp', 1.5, 'a rubber stamp thumping on paper', 'A rubber stamp thumped hard onto paper on a wooden desk, single thud.'),
    ('phone_taps', 2, 'tapping on a phone screen', 'Fingers tapping on a smartphone touchscreen three times, then a call ringing tone starts.'),
]
NEG = 'low quality, distorted, music, speech, singing'
UNWANTED = ['music', 'a person talking', 'static noise', 'silence']
N = 4

def main():
    from diffusers import StableAudioPipeline
    from transformers import ClapModel, ClapProcessor
    import librosa
    only = set(sys.argv[1:])
    log(time.strftime('%H:%M:%S'), 'SAO EP8 start', torch.cuda.get_device_name(0))
    pipe = StableAudioPipeline.from_pretrained('stabilityai/stable-audio-open-1.0', torch_dtype=torch.float16).to('cuda')
    clap = ClapModel.from_pretrained('laion/larger_clap_general').to('cuda').eval(); proc = ClapProcessor.from_pretrained('laion/larger_clap_general')
    def vec(o, *names):
        if torch.is_tensor(o): return o
        for n in names:
            v = getattr(o, n, None)
            if v is not None: return v
        return o.pooler_output
    def temb(texts):
        with torch.no_grad():
            t = proc(text=texts, return_tensors='pt', padding=True).to('cuda'); e = vec(clap.get_text_features(**t), 'text_embeds')
        return torch.nn.functional.normalize(e, dim=-1)
    def aemb(wav48):
        with torch.no_grad():
            try: a = proc(audio=[wav48], sampling_rate=48000, return_tensors='pt')
            except TypeError: a = proc(audios=[wav48], sampling_rate=48000, return_tensors='pt')
            a = a.to('cuda'); e = vec(clap.get_audio_features(**a), 'audio_embeds')
        return torch.nn.functional.normalize(e, dim=-1)
    unwanted = temb(UNWANTED); scores = json.load(open(OUT / 'scores.json')) if (OUT / 'scores.json').exists() else {}
    for cue, sec, target, prompt in CUES:
        if only and cue not in only: continue
        t0 = time.time(); g = torch.Generator('cuda').manual_seed(hash(cue) % 10000)
        out = pipe(prompt, negative_prompt=NEG, num_inference_steps=100, guidance_scale=7.0, audio_end_in_s=float(sec), num_waveforms_per_prompt=N, generator=g).audios
        tg = temb([target]); takes = []
        for k in range(N):
            w = out[k].T.float().cpu().numpy()                      # (samples, 2) at 44100
            mono = w.mean(1); m48 = librosa.resample(mono, orig_sr=44100, target_sr=48000)
            ae = aemb(m48); s = float((ae @ tg.T).item() - 0.5 * (ae @ unwanted.T).max().item())
            takes.append((s, w))
        takes.sort(key=lambda x: -x[0])
        for r, (s, w) in enumerate(takes, 1):
            pk = np.abs(w).max() or 1; sf.write(OUT / f'{cue}_r{r}.wav', (w / pk * 0.89).astype(np.float32), 44100, subtype='PCM_16')
        scores[cue] = [round(s, 4) for s, _ in takes]; json.dump(scores, open(OUT / 'scores.json', 'w'), indent=1)
        log(cue, 'done', round(time.time() - t0, 1), 's', scores[cue])
    log(time.strftime('%H:%M:%S'), 'SAO EP8 DONE')
    import subprocess; subprocess.run([sys.executable, str(HERE.parent / 'sfx_index.py'), 'publish'])   # index + upload to the store + free disk + push index

if __name__ == '__main__':
    main()
