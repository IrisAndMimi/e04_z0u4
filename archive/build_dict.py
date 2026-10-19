import math, re, collections, json
D='/home/claude/zy/libchewing-data/dict/chewing/'
cjk=re.compile(r'^[㐀-䶿一-鿿豈-﫿]+$')
TONES='ˊˇˋ˙'
def norm(s):  # ensure tone at end
    return s
entries=collections.defaultdict(int)  # (phrase, reading)->freq
for fn in ['tsi.csv','alt.csv']:
    for l in open(D+fn,encoding='utf8'):
        if l.startswith('#'): continue
        r=l.rstrip('\n').split(',')
        if len(r)<3: continue
        p,f,b=r[0],int(r[1]),r[2]
        syl=b.split()
        if not cjk.match(p) or len(syl)!=len(p): continue
        entries[(p,b)]=max(entries[(p,b)],f)
for l in open(D+'word.csv',encoding='utf8'):
    if l.startswith('#'): continue
    r=l.rstrip('\n').split(',')
    if len(r)<3: continue
    p,f,b=r[0],int(r[1]),r[2]
    if len(p)!=1 or not cjk.match(p): continue
    entries.setdefault((p,b),0)
    if (p,b) not in entries: entries[(p,b)]=0
TH=3
syls=set()
for (p,b),f in entries.items():
    if len(p)==1: syls.add(b)
syls=sorted(syls)
sid={s:i for i,s in enumerate(syls)}
print('syllables',len(syls))
def b36(n):
    a='0123456789abcdefghijklmnopqrstuvwxyz'; s=''
    while True:
        s=a[n%36]+s; n//=36
        if n==0: return s
def enc(i): return chr(0xE000+i)
def bucket(f): return min(35, round(math.log2(f+1)*1.6))
groups=collections.defaultdict(list)
skipped=0
for (p,b),f in entries.items():
    ss=b.split()
    if any(s not in sid for s in ss): skipped+=1; continue
    if len(p)>1 and f<TH: continue
    groups[''.join(enc(sid[s]) for s in ss)].append((f,p))
print('skipped',skipped,'groups',len(groups))
lines=[]
n=0
for k,v in groups.items():
    v.sort(key=lambda x:-x[0])
    n+=len(v)
    lines.append(k+'\t'+''.join(p for f,p in v)+'\t'+''.join('0123456789abcdefghijklmnopqrstuvwxyz'[bucket(f)] for f,p in v))
print('entries',n)
data='\n'.join(lines)
js='window.ZY_SYL='+json.dumps(' '.join(syls),ensure_ascii=False)+';\nwindow.ZY_DICT='+json.dumps(data,ensure_ascii=False)+';\n'
open('data.js','w',encoding='utf8').write(js)
print('bytes',len(js.encode()))
