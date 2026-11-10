"""Word timestamps for the narrator take with Whisper (runs on the local GPU). Writes ep10_words.json + transcribe_ep10_log.txt."""
import json, pathlib, sys, traceback
HERE = pathlib.Path(__file__).resolve().parent
log = open(HERE / 'transcribe_ep10_log.txt', 'w', encoding='utf-8')
try:
    import torch, numpy as np, scipy.io.wavfile as wf, scipy.signal as ss
    from transformers import pipeline
    sr, x = wf.read(HERE / 'narration_ep10_16.wav'); x = x.astype('float32') / (32768.0 if x.dtype.kind == 'i' else 1.0)
    if x.ndim > 1: x = x.mean(1)
    x = ss.resample_poly(x, 16000, sr).astype('float32')
    asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', torch_dtype=torch.float16, device='cuda:0')
    out = asr({'raw': x, 'sampling_rate': 16000}, return_timestamps='word', generate_kwargs={'language': 'thai', 'task': 'transcribe'}, chunk_length_s=30, batch_size=4)
    json.dump(out, open(HERE / 'ep10_words.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    log.write('OK\n' + out['text'] + '\n')
except Exception as e:
    log.write('ERROR ' + repr(e) + '\n' + traceback.format_exc())
log.close()
