#!/usr/bin/env python3
"""Construit le site de révision 한국어 노트 à partir des fichiers d'import Anki.

Sources lues, dans l'ordre :
  1. archive/*.txt            anciens fichiers (jusqu'au 3 nov. 2026)
  2. done/ et inbox/ de TOUTES les branches du dépôt (la tâche quotidienne pousse sur une branche claude/… par jour)
  3. done/ et inbox/ du dossier de travail
Un mot n'est gardé qu'une fois, dans le premier cours où il apparaît.

Usage : python site/build.py --out _site            (site hors ligne pour GitHub Pages)
        python site/build.py --out x --single       (page seule, sans mise en cache)
"""
import sys,glob,os,re,json,collections,html,subprocess,argparse,datetime,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERE=os.path.join(ROOT,'site')
ap=argparse.ArgumentParser()
ap.add_argument('--out',default='_site'); ap.add_argument('--single',action='store_true')
ap.add_argument('--extra',action='append',default=[],help='dossier supplémentaire de fichiers .txt')
args=ap.parse_args()
def natkey(cid):
    m=re.match(r'([CJ])(\d+)',cid)
    if m: return (0 if m.group(1)=='C' else 1,int(m.group(2)),'')
    return (2,0,cid)
def git(*a):
    try: return subprocess.run(['git','-C',ROOT]+list(a),capture_output=True,text=True,encoding='utf-8').stdout
    except Exception: return ''
sources=[]  # (nom, texte)
for d in [os.path.join(ROOT,'archive')]+args.extra+[os.path.join(ROOT,'done'),os.path.join(ROOT,'inbox')]:
    for f in sorted(glob.glob(os.path.join(d,'*.txt'))):
        sources.append((os.path.basename(f),open(f,encoding='utf-8').read()))
for ref in git('for-each-ref','--format=%(refname)','refs/remotes','refs/heads').split():
    for path in git('ls-tree','-r','--name-only',ref).split('\n'):
        if re.match(r'^(done|inbox)/[^/]+\.txt$',path):
            sources.append((os.path.basename(path),git('show',ref+':'+path)))
rows=[]; seen_src=set()
for base,text in sources:
    h=hashlib.sha1(text.encode('utf-8')).hexdigest()
    if h in seen_src: continue
    seen_src.add(h)
    txt=text.split('\n'); deckh=None
    for l in txt:
        if l.startswith('#deck:'): deckh=l[6:].strip()
    for l in txt:
        if not l.strip() or l.startswith('#'): continue
        p=l.rstrip('\r').split('\t')
        if len(p)<5: continue
        while len(p)<6: p.append('')
        rows.append((base,deckh,p))
def clean(s):
    s=s.replace('&nbsp;',' ')
    return html.unescape(s).strip()
def split_fr(s):
    # returns (main, fr)
    m=re.search(r'<br>\s*<i>(.*?)</i>\s*$',s)
    fr=''
    if m:
        fr=m.group(1); s=s[:m.start()]
    return s,fr
INTERROG=set('누구 누가 뭐 무엇 무슨 어디 언제 왜 어떻게 어떤 어느 몇 얼마 얼마나 며칠 어때요? 웬일이야?'.split())
POS=set('앞 뒤 옆 위 아래 안 밖 사이 근처 왼쪽 오른쪽 쪽 건너편 맞은편 가운데 주변 이쪽 밑 속'.split())|{'A하고 B 사이','남쪽 / 북쪽 / 동쪽 / 서쪽','에 있다 / 에 없다','Subject + Place + Location + Verb'}
WEATHER=set('날씨 비 바람 구름 맑다 흐리다 덥다 춥다 따뜻하다 시원하다 쌀쌀하다 습하다 건조하다 태풍 장마 소나기 천둥 번개 안개 기온 온도 습도 황사 미세먼지 폭설 꽃샘추위 우기 해 햇빛 햇볕 불다 그치다 개다 체감온도 봄 여름 가을 겨울 계절 환절기 눈사람 눈싸움 노을 해돋이 하늘 얼음 우산 비옷 장화 단풍 벚꽃'.split())|{'눈 (날씨)','도 (온도)','일기 예보','비가 그치다','해가 뜨다','해가 지다','꽃이 피다'}
NUMS={'일 이 삼 사 오 육 칠 팔 구 십','하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열','스물 서른 마흔 쉰 예순 일흔 여든 아흔','한, 두, 세, 네, 스무','10 이상의 수','공 / 영','백','천','만','몇','몇 + 단위명사','단위명사','번','번호','반','N배','N에 + 횟수','N에 + 가격','N씩이나','씩','원','얼마예요?','전화번호가 어떻게 돼요?','몇이에요?','나이가 어떻게 되세요?','일등','N위','N대'}
COLORS=set('색깔 파랗다 색'.split())
RX={
 'meteo':r'\b(weather|rain|snow|wind\b|windy|cloud|humid|typhoon|fog|temperature|seasons?\b|sunny|sunshine|sunlight|thunder|lightning|monsoon|forecast|chilly|heat wave|fine dust)',
 'sentiments':r'\b(happy|glad|joy|sad\b|angry|anger|tired|exhausted|bored|boring|nervous|excited|thrilled|lonely|worr|upset|embarrass|proud|disappoint|afraid|scared|scary|surpris|feel|feeling|mood|annoy|regret|envi|jealous|shy\b|relie|stress|fluster|sleepy|hungry|thirsty|frustrat|anxious|uneasy|depress|satisf|miss \(|to miss|refreshed|hurt \(feel|touched|awkward|unfair|flutter|lonely|homesick|comfortable|uncomfortable|irritat|burden|emotion|confiden|empty \(feel|at a loss|fed up|heartbroken|sorry to|pity|a shame)',
 'nourriture':r'\b(food|eat|drink|meal|rice|soup|stew|noodle|meat|beef|pork|chicken|fish|vegetable|fruit|kimchi|spicy|salty|sweet|sour|bitter|tast|delicious|restaurant|menu|cook|boil|fry|bake|coffee|tea\b|beer|wine|alcohol|bread|cake|snack|breakfast|lunch|dinner|chopstick|spoon|order \(|dish)',
 'transport':r'\b(bus|subway|train|taxi|car\b|plane|airport|station|ticket|transfer|traffic|drive|ride|bicycle|bike|boat|ship|flight|road|street|crosswalk|intersection|route|line \d|get off|get on|one-way|round trip)',
 'maison':r'\b(house|home|room\b|apartment|kitchen|bedroom|living room|bathroom|furniture|bed\b|desk|chair|sofa|table|window|door|refrigerator|washing machine|vacuum|laundry|clean|dishes|rent|landlord|deposit|move \(house|moving|housework|chore|trash|garbage|mop|iron|dust|curtain|wallpaper)',
 'travail':r'\b(work|job|office|company|colleague|boss|meeting|salary|employee|business trip|overtime|interview|resign|quit|hire|career|intern|leave \(|commute|report|deadline|promotion|retire)',
 'etudes':r'\b(school|study|student|class\b|lesson|exam|test\b|homework|teacher|university|college|graduate|semester|vocabulary|grammar|textbook|dictionary|learn|practice|review|major|scholarship|language)',
 'sante':r'\b(sick|ill\b|hospital|doctor|medicine|pharmacy|cold \(|catch a cold|fever|cough|sneeze|headache|pain|hurt|injur|health|symptom|treatment|clinic|emergency|runny|nurse|shot|diet|exercise|gym|muscle|body|stomach|throat)',
 'loisirs':r'\b(hobby|movie|film|music|song|sing|dance|game|sport|soccer|football|baseball|basketball|tennis|swim|hik|climb|ski|travel|trip|tour|sightsee|camping|fishing|concert|performance|exhibition|museum|photo|picture|draw|paint|read|book|novel|drama|guitar|piano|instrument|festival|party|club|leisure|yoga|jog|surf|bowling)',
 'achats':r'\b(buy|sell|price|cheap|expensive|pay|money|won\b|discount|refund|exchange|store|shop|market|department store|mall|receipt|size|wear|clothes|shirt|pants|skirt|shoes|hat\b|bag\b|wallet|gift|present|free \(|sold out|coupon|deliver|order)',
 'caractere':r'\b(personality|friendly|diligent|lazy|introvert|extrovert|outgoing|sociable|calm|honest|strict|picky|meticulous|responsib|patient|timid|blunt|warm-hearted|generous|talkative|cheerful|rude|stubborn|smart|clever|confident|sincere|easygoing|positive|negative)',
}
TAGMAP={'색':'couleurs','숫자':'chiffres','단위':'chiffres','시간':'temps','위치':'positions','조사':'particules','음식':'nourriture','과일':'nourriture','채소':'nourriture','장소':'lieux','사람':'personnes','가족':'personnes','직업':'metiers','동물':'nature','새':'nature','식물':'nature','나라':'pays','언어':'pays','집':'maison','가전':'maison','사물':'objets','교통':'transport','인사':'salutations','운동':'loisirs','자모':'hangeul','자음':'hangeul','발음':'hangeul','발음규칙':'hangeul','된소리':'hangeul','동음이의어':'homonymes','외래어':'emprunts'}
POSMAP={'명사':'n','동사':'v','형용사':'adj','부사':'adv','문법':'gram','표현':'expr','조사':'gram','대명사':'n','회화':None}
cards=[];seen={};courses=collections.OrderedDict()
def course_sort(r):
    base,deckh,p=r
    t=p[4].split()
    cid=next((x[7:] for x in t if x.startswith('cours::')),None)
    if cid is None: cid='jour'
    day=next((x[11:] for x in t if x.startswith('quotidien::')),'')
    return (natkey(cid),day)
rows.sort(key=course_sort)
for base,deckh,p in rows:
    ko=clean(p[0]); 
    if not ko: continue
    mean,fr=split_fr(p[1]); mean=clean(re.sub(r'<br>',' ; ',mean))
    ex=p[2]; exfr=''
    ex,exfr=split_fr(ex)
    parts=[clean(re.sub(r'<[^>]+>','',x)) for x in ex.split('<br>')]
    exko=parts[0] if parts else ''; exen=' '.join(parts[1:]) if len(parts)>1 else ''
    note=clean(re.sub(r'<br>',' ',re.sub(r'</?i>','',p[3])))
    tags=p[4].split()
    cid=next((x[7:] for x in tags if x.startswith('cours::')),None)
    day=next((x[11:] for x in tags if x.startswith('quotidien::')),'')
    if cid is None: cid='jour'
    cid=re.sub(r'^C0?(\d)$',r'C\1',cid)
    if ko in seen: continue
    lvl=next((x[8:] for x in tags if x.startswith('niveau::')),None)
    book=next((x for x in tags if x.startswith('교재')),'')
    if not lvl:
        if book.startswith('교재3'): lvl='B1'
        elif book.startswith('교재2'): lvl='A2'
        elif 'MKG-INT' in book: lvl='A2'
        elif book.startswith('교재') : lvl='A1'
        elif cid.startswith('C'): lvl='A1'
        elif cid.startswith('J'): lvl='A2'
        else: lvl='B1'
    pos=None
    for t in tags:
        if t in POSMAP and POSMAP[t]: pos=POSMAP[t]; break
    if not pos:
        if ko.startswith('-') or re.match(r'^[NAV][\-/ (은이과에하위대배씩마만보]',ko): pos='gram'
        elif ko.endswith('다') and ' ' not in ko: pos='v'
        elif re.search(r'[?.!]$',ko) or ' ' in ko: pos='expr'
        else: pos='n'
    th=set()
    for t in tags:
        if t in TAGMAP: th.add(TAGMAP[t])
    if '회화' in tags and pos=='expr': th.add('salutations')
    kb=ko
    if kb in INTERROG or (kb.endswith('?') and any(kb.startswith(w) or (' '+w) in kb for w in ['누구','뭐','무슨','어디','언제','왜','어떻게','어떤','어느','몇','얼마','무엇','뭘'])): th.add('interrogatifs')
    if kb in POS: th.add('positions')
    if kb in WEATHER: th.add('meteo')
    if kb in NUMS: th.add('chiffres')
    if kb in COLORS or (kb.endswith('색') and len(kb)<=4): th.add('couleurs')
    low=mean.lower()
    if pos!='gram' and '?' not in ko:
        for k,rx in RX.items():
            if re.search(rx,low): th.add(k)
    if pos=='adj': th.add('adjectifs')
    if 'hangeul' in th: th={'hangeul'}
    c=dict(k=ko,e=mean,l=lvl,p=pos,c=cid)
    if fr: c['f']=clean(re.sub(r'<[^>]+>','',fr))
    if exko: c['x']=exko
    if exen: c['y']=exen
    if exfr: c['z']=clean(re.sub(r'<[^>]+>','',exfr))
    if note: c['n']=note
    if th: c['t']=sorted(th)
    if day: c['d']=day
    seen[ko]=1; cards.append(c)
    co=courses.setdefault(cid,dict(id=cid,title='',book='',gram=[]))
    if p[5].strip() and not co['title']:
        m=re.search(r'·\s*(.*)$',p[5]); 
        if m: co['title']=m.group(1).strip()
    if book and not co['book']: co['book']=book
    if pos=='gram' and len(co['gram'])<3: co['gram'].append(ko)
def bookname(b):
    if not b: return ''
    m=re.match(r'(교재\d?)::(.*)',b)
    if not m: return ''
    bk,l=m.groups()
    if l.startswith('MKG'):
        l=l[3:].lstrip('-')
        return 'My Korean Guide '+l.replace('UB','unité ').replace('INT','intermédiaire')
    n={'교재':'1','교재2':'2','교재3':'3'}[bk]
    return 'Manuel %s, leçon %s'%(n,l[1:])
cl=[]
for cid,co in courses.items():
    if cid=='jour': title='Mots du jour'; sub='5 mots par jour depuis octobre 2026'
    else:
        title=co['title'] or {'C1':'Hangeul : consonnes et voyelles','C2':'Vocabulaire de base','C3':'Expressions de classe'}.get(cid) or (', '.join(co['gram'][:2]) if co['gram'] else 'Vocabulaire')
        sub=bookname(co['book'])
    n=sum(1 for c in cards if c['c']==cid)
    cl.append(dict(id=cid,t=title,s=sub,n=n,teacher=('Hyesoo' if cid.startswith('C') else 'Jihyeon' if cid.startswith('J') else '')))
FR={}
for l in open(os.path.join(HERE,'fr.tsv'),encoding='utf-8'):
    if '\t' in l:
        k,v=l.rstrip('\n').split('\t',1); FR[k]=v
nofr=0
for c in cards:
    if not c.get('f'):
        if c['k'] in FR: c['f']=FR[c['k']]
        elif re.search(r'[a-zA-Z]',c['e']): nofr+=1
data=json.dumps(dict(cards=cards,courses=cl),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
content=open(os.path.join(HERE,'content.js'),encoding='utf-8').read().replace('</','<\\/')
MOIS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
now=datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=1)
build='%d %s %d'%(now.day,MOIS[now.month-1],now.year)
PWA='<link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" href="icon-180.png"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="한국어 노트"><meta name="theme-color" content="#1d5a78">'
t=open(os.path.join(HERE,'template.html'),encoding='utf-8').read()
t=t.replace('<!--PWA-->','' if args.single else PWA).replace('/*DATA*/',data).replace('/*CONTENT*/',content).replace('/*BUILD*/',build).replace('/*OFFLINE*/','false' if args.single else 'true')
os.makedirs(args.out,exist_ok=True)
open(os.path.join(args.out,'index.html'),'w',encoding='utf-8').write(t)
if not args.single:
    ver=hashlib.sha1(t.encode('utf-8')).hexdigest()[:12]
    sw=open(os.path.join(HERE,'sw.js'),encoding='utf-8').read().replace('/*VERSION*/',ver)
    open(os.path.join(args.out,'sw.js'),'w',encoding='utf-8').write(sw)
    for f in ['manifest.webmanifest','icon-180.png','icon-512.png']:
        open(os.path.join(args.out,f),'wb').write(open(os.path.join(HERE,f),'rb').read())
    open(os.path.join(args.out,'.nojekyll'),'w').write('')
print('%d fichiers sources, %d lignes, %d cartes, %d sans français, %d cours'%(len(seen_src),len(rows),len(cards),nofr,len(cl)))
