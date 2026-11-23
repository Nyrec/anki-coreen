/* ---------- 연습 · Pratique : journal, dictée, irréguliers, hanja, shadowing ---------- */

/* Cartes personnelles (journal) : ajoutées aux cartes du site, synchronisées. */
function injectMy(){
  const M=S.my||{};let co=COURSES.find(c=>c.id==="moi");
  if(!co){co={id:"moi",t:"Mon journal",s:"Mes phrases corrigées par Hyesoo",n:0,teacher:"Hyesoo"};COURSES.push(co)}
  for(const k in M){const m=M[k];if(!m||m.del)continue;
    if(CARDIDX[k]){if(CARDIDX[k].c==="moi")Object.assign(CARDIDX[k],m);continue}
    const c=Object.assign({},m);delete c.u;CARDS.push(c);CARDIDX[k]=c}
  co.n=CARDS.filter(c=>c.c==="moi").length;
}
injectMy();

/* ---------- hub ---------- */
function vPratique(){
  const jr=Object.values(S.jr||{}).filter(e=>!e.del).length,my=CARDS.filter(c=>c.c==="moi").length;
  const EH=S.exam||[],eavg=EH.length?Math.round(10*EH.slice(-5).reduce((x,y)=>x+y.n/y.of,0)/Math.min(5,EH.length)*10)/10:null;
  const tiles=[
   ["exam","모의고사","Test blanc","10 cartes déjà apprises : écrire le mot, retrouver le sens, reconnaître à l'oreille. Les erreurs reviennent en révision.",EH.length?`Dernier : ${EH[EH.length-1].n}/${EH[EH.length-1].of} · moyenne ${String(eavg).replace(".",",")}/10`:"10 questions · ≈ 3 min","var(--a1)"],
   ["journal","일기","Journal de cours","Écris tes phrases avant le cours, reporte les corrections : elles deviennent des cartes.",jr?`${jr} jour${jr>1?"s":""} · ${my} carte${my>1?"s":""}`:"À commencer","var(--red)"],
   ["dictee","받아쓰기","Dictée","Écoute une phrase de tes cartes et écris-la en hangeul.",S.dict&&S.dict.n?`${S.dict.n} phrases · ${Math.round(S.dict.sum/S.dict.n)} % en moyenne`:"10 phrases par série","var(--blu)"],
   ["irreg","불규칙","Verbes irréguliers","ㅂ, ㄷ, ㄹ, 르, ㅎ, ㅅ, 으 : conjugue jusqu'à ce que ce soit automatique.",`${IRR.length} verbes`,"var(--chija)"],
   ["hanja","한자","Hanja","Les syllabes sino-coréennes qui relient tes mots entre eux.",`${HANJA.length} caractères`,"var(--grn)"],
   ["fiches","정리","Synthèses","Les tableaux à relire en deux minutes avant un cours.",`${FICHES.length} fiches`,"var(--vio)"]];
  $("#view").innerHTML=`<h1>연습 · Pratique<small>Des exercices courts pour écouter, écrire et parler, en plus des révisions.</small></h1>
  <div class="ptiles">${tiles.map(([v,ko,fr,d,st,c])=>`<button class="ptile" data-pv="${v}" style="--pc:${c}"><b class="ko">${ko}</b><span class="pt">${fr}</span><span class="pd">${d}</span><em>${st}</em></button>`).join("")}</div>`;
}

/* ---------- 일기 · journal de cours ---------- */
const jToday=()=>dstr(today());
function jEntry(id){S.jr=S.jr||{};return S.jr[id]}
function vJournal(s){
  S.jr=S.jr||{};const ids=Object.keys(S.jr).filter(k=>!S.jr[k].del).sort((a,b)=>S.jr[b].d<S.jr[a].d?-1:1);
  if(s.open==null)s.open=ids[0]||null;const my=CARDS.filter(c=>c.c==="moi").length;
  const row=(id,r,i)=>`<div class="jrow" data-j="${id}" data-r="${i}">
    <label>내 문장 · Ma phrase</label><textarea class="ko" rows="2" data-f="m" placeholder="요즘 리옹은 날씨가 안 좋아요.">${esc(r.m||"")}</textarea>
    <label>수정 · Correction de Hyesoo</label><textarea class="ko" rows="2" data-f="c" placeholder="La version corrigée, après le cours">${esc(r.c||"")}</textarea>
    <input data-f="f" value="${esc(r.f||"")}" placeholder="Sens en français (facultatif)">
    <div class="meta"><button class="mini${r.k?" done":""}" data-act="jcard">${r.k?"✓ 카드 · Carte créée":"카드 만들기 · Faire une carte"}</button>${canPlay&&(r.c||r.m)?`<button class="mini" data-say="${esc(r.c||r.m)}">▶ 듣기</button>`:""}<button class="mini" data-act="jdelr">지우기 · Effacer</button></div></div>`;
  $("#view").innerHTML=`${backBtn()}<h1>일기 · Journal de cours<small>Avant le cours, écris 3 phrases avec les mots récents. Après, colle la correction de Hyesoo et fais-en une carte : elle rejoint tes révisions.</small></h1>
  <div class="actions"><button class="btn" data-act="jnew">오늘 쓰기 · Écrire aujourd'hui</button>${my?`<button class="btn ghost" data-course="moi">내 카드 · Réviser mes ${my} cartes</button>`:""}</div>
  ${ids.length?ids.map(id=>{const e=S.jr[id],op=s.open===id;return `<section class="jentry${op?" open":""}"><button class="jhead" data-jopen="${id}"><b>${new Date(e.d+"T12:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</b><span>${e.s.filter(r=>r.m||r.c).length} phrase${e.s.length>1?"s":""} · ${e.s.filter(r=>r.k).length} carte${e.s.filter(r=>r.k).length>1?"s":""}</span></button>
    ${op?`<div class="jbody">${e.s.map((r,i)=>row(id,r,i)).join("")}<button class="btn ghost" data-act="jadd" data-j="${id}">+ 문장 · Ajouter une phrase</button></div>`:""}</section>`}).join(""):`<p class="count">Pas encore d'entrée. Commence par « Écrire aujourd'hui ».</p>`}`;
}
let jT=0;
document.addEventListener("input",e=>{const f=e.target.closest&&e.target.closest(".jrow [data-f]");if(!f)return;const r=f.closest(".jrow"),en=jEntry(r.dataset.j);if(!en)return;
  en.s[+r.dataset.r][f.dataset.f]=f.value;en.u=Date.now();clearTimeout(jT);jT=setTimeout(save,500)});

/* ---------- 받아쓰기 · dictée ---------- */
const hang=t=>[...String(t).replace(/[^가-힣]/g,"")];
function lcs(a,b){const n=a.length,m=b.length,d=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)d[i][j]=a[i]===b[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
  const ma=new Set(),mb=new Set();let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){ma.add(i);mb.add(j);i++;j++}else if(d[i+1][j]>=d[i][j+1])i++;else j++}
  return {len:d[0][0],ma,mb}}
function markText(text,set){let k=-1;return [...text].map(ch=>/[가-힣]/.test(ch)?(k++,`<span class="${set.has(k)?"okc":"bad"}">${esc(ch)}</span>`):esc(ch)).join("")}
function dPool(s){const ok=c=>(!s.lv||lvKey(c)===s.lv);
  const p=s.mode==="mot"?CARDS.filter(c=>ok(c)&&c.p!=="gram"&&spoken(c.k)&&spoken(c.k).length>=2):CARDS.filter(c=>ok(c)&&c.x&&/^[가-힣 ,.?!~]+$/.test(c.x)&&c.x.length<=38);
  const seen=shuffle(p.filter(c=>S.c[c.k])),rest=shuffle(p.filter(c=>!S.c[c.k]));return seen.concat(rest).slice(0,10)}
const dText=(s,c)=>s.mode==="mot"?spoken(c.k):c.x;
function vDictee(s){
  s.mode=s.mode||"phrase";
  if(!s.items){
    $("#view").innerHTML=`${backBtn()}<h1>받아쓰기 · Dictée<small>Tu entends une ${s.mode==="mot"?"expression":"phrase"} de tes cartes, tu l'écris en hangeul, puis tu vois syllabe par syllabe ce qui manque. Les cartes déjà vues passent en premier.</small></h1>
    <div class="chips">${[["","전체 · Tout"],["A1","A1"],["A2","A2"],["B1","B1+"]].map(([k,l])=>`<button class="chip" aria-pressed="${(s.lv||"")===k}" data-dlv="${k}">${l}</button>`).join("")}</div>
    <div class="chips"><button class="chip" aria-pressed="${s.mode==="phrase"}" data-dmode="phrase">문장 · Phrases</button><button class="chip" aria-pressed="${s.mode==="mot"}" data-dmode="mot">단어 · Mots et expressions</button></div>
    ${canPlay?`<div class="actions"><button class="btn big" data-act="dstart">시작 · Commencer (10)</button></div>`:`<p class="count">Le son n'est pas disponible sur ce navigateur.</p>`}`;return}
  if(s.i>=s.items.length){const avg=Math.round(s.res.reduce((a,b)=>a+b,0)/s.res.length);
    $("#view").innerHTML=`${backBtn()}<h1 class="fin">${avg>=85?"잘했어요! · Très bien !":avg>=60?"좋아요 · Pas mal":"조금 더 · Encore un effort"}<small>Moyenne : ${avg} % sur ${s.res.length} ${s.mode==="mot"?"expressions":"phrases"}.</small></h1>
    <div class="rows">${s.items.map((c,i)=>`<div class="drow"><b class="${s.res[i]>=90?"ok":"ko2"}">${s.res[i]} %</b><span class="ko">${esc(dText(s,c))}</span><small>${esc(s.mode==="mot"?biT(c):[c.z,c.y].filter(Boolean).join(" · "))}</small></div>`).join("")}</div>
    <div class="actions"><button class="btn" data-act="dagain">다시 · Nouvelle série</button><button class="btn ghost" data-act="back">Revenir</button></div>`;return}
  const c=s.items[s.i],t=dText(s,c),done=s.chk!=null;
  let res="";if(done){const A=hang(t),B=hang(s.ans),L=lcs(A,B);res=`<div class="dres"><div class="dsc ${s.chk>=90?"ok":"ko2"}">${s.chk} %</div>
    <div><small>정답 · La bonne réponse</small><p class="ko big2">${markText(t,L.ma)}</p></div>
    <div><small>내 답 · Ta réponse</small><p class="ko">${s.ans.trim()?markText(s.ans,L.mb):"—"}</p></div>
    <p class="count">${esc(s.mode==="mot"?biT(c):[c.z,c.y].filter(Boolean).join(" · "))}</p></div>`}
  $("#view").innerHTML=`${backBtn()}<div class="dict"><div class="meta"><span class="qc">${s.i+1} / ${s.items.length}</span><button class="chip" aria-pressed="${!!S.cfg.slow}" data-act="slow">천천히 · Lent</button></div>
  <div class="bar sess"><i style="width:${100*s.i/s.items.length}%"></i></div>
  <button class="earbtn" data-act="dplay" aria-label="Écouter">🔊</button><p class="hint center">듣고 써 보세요 · Écoute et écris</p>
  <textarea id="dq" class="ko dq" rows="2" placeholder="여기에 쓰세요" ${done?"disabled":""}>${esc(s.ans||"")}</textarea>
  ${done?res+`<div class="actions"><button class="btn big" data-act="dnext">${s.i+1<s.items.length?"다음 · Suivante":"결과 · Résultat"}</button></div>`:`<div class="actions"><button class="btn big" data-act="dcheck">확인 · Vérifier</button></div><p class="count keys">Entrée pour vérifier. Clavier coréen : ajoute-le dans les réglages de ton téléphone ou de ton Mac.</p>`}</div>`;
  if(!done){const q=$("#dq");setTimeout(()=>{try{q.focus()}catch(e){}},60);q.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.querySelector('[data-act="dcheck"]').click()}};q.oninput=()=>{s.ans=q.value}}
  if(s.played!==s.i){s.played=s.i;setTimeout(()=>speak(t),250)}
}
function dCheck(s){const c=s.items[s.i],A=hang(dText(s,c)),B=hang(s.ans||"");const L=lcs(A,B);
  s.chk=Math.round(100*Math.max(0,2*L.len/(A.length+B.length||1)));s.res.push(s.chk);
  S.dict=S.dict||{n:0,sum:0};S.dict.n++;S.dict.sum+=s.chk;save()}

/* ---------- 불규칙 · verbes irréguliers ---------- */
const IRR=[
["돕다","ㅂ","aider","도와요","도왔어요","도우면","도운"],["춥다","ㅂ","avoir froid","추워요","추웠어요","추우면","추운"],["덥다","ㅂ","faire chaud","더워요","더웠어요","더우면","더운"],["어렵다","ㅂ","être difficile","어려워요","어려웠어요","어려우면","어려운"],["쉽다","ㅂ","être facile","쉬워요","쉬웠어요","쉬우면","쉬운"],["맵다","ㅂ","être épicé","매워요","매웠어요","매우면","매운"],["가깝다","ㅂ","être proche","가까워요","가까웠어요","가까우면","가까운"],["무겁다","ㅂ","être lourd","무거워요","무거웠어요","무거우면","무거운"],["줍다","ㅂ","ramasser","주워요","주웠어요","주우면","주운"],["두껍다","ㅂ","être épais","두꺼워요","두꺼웠어요","두꺼우면","두꺼운"],["귀엽다","ㅂ","être mignon","귀여워요","귀여웠어요","귀여우면","귀여운"],["아름답다","ㅂ","être beau","아름다워요","아름다웠어요","아름다우면","아름다운"],
["듣다","ㄷ","écouter","들어요","들었어요","들으면","들은"],["걷다","ㄷ","marcher","걸어요","걸었어요","걸으면","걸은"],["묻다","ㄷ","demander","물어요","물었어요","물으면","물은"],
["살다","ㄹ","habiter, vivre","살아요","살았어요","살면","산"],["만들다","ㄹ","fabriquer","만들어요","만들었어요","만들면","만든"],["알다","ㄹ","savoir","알아요","알았어요","알면","안"],["길다","ㄹ","être long","길어요","길었어요","길면","긴"],["멀다","ㄹ","être loin","멀어요","멀었어요","멀면","먼"],["놀다","ㄹ","s'amuser","놀아요","놀았어요","놀면","논"],["열다","ㄹ","ouvrir","열어요","열었어요","열면","연"],
["모르다","르","ne pas savoir","몰라요","몰랐어요","모르면","모른"],["빠르다","르","être rapide","빨라요","빨랐어요","빠르면","빠른"],["부르다","르","appeler, chanter","불러요","불렀어요","부르면","부른"],["다르다","르","être différent","달라요","달랐어요","다르면","다른"],["고르다","르","choisir","골라요","골랐어요","고르면","고른"],["마르다","르","sécher, avoir soif (목이)","말라요","말랐어요","마르면","마른"],["자르다","르","couper","잘라요","잘랐어요","자르면","자른"],
["하얗다","ㅎ","être blanc","하얘요","하얬어요","하야면","하얀"],["빨갛다","ㅎ","être rouge","빨개요","빨갰어요","빨가면","빨간"],["노랗다","ㅎ","être jaune","노래요","노랬어요","노라면","노란"],["파랗다","ㅎ","être bleu","파래요","파랬어요","파라면","파란"],["까맣다","ㅎ","être noir","까매요","까맸어요","까마면","까만"],["그렇다","ㅎ","être ainsi","그래요","그랬어요","그러면","그런"],
["낫다","ㅅ","guérir, être mieux","나아요","나았어요","나으면","나은"],["짓다","ㅅ","construire","지어요","지었어요","지으면","지은"],["붓다","ㅅ","enfler, verser","부어요","부었어요","부으면","부은"],
["쓰다","으","écrire","써요","썼어요","쓰면","쓴"],["크다","으","être grand","커요","컸어요","크면","큰"],["바쁘다","으","être occupé","바빠요","바빴어요","바쁘면","바쁜"],["아프다","으","avoir mal","아파요","아팠어요","아프면","아픈"],["예쁘다","으","être joli","예뻐요","예뻤어요","예쁘면","예쁜"],["슬프다","으","être triste","슬퍼요","슬펐어요","슬프면","슬픈"],["기쁘다","으","être content","기뻐요","기뻤어요","기쁘면","기쁜"],["끄다","으","éteindre","꺼요","껐어요","끄면","끈"],
["입다","reg","porter (un vêtement)","입어요","입었어요","입으면","입은"],["좁다","reg","être étroit","좁아요","좁았어요","좁으면","좁은"],["받다","reg","recevoir","받아요","받았어요","받으면","받은"],["닫다","reg","fermer","닫아요","닫았어요","닫으면","닫은"],["좋다","reg","être bon","좋아요","좋았어요","좋으면","좋은"],["웃다","reg","rire","웃어요","웃었어요","웃으면","웃은"],["씻다","reg","se laver","씻어요","씻었어요","씻으면","씻은"]];
const IRRT={"ㅂ":"ㅂ devient 우 devant une voyelle : 춥다 → 추워요, 추우면, 추운. Exception : 돕다 → 도와요.","ㄷ":"ㄷ devient ㄹ devant une voyelle : 듣다 → 들어요, 들으면, 들은.","ㄹ":"Le ㄹ tombe devant ㄴ, ㅂ, ㅅ : 살다 → 사는, 산, 삽니다. Avec -(으)면, pas de 으 : 살면.","르":"르 devient ㄹㄹ devant 아/어 : 모르다 → 몰라요, 부르다 → 불러요.","ㅎ":"ㅎ tombe. Devant 아/어 la voyelle devient ㅐ (ㅑ → ㅒ) : 빨갛다 → 빨개요, 하얗다 → 하얘요 ; 빨간, 빨가면.","ㅅ":"ㅅ tombe devant une voyelle, sans contraction : 낫다 → 나아요, 나으면, 나은.","으":"ㅡ tombe devant 아/어 : 쓰다 → 써요 ; 바쁘다 → 바빠요 (아 car la syllabe d'avant a ㅏ).","reg":"Pièges : ils ressemblent à des irréguliers mais se conjuguent normalement (입어요, 받아요, 좋아요, 웃어요)."};
const IRRF=[["présent poli (-아/어요)",3],["passé poli (-았/었어요)",4],["si… (-(으)면)",5],["devant un nom (-(으)ㄴ)",6]];
function vIrreg(s){
  s.ty=s.ty==null?"":s.ty;
  if(s.table){$("#view").innerHTML=`${backBtn()}<h1>불규칙 · Tableau<small>${s.ty?IRRT[s.ty]:"Tous les verbes, par famille."}</small></h1>
    <div class="tablebox"><table class="f irrt"><tr><th>기본형</th><th>-아/어요</th><th>-았/었어요</th><th>-(으)면</th><th>-(으)ㄴ</th></tr>${IRR.filter(v=>!s.ty||v[1]===s.ty).map(v=>`<tr><td class="k">${v[0]}<small>${v[2]}</small></td><td>${v[3]}</td><td>${v[4]}</td><td>${v[5]}</td><td>${v[6]}</td></tr>`).join("")}</table></div>
    <div class="actions"><button class="btn" data-act="itable">퀴즈로 · Revenir au quiz</button></div>`;return}
  if(!s.qs){const pool=IRR.filter(v=>!s.ty||v[1]===s.ty);s.qs=Array.from({length:12},()=>{const v=pool[Math.floor(Math.random()*pool.length)],f=IRRF[Math.floor(Math.random()*IRRF.length)];return {v,f}});s.i=0;s.ok=0;s.ans=null}
  const chips=`<div class="chips">${[["","전체 · Tout"],["ㅂ","ㅂ"],["ㄷ","ㄷ"],["ㄹ","ㄹ"],["르","르"],["ㅎ","ㅎ"],["ㅅ","ㅅ"],["으","으"],["reg","규칙 · Pièges"]].map(([k,l])=>`<button class="chip ko" aria-pressed="${s.ty===k}" data-ity="${k}">${l}</button>`).join("")}</div>`;
  if(s.i>=s.qs.length){$("#view").innerHTML=`${backBtn()}<h1 class="fin">${s.ok}/${s.qs.length}<small>${s.ok>=10?"완벽해요 · Excellent !":s.ok>=7?"좋아요 · Bien":"다시 해 봐요 · On recommence ?"}</small></h1>${chips}<div class="actions"><button class="btn" data-act="iagain">다시 · Nouvelle série</button><button class="btn ghost" data-act="itable">표 · Voir le tableau</button></div>`;return}
  const q=s.qs[s.i],good=q.v[q.f[1]],done=s.ans!=null,right=done&&s.ans.trim()===good;
  $("#view").innerHTML=`${backBtn()}<h1>불규칙 · Irréguliers<small>${s.ty?IRRT[s.ty]:"Toutes les familles mélangées. Choisis-en une pour réviser sa règle."}</small></h1>${chips}
  <div class="irq"><div class="meta"><span class="qc">${s.i+1} / ${s.qs.length} · ${s.ok} juste${s.ok>1?"s":""}</span><button class="mini" data-act="itable">표 · Tableau</button></div>
   <div class="irv ko">${q.v[0]}</div><div class="hint">${q.v[2]} → <b>${q.f[0]}</b></div>
   <input id="iq" class="ko dq" autocomplete="off" autocapitalize="off" placeholder="…" value="${esc(s.ans||"")}" ${done?"disabled":""}>
   ${done?`<div class="dres"><div class="dsc ${right?"ok":"ko2"}">${right?"맞아요 · Juste":"정답 · Réponse : "+good}</div><p class="count">${q.v[0]} : ${q.v[3]} · ${q.v[4]} · ${q.v[5]} · ${q.v[6]}${q.v[1]!=="reg"?` — ${IRRT[q.v[1]]}`:""}</p></div><div class="actions"><button class="btn big" data-act="inext">다음 · Suivant</button></div>`:`<div class="actions"><button class="btn big" data-act="icheck">확인 · Vérifier</button></div>`}</div>`;
  if(!done){const i=$("#iq");setTimeout(()=>{try{i.focus()}catch(e){}},60);i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.querySelector('[data-act="icheck"]').click()}}}
}

/* ---------- 한자 · hanja ---------- */
const HANJA=[
["學","학","étudier","학생 대학생 학교 고등학교 여학생 방학 학원 여름방학 유학 학위 대학원 개학 장학금 학기 고등학생 초등학교 중학교 어학연수 학년 세종학당"],
["生","생","vie, naître","학생 선생님 대학생 생일 생선 생신 생활 고등학생 수강생 평생 생활비 여학생 동생 남동생 여동생"],
["國","국","pays","한국 중국 미국 국적 영국 태국 외국 한국말 전국 국제 국립 외국어 국민 국립공원"],
["外","외","extérieur","외국 외국어 해외여행 외모"],
["館","관","bâtiment public","도서관 영화관 대사관 미술관 박물관 체육관"],
["觀","관","regarder","관광 관광지 관광객 관람 경관"],
["車","차","véhicule","경찰차 구급차 기차 화물차 승용차 자동차 막차"],
["場","장","lieu, place","헬스장 수영장 공연장 운동장 축구장 스키장 캠핑장 시장 극장 장소 입장권 공공장소"],
["市","시","ville, marché","시장 시청 시내 시내버스 도시 시민"],
["時","시","heure, temps","시간 시계 손목시계 점심시간 시차"],
["社","사","société","회사 회사원 여행사 영화사 사장님"],
["動","동","bouger","운동 운동선수 운동화 운동장 운동회 자동차 동물 동영상 행동 감동 부동산 진동"],
["映","영","projeter (image)","영화 영화관 영화배우 영화사 영화제 동영상 영상통화"],
["行","행","aller, agir","여행 여행사 여행가방 여행지 배낭여행 자유여행 해외여행 비행기 은행 은행원 유행 행동"],
["食","식","manger","식당 식탁 음식 식후 한식 음식물 간식 야식 회식 식초"],
["水","수","eau","음료수 수영장 수영복 향수 팥빙수"],
["手","수","main, personne qui fait","가수 선수 운동선수 수첩 수건"],
["店","점","magasin","서점 편의점 백화점 점원"],
["書","서","écrit, livre","도서관 서점 신청서 보고서 독서 서류 엽서 낙서"],
["日","일","jour, soleil","생일 요일 평일 매일 일주일 휴일 공휴일 기념일 일정 내일 일본"],
["休","휴","se reposer","휴가 휴일 공휴일 여름휴가 연휴 휴게실 휴지"],
["公","공","public","공원 놀이공원 국립공원 공공장소 공휴일 공주"],
["空","공","vide, ciel","공책 공항 공기 공짜"],
["室","실","pièce","사무실 화장실 교실 거실 욕실 침실 미용실 휴게실 응급실"],
["院","원","établissement","병원 학원 대학원 병원비"],
["員","원","membre, employé","회사원 은행원 점원 종업원 안내원 승무원 인원 직원"],
["人","인","personne","주인 군인 애인 연예인 집주인 중개인 보증인 인원 인기"],
["氣","기","énergie, air","기분 인기 공기 기운 분위기 감기"],
["機","기","machine","비행기 선풍기 세탁기 청소기"],
["感","감","sentir","감동 감정 자신감 소감 성취감 감기 코감기 체감온도"],
["大","대","grand","대학생 대학원 대청소 대회 대중교통 최대 대부분 대사관"],
["地","지","terre, lieu","여행지 유적지 출발지 도착지 목적지 관광지 현지 지하철"],
["物","물","chose, objet","동물 건물 선물 음식물 물건 박물관 화물차 물가"],
["金","금","or, argent","장학금 상금 금색 보증금 축의금"],
["中","중","milieu","중국 중학교 집중 대중교통"],
["家","가","maison, spécialiste","가족 가구 작가"]];
const HJ=HANJA.map(([h,r,m,w])=>({h,r,m,w:w.split(" ").filter(k=>CARDIDX[k])}));
function vHanja(s){
  $("#view").innerHTML=`${backBtn()}<h1>한자 · Hanja<small>Environ 60 % du vocabulaire coréen vient du chinois. Une syllabe comme 학 (學, étudier) se retrouve dans 학생, 학교, 방학… La reconnaître aide à deviner un mot nouveau.</small></h1>
  <div class="hgrid">${HJ.filter(x=>x.w.length).map((x,i)=>`<button class="hcard${s.open===i?" open":""}" data-hj="${i}"><b>${x.h}</b><span class="ko">${x.r}</span><em>${x.m}</em><small>${x.w.length} mots</small></button>${s.open===i?`<div class="hwords">${x.w.map(k=>{const c=CARDIDX[k];return `<button class="gchip" data-node="m:${esc(k)}" style="--c:${GCOL[lvKey(c)]||GCOL.A1}"><b class="ko">${esc(k)}</b><span>${esc(biT(c).slice(0,40))}</span></button>`}).join("")}</div>`:""}`).join("")}</div>
  <p class="count">Les mêmes liens apparaissent dans 뇌 · Cerveau (points dorés). Attention aux homonymes : 공 de 공원 (公, public) n'est pas celui de 공항 (空, vide).</p>`;
}

/* ---------- 따라 하기 · shadowing dans les histoires ---------- */
const canRec=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
let REC=null;const RECS={};
async function recToggle(i,btn){
  if(REC){try{REC.mr.stop()}catch(e){}return}
  const s=cur();try{stopStory()}catch(e){}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mr=new MediaRecorder(st),ch=[];
    mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
    mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());clearTimeout(REC&&REC.to);RECS[s.id+":"+i]=URL.createObjectURL(new Blob(ch,{type:mr.mimeType||"audio/mp4"}));REC=null;if(cur()===s){s.keepScroll=true;render();s.keepScroll=false}};
    REC={mr,i,to:setTimeout(()=>{try{mr.stop()}catch(e){}},15000)};mr.start();btn.textContent="■ 녹음 중 · Arrêter";btn.classList.add("rec");
  }catch(e){btn.textContent="Micro refusé ou indisponible"}
}
function playMine(url,then){stopAudio();const a=new Audio(url);a.onended=()=>{if(then)then()};a.play().catch(()=>{})}
function recButtons(id,i){if(!canRec)return "";const u=RECS[id+":"+i];
  return `<button class="mini" data-rec="${i}">🎙 따라 하기</button>${u?`<button class="mini" data-mine="${i}">▶ 내 목소리 · Ma voix</button><button class="mini" data-cmp="${i}">⇄ 비교 · Comparer</button>`:""}`}

/* ---------- clics ---------- */
document.addEventListener("click",e=>{const t=e.target,s=cur();
  const pv=t.closest("[data-pv]");if(pv){e.stopPropagation();const v=pv.dataset.pv;if(v==="histoires"){tab("histoires");return}go({v});return}
  const jo=t.closest("[data-jopen]");if(jo){e.stopPropagation();s.open=s.open===jo.dataset.jopen?"":jo.dataset.jopen;s.keepScroll=true;render();s.keepScroll=false;return}
  const hj=t.closest("[data-hj]");if(hj){e.stopPropagation();const i=+hj.dataset.hj;s.open=s.open===i?null:i;s.keepScroll=true;render();s.keepScroll=false;return}
  const dl=t.closest("[data-dlv]");if(dl){e.stopPropagation();s.lv=dl.dataset.dlv;render();return}
  const dm=t.closest("[data-dmode]");if(dm){e.stopPropagation();s.mode=dm.dataset.dmode;render();return}
  const it=t.closest("[data-ity]");if(it){e.stopPropagation();s.ty=it.dataset.ity;s.qs=null;s.table=false;render();return}
  const rc=t.closest("[data-rec]");if(rc&&s.v==="story"){e.stopPropagation();recToggle(+rc.dataset.rec,rc);return}
  const mi=t.closest("[data-mine]");if(mi&&s.v==="story"){e.stopPropagation();const u=RECS[s.id+":"+mi.dataset.mine];if(u)playMine(u);return}
  const cp=t.closest("[data-cmp]");if(cp&&s.v==="story"){e.stopPropagation();const i=+cp.dataset.cmp,u=RECS[s.id+":"+i],l=lineOf(STORIES.find(x=>x.id===s.id).lines[i]);sayStory(l[1],SPK[l[0]]||"hyunsu",()=>setTimeout(()=>playMine(u),300));return}
  const ac=t.closest("[data-act]");if(!ac)return;const a=ac.dataset.act;
  const mine=["jnew","jadd","jcard","jdelr","dstart","dplay","dcheck","dnext","dagain","icheck","inext","iagain","itable","journal-today"];if(!mine.includes(a))return;e.stopPropagation();
  if(a==="journal-today"||a==="jnew"){S.jr=S.jr||{};const id=jToday();if(!S.jr[id]||S.jr[id].del)S.jr[id]={d:id,s:[{},{},{}],u:Date.now()};save();if(a==="journal-today")go({v:"journal",open:id});else{s.open=id;render()}return}
  if(a==="jadd"){const en=jEntry(ac.dataset.j);en.s.push({});en.u=Date.now();save();s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="jdelr"||a==="jcard"){const r=ac.closest(".jrow"),en=jEntry(r.dataset.j),i=+r.dataset.r,row=en.s[i];
    if(a==="jdelr"){en.s.splice(i,1);if(!en.s.length)en.del=1;en.u=Date.now();save();s.keepScroll=true;render();s.keepScroll=false;return}
    const k=(row.c||row.m||"").trim();if(!k)return;const m=(row.m||"").trim(),changed=row.c&&m&&row.c.trim()!==m;
    S.my=S.my||{};S.my[k]={k,f:(row.f||"").trim(),e:changed?"Ta version : "+m:"Ma phrase",n:changed?"Avant correction : "+m:"",c:"moi",l:"A2",p:"expr",t:[],d:en.d,u:Date.now()};
    row.k=k;en.u=Date.now();injectMy();save();s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="dstart"||a==="dagain"){s.items=dPool(s);s.i=0;s.res=[];s.chk=null;s.ans="";s.played=null;if(!s.items.length){s.items=null;alertMsg("Pas de phrase pour ce niveau.");}render();return}
  if(a==="dplay"){const c=s.items[s.i];speak(dText(s,c));return}
  if(a==="dcheck"){const q=$("#dq");s.ans=q?q.value:"";dCheck(s);s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="dnext"){s.i++;s.chk=null;s.ans="";render();return}
  if(a==="icheck"){const q=$("#iq");s.ans=q?q.value:"";if(s.ans.trim()===s.qs[s.i].v[s.qs[s.i].f[1]])s.ok++;s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="inext"){s.i++;s.ans=null;render();return}
  if(a==="iagain"){s.qs=null;render();return}
  if(a==="itable"){s.table=!s.table;render();return}
},true);
function alertMsg(m){const x=document.createElement("div");x.className="wtip";x.style.cssText="left:50%;top:40%";x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}

/* ---------- 모의고사 · test blanc sur 10 cartes déjà apprises ----------
   Pourquoi ce format : se tester de mémoire (et pas relire) est ce qui ancre le plus, et varier la forme
   (écrire le mot, retrouver le sens, reconnaître à l'oreille) vérifie que le mot est vraiment utilisable.
   Choix des cartes : 5 parmi celles que FSRS juge les plus fragiles aujourd'hui, 5 au hasard parmi les autres.
   Une erreur renvoie la carte en révision le jour même (étape QCM) ; une réussite ne change pas le planning. */
const EXT={write:["쓰기","Écrire en coréen"],recall:["기억","Retrouver le sens"],ear:["듣기","Reconnaître à l'oreille"],mcq:["선택","Choisir le sens"]};
function exLearned(){const t=today(),out=[];
  for(const k in S.c){const c=CARDIDX[k],s=S.c[k];if(!c||!s)continue;const f=fState(s);
    out.push({c,learned:s[1]>0&&stage(k)>=2,r:f?fR(Math.max(0,t-f[2]),f[0]*fmul()):0})}
  return out}
const exAlts=c=>spoken(c.k).split(/\s*,\s*/).filter(Boolean);
function exBuild(){
  const all=exLearned();let pool=all.filter(x=>x.learned),note="";
  if(pool.length<10){note=`Tu n'as que ${pool.length} carte${pool.length>1?"s":""} vraiment apprise${pool.length>1?"s":""} : le test est complété avec des cartes encore en apprentissage.`;pool=all}
  if(pool.length<4)return {err:"Pas encore assez de cartes vues pour un test. Fais d'abord quelques révisions."};
  const weak=pool.slice().sort((a,b)=>a.r-b.r).slice(0,5),rest=shuffle(pool.filter(x=>!weak.includes(x))).slice(0,10-weak.length);
  const cards=shuffle(weak.concat(rest).map(x=>x.c));
  const want=shuffle(["write","write","write","write","recall","recall","recall","ear","ear","ear"]);
  const canW=c=>c.p!=="gram"&&!!spoken(c.k)&&!!(c.f||c.e),canE=c=>canPlay&&!!spoken(c.k)&&!!mcqOpts(c,CARDS);
  const qs=cards.map((c,i)=>{let ty=want[i]||"recall";if(ty==="write"&&!canW(c))ty="recall";if(ty==="ear"&&!canE(c))ty=mcqOpts(c,CARDS)?"mcq":"recall";
    return {c,ty,opts:ty==="ear"||ty==="mcq"?mcqOpts(c,CARDS):null,ok:null,ans:"",sim:null}});
  return {qs,note}}
function vExam(s){
  const H=S.exam||[];
  if(!s.qs){const last=H.slice(-5).reverse();
    $("#view").innerHTML=`${backBtn()}<h1>모의고사 · Test blanc<small>10 cartes que tu as déjà apprises, sans aide : tu écris le mot en coréen, tu retrouves le sens de mémoire ou tu reconnais le mot à l'oreille.</small></h1>
    <div class="panel"><p class="count" style="margin:0">Les cartes choisies : la moitié parmi celles que tu risques le plus d'oublier aujourd'hui, l'autre moitié au hasard. Chaque erreur renvoie la carte dans tes révisions du jour ; une bonne réponse ne change rien à ton planning.</p></div>
    ${s.err?`<p class="msg">${esc(s.err)}</p>`:""}
    <div class="actions"><button class="btn big" data-act="exstart">시작 · Commencer (10)</button></div>
    ${last.length?`<section><h2><span class="ko">지난 시험</span> · Derniers tests</h2><div class="rows">${last.map(x=>`<div class="drow"><b class="${x.n>=8?"ok":x.n<6?"ko2":""}">${x.n} / ${x.of}</b><span>${new Date(x.d+"T12:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span></div>`).join("")}</div></section>`:""}`;return}
  if(s.i>=s.qs.length){
    const n=s.qs.filter(q=>q.ok).length;
    if(!s.applied){s.applied=1;const t=today();for(const q of s.qs)if(!q.ok&&S.c[q.c.k]){answer(q.c.k,1,0);S.c[q.c.k][5]=1}
      S.exam=(S.exam||[]).concat({d:dstr(t),n,of:s.qs.length}).slice(-30);save()}
    const bad=s.qs.length-n;
    $("#view").innerHTML=`${backBtn()}<h1 class="fin">${n} / ${s.qs.length}<small>${n>=9?"완벽해요! · Excellent, ces mots sont bien ancrés.":n>=7?"잘했어요 · Bien, quelques mots à consolider.":n>=5?"괜찮아요 · Correct, il y a des mots fragiles.":"다시 복습해요 · Plusieurs mots sont à reprendre."}</small></h1>
    ${bad?`<p class="intro">${bad} carte${bad>1?"s reviennent":" revient"} dans tes révisions d'aujourd'hui, en QCM d'abord.</p>`:""}
    <div class="rows">${s.qs.map(q=>`<div class="drow"><b class="${q.ok?"ok":"ko2"}">${q.ok?"✓":"✗"}</b><span><span class="ko">${esc(q.c.k)}</span> · ${biH(q.c)}</span><small>${EXT[q.ty][0]} · ${EXT[q.ty][1]}${q.ty==="write"&&q.ans&&!q.ok?` · tu as écrit « <span class="ko">${esc(q.ans)}</span> »`:""}</small></div>`).join("")}</div>
    <div class="actions"><button class="btn" data-act="exagain">다시 · Nouveau test</button>${bad?`<button class="btn ghost" data-act="all-study">복습하기 · Réviser maintenant</button>`:""}</div>`;return}
  const q=s.qs[s.i],c=q.c,done=q.ok!=null,[tko,tfr]=EXT[q.ty];
  const top=`${backBtn()}<div class="study"><div class="meta"><span class="qc">${s.i+1} / ${s.qs.length} · ${s.qs.filter(x=>x.ok).length} juste${s.qs.filter(x=>x.ok).length>1?"s":""}</span><button class="chip" aria-pressed="${!!S.cfg.slow}" data-act="slow">천천히 · Lent</button></div>
  <div class="bar sess" style="--c:var(--a1)"><i style="width:${100*s.i/s.qs.length}%"></i></div>`;
  const reveal=`<hr><div class="big ko small">${esc(c.k)}</div><div class="ans">${biH(c)}</div>${c.x?`<div class="ko exx">${esc(c.x)}</div><div class="hint">${esc(c.z||c.y||"")}</div>`:""}`;
  const verdict=done?`<div class="hint" style="font-weight:600;color:${q.ok?"var(--a1)":"var(--red)"}">${q.ok?"맞아요 · Juste":q.sim!=null&&q.sim>=70?"거의 · Presque":"틀렸어요 · Faux"}</div>`:"";
  const next=`<div class="actions"><button class="btn big" data-act="exnext">${s.i+1<s.qs.length?"다음 · Suivant":"결과 · Résultat"}</button></div>`;
  let body="";
  if(q.ty==="write"){
    body=`<div class="flash" style="min-height:150px"><span class="tag">${tko} · ${tfr}</span><div class="big small">${biH(c)}</div>${done?verdict+(q.ok?"":`<div class="dres" style="margin-top:6px"><small>정답 · La bonne réponse</small><p class="ko big2">${markText(exAlts(c)[0],lcs(hang(exAlts(c)[0]),hang(q.ans)).ma)}</p><small>내 답 · Ta réponse</small><p class="ko">${q.ans.trim()?markText(q.ans,lcs(hang(exAlts(c)[0]),hang(q.ans)).mb):"—"}</p></div>`)+(c.x?`<div class="ko exx">${esc(c.x)}</div><div class="hint">${esc(c.z||c.y||"")}</div>`:""):`<div class="hint">Écris le mot en coréen</div>`}</div>
    <input id="exq" class="ko dq" placeholder="한국어로 쓰세요" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(q.ans)}" ${done?"disabled":""}>
    ${done?(q.ok?"":`<div class="actions center"><button class="mini" data-act="exfix">J'avais juste (faute de frappe, autre forme correcte)</button></div>`)+next:`<div class="actions"><button class="btn big" data-act="excheck">확인 · Vérifier</button><button class="btn ghost" data-act="exskip">모르겠어요 · Je ne sais pas</button></div><p class="count keys">Entrée pour vérifier. Clavier coréen : ajoute-le dans les réglages de ton téléphone ou de ton Mac.</p>`}`;
  }else if(q.ty==="recall"){
    body=`<div class="flash" style="min-height:150px"><span class="tag">${tko} · ${tfr}</span><div class="big ko${c.k.length>9?" small":""}">${esc(c.k)}</div>${s.rev||done?`<hr><div class="ans">${biH(c)}</div>${c.x?`<div class="ko exx">${esc(c.x)}</div><div class="hint">${esc(c.z||c.y||"")}</div>`:""}${verdict}`:`<div class="hint">Dis le sens à voix haute avant de regarder</div>`}</div>
    ${done?next:s.rev?`<div class="grades two"><button class="grade g1" data-act="exno"><span class="ko">몰랐어요</span>Je ne savais pas</button><button class="grade g3" data-act="exyes"><span class="ko">알았어요</span>Je savais</button></div>`:`<button class="btn big" data-act="exflip">답 보기 · Voir la réponse</button>`}`;
  }else{
    const ear=q.ty==="ear";
    body=`<div class="flash" style="min-height:150px"><span class="tag">${tko} · ${tfr}</span>${ear&&!done?`<button class="earbtn" data-act="explay" aria-label="Réécouter">🔊</button><div class="hint">Écoute et choisis le sens</div>`:`<div class="big ko${c.k.length>9?" small":""}">${esc(c.k)}</div>`}${done?verdict+(c.x?`<div class="ko exx">${esc(c.x)}</div><div class="hint">${esc(c.z||c.y||"")}</div>`:""):""}</div>
    ${q.opts.map((o,j)=>`<button class="opt${done?(o.k===c.k?" good":j===q.pick?" bad":""):""}" data-exo="${j}" ${done?"disabled":""}>${biH(o)}</button>`).join("")}
    ${done?next:""}`;
  }
  $("#view").innerHTML=top+body+`</div>`;
  if(q.ty==="write"&&!done){const i=$("#exq");setTimeout(()=>{try{i.focus()}catch(e){}},60);i.oninput=()=>{q.ans=i.value};i.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();document.querySelector('[data-act="excheck"]').click()}}}
  if(q.ty==="ear"&&!done&&s.played!==s.i){s.played=s.i;setTimeout(()=>speak(spoken(c.k)),250)}
  if(done&&canPlay&&s.said!==s.i&&spoken(c.k)&&q.ty!=="ear"){s.said=s.i;speak(spoken(c.k))}
}
function exCheck(q){const A=hang(q.ans||"").join("");
  const alts=exAlts(q.c).map(a=>hang(a).join(""));
  q.ok=!!A&&alts.includes(A);
  const best=Math.max(0,...alts.map(a=>{const L=lcs([...a],[...A]);return Math.round(100*2*L.len/((a.length+A.length)||1))}));q.sim=best}
document.addEventListener("click",e=>{const s=cur();if(s.v!=="exam")return;const t=e.target;
  const o=t.closest("[data-exo]");if(o&&!o.disabled){e.stopPropagation();const q=s.qs[s.i];q.pick=+o.dataset.exo;q.ok=q.opts[q.pick].k===q.c.k;s.keepScroll=true;render();s.keepScroll=false;const nx=document.querySelector('[data-act="exnext"]');if(nx)try{nx.scrollIntoView({block:"nearest",behavior:"smooth"})}catch(x){}return}
  const ac=t.closest("[data-act]");if(!ac)return;const a=ac.dataset.act;
  if(!/^ex/.test(a))return;e.stopPropagation();
  if(a==="exstart"||a==="exagain"){const b=exBuild();if(b.err){s.err=b.err;s.qs=null;render();return}s.err=null;s.qs=b.qs;s.note=b.note;s.i=0;s.rev=false;s.applied=0;s.played=null;s.said=null;render();if(b.note)alertMsg(b.note);return}
  const q=s.qs&&s.qs[s.i];if(!q)return;
  if(a==="excheck"){const i=$("#exq");q.ans=i?i.value:q.ans;exCheck(q);s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="exskip"){q.ans="";q.ok=false;q.sim=0;render();return}
  if(a==="exfix"){q.ok=true;render();return}
  if(a==="exflip"){s.rev=true;render();return}
  if(a==="exyes"||a==="exno"){q.ok=a==="exyes";render();return}
  if(a==="explay"){speak(spoken(q.c.k));return}
  if(a==="exnext"){s.i++;s.rev=false;render();return}
},true);
document.addEventListener("keydown",e=>{const s=cur();if(s.v!=="exam"||!s.qs||e.target.matches("input,textarea")||e.metaKey||e.ctrlKey)return;
  const click=sel=>{const b=document.querySelector(sel);if(b){e.preventDefault();b.click();return true}};
  if(/^[1-4]$/.test(e.key)){click(`[data-exo="${+e.key-1}"]:not([disabled])`);return}
  if(e.key===" "||e.key==="Enter"){click('[data-act="exnext"]')||click('[data-act="exflip"]')||click('[data-act="exyes"]');return}
  if(e.key==="ArrowLeft")click('[data-act="exno"]');else if(e.key==="ArrowRight")click('[data-act="exyes"]');else if(e.key==="r"||e.key==="R")click('[data-act="explay"]');
});
