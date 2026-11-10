import json,re,sys
words=json.load(open('vsl/build/words.json'))['words']
OFF=0.8; DUR=60.0
words=[w for w in words if w['type']=='word' and not re.match(r'^\[|\]$',w['text'])]
for w in words: w['start']+=OFF; w['end']+=OFF
# phrases: split on punctuation or every 4 words
phr=[];cur=[]
for w in words:
    cur.append(w)
    if re.search(r'[.?!:]$',w['text']) or len(cur)>=4:
        phr.append(cur);cur=[]
if cur: phr.append(cur)
phrases=[{'start':p[0]['start'],'end':p[-1]['end'],'words':[{'text':w['text'],'start':w['start'],'end':w['end']} for w in p]} for p in phr]
def at(txt,n=0):
    hits=[w for w in words if w['text'].lower().strip('.,?:!')==txt.lower()]
    return hits[n]['start']
scenes=[
 {'id':'s0','start':0,'end':at('todo')},
 {'id':'s1','start':at('todo'),'end':at('e',1),'cues':[0.3,at('gravar')-at('todo'),at('editar')-at('todo'),at('tempo')-at('todo'),at('resultado')-at('todo')]},
 {'id':'s2','start':at('e',1),'end':at('funciona')},
 {'id':'s3','start':at('funciona'),'end':at('isso',1),'cues':[at('pede')-at('funciona'),at('escreve')-at('funciona'),at('elevenlabs')-at('funciona'),at('metricool')-at('funciona'),at('sem',0)-at('funciona'),at('sem',1)-at('funciona'),at('sem',2)-at('funciona')]},
 {'id':'s4','start':at('isso',1),'end':at('tudo',1),'cues':[at('passo')-at('isso',1),at('dezesseis')-at('isso',1)]},
 {'id':'s5','start':at('tudo',1),'end':at('toca'),'cues':[at('sete',2)-at('tudo',1)]},
 {'id':'s6','start':at('toca'),'end':DUR},
]
json.dump({'dur':DUR,'offset':OFF,'words':phrases,'scenes':scenes},open('vsl/build/timeline.json','w'),ensure_ascii=False,indent=1)
for s in scenes: print(s['id'],round(s['start'],2),round(s['end'],2),[round(c,2) for c in s.get('cues',[])])
print(len(phrases),'phrases')
