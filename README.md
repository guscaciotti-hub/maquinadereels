# Máquina de Reels — página de vendas

Site estático (`site/`) com VSL, pixel da Meta e checkout Kiwify. Deploy na Vercel (root: `site`).

## Estrutura
- `site/` — página (index.html, termos, privacidade, contato, assets)
- `vsl/` — pipeline da VSL: `render.html` (motion graphics), `build_timeline.py` (sincroniza legenda com a narração), `render.mjs` (frames via Playwright), `music.py` (trilha procedural sem direitos), `build/` (áudio, timeline, saída)
- `docs/roteiro-vsl.md` — roteiro da VSL
- `docs/checklist.md` — o que falta fazer manualmente

## Regerar a VSL
```bash
python3 vsl/music.py 60 vsl/build/music.wav
python3 vsl/build_timeline.py            # usa vsl/build/words.json (timestamps da narração)
node vsl/render.mjs                      # frames em vsl/build/frames
bash vsl/encode.sh                       # mp4 1080p + versão web 720p + poster
```
A narração foi gerada com ElevenLabs (eleven_v4, voice 7ete3BaGPf3vlbnyJnJK). A chave nunca fica no código: use `ELEVENLABS_API_KEY` no ambiente.
