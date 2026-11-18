/* ---------- 뇌 · Cerveau : tout ce que j'apprends, relié comme des neurones ---------- */
const GR=/*GRAPH*/;
const GT={h:["한자","Hanja"],m:["단어","Mot"],c:["수업","Cours"],t:["주제","Thème"],f:["정리","Synthèse"],s:["이야기","Histoire"],p:["방송","Émission"],u:["메모","Ma note"]};
const GCOL={h:"#ffd166",c:"#ffc53d",t:"#ff667e",f:"#c193ff",s:"#4fd8e0",p:"#ff9a3c",u:"#ffffff",A1:"#3fd29a",A2:"#79a9ff",B1:"#c193ff"};
const THNAME={};for(const g of THEMES)for(const [k,fr,ko] of g.items)THNAME[k]=[ko,fr];
let GN=null;// {key,type,x,y,adj:Set}
const GI={};// clé → indice
let GBASE=0;
function gObj(n){const id=n.key.slice(2);
  return n.type==="m"?CARDIDX[id]:n.type==="c"?courseOf(id):n.type==="f"?FICHES.find(f=>f.id===id):n.type==="s"?STORIES.find(x=>x.id===id):n.type==="p"?PODCASTS.find(x=>x.id===id):n.type==="u"?(S.notes||{})[n.key]:n.type==="h"?HJ.find(x=>x.h===id):null}
function gLabel(n){const o=gObj(n),id=n.key.slice(2);
  switch(n.type){case "m":return [id,o?(o.f||o.e):""];case "c":return [id==="jour"?"매일 단어":id,o?o.t:""];case "t":return THNAME[id]||[id,""];
  case "f":return o?[o.ko,o.t]:[id,""];case "s":case "p":return o?[o.ko,o.t]:[id,""];case "u":return [o&&o.ti||"제목 없음",o&&o.ti?"Ma note":"Note sans titre"];case "h":return o?[o.h+" "+o.r,o.m]:[id,""]}return [id,""]}
function gColor(n){if(n.type==="m"){const c=CARDIDX[n.key.slice(2)];return GCOL[c?lvKey(c):"A1"]||GCOL.A1}return GCOL[n.type]}
function gInit(){
  if(GN)return;GN=[];
  for(let i=0;i<GR.k.length;i++){const key=GR.k[i];GI[key]=i;GN.push({key,type:key[0],x:GR.xy[2*i],y:GR.xy[2*i+1],adj:new Set()})}
  for(let i=0;i<GR.e.length;i+=2){GN[GR.e[i]].adj.add(GR.e[i+1]);GN[GR.e[i+1]].adj.add(GR.e[i])}
  for(const x of (typeof HJ!=="undefined"?HJ:[])){const ids=x.w.map(k=>GI["m:"+k]).filter(i=>i!=null);if(!ids.length)continue;const key="h:"+x.h,me=GN.length;
    GI[key]=me;GN.push({key,type:"h",x:ids.reduce((s,i)=>s+GN[i].x,0)/ids.length,y:ids.reduce((s,i)=>s+GN[i].y,0)/ids.length,adj:new Set(ids)});for(const i of ids)GN[i].adj.add(me)}
  GBASE=GN.length;GN.forEach(n=>n.base=new Set(n.adj));
}
// Noms reconnus entre [[ ]] : mot, n° de cours, thème, synthèse, histoire, émission, titre d'une de mes notes.
function gFind(name){
  name=String(name).trim();if(!name)return -1;const lo=name.toLowerCase();
  if(GI["m:"+name]!=null)return GI["m:"+name];
  if(GI["c:"+name.toUpperCase()]!=null)return GI["c:"+name.toUpperCase()];
  for(let i=0;i<GN.length;i++){const n=GN[i];if(n.type==="m")continue;const [a,b]=gLabel(n);if(a.toLowerCase()===lo||(b&&b.toLowerCase()===lo))return i}
  return -1;
}
const gLinksIn=t=>[...String(t||"").matchAll(/\[\[([^\]]+)\]\]/g)].map(m=>m[1].split("|")[0]);
// Ajoute mes notes au réseau : chaque note libre devient un nœud, chaque [[lien]] devient un lien.
function gUser(){
  gInit();GN.length=GBASE;GN.forEach(n=>{n.adj=new Set(n.base)});for(const k in GI)if(k[0]==="u")delete GI[k];
  const N=S.notes||{};
  for(const k in N)if(k[0]==="u"&&!N[k].del){GI[k]=GN.length;GN.push({key:k,type:"u",x:0,y:0,adj:new Set(),base:new Set()})}
  for(const k in N){if(N[k].del||GI[k]==null)continue;const a=GI[k];
    for(const l of gLinksIn(N[k].t)){const b=gFind(l);if(b>=0&&b!==a){GN[a].adj.add(b);GN[b].adj.add(a)}}}
  for(let i=GBASE;i<GN.length;i++){const n=GN[i],nb=[...n.adj];if(nb.length){n.x=nb.reduce((s,j)=>s+GN[j].x,0)/nb.length+40;n.y=nb.reduce((s,j)=>s+GN[j].y,0)/nb.length-40}else{const a=i*2.4;n.x=1080*Math.cos(a);n.y=1080*Math.sin(a)}}
}
function gGlow(n){if(n.type!=="m")return 1;const c=S.c[n.key.slice(2)];return !c?0:c[1]>=21?3:c[1]>=1?2:1}
function noteSet(key,patch){S.notes=S.notes||{};S.notes[key]=Object.assign({},S.notes[key]||{},patch,{u:Date.now()});save()}

/* dessin : nœuds = indices dans GN, pos = positions (monde), tap = fonction(indice) */
function gDraw(cv,o){
  const ctx=cv.getContext("2d"),dpr=Math.min(2,window.devicePixelRatio||1);
  const V=o.view;let W=0,H=0,raf=0;
  const edges=[];const inSet=new Set(o.ids);
  for(const i of o.ids)for(const j of GN[i].adj)if(j>i&&inSet.has(j))edges.push(i,j);
  const P=o.pos;
  function fit(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;if(!V.s){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const i of o.ids){const p=P(i);x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}V.s=Math.min(W/(x1-x0+120),H/(y1-y0+120))||1;V.x=(x0+x1)/2;V.y=(y0+y1)/2}}
  const sx=p=>(p[0]-V.x)*V.s+W/2,sy=p=>(p[1]-V.y)*V.s+H/2;
  function rad(i){const n=GN[i];const d=n.adj.size;let r=n.type==="m"?1.6+Math.min(3,Math.sqrt(d)*.55):3.5+Math.min(9,Math.sqrt(d)*.9);if(o.big)r*=1.6;return r*Math.max(.7,Math.min(2.4,Math.sqrt(V.s*(o.big?1:2.2))))}
  function draw(){raf=0;ctx.setTransform(dpr,0,0,dpr,0,0);
    const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,"#1b2140");g.addColorStop(1,"#0b0c12");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const sel=V.sel;ctx.globalCompositeOperation="lighter";
    ctx.strokeStyle=o.big?"rgba(160,190,255,.35)":"rgba(150,180,255,"+(sel!=null?.05:.11)+")";ctx.lineWidth=o.big?1.2:.7;ctx.beginPath();
    for(let k=0;k<edges.length;k+=2){const a=P(edges[k]),b=P(edges[k+1]);ctx.moveTo(sx(a),sy(a));ctx.lineTo(sx(b),sy(b))}ctx.stroke();
    if(sel!=null&&inSet.has(sel)){const a=P(sel);ctx.strokeStyle="rgba(255,225,150,.75)";ctx.lineWidth=1.4;ctx.beginPath();for(const j of GN[sel].adj)if(inSet.has(j)){const b=P(j);ctx.moveTo(sx(a),sy(a));ctx.lineTo(sx(b),sy(b))}ctx.stroke()}
    const lab=[];
    for(const i of o.ids){const p=P(i),x=sx(p),y=sy(p);if(x<-20||y<-20||x>W+20||y>H+20)continue;const n=GN[i],r=rad(i),gl=gGlow(n);
      const dim=sel!=null&&i!==sel&&!GN[sel].adj.has(i);
      ctx.globalAlpha=dim?.22:n.type==="m"?(gl===0?.45:1):1;ctx.fillStyle=gColor(n);
      if(gl>=2||n.type!=="m"){ctx.globalAlpha*=.28;ctx.beginPath();ctx.arc(x,y,r*(gl===3?3.4:2.4),0,7);ctx.fill();ctx.globalAlpha=dim?.22:1}
      ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();
      if(i===sel){ctx.globalAlpha=1;ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r+3,0,7);ctx.stroke()}
      lab.push([n.type==="m"?(i===sel?100:V.s>(o.big?0:.9)?1:-1):(i===sel?100:10+n.adj.size),x,y,r,i])}
    ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;
    lab.sort((a,b)=>b[0]-a[0]);const occ=[];ctx.textAlign="center";ctx.textBaseline="top";
    for(const [pr,x,y,r,i] of lab){if(pr<0)continue;if(o.big||pr>=100||V.s*(GN[i].type==="m"?1:3.2)>.5){
      const t=gLabel(GN[i])[0],fs=GN[i].type==="m"?12:13,w=t.length*fs*.9+8,box=[x-w/2,y+r+2,x+w/2,y+r+2+fs+4];
      if(pr<100&&occ.some(b=>b[0]<box[2]&&box[0]<b[2]&&b[1]<box[3]&&box[1]<b[3]))continue;occ.push(box);if(occ.length>(o.big?60:90))break;
      ctx.font=(GN[i].type==="m"?"500 ":"700 ")+fs+"px "+(getComputedStyle(document.body).getPropertyValue("--ko")||"sans-serif");
      ctx.fillStyle="rgba(8,10,20,.72)";ctx.fillRect(box[0],box[1],w,fs+4);ctx.fillStyle=GN[i].type==="m"?"#fff3e6":gColor(GN[i]);ctx.fillText(t,x,y+r+4)}}
  }
  const req=()=>{if(!raf)raf=requestAnimationFrame(draw)};
  const pts=new Map();let moved=0,t0=0,pinch=null;
  cv.onpointerdown=e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);moved=0;t0=Date.now();if(pts.size===2){const [a,b]=[...pts.values()];pinch=[Math.hypot(a[0]-b[0],a[1]-b[1]),V.s]}};
  cv.onpointermove=e=>{if(!pts.has(e.pointerId))return;const q=pts.get(e.pointerId);const dx=e.clientX-q[0],dy=e.clientY-q[1];
    if(pts.size===1){V.x-=dx/V.s;V.y-=dy/V.s;moved+=Math.abs(dx)+Math.abs(dy)}pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2&&pinch){const [a,b]=[...pts.values()];V.s=Math.max(.05,Math.min(20,pinch[1]*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch[0]));moved=99}req()};
  const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size<2)pinch=null;
    if(!pts.size&&moved<8&&Date.now()-t0<500){const r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let best=-1,bd=22*22;
      for(const i of o.ids){const p=P(i),dx=sx(p)-mx,dy=sy(p)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;best=i}}o.tap(best,req)}};
  cv.onpointerup=up;cv.onpointercancel=up;
  cv.onwheel=e=>{e.preventDefault();const r=cv.getBoundingClientRect(),mx=e.clientX-r.left-W/2,my=e.clientY-r.top-H/2,f=Math.exp(-e.deltaY*.0015);
    V.x+=mx/V.s;V.y+=my/V.s;V.s=Math.max(.05,Math.min(20,V.s*f));V.x-=mx/V.s;V.y-=my/V.s;req()};
  fit();draw();
  return {redraw:req,zoom(f){V.s=Math.max(.05,Math.min(20,V.s*f));req()},center(i,s){const p=P(i);V.x=p[0];V.y=p[1];if(s)V.s=s;V.sel=i;req()},reset(){V.s=0;V.sel=null;fit();req()}};
}

/* ---------- vue globale ---------- */
let GV={s:0,x:0,y:0,sel:null},GHIDE={},GAPI=null;
function gStats(){let m=0,on=0,ma=0;for(const n of GN)if(n.type==="m"){m++;const g=gGlow(n);if(g)on++;if(g===3)ma++}let e=0;for(const n of GN)e+=n.adj.size;return {n:GN.length,e:e/2,m,on,ma}}
function vCerveau(){
  gUser();const st=gStats(),N=S.notes||{};
  const mine=Object.keys(N).filter(k=>k[0]==="u"&&!N[k].del).sort((a,b)=>N[b].u-N[a].u);
  const attached=Object.keys(N).filter(k=>k[0]!=="u"&&!N[k].del&&N[k].t&&N[k].t.trim()&&GI[k]!=null);
  const leg=[["m","단어 · Mots"],["c","수업 · Cours"],["t","주제 · Thèmes"],["f","정리 · Synthèses"],["s","이야기 · Histoires"],["p","방송 · Émissions"],["h","한자 · Hanja"],["u","메모 · Mes notes"]];
  $("#view").innerHTML=`<h1>뇌 · Cerveau<small>Tout ce que tu apprends, relié comme des neurones : ${st.n} éléments et ${st.e} liens. Les mots que tu connais s'allument.</small></h1>
  <div class="kpis"><div class="kpi"><b>${st.on}</b><span><i class="ko">켜진 뉴런</i> mots allumés sur ${st.m}</span></div><div class="kpi"><b>${st.ma}</b><span><i class="ko">튼튼한 뉴런</i> mots ancrés (3 semaines et plus)</span></div><div class="kpi"><b>${mine.length+attached.length}</b><span><i class="ko">내 메모</i> notes écrites</span></div></div>
  <div class="gsearch"><input id="gq" type="search" placeholder="찾기 · Chercher un mot, un cours, une histoire…" autocomplete="off"><div id="gres" class="gres"></div></div>
  <div class="gwrap"><canvas id="gc" class="gc"></canvas>
   <div class="gzoom"><button data-gz="1.5" aria-label="Zoomer">+</button><button data-gz="0.66" aria-label="Dézoomer">−</button><button data-gz="0" aria-label="Recentrer">⟲</button></div>
   <div id="gsel" class="gsel" hidden></div></div>
  <div class="gleg">${leg.map(([t,l])=>`<button class="chip" aria-pressed="${!GHIDE[t]}" data-gt="${t}"><i style="background:${t==="m"?GCOL.A1:GCOL[t]}"></i>${l}</button>`).join("")}</div>
  <p class="count">Glisse pour te déplacer, pince ou fais défiler pour zoomer, touche un point pour voir ses liens. Mots : <b style="color:${GCOL.A1}">A1</b>, <b style="color:${GCOL.A2}">A2</b>, <b style="color:${GCOL.B1}">B1</b> ; plus un mot est révisé, plus il brille.</p>
  <section><h2><span class="ko">내 메모</span> · Mes notes</h2>
   <div class="actions"><button class="btn" data-act="gnew">새 메모 · Nouvelle note</button></div>
   ${mine.length||attached.length?`<div class="rows">${[...mine,...attached].sort((a,b)=>N[b].u-N[a].u).map(k=>{const n=GN[GI[k]];const [a,b]=gLabel(n);return `<button class="rowbtn" data-node="${esc(k)}"><span class="id" style="color:${gColor(n)}">${GT[n.type][0]}</span><span class="tx"><span>${esc(k[0]==="u"?a:a+" · ma note")}</span><small>${esc((N[k].t||"").replace(/\s+/g," ").slice(0,90))}</small></span><span class="n">${n.adj.size} lien${n.adj.size>1?"s":""}</span></button>`}).join("")}</div>`:`<p class="count">Aucune note pour l'instant. Écris une remarque de cours, une phrase entendue, une astuce : mets un mot entre [[ ]] pour le relier, par exemple [[까만색]] ou [[C79]].</p>`}
  </section>
  <section><h2><span class="ko">옵시디언</span> · Obsidian</h2><p class="count">Tout le réseau en fichiers Markdown reliés, avec tes notes : à décompresser dans un coffre Obsidian (ordinateur, tablette ou téléphone).</p>
   <div class="actions"><button class="btn ghost" data-act="obs">내보내기 · Télécharger le coffre (.zip)</button></div><p class="count" id="obsmsg"></p></section>`;
  const ids=[];for(let i=0;i<GN.length;i++)if(!GHIDE[GN[i].type])ids.push(i);
  GAPI=gDraw($("#gc"),{ids,view:GV,pos:i=>[GN[i].x,GN[i].y],tap(i,req){GV.sel=i<0?null:i;gSel();req()}});
  if(GV.sel!=null)gSel();
  const q=$("#gq");q.oninput=()=>{const v=q.value.trim().toLowerCase(),r=$("#gres");if(!v){r.innerHTML="";return}
    const hits=[];for(let i=0;i<GN.length&&hits.length<8;i++){const [a,b]=gLabel(GN[i]);if(a.toLowerCase().includes(v)||(b&&b.toLowerCase().includes(v)))hits.push(i)}
    r.innerHTML=hits.length?hits.map(i=>{const [a,b]=gLabel(GN[i]);return `<button data-gpick="${i}"><i style="background:${gColor(GN[i])}"></i><b class="ko">${esc(a)}</b><span>${esc(b)}</span></button>`}).join(""):'<p class="count">Rien trouvé.</p>'};
}
function gSel(){const box=$("#gsel");if(!box)return;const i=GV.sel;if(i==null||!GN[i]){box.hidden=true;return}
  const n=GN[i],[a,b]=gLabel(n);box.hidden=false;
  box.innerHTML=`<span class="gtag" style="--c:${gColor(n)}">${GT[n.type][0]} · ${GT[n.type][1]}</span><b class="ko">${esc(a)}</b><span>${esc(b)}</span><em>${n.adj.size} lien${n.adj.size>1?"s":""}</em><button class="btn" data-node="${esc(n.key)}">열기 · Ouvrir</button>`}

/* ---------- page d'un élément ---------- */
function gLocal(center){
  const n=GN[center],nb=[...n.adj].sort((a,b)=>(GN[a].type==="m")-(GN[b].type==="m")||GN[b].adj.size-GN[a].adj.size).slice(0,34);
  const ids=[center,...nb],pos={};pos[center]=[0,0];
  nb.forEach((j,k)=>{const a=k/nb.length*6.283+.3,r=GN[j].type==="m"?150:110;pos[j]=[r*Math.cos(a),r*Math.sin(a)]});
  for(let it=0;it<140;it++){const d={};for(const i of ids)d[i]=[0,0];
    for(let x=0;x<ids.length;x++)for(let y=x+1;y<ids.length;y++){const a=ids[x],b=ids[y],dx=pos[a][0]-pos[b][0],dy=pos[a][1]-pos[b][1],q=dx*dx+dy*dy+.01,f=2600/q;d[a][0]+=dx*f;d[a][1]+=dy*f;d[b][0]-=dx*f;d[b][1]-=dy*f}
    for(const a of ids)for(const b of GN[a].adj)if(b>a&&pos[b]){const dx=pos[a][0]-pos[b][0],dy=pos[a][1]-pos[b][1],L=Math.sqrt(dx*dx+dy*dy)+.01,f=(L-120)/L*.08;d[a][0]-=dx*f;d[a][1]-=dy*f;d[b][0]+=dx*f;d[b][1]+=dy*f}
    for(const i of ids){if(i===center)continue;const L=Math.hypot(d[i][0],d[i][1])||1,m=Math.min(L,8);pos[i][0]+=d[i][0]/L*m-pos[i][0]*.004;pos[i][1]+=d[i][1]/L*m-pos[i][1]*.004}}
  return {ids,pos};
}
function gOpenBtn(n){const id=n.key.slice(2);
  return n.type==="c"?`<button class="btn" data-course="${esc(id)}">수업 열기 · Ouvrir le cours</button>`:n.type==="t"?`<button class="btn" data-th="${esc(id)}">카드 보기 · Voir les cartes</button>`:n.type==="f"?`<button class="btn" data-fiche="${esc(id)}">정리 열기 · Ouvrir la synthèse</button>`:n.type==="s"?`<button class="btn" data-story="${esc(id)}">읽기 · Lire l'histoire</button>`:n.type==="p"?`<button class="btn" data-pod="${esc(id)}">듣기 · Écouter l'émission</button>`:n.type==="h"?`<button class="btn" data-pv="hanja">한자 · Tous les hanja</button>`:""}
function vNode(s){
  gUser();const i=GI[s.key];if(i==null){$("#view").innerHTML=`${backBtn()}<h1>뇌 · Cerveau<small>Cet élément n'existe plus.</small></h1>`;return}
  const n=GN[i],[a,b]=gLabel(n),N=(S.notes||{})[s.key]||{},o=gObj(n);
  const groups={};for(const j of n.adj)(groups[GN[j].type]=groups[GN[j].type]||[]).push(j);
  const order=["c","t","f","h","s","p","u","m"];
  $("#view").innerHTML=`${backBtn()}<h1><span class="gtag" style="--c:${gColor(n)}">${GT[n.type][0]} · ${GT[n.type][1]}</span>${n.type==="u"?`<input id="gti" class="gti ko" value="${esc(N.ti||"")}" placeholder="제목 · Titre de la note">`:`<span class="ko">${esc(a)}</span>`}<small>${n.type==="u"?"Note libre, reliée au reste par ses [[liens]]":esc(b)}</small></h1>
  ${n.type==="m"&&o?`<div class="rows"><div class="w open">${cardBody(o)}</div></div>`:""}
  ${gOpenBtn(n)?`<div class="actions">${gOpenBtn(n)}</div>`:""}
  <div class="gwrap small"><canvas id="gl" class="gc"></canvas></div>
  <section><h2><span class="ko">${n.type==="u"?"메모":"내 메모"}</span> · ${n.type==="u"?"Contenu":"Ma note"}</h2>
   <textarea id="gnote" class="gnote" rows="${n.type==="u"?9:4}" placeholder="Écris ce que tu veux retenir. Pour relier, mets un nom entre [[ ]] : [[까만색]], [[C79]], [[Couleurs]]…">${esc(N.t||"")}</textarea>
   <p class="count" id="gnmsg">${N.u?"Enregistrée le "+new Date(N.u).toLocaleString("fr-FR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})+". Elle se synchronise avec tes autres appareils.":"Enregistrement automatique, synchronisé avec tes autres appareils."}</p>
   ${n.type==="u"?`<div class="actions"><button class="btn ghost" data-act="gdel">${s.del?"Confirmer la suppression":"Supprimer cette note"}</button></div>`:""}</section>
  <section><h2><span class="ko">연결</span> · Liens (${n.adj.size})</h2>
   ${n.adj.size?order.filter(t=>groups[t]).map(t=>{const g=groups[t].sort((x,y)=>GN[y].adj.size-GN[x].adj.size),lim=s.all?999:40;return `<h3 class="gh">${GT[t][0]} · ${GT[t][1]}${g.length>1?"s":""} <span>${g.length}</span></h3><div class="gchips">${g.slice(0,lim).map(j=>{const [x,y]=gLabel(GN[j]);return `<button class="gchip" data-node="${esc(GN[j].key)}" style="--c:${gColor(GN[j])}" title="${esc(y)}"><b class="ko">${esc(x)}</b>${t!=="m"&&y?`<span>${esc(y)}</span>`:t==="m"?`<span>${esc(y.slice(0,26))}</span>`:""}</button>`}).join("")}${g.length>lim?`<button class="gchip more" data-act="gall">+ ${g.length-lim}</button>`:""}</div>`}).join(""):`<p class="count">Pas encore de lien. Écris une note avec un [[mot]] pour en créer.</p>`}
  </section>`;
  const L=gLocal(i);gDraw($("#gl"),{ids:L.ids,pos:j=>L.pos[j],view:{s:0,x:0,y:0,sel:i},big:true,tap(j){if(j>=0&&j!==i){s.scroll=$("#main").scrollTop;go({v:"node",key:GN[j].key})}}});
  let tm=0;const save1=()=>{const t=$("#gnote").value,ti=$("#gti")?$("#gti").value.trim():undefined;const p={t};if(ti!==undefined)p.ti=ti;noteSet(s.key,p);const m=$("#gnmsg");if(m)m.textContent="Enregistrée. "+(gLinksIn(t).length?gLinksIn(t).map(l=>gFind(l)>=0?"[["+l+"]] relié":"[["+l+"]] introuvable").join(", ")+".":"")};
  const later=()=>{clearTimeout(tm);tm=setTimeout(save1,500)};
  $("#gnote").oninput=later;if($("#gti"))$("#gti").oninput=later;
  $("#gnote").onblur=()=>{clearTimeout(tm);save1()};
}
document.addEventListener("click",e=>{const t=e.target;
  const nd=t.closest("[data-node]");if(nd){e.stopPropagation();cur().scroll=$("#main").scrollTop;go({v:"node",key:nd.dataset.node});return}
  const gz=t.closest("[data-gz]");if(gz&&GAPI){const f=+gz.dataset.gz;if(f)GAPI.zoom(f);else{GAPI.reset();gSel()}return}
  const gt=t.closest("[data-gt]");if(gt){GHIDE[gt.dataset.gt]=!GHIDE[gt.dataset.gt];cur().keepScroll=true;render();cur().keepScroll=false;return}
  const gp=t.closest("[data-gpick]");if(gp&&GAPI){const i=+gp.dataset.gpick;if(GHIDE[GN[i].type]){GHIDE[GN[i].type]=false;GV.sel=i;cur().keepScroll=true;render();cur().keepScroll=false}GAPI.center(i,Math.max(GV.s,.9));GV.sel=i;gSel();$("#gres").innerHTML="";$("#gq").value="";$("#gc").scrollIntoView({block:"center",behavior:"smooth"});return}
  const ac=t.closest("[data-act]");if(!ac)return;const a=ac.dataset.act,s=cur();
  if(["gnew","gdel","gall","obs"].includes(a))e.stopPropagation();
  if(a==="gnew"){const k="u:"+Date.now().toString(36);noteSet(k,{ti:"",t:""});go({v:"node",key:k});setTimeout(()=>{const x=$("#gti");if(x)x.focus()},50);return}
  if(a==="gdel"&&s.v==="node"){if(!s.del){s.del=1;s.keepScroll=true;render();s.keepScroll=false;return}noteSet(s.key,{del:1,t:"",ti:""});back();return}
  if(a==="gall"&&s.v==="node"){s.all=1;s.keepScroll=true;render();s.keepScroll=false;return}
  if(a==="obs"){obsidian();return}
},true);

/* ---------- export Obsidian : un .zip de fichiers Markdown reliés ---------- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){let c=-1;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^-1)>>>0}
function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const [name,text] of files){const nm=enc.encode(name),data=enc.encode(text),crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,0,true);h.setUint16(12,0x5a21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nm.length,true);
    parts.push(h,nm,data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x5a21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cen.push(c,nm);off+=30+nm.length+data.length}
  const cs=cen.reduce((s,x)=>s+x.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e],{type:"application/zip"})}
function obsidian(){
  gUser();const msg=$("#obsmsg");if(msg)msg.textContent="Préparation…";
  const safe=s=>String(s).replace(/[\\\/:*?"<>|#^\[\]]/g," ").replace(/\s+/g," ").trim().slice(0,80)||"sans titre";
  const DIR={m:"단어 Mots",c:"수업 Cours",t:"주제 Thèmes",f:"정리 Synthèses",s:"이야기 Histoires",p:"방송 Émissions",h:"한자 Hanja",u:"메모 Mes notes"};
  const used={},fname=[];
  GN.forEach((n,i)=>{const [a,b]=gLabel(n);let nm=n.type==="m"?safe(a):n.type==="c"?safe(n.key==="c:jour"?"매일 단어 (Mots du jour)":n.key.slice(2)):n.type==="t"?safe("주제 "+a+" ("+b+")"):n.type==="f"?safe("정리 "+a+" ("+b+")"):n.type==="s"?safe("이야기 "+a):n.type==="p"?safe("방송 "+a):n.type==="h"?safe("한자 "+a):safe(a||"메모");
    while(used[nm.toLowerCase()])nm+=" ·";used[nm.toLowerCase()]=1;fname[i]=nm});
  const lk=i=>"[["+fname[i]+"]]";const N=S.notes||{};
  const fix=t=>String(t||"").replace(/\[\[([^\]]+)\]\]/g,(m,x)=>{const j=gFind(x.split("|")[0]);return j>=0?lk(j):m});
  const files=[];
  GN.forEach((n,i)=>{const o=gObj(n),[a,b]=gLabel(n);const L=[];const tags=["coréen",GT[n.type][1].toLowerCase().replace(/\s/g,"-")];
    if(n.type==="m"&&o){tags.push(o.l);(o.t||[]).forEach(t=>tags.push(t));L.push("---","type: mot","niveau: "+o.l,"cours: "+o.c,"tags: ["+tags.join(", ")+"]","---","# "+a,"","**FR** : "+(o.f||""),"**EN** : "+(o.e||""),"");if(o.x){L.push("> "+o.x);if(o.z)L.push("> "+o.z);if(o.y)L.push("> "+o.y);L.push("")}if(o.n)L.push(o.n,"")}
    else{L.push("---","type: "+GT[n.type][1].toLowerCase(),"tags: ["+tags.join(", ")+"]","---","# "+a+(b&&n.type!=="u"?" · "+b:""),"");
      if(n.type==="c"&&o){if(o.s)L.push(o.s,"");if(o.teacher)L.push("Professeur : "+o.teacher,"")}
      if(n.type==="f"&&o){L.push(o.intro,"");for(const sec of o.s){L.push("## "+sec.h,"","| 한국어 | Français | English |","|---|---|---|");for(const r of sec.r)L.push("| "+[r[0],r[1],r[2]].map(x=>String(x||"").replace(/\|/g,"/")).join(" | ")+" |");L.push("")}}
      if((n.type==="s"||n.type==="p")&&o){L.push("Niveau : "+o.l,"");for(const raw of o.lines){const l=n.type==="p"?["",raw[0],raw[1]]:lineOf(raw);L.push((l[0]&&l[0]!=="N"?"**"+l[0]+"** : ":"")+l[1],"*"+l[2]+"*","")}}
      if(n.type==="u"&&o)L.push(fix(o.t),"")}
    const nt=N[n.key];if(n.type!=="u"&&nt&&!nt.del&&nt.t)L.push("## 내 메모 · Ma note","",fix(nt.t),"");
    const g={};for(const j of n.adj)(g[GN[j].type]=g[GN[j].type]||[]).push(j);
    if(n.adj.size){L.push("## 연결 · Liens","");for(const t of ["c","t","f","h","s","p","u","m"])if(g[t])L.push("- "+GT[t][1]+" : "+g[t].map(lk).join(" · "));L.push("")}
    files.push([`한국어 노트/${DIR[n.type]}/${fname[i]}.md`,L.join("\n")])});
  files.push(["한국어 노트/뇌 Cerveau.md",["# 뇌 · Cerveau","","Exporté depuis 한국어 노트 le "+new Date().toLocaleDateString("fr-FR")+".","","Ouvre la vue graphique d'Obsidian pour voir le réseau. Dossiers : "+Object.values(DIR).join(", ")+".","","## Cours","",GN.map((n,i)=>n.type==="c"?"- "+lk(i):"").filter(Boolean).join("\n"),"","## Thèmes","",GN.map((n,i)=>n.type==="t"?"- "+lk(i):"").filter(Boolean).join("\n")].join("\n")]);
  const url=URL.createObjectURL(zip(files)),el=document.createElement("a");el.href=url;el.download="한국어-노트-obsidian.zip";document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),6e4);
  if(msg)msg.textContent=`${files.length} fichiers exportés. Décompresse le dossier « 한국어 노트 » dans ton coffre Obsidian.`;
}
