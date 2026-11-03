"""AI sound effects for absurd-cases EP1 with AudioLDM2 (free, runs locally on the NVIDIA GPU).
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

CUES = [  # name, seconds, prompt
    ('light_switch', 1.5, 'a single plastic light switch click in a quiet bedroom, close up'),
    ('mosquito', 5.0, 'a single mosquito buzzing close to the ear in a quiet room at night'),
    ('swarm', 10.0, 'a huge swarm of mosquitoes buzzing loudly, dense insect buzz'),
    ('crickets', 10.0, 'crickets chirping softly at night outside a window, calm'),
    ('police_arrive', 6.0, 'police car siren approaching fast, then tires screeching as the car brakes hard on a night street'),
    ('car_door', 2.0, 'a car door slams shut outdoors at night'),
    ('door_open', 2.0, 'a wooden bedroom door is kicked open and slams against the wall'),
    ('stampede', 4.0, 'a group of soldiers in heavy boots running fast into a small room, gear rattling'),
    ('radio_squelch', 1.5, 'police radio squelch beep with short static burst'),
    ('keys', 2.0, 'metal handcuffs jingling, chain rattle, close up'),
    ('cuff_click', 1.5, 'handcuffs ratcheting closed, quick metallic clicks'),
    ('thud1', 2.0, 'two hands slam hard on a metal table in a quiet room'),
    ('glass_hit', 1.5, 'a small glass jar rattles and clinks on a metal table'),
    ('thud2', 1.5, 'a rubber stamp slammed hard onto paper on a wooden desk'),
    ('knock', 1.5, 'a single wooden gavel strike on a sound block in a courtroom'),
    ('hit', 2.0, 'a dramatic deep cinematic impact hit'),
    ('riser', 5.0, 'cinematic suspense riser building up tension, rising whoosh'),
    ('flicker', 10.0, 'fluorescent light buzzing hum in a small empty interrogation room'),
    ('murmur', 10.0, 'quiet courtroom crowd murmuring, people whispering'),
    ('helicopter', 10.0, 'news helicopter hovering over a city at night, rotor blades'),
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
