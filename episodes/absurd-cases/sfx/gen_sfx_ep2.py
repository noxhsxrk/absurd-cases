"""AI sound effects for absurd-cases EP2 with AudioLDM2 (free, runs locally on the NVIDIA GPU).
Writes out/<cue>_v1.wav, out/<cue>_v2.wav (two takes each, fixed seeds) and progress to gen_log.txt.
Re-running skips takes that already exist; delete a file to regenerate it."""
import os, sys, time, pathlib
import torch, scipy.io.wavfile as wavfile
from diffusers import AudioLDM2Pipeline

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'out'; OUT.mkdir(exist_ok=True)
LOG = open(HERE / 'gen_log.txt', 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()

CUES = [  # absurd-cases EP2: name, seconds, prompt
    ('fan_motor', 8.0, 'an old electric stand fan running at high speed in a quiet room, steady whirring motor and blades'),
    ('fan_winddown', 4.0, 'an electric fan is switched off, the motor and blades slowly spin down to silence'),
    ('electric_buzz', 3.0, 'loud electric shock buzzing, crackling high voltage arc, zapping sparks'),
    ('wind_gust', 6.0, 'strong steady wind blowing through a narrow concrete corridor'),
    ('suit_breath', 6.0, 'slow heavy breathing inside a sealed helmet, muffled, close up'),
    ('heavy_boots', 5.0, 'several men in very heavy armor walking slowly on a street, slow heavy footsteps, gear creaking'),
    ('breaker_clunk', 2.0, 'a large electrical circuit breaker switch thrown off, one heavy mechanical clunk'),
    ('pen_writing', 3.0, 'a pen writing quickly on paper, scratching, close up'),
    ('night_quiet', 10.0, 'quiet night in a neighbourhood during a power outage, faint distant dogs and insects'),
]
NEG = 'low quality, noise, distorted, music, speech'

def main():
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    log(time.strftime('%H:%M:%S'), 'device', dev, torch.cuda.get_device_name(0) if dev == 'cuda' else '')
    pipe = AudioLDM2Pipeline.from_pretrained('cvssp/audioldm2', torch_dtype=torch.float16 if dev == 'cuda' else torch.float32).to(dev)
    log('model loaded')
    for name, sec, prompt in CUES:
        for v, seed in ((1, 11), (2, 29)):
            p = OUT / f'{name}_v{v}.wav'
            if p.exists(): continue
            g = torch.Generator(dev).manual_seed(seed)
            t0 = time.time()
            audio = pipe(prompt, negative_prompt=NEG, num_inference_steps=150, audio_length_in_s=sec, guidance_scale=3.5, generator=g).audios[0]
            wavfile.write(p, 16000, audio)
            log(f'{name}_v{v} {sec:.1f}s done in {time.time() - t0:.1f}s')
    log(time.strftime('%H:%M:%S'), 'ALL DONE')

if __name__ == '__main__':
    try: main()
    except Exception as e:
        import traceback; log('ERROR', repr(e)); log(traceback.format_exc()); sys.exit(1)
