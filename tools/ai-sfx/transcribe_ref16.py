"""Segment + word timestamps for the 16 reference clips (English narration) with Whisper on the local GPU."""
import json, pathlib, traceback
HERE = pathlib.Path(__file__).resolve().parent / 'ref'
log = open(HERE / 'ref16_log.txt', 'w', encoding='utf-8')
try:
    import torch, scipy.io.wavfile as wf
    from transformers import pipeline
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', torch_dtype=torch.float16, device='cuda:0')
    res = {}
    for p in sorted(HERE.glob('r*.wav')):
        sr, x = wf.read(p); x = x.astype('float32') / 32768.0
        if x.ndim > 1: x = x.mean(1)
        out = asr({'raw': x, 'sampling_rate': sr}, return_timestamps='word', generate_kwargs={'language': 'english', 'task': 'transcribe'}, chunk_length_s=30, batch_size=4)
        res[p.stem] = out; log.write(p.stem + ' ' + out['text'] + '\n'); log.flush()
    json.dump(res, open(HERE / 'ref16_words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    log.write('DONE\n')
except Exception as e:
    log.write('ERROR ' + repr(e) + '\n' + traceback.format_exc())
log.close()
