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

CUES = [  # absurd-cases EP3: name, seconds, prompt
    ('vacuum_roar', 6.0, 'an enormous industrial vacuum cleaner turned on, a huge powerful sucking roar of air'),
    ('prison_siren', 7.0, 'a prison alarm siren wailing loudly outdoors, echoing between concrete walls'),
    ('morning_birds', 8.0, 'a calm morning outside an open window, light breeze, a few small birds chirping far away'),
    ('sneeze', 2.0, 'a man sneezes once loudly, close up, indoors'),
    ('window_creak', 2.5, 'an old wooden window is pushed open, a long creaking hinge'),
    ('gear_creak', 2.5, 'an old electric fan oscillating, plastic gears grinding and creaking slowly, then a click'),
    ('hammer_nail', 2.5, 'a hammer hitting a nail into a wooden board twice, close up'),
    ('prison_hall', 8.0, 'empty prison cell block room tone, large concrete hall, faint distant echoes'),
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
