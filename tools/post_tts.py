#!/usr/bin/env python3
"""Trim Gemini takes, write lines/<id>.wav + epN_lines_meta.json + review mp3 (script order)."""
import json, sys, subprocess, numpy as np, wave, pathlib
ep=int(sys.argv[1]); root=pathlib.Path(sys.argv[2]); script=json.load(open(sys.argv[3]))['lines']
src=root/f'ep{ep}'/'src'; dst=root/f'ep{ep}'/'lines'; dst.mkdir(parents=True,exist_ok=True)
def read(p):
    w=wave.open(str(p)); sr=w.getframerate(); x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768; return x,sr
def write(p,x,sr):
    w=wave.open(str(p),'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(x,-1,1)*32767).astype(np.int16).tobytes()); w.close()
meta={}; rows=[]; parts=[]
for L in script:
    p=src/f"{L['id']}.wav"
    if not p.exists(): rows.append((L['id'],'MISSING')); continue
    x,sr=read(p); hop=int(sr*0.01)
    rms=np.array([np.sqrt(np.mean(x[i:i+hop]**2)+1e-12) for i in range(0,len(x)-hop,hop)])
    db=20*np.log10(rms); thr=max(db.max()-38,-55); v=db>thr
    if not v.any(): rows.append((L['id'],'SILENT')); continue
    a=np.argmax(v); b=len(v)-np.argmax(v[::-1])
    s=max(0,a*hop-int(.06*sr)); e=min(len(x),b*hop+int(.06*sr)); y=x[s:e]
    write(dst/f"{L['id']}.wav",y,sr)
    # voiced segments (pauses >= 180 ms split)
    vv=v[a:b]; segs=[]; i=0; n=len(vv)
    while i<n:
        if vv[i]:
            j=i
            while j<n and (vv[j] or (not vv[j:j+18].all()==False and False)): j+=1
            segs.append([i,j]); i=j
        else: i+=1
    merged=[]
    for sg in segs:
        if merged and sg[0]-merged[-1][1]<18: merged[-1][1]=sg[1]
        else: merged.append(sg)
    off=(a*hop-s)/sr
    segs=[[round(off+g[0]*0.01,3),round(off+g[1]*0.01,3)] for g in merged if g[1]-g[0]>=5]
    d=len(y)/sr; meta[L['id']]={'dur':round(d,3),'segs':segs}
    chars=len(L['text']); rate=chars/d
    rows.append((L['id'],f"{d:.2f}s raw {len(x)/sr:.2f}s segs {len(segs)} chars/s {rate:.1f}"))
    parts.append(y); parts.append(np.zeros(int(sr*0.7),np.float32))
json.dump(meta,open(sys.argv[4],'w'),indent=1)
for r in rows: print(*r)
if parts:
    rv=root/f'ep{ep}'/f'ep{ep}_review.wav'; write(rv,np.concatenate(parts),24000)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(rv),'-b:a','128k',str(rv.with_suffix('.mp3'))],check=True); rv.unlink()
    print('review', rv.with_suffix('.mp3'))
