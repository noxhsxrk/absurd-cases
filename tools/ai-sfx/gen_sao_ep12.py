"""EP8 v2 foley with Stable Audio Open 1.0 (44.1 kHz stereo): each cue x N takes, ranked by CLAP (laion/larger_clap_general)
against the cue text minus unwanted texts. Writes out_sao12/<cue>_r1..rN.wav (best first) + scores.json; log -> sao_log.txt.
Needs a one-time `huggingface-cli login` by Nox (hf_login.bat) and the gated licence accepted on the model page."""
import sys, time, json, pathlib
import numpy as np, torch, soundfile as sf

HERE = pathlib.Path(__file__).resolve().parent; OUT = HERE / 'out_sao12'; OUT.mkdir(exist_ok=True)
LOG = open(HERE / 'sao_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

CUES = [  # cue, seconds, CLAP target, prompt  (police_whistle, flipflop_steps, wheel_clamp, tow_winch, truck_away: generated 2026-11-11, in the store)
    ('house_door', 3, 'a wooden front door being unlatched and opened', 'A wooden house front door: the metal door handle is pressed down with a clear latch click, then the door swings open slowly on its hinges with a short soft creak, close foley, quiet house, dry.'),
    ('door_creak', 3, 'a wooden door creaking open', 'A door knob clicks, then an old wooden door slowly creaks open, a long squeaky hinge creak rising in pitch, indoor, close microphone, dry, no music.'),
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
