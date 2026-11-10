"""Procedural royalty-free background music: soft lo-fi pad + sub pulse, ~70 s, generated from scratch (no samples)."""
import numpy as np, wave, sys
SR=44100; DUR=float(sys.argv[1]) if len(sys.argv)>1 else 72.0; BPM=92
t=np.arange(int(SR*DUR))/SR
def note(f): return 440*2**((f-69)/12)
# chord progression (Am – F – C – G) in midi, 2 bars each
chords=[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]]
beat=60/BPM; bar=4*beat; seg=2*bar
out=np.zeros_like(t)
for i,ch in enumerate(chords*int(np.ceil(DUR/seg/len(chords)))):
    s=i*seg; e=min(s+seg,DUR)
    if s>=DUR: break
    idx=(t>=s)&(t<e); tt=t[idx]-s
    env=np.minimum(1,tt/1.2)*np.minimum(1,(e-s-tt)/1.5)
    pad=np.zeros_like(tt)
    for m in ch:
        f=note(m)
        pad+=0.5*np.sin(2*np.pi*f*tt)+0.25*np.sin(2*np.pi*2*f*tt+0.3)+0.12*np.sin(2*np.pi*0.5*f*tt)
        pad+=0.2*np.sin(2*np.pi*(f*1.003)*tt)  # detune for warmth
    out[idx]+=pad*env*0.08
# soft kick on 1 and 3, hat on offbeats
for b in np.arange(0,DUR,beat):
    k=int(b*SR); n=int(0.25*SR)
    if k+n>len(out): break
    tt=np.arange(n)/SR
    if int(round(b/beat))%2==0:
        out[k:k+n]+=0.35*np.sin(2*np.pi*(55*np.exp(-tt*8)+40)*tt)*np.exp(-tt*14)
    h=int((b+beat/2)*SR); hn=int(0.05*SR)
    if h+hn<len(out):
        out[h:h+hn]+=0.04*np.random.randn(hn)*np.exp(-np.arange(hn)/SR*90)
# gentle lowpass via moving average
k=np.ones(6)/6; out=np.convolve(out,k,'same')
out=np.tanh(out*1.6)*0.9
# fade in/out
fi=int(1.5*SR); fo=int(2.5*SR)
out[:fi]*=np.linspace(0,1,fi); out[-fo:]*=np.linspace(1,0,fo)
pcm=(out/np.max(np.abs(out))*0.8*32767).astype(np.int16)
with wave.open(sys.argv[2] if len(sys.argv)>2 else 'music.wav','wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('music ok',DUR)
