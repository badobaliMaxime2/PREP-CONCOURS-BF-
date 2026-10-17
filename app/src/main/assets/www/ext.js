/* ===== PREP' CONCOURS BF v4 : extensions =====
   Compte + code d'activation, assistant, Repères Burkina Faso, flux d'annonces en direct,
   source de configuration en ligne. Chargé AVANT app.js ; app.js appelle EXT.init(APP). */
(function(){
"use strict";
let A=null,C=null,D=null,ls=null,esc=null,toast=null;
const $=s=>document.querySelector(s);
const ALLOW=["FEED_URL","FEED_RSS","FEED_KEYWORDS","REGISTER_URL","ACCOUNT_URL","AI_URL","WHATSAPP","PHONE","EMAIL","FACEBOOK","ECONCOURS","SITES","CONFIG_URL"];
const URLKEYS=["FEED_URL","REGISTER_URL","ACCOUNT_URL","AI_URL","FACEBOOK","ECONCOURS","CONFIG_URL"];
const BASE={};let BASEREP=null,afilt=true,outConfirm=false;
const isHttps=u=>typeof u==="string"&&/^https:\/\//i.test(u);
const nz=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/['’`]/g," ");

/* ---------- configuration (défauts < source en ligne < réglages admin) ---------- */
function sane(k,v){
  if(URLKEYS.includes(k))return v===""||isHttps(v)?v:undefined;
  if(k==="FEED_RSS"||k==="SITES")return Array.isArray(v)?v.filter(x=>x&&isHttps(x.u)&&x.n).map(x=>({n:String(x.n),u:x.u})):undefined;
  if(k==="WHATSAPP")return /^\d{8,15}$/.test(String(v))?String(v):undefined;
  if(k==="PHONE")return /^\+?\d{8,15}$/.test(String(v))?String(v):undefined;
  if(k==="EMAIL")return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v))?String(v):undefined;
  if(k==="FEED_KEYWORDS"){try{new RegExp(v);return String(v)}catch(e){return undefined}}
  return typeof v==="string"?v:undefined}
function applyCfg(){const r=ls.g("rcfg",{}),o=ls.g("ovr",{});
  ALLOW.forEach(k=>{if(!(k in BASE))BASE[k]=C[k];let v=BASE[k];
    if(r[k]!==undefined&&r[k]!==null&&r[k]!=="")v=r[k];
    if(o[k]!==undefined&&o[k]!=="")v=o[k];C[k]=v})}
function applyRep(){const r=ls.g("rrep",null);window.REP=(r&&typeof r==="object")?Object.assign({},BASEREP,r):BASEREP}
const REPD=()=>window.REP;

/* ---------- réseau ---------- */
async function getText(u,ms){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms||12000);
  try{const r=await fetch(u,{cache:"no-store",signal:c.signal});if(!r.ok)throw new Error("http "+r.status);return await r.text()}finally{clearTimeout(t)}}
function strip(h){const t=document.createElement("div");t.innerHTML=h||"";return(t.textContent||"").replace(/\s+/g," ").trim()}
function parseXml(txt,name){
  const doc=new DOMParser().parseFromString(txt,"text/xml");
  if(doc.getElementsByTagName("parsererror").length)throw new Error("xml");
  return Array.from(doc.querySelectorAll("item, entry")).slice(0,40).map(it=>{
    const tg=n=>{const e=it.getElementsByTagName(n)[0];return e?e.textContent:""};
    let link=tg("link");const ls2=it.getElementsByTagName("link");
    for(let i=0;i<ls2.length;i++){const h=ls2[i].getAttribute("href");if(h){link=h;break}}
    const id=tg("guid")||tg("id")||link||tg("title");
    const d=Date.parse(tg("pubDate")||tg("updated")||tg("published")||tg("dc:date"))||0;
    return{id:name+"|"+id,titre:strip(tg("title")),texte:strip(tg("description")||tg("summary")||tg("content:encoded")||tg("content")).slice(0,220),date:d,lien:isHttps(link.trim())?link.trim():"",src:name}})}
async function pullCfg(){
  if(!C.CONFIG_URL)return null;
  try{const j=JSON.parse(await getText(C.CONFIG_URL));
    const cfg=j.config||{},clean={};
    ALLOW.forEach(k=>{if(k==="CONFIG_URL"||cfg[k]===undefined)return;const v=sane(k,cfg[k]);if(v!==undefined)clean[k]=v});
    ls.s("rcfg",clean);
    if(j.reperes&&typeof j.reperes==="object")ls.s("rrep",j.reperes);
    const rd={};["concours","notifications","faq","resultats"].forEach(k=>{if(Array.isArray(j[k]))rd[k]=j[k]});ls.s("rdata",rd);
    ls.s("cfgver",{t:Date.now(),v:String(j.version||"")});applyCfg();applyRep();return true}
  catch(e){return false}}
async function sync(manual){
  const st={t:Date.now(),src:{}};
  st.cfg=await pullCfg();
  let off=[];
  if(C.FEED_URL){const nm="Annonces officielles (JSON)";
    try{const j=JSON.parse(await getText(C.FEED_URL));ls.s("feed",j);
      off=(j.notifications||[]).map(n=>({id:"off|"+n.id,titre:n.titre||"",texte:n.texte||"",date:Date.parse(n.date)||0,lien:isHttps(n.lien)?n.lien:"",src:"Officiel",off:true}));
      st.src[nm]={ok:true,n:off.length}}catch(e){st.src[nm]={ok:false,n:0}}}
  const feeds=Array.isArray(C.FEED_RSS)?C.FEED_RSS:[];
  const res=await Promise.allSettled(feeds.map(f=>getText(f.u).then(t=>({f,t}))));
  let all=off.slice(),anyOk=off.length>0;
  res.forEach((r,i)=>{const f=feeds[i];
    if(r.status==="fulfilled"){try{const t=r.value.t.trim();let arr;
        if(t[0]==="{"||t[0]==="["){const j=JSON.parse(t);arr=(j.notifications||[]).map(n=>({id:f.n+"|"+n.id,titre:n.titre||"",texte:n.texte||"",date:Date.parse(n.date)||0,lien:isHttps(n.lien)?n.lien:"",src:f.n}))}
        else arr=parseXml(t,f.n);
        all=all.concat(arr);anyOk=true;st.src[f.n]={ok:true,n:arr.length}}catch(e){st.src[f.n]={ok:false,n:0}}}
    else st.src[f.n]={ok:false,n:0}});
  if(anyOk){
    const old=ls.g("fitems",[]),m=new Map();old.concat(all).forEach(x=>{if(x.id&&x.titre)m.set(x.id,Object.assign({},m.get(x.id)||{},x))});
    const items=Array.from(m.values()).sort((a,b)=>(b.date||0)-(a.date||0)).slice(0,150);ls.s("fitems",items);
    let re;try{re=new RegExp(C.FEED_KEYWORDS||"concours","i")}catch(e){re=/concours/i}
    const first=ls.g("seen2",null)===null,seen=ls.g("seen2",[]);let notified=0;
    items.forEach(x=>{if(seen.includes(x.id))return;seen.push(x.id);
      if(first)return;
      if(notified<3&&ls.g("notif",true)&&A.B&&A.B.notify&&(x.off||re.test(nz(x.titre+" "+x.texte)+" "+x.titre+" "+x.texte))){A.B.notify(x.titre,x.texte||x.src);notified++}});
    ls.s("seen2",seen.slice(-400))}
  ls.s("fstat",st);
  const cur=A.cur();
  if(["home","track","results","rep"].includes(cur))A.draw();
  if(manual){const tot=Object.keys(st.src).length,ok=Object.values(st.src).filter(x=>x.ok).length;
    toast(!tot&&!C.CONFIG_URL?"Aucune source en ligne configurée":anyOk||st.cfg?`Mis à jour ✔ (${ok}/${tot} flux${st.cfg?" + configuration":""})`:"Hors ligne : données en cache")}}

/* ---------- compte utilisateur ---------- */
const acct=()=>ls.g("acct",null);
const acctOK=()=>{const a=acct();return !!(a&&a.act)};
function normContact(raw){raw=(raw||"").trim();
  if(raw.includes("@")){const e=raw.toLowerCase();return/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e)?{t:"email",v:e}:null}
  let d=raw.replace(/\D/g,"");if(d.startsWith("00226"))d=d.slice(5);else if(d.length>8&&d.startsWith("226"))d=d.slice(3);
  return d.length===8?{t:"tel",v:d}:null}
const shown=a=>a.t==="tel"||a.type==="tel"?"+226 "+a.contact.replace(/(\d\d)(?=\d)/g,"$1 ").trim():a.contact;
const adminTo=()=>((C.ADMIN_EMAILS&&C.ADMIN_EMAILS.length)?C.ADMIN_EMAILS:[C.EMAIL]).join(",");
let delConfirm=false;
function sha256hex(str){
  const H=[],K=[];let n=2,c=0;const isP=x=>{for(let i=2;i*i<=x;i++)if(x%i===0)return false;return true};
  for(;c<64;n++)if(isP(n)){if(c<8)H[c]=Math.floor(Math.sqrt(n)%1*4294967296)|0;K[c++]=Math.floor(Math.cbrt(n)%1*4294967296)|0}
  const m=[];for(let i=0;i<str.length;i++)m.push(str.charCodeAt(i)&255);
  const bits=m.length*8;m.push(0x80);while(m.length%64!==56)m.push(0);
  for(let i=7;i>=0;i--)m.push(i>=4?0:(bits>>>(i*8))&255);
  const rr=(x,k)=>(x>>>k)|(x<<(32-k));
  for(let o=0;o<m.length;o+=64){const w=[];
    for(let i=0;i<16;i++)w[i]=(m[o+4*i]<<24)|(m[o+4*i+1]<<16)|(m[o+4*i+2]<<8)|m[o+4*i+3];
    for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
    let [a,b,cc,d,e,f,g,h]=H;
    for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&b)^(a&cc)^(b&cc),t2=(S0+mj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=cc;cc=b;b=a;a=(t1+t2)|0}
    H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+cc)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0}
  return H.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("")}
const adminLocal=code=>(C.ADMIN_HASHES||[]).includes(sha256hex("PCBF|"+code));
const activLocal=code=>(C.ACTIVATION_HASHES||[]).includes(sha256hex("PCBF|"+code));   // code à usage unique (un code = une personne)   // les codes ne sont jamais dans l'APK, seulement leurs empreintes
const ERR={net:"Serveur injoignable : vérifie ta connexion internet, puis réessaie",
 bad:"Le serveur a répondu de façon inattendue (adresse du serveur incorrecte ou service arrêté). Contacte le support",
 invalid:"Informations invalides : vérifie ton numéro (8 chiffres) ou ton e-mail",
 rate:"Trop de tentatives : réessaie dans quelques minutes",
 mail:"Le code n'a pas pu être envoyé par e-mail. Réessaie, ou utilise un numéro de téléphone",
 locked:"Trop d'essais : demande un nouveau code",expired:"Code expiré : demande un nouveau code",
 auth:"Session expirée : reconnecte-toi",srv:"Le serveur a refusé la demande. Réessaie plus tard",
 notok:"Entre le jeton administrateur",nourl:"Serveur non configuré (adresse vide)",unauth:"Jeton administrateur incorrect"};
const errMsg=e=>ERR[e&&e.code]||ERR.srv;
const fail=c=>Object.assign(new Error(c),{code:c});
async function post(o){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),20000);let r,j;
  try{r=await fetch(C.ACCOUNT_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(o),signal:c.signal})}
  catch(e){throw fail("net")}finally{clearTimeout(t)}
  try{j=await r.json()}catch(e){throw fail("bad")}
  return j}
function sessionExpired(){const a=acct();if(!a||!a.act)return;if(a.acode){delete a.token;ls.s("acct",a);return}   // activé par code administrateur : on se reconnecte seul
  a.act=false;a.pending=true;delete a.token;ls.s("acct",a);setTimeout(()=>A.draw(),0)}

/* Obtient un jeton de session pour un compte activé hors ligne par code administrateur (dès que le serveur répond) */
async function ensureToken(){const a=acct();if(!a||!a.act)return "";if(a.token)return a.token;
  if(!a.acode||!C.ACCOUNT_URL)return "";
  try{const r=await post({action:"verify",contact:a.contact,code:a.acode,did:a.did,type:a.type,nom:a.nom,prenom:a.prenom,naissance:a.naissance});
    if(r&&r.ok&&r.token){const b=acct();b.token=r.token;ls.s("acct",b);return r.token}
    if(r&&r.error==="used"){const b=acct();b.act=false;b.pending=true;delete b.acode;delete b.token;ls.s("acct",b);
      toast("Ce code d'activation est déjà utilisé par une autre personne : compte désactivé. Demande un autre code.");setTimeout(()=>A.draw(),0)}}catch(e){}
  return ""}

/* ---------- synchronisation de la progression (cloud) ---------- */
let rawSet=null,cloudTm=0,lver=0;   // lver : compteur de modifications locales (évite d'écraser une modification faite pendant une synchronisation)
const SYNCK=["hist","cq","target"];
const cloudData=()=>{const cq=ls.g("cq",[]),tg=ls.g("target","");return{hist:ls.g("hist",[]).slice(-1500),cq,cqAt:ls.g("cqAt",cq.length?1:0),target:tg,targetAt:ls.g("targetAt",tg?1:0)}};
async function cloudRun(manual){
  const a=acct();
  if(!C.ACCOUNT_URL||!a||!a.act)return false;
  if(!navigator.onLine){if(manual)toast("Hors ligne : progression non synchronisée");return false}
  const tok=a.token||await ensureToken();if(!tok)return false;
  try{const v0=lver,before=JSON.stringify(cloudData()),r=await post({action:"sync",token:tok,data:cloudData()});
    if(r&&r.ok&&lver!==v0){cloudSoon();return false}   // données modifiées pendant l'échange : on ignore cette réponse et on resynchronise
    if(r&&r.ok&&r.data){const d=r.data,set=rawSet||ls.s;
      set("hist",d.hist);set("cq",d.cq);set("cqAt",d.cqAt);set("target",d.target);set("targetAt",d.targetAt);
      if(JSON.stringify(cloudData())!==before&&A.cur()!=="quizrun")A.draw();
      if(manual)toast("Progression synchronisée ✔");return true}
    if(r&&r.error==="auth"){sessionExpired();return false}
    if(manual)toast(ERR[r&&r.error]||ERR.srv);return false}
  catch(e){if(manual)toast(errMsg(e));return false}}
let cloudP=Promise.resolve(false);
const cloud=manual=>{const run=()=>cloudRun(manual);return cloudP=cloudP.then(run,run)};   // synchronisations exécutées l'une après l'autre
const cloudSoon=()=>{clearTimeout(cloudTm);cloudTm=setTimeout(()=>cloud(false),4000)};

/* ---------- administration (via le serveur : aucun secret dans l'application) ---------- */
const admBase=()=>{try{return new URL(C.ACCOUNT_URL).origin}catch(e){return""}};
async function adm(path){
  const tok=(($("#apin")||{}).value||"").trim();if(!tok)throw fail("notok");if(!C.ACCOUNT_URL)throw fail("nourl");
  let r,j;try{r=await fetch(admBase()+path,{headers:{Authorization:"Bearer "+tok},cache:"no-store"})}catch(e){throw fail("net")}
  if(r.status===401)throw fail("unauth");
  try{j=await r.json()}catch(e){throw fail("bad")}
  return j}
let gateMode="login";
function gate(){
  const adm=A.cur()==="admin";
  if(!C.REQUIRE_ACCOUNT||acctOK()||adm){document.body.classList.remove("gate");return false}
  document.body.classList.add("gate");
  const a=acct(),scr=(a&&a.pending&&!a.act)?"activate":gateMode;
  $("#view").innerHTML=A.S[scr]();$("#view").scrollTop=0;
  $("#title").textContent=scr==="signup"?"Créer mon compte":scr==="login"?"Connexion":"Activer mon compte";$("#backBtn").hidden=true;return true}
const waMsg=a=>"Bonjour, je souhaite activer mon compte PREP' CONCOURS BF.\nNom : "+a.nom+"\nPrénom : "+a.prenom+"\nContact : "+shown(a)+"\nIdentifiant appareil : "+a.did;

/* ---------- assistant ---------- */
const REFUSE="Je ne suis pas programmé pour répondre à ce type de question. Je peux t'aider pour ta préparation aux concours : cours, quiz, annales et méthodes de révision.";
const BOT_SYSTEM="Tu es l'assistant de l'application PREP' CONCOURS BF (préparation aux concours au Burkina Faso). Réponds en français clair et concis (sauf si l'utilisateur écrit dans une autre langue), sur tous les domaines : culture générale, sciences, histoire, géographie, droit, économie, mathématiques, langues, santé (information générale sans diagnostic), technologie, conseils d'études et de méthode, etc. Sois exact ; si tu n'es pas sûr ou si l'information peut avoir changé (actualité, postes, chiffres récents), dis-le et recommande une source officielle. Ne réponds JAMAIS aux demandes sexuelles ou pornographiques, politiques partisanes (opinions sur partis, dirigeants, élections, gouvernements, coups d'État), discriminatoires ou haineuses, liées au terrorisme ou à la violence, ni à celles qui remettent en cause la crédibilité d'une religion, d'une communauté ou d'une institution : réponds alors exactement « Je ne suis pas programmé pour répondre à ce type de question. » Les faits neutres (dates, définitions, fonctionnement des institutions) restent permis. Pour plus d'informations ou une aide humaine, renvoie vers badobalimaxime@gmail.com ou WhatsApp 56837328. Moins de 250 mots sauf demande contraire.";
const SENS=[
 /\b(porn\w*|xxx|sex\w*|erotiq\w*|nudes?|masturb\w*|prostitu\w*|fellat\w*|vagin\w*|penis|orgasm\w*|pedophil\w*|seins|fesses|coucher avec)\b/,
 /\b(racis\w*|xenophob\w*|tribalis\w*|discrimin\w*|antisemit\w*|homophob\w*|suprematis\w*|negre|sous homme|(race|ethnie|peuple)s? (inferieure?s?|superieure?s?)|purification ethnique)\b/,
 /\b(terroris\w*|djihad\w*|jihad\w*|qaida|aqmi|daech|etat islamique|boko haram|jnim|gsim|ansarul\w*|attentats?|kamikaze|explosifs?|fabriquer (une |un )?(bombe|arme)\w*)\b/,
 /\b(corrompus?|incompetents?|illegitimes?|traitres?|escrocs?|menteurs?|blasphem\w*|diffam\w*|complots?|fake news|rumeurs?|dieu n existe pas|insulter|ridiculiser)\b/,
 /\b(le president|le gouvernement|l armee|la police|la justice|les ministres|l etat|la religion|l islam|le christianisme|les musulmans|les chretiens|les mossi|les peuls|les dioulas?|les gourounsi|les bobo|les touaregs?) (est|sont) (nuls?|mauvais\w*|dangereux\w*|vendus?|faux|fausses?|violents?|stupides?|voleurs?)\b/,
 /\b(avis|opinion|pense|penses|critique\w*|prefere|pour ou contre).*\b(president|gouvernement|ministre|religion|islam|christian\w*|dieu|armee|ethnie|communaute|aes|transition|revolution|ibrahim traore|capitaine)\b/,
 /\b(religions?|islam\w*|musulman\w*|chretien\w*|christianisme|catholi\w*|protestant\w*|animis\w*|evangeli\w*|eglises?|mosquees?|pasteurs?|imams?|pretres?|allah|jesus|mahomet|prophetes?|coran|bible|dieu|dieux|sectes?|atheis\w*|blaspheme)\b/,
 /\b(mossis?|moose|peuls?|fulanis?|dioulas?|gourounsis?|bobos?|touaregs?|lobis?|bissas?|gourmantches?|samos?|senoufos?|dagaris?|noirs|blancs|arabes|etrangers|migrants?)\b.*\b(meilleur\w*|superieur\w*|inferieur\w*|pire\w*|detest\w*|hais\w*|mepris\w*|valent|moins que|plus que)\b/,
 /\b(meilleur\w*|superieur\w*|inferieur\w*|pire\w*|detest\w*|hais\w*|mepris\w*)\b.*\b(mossis?|moose|peuls?|fulanis?|dioulas?|gourounsis?|bobos?|touaregs?|lobis?|bissas?|gourmantches?|samos?|senoufos?|dagaris?|noirs|blancs|arabes|etrangers|migrants?)\b/,
 /\b(quelle|quel) (ethnie|race|peuple|communaute|tribu)\b/
];
const SOFT=/\b(partis?|politiq\w*|politicien\w*|opposant\w*|opposition|elections?|voter|vote|putsch|coup d etat|junte|dictat\w*|campagne electorale)\b/;
const EDU=/\b(reperes?|reviser|histoire|biograph\w*|bibliograph\w*|institution\w*|constitution\w*|charte|mandat|definition|definir|signifie|date|creation|quiz|annale\w*|concours|cours|droit|economie|aes|alt|alp|que veut dire|c est quoi|qu est ce)\b/;
const OPIN=/\b(avis|opinion|pense\w*|prefere\w*|meilleur|pire|pour qui|devrait|faut il|bon ou mauvais|legitime|critique\w*|mauvais|nul|nuls)\b/;
function flag(m){const n=nz(m).replace(/bouts de bois de dieu/g," ");
  for(const r of SENS)if(r.test(n))return true;
  if(SOFT.test(n)&&!(EDU.test(n)&&!OPIN.test(n)))return true;
  return false}
const STOP=new Set("le la les des une est que qui quoi quel quelle quels quelles dans pour avec sur par pas plus comment quand donc sont ont aux ses ces mon ton son mais ainsi cela cette cet vous nous elle ils elles etre avoir faire peux peut veux dit dis dire donne moi sais savoir parle parler voudrais aimerais besoin resume liste synthese difference differences entre explique expliquer explication signifie sens definition definir notion exemple exemples veut".split(" "));
const tok=s=>nz(s).split(/[^a-z0-9]+/).filter(w=>w.length>=3&&!STOP.has(w)).map(w=>w.length>4&&w.endsWith("s")?w.slice(0,-1):w);
function docs(){
  const R=REPD(),L=[],lockedM=m=>A.locked(m);
  const mat=Object.fromEntries(D.matieres.map(m=>[m.id,m]));
  (D.faq||[]).forEach(f=>L.push({k:"app",t:f.q,x:f.q+" "+f.a,h:`<b>${esc(f.q)}</b><br>${esc(f.a)}`}));
  APPHELP.forEach(f=>L.push({k:"app",t:f.t,x:f.t+" "+f.x,h:f.h,b:f.b}));
  D.fiches.forEach(f=>{const tx=strip(f.h);L.push({k:"fiche",m:f.m,t:f.t,x:f.t+" "+tx,h:`<b>${esc(f.t)}</b><br>${esc(tx.slice(0,500))}`,b:[{l:"Ouvrir la fiche",act:"go",a:"fiche|"+f.id}]})});
  D.matieres.forEach(m=>A.allQ(m.id).forEach(q=>L.push({k:"q",m:m.id,t:q.q,x:q.q,h:`<b>${esc(q.q)}</b><br>✅ ${esc(q.o[q.a])}${q.e?`<br><small>${esc(q.e)}</small>`:""}`})));
  Object.keys(D.annalesQ||{}).forEach(m=>D.annalesQ[m].forEach(q=>L.push({k:"q",m:m,t:q.q,x:q.q,h:`<b>${esc(q.q)}</b><br>✅ ${esc(q.o[q.a])}${q.e?`<br><small>${esc(q.e)}</small>`:""}`})));
  (R.presidents||[]).forEach((p,i)=>L.push({k:"rep",m:"cg",t:p.n,x:p.n+" "+p.mandat+" "+p.gvt+" "+p.bio,h:`<b>${esc(p.n)}</b>${p.per?" ("+esc(p.per)+")":""}<br>Mandat : ${esc(p.mandat)}<br>${esc(p.bio)}`,b:[{l:"Voir la fiche détaillée",act:"go",a:"rep_p|"+i}]}));
  (R.institutions||[]).forEach(x=>L.push({k:"rep",m:"cg",t:x.n,x:x.n+" "+x.d+" "+x.t,h:`<b>${esc(x.n)}</b><br>Date : ${esc(x.d)}<br>${esc(x.t)}`,b:[{l:"Toutes les institutions",act:"go",a:"rep_i"}]}));
  (R.ministres||[]).forEach((x,i)=>L.push({k:"rep",m:"cg",t:x.nom,x:x.nom+" "+x.poste+" "+x.bio,h:`<b>${esc(x.nom)}</b><br>${esc(x.poste)}<br>${esc(x.bio)}`,b:[{l:"Voir le gouvernement",act:"go",a:"rep_g"}]}));
  (R.textes||[]).forEach(x=>L.push({k:"rep",m:"cg",t:x.t,x:x.t+" "+strip(x.h),h:`<b>${esc(x.t)}</b><br>${esc(strip(x.h).slice(0,650))}…`,b:[{l:"Lire le résumé complet",act:"go",a:"rep_t|"+x.id}]}));
  return L}
const APPHELP=[
 {t:"Premium",x:"premium prix payer activer code matieres debloquer",h:(window.CONFIG||{}).ALL_FREE?"🎉 Tout est gratuit : toutes les matières, les tests chronométrés, l'audio et le tableau de bord sont accessibles sans paiement.":"⭐ Le Premium débloque toutes les matières, les tests chronométrés, l'audio et le tableau de bord. Va dans <b>Plus → Premium</b> pour payer puis entrer ton code.",b:[{l:"Voir le Premium",act:"go",a:"premium"}]},
 {t:"Inscription aux concours directs",x:"inscription inscrire econcours e-concours fonction publique concours directs site officiel",h:"🧾 L'inscription aux concours directs de la Fonction publique se fait sur le site officiel <b>econcours.gov.bf</b>.",b:[{l:"Ouvrir e-concours",act:"open",a:"https://www.econcours.gov.bf/"}]},
 {t:"Résultats",x:"resultats admissibilite recepisse chercher nom",h:"🔎 Onglet <b>Résultats</b> : saisis ton nom, ton prénom ou ton numéro de récépissé.",b:[{l:"Aller aux résultats",act:"tab",a:"results"}]},
 {t:"Notifications et annonces",x:"notification annonce alerte communique direct flux",h:"🔔 Les annonces arrivent dans <b>Concours → Annonces</b>. Touche « Actualiser » pour recharger les flux en direct.",b:[{l:"Voir les annonces",act:"tab",a:"track"}]},
 {t:"Audio",x:"audio ecouter voix lecture fiche",h:"🎧 Dans <b>Réviser → Espace audio</b>, touche ▶ pour écouter une fiche. Installe la voix française si besoin.",b:[{l:"Espace audio",act:"go",a:"audio"}]},
 {t:"Quiz",x:"quiz test chronometre qcm entrainement score",h:"📝 Choisis la matière, le nombre de questions et le mode (entraînement ou chronométré) dans <b>Réviser → Quiz</b>.",b:[{l:"Lancer un quiz",act:"go",a:"quiz"}]},
 {t:"Compte",x:"compte code activation mot de passe deconnexion profil",h:"👤 Ton compte se gère dans <b>Plus → Mon compte</b>.",b:[{l:"Mon compte",act:"go",a:"compte"}]}
];
const TIPS={
 psy:"🧩 <b>Psychotechnique</b> : cherche d'abord la différence constante, puis le rapport, puis deux suites imbriquées. Teste carrés, cubes, premiers, Fibonacci. Ne reste pas bloqué : passe à la suivante.",
 droit:"⚖️ <b>Droit</b> : retiens la hiérarchie des normes, les trois pouvoirs, les juridictions suprêmes et les dates clés (OHADA 1993, UEMOA 1994). Fais des fiches définition + exemple.",
 eco:"📈 <b>Économie</b> : maîtrise PIB, inflation, balance commerciale, secteurs, UEMOA/BCEAO et critères de convergence. Illustre chaque notion par un exemple burkinabè.",
 math:"➗ <b>Mathématiques</b> : apprends les formules (aires, volumes, Pythagore, identités remarquables), pose toujours les unités et vérifie ton résultat par un ordre de grandeur.",
 hist:"🏛️ <b>Histoire</b> : retiens les grandes dates (1235 Kirina, 1884 Berlin, 1960 indépendance), les souverains (Soundiata, Kankou Moussa, Askia Mohamed, Samory) et les organisations (ONU, UA, CEDEAO, UEMOA, AES).",
 geo:"🗺️ <b>Géographie</b> : apprends les capitales par région, les fleuves, les climats et les chiffres clés du Burkina (17 régions, 47 provinces, 6 voisins).",
 fr:"✍️ <b>Français</b> : révise les accords du participe passé, les homophones (a/à, ces/ses…), les temps simples et le vocabulaire. Relis tes erreurs chaque semaine.",
 cg:"🌍 <b>Culture générale</b> : apprends les repères du Burkina (histoire 1960-2026, institutions, Charte de la Révolution, AES) et suis l'actualité via les annonces."
};
const contactBtns=()=>[{l:"✉️ Gmail du support",act:"open",a:"mailto:"+C.EMAIL},{l:"💬 WhatsApp",act:"open",a:"https://wa.me/"+C.WHATSAPP}];
const extAiBtns=q=>[{l:"💬 Demander à ChatGPT",act:"open",a:"https://chatgpt.com/?q="+encodeURIComponent(q)},{l:"✨ Demander à Gemini",act:"open",a:"https://gemini.google.com/app"}];
function local(m){
  const n=nz(m),q=tok(m);
  if(/\b(plus d info\w*|contact\w*|service client|conseiller|parler a|humain|whatsapp|gmail|mail|email|support|pas satisfait|aide supplementaire)\b/.test(n))
    return{h:"Pour plus d'informations, écris-nous : <b>"+esc(C.EMAIL)+"</b> ou WhatsApp <b>"+esc(C.WHATSAPP.replace(/^226/,""))+"</b>.",b:contactBtns()};
  if(/^(bonjour|bonsoir|salut|hello|coucou|bjr|slt)\b/.test(n))return{h:"Bonjour 👋 Pose-moi une question sur tes cours, les quiz, les repères du Burkina ou l'application."};
  if(/\b(merci|thanks)\b/.test(n))return{h:"Avec plaisir ! Bon courage pour ta préparation 💪"};
  if(/\b(qui es tu|tu es qui|ton nom|c est quoi ce robot)\b/.test(n))return{h:"Je suis l'assistant de PREP' CONCOURS BF. Je réponds avec le contenu de l'application (cours, fiches, questions, repères)."};
  if(/prochain concours|calendrier|date.*concours|quand.*concours/.test(n)){const x=A.nextC();return{h:x?`📅 Prochain concours enregistré : <b>${esc(x.nom)}</b>${x.debut?" — "+A.fmt(x.debut)+" → "+A.fmt(x.fin):""}. Vérifie toujours les communiqués officiels.`:"Aucun concours enregistré pour le moment. Consulte l'onglet Concours.",b:[{l:"Onglet Concours",act:"tab",a:"track"}]}}
  if(/(president|premier ministre)/.test(n)&&/(actuel|aujourd|maintenant|qui est le|qui est l)/.test(n)&&!/(premier president|ancien|haute volta|histoire|sankara|compaore|yameogo|lamizana|kabore|damiba|kafando)/.test(n)){const R=REPD(),p=R.presidents[R.presidents.length-1],pm=R.ministres[0];
    return{h:`Chef de l'État : <b>${esc(p.n)}</b>, Président du Faso. Chef du Gouvernement : <b>${esc(pm.nom)}</b> (${esc(pm.poste)}). Données au ${esc(R.maj)}.`,b:[{l:"Repères du Burkina",act:"go",a:"rep"}]}}
  for(const k of Object.keys(TIPS))if(/(methode|conseil|astuce|reviser|comment reussir|organiser|strategie)/.test(n)){
    const map={psy:/psycho/,droit:/droit/,eco:/econom/,fr:/francais|grammaire|conjug|vocab/,cg:/culture/,math:/math|calcul|geometr|algebre|arithm/,hist:/histoire|empire|royaume/,geo:/geograph/};
    if(map[k].test(n)){if(k!=="cg"&&A.locked(k))return{h:"Cette rubrique fait partie du Premium 🔒",b:[{l:"Voir le Premium",act:"go",a:"premium"}]};return{h:TIPS[k]}}}
  if(!q.length)return null;
  const L=docs(),N=L.length;
  if(!window.__DF||window.__DFN!==N){const m={};L.forEach(d=>new Set(tok(d.x)).forEach(w=>{m[w]=(m[w]||0)+1}));window.__DF=m;window.__DFN=N}
  const DF=window.__DF,idf=w=>Math.log(1+N/((DF[w]||0)+0.5)),tot=q.reduce((a,w)=>a+idf(w),0)||1;
  let best=null,bs=0,bf=0,bth=false,bth1=false;
  L.forEach(d=>{const set=tok(d.x),ts=new Set(tok(d.t));let s=0,raw=0;
    q.forEach(w=>{const i=idf(w);if(set.includes(w)){s+=i*(ts.has(w)?1.6:1);raw+=i}else if(w.length>=5&&set.some(z=>z.startsWith(w.slice(0,5)))){s+=i*0.5;raw+=i*0.5}});
    if(d.k==="q"||d.k==="rep")s*=1.1;
    if(s>bs){bs=s;best=d;bf=raw/tot;bth=q.some(w=>ts.has(w));bth1=q.length===1&&tok(d.t.slice(0,45)).includes(q[0])}});
  const need=1;bs=((q.length>1&&(bf>=0.6||(bf>=0.5&&bth)))||(q.length===1&&bf>=0.6&&bth1))?1:0;
  if(best&&bs>=need){
    if(best.m&&A.locked(best.m))return{h:"Cette réponse fait partie des contenus Premium 🔒 ("+esc(D.matieres.find(x=>x.id===best.m).nom)+").",b:[{l:"Voir le Premium",act:"go",a:"premium"}]};
    return{h:best.h,b:best.b}}
  return null}
let chat=null;
const chatLoad=()=>chat||(chat=ls.g("chat",[]));
function chatPush(r,h,b){chatLoad();chat.push({r,h,b:b||null});if(chat.length>40)chat.shift();ls.s("chat",chat);chatDraw()}
function chatDraw(){const e=$("#bchat");if(!e)return;
  e.innerHTML=chatLoad().map(x=>`<div class="bub ${x.r}">${x.h}${x.b?`<div class="bbt">${x.b.map(y=>`<button class="chip green" data-act="${y.act}" data-a="${esc(y.a)}">${esc(y.l)}</button>`).join(" ")}</div>`:""}</div>`).join("");
  e.scrollTop=e.scrollHeight}
async function botSend(){const inp=$("#bi");if(!inp)return;const m=(inp.value||"").trim().slice(0,600);if(!m)return;inp.value="";
  chatPush("u",esc(m));
  if(flag(m)){chatPush("b","🙏 "+esc(REFUSE),contactBtns());return}
  const loc=local(m),aiUrl=C.AI_URL||C.ACCOUNT_URL;   // l'IA utilise le même serveur Apps Script que les comptes si AI_URL est vide
  let rep=null,why=!aiUrl?"adresse du serveur non configurée (ACCOUNT_URL vide dans cette version)":!navigator.onLine?"pas de connexion internet":"";
  if(aiUrl&&navigator.onLine){
    chatLoad();chat.push({r:"b",h:"⏳ Je réfléchis…",b:null,tmp:1});chatDraw();
    try{const hist=chat.filter(x=>!x.tmp).slice(-7,-1).map(x=>({role:x.r==="u"?"user":"assistant",content:strip(x.h).slice(0,600)}));
      const a=acct(),c=new AbortController(),t=setTimeout(()=>c.abort(),30000);
      const r=await fetch(aiUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"ask",token:await ensureToken(),message:m,history:hist,did:(a&&a.did)||A.did(),context:loc?strip(loc.h).slice(0,900):""}),signal:c.signal});clearTimeout(t);
      let j=null;try{const raw=r.text?await r.text():JSON.stringify(await r.json());try{j=JSON.parse(raw)}catch(e2){const t=String(raw).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,100);why="le serveur n'a pas renvoyé de JSON (HTTP "+(r.status||"?")+") : « "+(t||"réponse vide")+" » → déploiement non public, mauvaise adresse ou ancien script"}}catch(e){why="réponse illisible du serveur ("+String(e&&e.message||e).slice(0,60)+")"}
      if(j&&j.reply)rep={h:esc(String(j.reply).slice(0,3500)).replace(/\n/g,"<br>")+'<div style="font-size:11px;opacity:.65;margin-top:6px">🤖 Réponse générée par IA : vérifie les informations importantes.</div>'};
      else if(j&&j.error==="limit")rep={ext:1,h:"Tu as atteint la limite de questions IA pour le moment. Réessaie dans quelques heures ou contacte le support :",b:contactBtns()};
      else if(j&&!j.reply&&!why)why="serveur : "+(j.error||"inconnu")+(j.detail?" – "+String(j.detail).slice(0,140):"");
      if(j&&j.error==="auth"&&a&&a.act)sessionExpired();
      if(!rep&&j&&j.error==="auth"&&!loc)rep={h:"Ta session a expiré ou ton compte n'est pas activé : reconnecte-toi avec un nouveau code, ou contacte le support :",b:contactBtns()};
    }catch(e){rep=null;why="serveur injoignable ("+(e&&e.name==="AbortError"?"délai dépassé":"adresse incorrecte ou réseau")+")"}
    const k=chat.findIndex(x=>x.tmp);if(k>=0)chat.splice(k,1)}
  const note=why?'<div style="font-size:11px;opacity:.65;margin-top:6px">⚙️ IA indisponible : '+esc(why)+"</div>":"";
  if(!rep&&loc)rep={h:loc.h+note,b:loc.b};
  if(!rep)rep={h:(aiUrl&&navigator.onLine?"Je n'ai pas pu obtenir de réponse pour le moment. Réessaie dans un instant, ou contacte le support :":"Je suis hors connexion : je ne peux répondre qu'avec les contenus de l'application. Connecte-toi à internet pour les questions générales, ou contacte le support :")+note,b:contactBtns()};
  if((why||rep.ext)&&!(rep.b||[]).some(x=>/chatgpt/.test(x.a)))rep.b=(rep.b||[]).concat(extAiBtns(m));
  chatPush("b",rep.h,rep.b)}

/* ---------- écrans ---------- */
function screens(S,T){
  const R=()=>REPD();
  const old={home:S.home,learn:S.learn,more:S.more,about:S.about};
  const repBtn=`<button class="mod" data-act="go" data-a="rep"><span class="ic">🇧🇫</span><span><b>Repères du Burkina Faso</b><small>Histoire 1960-2026, institutions, Charte de la Révolution, AES, gouvernement</small></span></button>`;
  const pdfBtn=`<button class="mod" data-act="go" data-a="pdf"><span class="ic">📕</span><span><b>Bibliothèque PDF</b><small>Annales, cours et documents à lire dans l'application</small></span></button>`;
  const exBtn=`<button class="mod" data-act="go" data-a="exams"><span class="ic">📝</span><span><b>Examens</b><small>Compose une épreuve et envoie ta copie au jury</small></span></button>`;
  const botBtn=`<button class="mod" data-act="go" data-a="bot"><span class="ic">🤖</span><span><b>Assistant PREP'</b><small>Pose tes questions sur les cours et l'application</small></span></button>`;
  S.home=()=>old.home()+`<h3 class="sec">À découvrir</h3>`+repBtn+pdfBtn+exBtn+botBtn;
  S.learn=()=>repBtn+pdfBtn+exBtn+botBtn+old.learn();
  S.more=()=>[...(C.ALL_FREE?[]:[["premium","⭐","Premium"]]),["pdf","📕","Bibliothèque PDF"],["exams","📝","Examens"],["bot","🤖","Assistant PREP'"],["compte","👤","Mon compte"],["addq","➕","Ajouter des questions"],["dash","📊","Tableau de bord de professionnalisation"],["faq","❓","Centre d'aide (FAQ)"],["contact","📞","Contact direct"],["sugg","💡","Suggestions"],["about","ℹ️","À propos"]]
    .map(x=>`<button class="mod" data-act="go" data-a="${x[0]}"><span class="ic">${x[1]}</span><b>${x[2]}</b></button>`).join("");
  S.about=()=>`<div class="card"><h3 style="margin-top:0">PREP' CONCOURS BF</h3><p>Application de préparation aux concours au Burkina Faso. Version 4.0.</p><small>Repères mis à jour le ${esc(R().maj)}.</small></div>`;

  /* Repères */
  T.pdf="Bibliothèque PDF";
  const pdfAll=()=>(window.PDFS||[]).map((x,i)=>Object.assign({i},x));
  const pdfList=(q,cat)=>{q=(q||"").toLowerCase();
    const l=pdfAll().filter(x=>(!cat||x.cat===cat)&&(!q||((x.t||"")+" "+(x.cat||"")+" "+(x.d||"")).toLowerCase().includes(q)));
    return l.length?l.map(x=>`<button class="mod" data-act="pdf" data-a="${x.i}"><span class="ic">📕</span><span><b>${esc(x.t||"Document")}</b><small>${esc([x.cat,x.d].filter(Boolean).join(" · "))}${x.n?" · 📖 lecture dans l'application":" · 🌐 en ligne"}</small></span></button>`).join(""):`<div class="note">Aucun document trouvé.</div>`};
  S.pdf=()=>{const all=pdfAll();if(!all.length)return`<div class="note">📕 La bibliothèque est vide pour le moment. Les PDF (annales, cours, textes officiels) seront ajoutés ici.</div>`;
    const cats=[...new Set(all.map(x=>x.cat).filter(Boolean))];
    return`<input id="pq" type="search" placeholder="🔎 Rechercher un document…" autocomplete="off">`+(cats.length?`<div class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0"><button class="chip green" data-act="pdfcat" data-a="">Tous</button>${cats.map(c=>`<button class="chip grey" data-act="pdfcat" data-a="${esc(c)}">${esc(c)}</button>`).join("")}</div>`:"")+`<div id="pl">${pdfList("","")}</div>`};
  let pdfCat="";
  document.addEventListener("input",e=>{if(e.target.id==="pq"){const l=document.getElementById("pl");if(l)l.innerHTML=pdfList(e.target.value,pdfCat)}});
  EXT_PDF.open=i=>{const x=(window.PDFS||[])[+i];if(!x)return;
    if(!prem()&&!C.ALL_FREE){A.toast("Bibliothèque PDF réservée aux abonnés");return A.go("premium")}
    if(x.n&&x.f){A.go("pdfview",String(i));return}
    if(x.u){const B=window.Android;if(B&&B.open)B.open(x.u);else window.open(x.u,"_blank")}};
  T.pdfview="Lecture";
  S.pdfview=i=>{const x=(window.PDFS||[])[+i];if(!x||!x.n)return"";const d=x.f.replace(/\.pdf$/,""),ac=acct()||{},w=esc(shown({...ac,t:ac.type})||"PREP CONCOURS");
    let h=`<div class="pvwm">${Array(24).fill("<span>"+w+"</span>").join("")}</div><div class="note">📖 ${esc(x.t)} — lecture seule dans l'application (téléchargement impossible).</div><div class="pv">`;
    for(let p=1;p<=x.n;p++)h+=`<img src="pdfimg/${d}/${String(p).padStart(3,"0")}.webp" loading="lazy" draggable="false" alt="Page ${p}" oncontextmenu="return false">`;
    return h+"</div>"};
  let planSel="month";
  S.premium=()=>{if(C.ALL_FREE)return`<div class="card stat"><b>🎉</b><h3>Tout est gratuit</h3></div>`;
    const st=subState(),P=C.PLANS,ok=["admin","life","month"].includes(st.k),sel=planSel;
    const state=ok?`<div class="card stat"><b>⭐</b><h3>${st.k==="life"?"Abonnement à vie actif":st.k==="admin"?"Accès administrateur":"Abonnement actif jusqu'au "+fdate(st.until)}</h3><p>Toutes les rubriques sont débloquées.</p></div>`:
      st.k==="trial"?`<div class="card" style="background:#e6f6ec">🎁 <b>Essai gratuit</b> : il te reste ${Math.max(1,Math.ceil((st.until-subNow())/36e5))} h. Abonne-toi pour garder l'accès à toutes les rubriques.</div>`:
      `<div class="card" style="background:#fdecea">🔒 <b>Essai gratuit terminé.</b> Abonne-toi pour retrouver toutes les rubriques.</div>`;
    return state+`<div class="hero" style="background:linear-gradient(135deg,#b8860b,#e0a800)"><h2>⭐ Abonnement</h2><p>Toutes les matières, tests chronométrés, audio, PDF et tableau de bord.</p></div>
    <div class="card"><b>Étape 1 — Choisis ton abonnement</b>
     <button class="opt ${sel==="month"?"sel":""}" data-act="plan" data-a="month">📅 Mensuel — ${P.month.prix} F (30 jours)</button>
     <button class="opt ${sel==="life"?"sel":""}" data-act="plan" data-a="life">♾️ À vie — ${P.life.prix} F (paiement unique)</button></div>
    <div class="card"><b>Étape 2 — Payer</b><p style="margin:6px 0">Compose ce code, puis saisis le montant <b>${P[sel].prix}</b> :<br><b>${esc(C.USSD)}</b></p>
     <button class="btn" data-act="open" data-a="tel:${C.USSD.replace(/#/g,"%23")}">📲 Payer maintenant</button></div>
    <div class="card"><b>Étape 3 — Confirmer</b><p style="margin:6px 0">Envoie la référence de la transaction : ton abonnement est activé dès vérification.</p>
     <button class="btn alt" data-act="proof">💬 J'ai payé : envoyer la preuve</button>
     <button class="btn" data-act="subcheck">🔄 Vérifier mon abonnement</button></div>`};
  EXT_PDF.cat=c=>{pdfCat=c;const q=document.getElementById("pq"),l=document.getElementById("pl");if(l)l.innerHTML=pdfList(q?q.value:"",c);
    document.querySelectorAll('[data-act="pdfcat"]').forEach(b=>{b.classList.toggle("green",b.dataset.a===c);b.classList.toggle("grey",b.dataset.a!==c)})};
  S.rep=()=>`<div class="note">Contenu pédagogique mis à jour le ${esc(R().maj)}. Pour tout texte officiel, réfère-toi aux publications de la Présidence du Faso et au Journal officiel.</div>`+
   [["rep_h","📜","Histoire politique 1960-2026","Présidents, mandats, gouvernements, biographies, bibliographies"],["rep_i","🏛️","Institutions nationales & dates de création","SOSUCO, CITEC, SONABEL, CNSS, CARFO…"],["rep_t|charte","📕","Charte de la Révolution (ex-Charte de la Transition, ALT → ALP)","Résumé à jour au 27 mars 2026"],["rep_t|aes","🌍","Confédération AES","Traité, organes, calendrier"],["rep_g","👥","Gouvernement & ministres","Composition du 12 janvier 2026, parcours"]]
   .map(x=>`<button class="mod" data-act="go" data-a="${x[0]}"><span class="ic">${x[1]}</span><span><b>${x[2]}</b><small>${x[3]}</small></span></button>`).join("");
  S.rep_h=()=>`<div class="note">Du 5 août 1960 à aujourd'hui : ${R().presidents.length} chefs d'État ou de transition.</div>`+R().presidents.map((p,i)=>`<button class="mod" data-act="go" data-a="rep_p|${i}"><span class="ic">${i+1}</span><span><b>${esc(p.n)}</b><small>${esc(p.mandat)}</small></span></button>`).join("");
  S.rep_p=i=>{const p=R().presidents[+i];if(!p)return"";
    return`<div class="card"><h3 style="margin-top:0">${esc(p.n)}</h3>${p.per?`<small>${esc(p.per)}</small>`:""}<p><b>Mandat :</b> ${esc(p.mandat)}<br><b>Régime :</b> ${esc(p.regime)}</p>
    <p><b>Gouvernement :</b> ${esc(p.gvt)}</p><p><b>Biographie :</b> ${esc(p.bio)}</p>
    <p><b>Bibliographie :</b></p><ul>${p.bib.map(b=>`<li>${esc(b)}</li>`).join("")}</ul></div>
    <details><summary>Références générales sur l'histoire politique</summary><ul>${R().refs_generales.map(b=>`<li>${esc(b)}</li>`).join("")}</ul></details>`};
  S.rep_i=()=>`<div class="note">Dates vérifiées à partir de sources officielles et de presse (présidence, sites des sociétés, textes de création).</div>`+R().institutions.map(x=>`<div class="card"><div class="row"><b>${esc(x.n)}</b><span class="chip green">${esc(x.d)}</span></div><p style="margin:8px 0 0"><small>${esc(x.t)}</small></p></div>`).join("");
  S.rep_t=id=>{const x=R().textes.find(t=>t.id===id);return x?`<div class="card"><h3 style="margin-top:0">${esc(x.t)}</h3>${x.h}</div>`:""};
  S.rep_g=()=>`<div class="note">${esc(R().gvt_info)}</div>`+R().ministres.map((m,i)=>`<button class="mod" data-act="go" data-a="rep_m|${i}"><span class="ic">${i?"👤":"⭐"}</span><span><b>${esc(m.nom)}</b><small>${esc(m.poste)}</small></span></button>`).join("");
  S.rep_m=i=>{const m=R().ministres[+i];if(!m)return"";
    return`<div class="card"><h3 style="margin-top:0">${esc(m.nom)}</h3><p><b>${esc(m.poste)}</b></p><p><b>Biographie :</b> ${esc(m.bio)}</p><p><b>Bibliographie :</b> ${esc(m.bib)}</p></div><div class="note">Seules les informations publiques vérifiées sont indiquées ; les champs « — » seront complétés via la source de configuration en ligne.</div>`};
  Object.assign(T,{rep:"Repères du Burkina Faso",rep_h:"Histoire politique 1960-2026",rep_p:"Chef d'État",rep_i:"Institutions nationales",rep_t:"Texte fondamental",rep_g:"Gouvernement",rep_m:"Ministre",bot:"Assistant PREP'",compte:"Mon compte",signup:"Créer mon compte",activate:"Activer mon compte"});

  /* Assistant */
  S.bot=()=>{chatLoad();if(!chat.length){chat.push({r:"b",h:"Bonjour 👋 Je suis l'assistant PREP'. Je réponds avec les cours, fiches, questions et repères de l'application. Pour plus d'informations, je te renvoie vers le support.",b:contactBtns()});}
    setTimeout(()=>{chatDraw();const i=$("#bi");if(i)i.focus()},50);
    return`<div id="bchat" class="chat"></div><div class="bbar"><input id="bi" placeholder="Écris ta question…" maxlength="400" autocomplete="off"><button class="btn" style="width:auto;margin:6px 0 6px 8px;padding:12px 16px" data-act="botsend">Envoyer</button></div>
    <div class="row" style="gap:6px"><button class="chip grey" data-act="botclear">Effacer</button><span><button class="chip green" data-act="open" data-a="mailto:${esc(C.EMAIL)}">Gmail</button> <button class="chip green" data-act="open" data-a="https://wa.me/${esc(C.WHATSAPP)}">WhatsApp</button></span></div>`};

  /* Compte */
  S.login=()=>`<div class="hero"><h2>Connexion 🔑</h2><p>Retrouve ton compte PREP' CONCOURS BF, même après une réinstallation.</p></div>
   <div class="card"><b>👤 Mes informations</b><input id="sn" placeholder="Nom *" autocomplete="family-name"><input id="sp" placeholder="Prénom(s) *" autocomplete="given-name">
   <input id="sc" placeholder="Numéro (ex : 70 00 00 00) ou Gmail *" autocomplete="username" autocapitalize="none">
   <small>Un code te sera envoyé sur ce numéro ou ce Gmail. Ta progression sera retrouvée.</small>
   <button class="btn" data-act="signup">Se connecter</button></div>
   <button class="btn alt" data-act="gomode" data-a="signup">Pas encore de compte ? Créer un compte</button>`;
  S.signup=()=>`<div class="hero"><h2>Bienvenue 👋</h2><p>Crée ton compte PREP' CONCOURS BF : 48 h d'essai gratuit, puis abonnement.</p></div>
   <div class="card"><b>👤 Mes informations</b><input id="sn" placeholder="Nom *" autocomplete="family-name"><input id="sp" placeholder="Prénom(s) *" autocomplete="given-name">
   <input id="sc" placeholder="Numéro (ex : 70 00 00 00) ou Gmail *" autocomplete="username" autocapitalize="none">
   <small>Tu recevras un code d'activation sur le numéro ou le Gmail renseigné.</small>
   <button class="btn" data-act="signup">Créer mon compte</button></div>
   <button class="btn alt" data-act="gomode" data-a="login">J'ai déjà un compte : me connecter</button>`;
  S.activate=()=>{const a=acct();if(!a)return S.signup();
    const email=a.type==="email",srv=a.mode==="server"&&a.sent!=="failed";
    const how=email&&srv?`Un code d'activation à 6 chiffres vient d'être envoyé à <b>${esc(a.contact)}</b>. Pense à vérifier les courriers indésirables.`
      :`Ton code d'activation à 6 chiffres t'est envoyé sur <b>${esc(shown({...a,t:a.type}))}</b> par le service client. Envoie ta demande avec le bouton ci-dessous.`;
    return`<div class="card"><b>🔐 Activation</b><p style="margin:6px 0">${how}</p>
    <input id="ac" placeholder="Code d'activation" maxlength="20" autocapitalize="characters" autocomplete="one-time-code">
    <button class="btn" data-act="actv">Activer mon compte</button></div>
    ${email&&srv?`<button class="btn alt" data-act="resend">📨 Renvoyer le code</button>`:`<button class="btn" style="background:#25D366" data-act="open" data-a="https://wa.me/${esc(C.WHATSAPP)}?text=${encodeURIComponent(waMsg(a))}">💬 Demander mon code par WhatsApp</button>
    <button class="btn alt" data-act="open" data-a="mailto:${esc(adminTo())}?subject=${encodeURIComponent("Activation du compte PREP' CONCOURS BF")}&body=${encodeURIComponent(waMsg(a))}">✉️ Demander mon code par Gmail</button>`}
    ${!srv&&C.ACCOUNT_URL?`<button class="btn alt" data-act="resend">📨 Réessayer l'envoi du code par le serveur</button>`:""}
    <button class="btn alt" data-act="editacct">✏️ Modifier mes informations</button>`};
  S.compte=()=>{const a=acct();if(!a)return`<div class="card">Aucun compte sur cet appareil.</div>`;
    return`<div class="card stat"><b>👤</b><h3>${esc(a.prenom)} ${esc(a.nom)}</h3><small>${esc(shown({...a,t:a.type}))}</small><br><span class="chip ${a.act?"green":"grey"}">${a.act?"Compte activé":"Non activé"}</span></div>
    ${subCard()}
    <button class="btn alt" data-act="logout">${outConfirm?"⚠️ Confirmer la déconnexion":"Se déconnecter"}</button>
    <button class="btn alt" data-act="cloudsync">☁️ Synchroniser ma progression</button>
    <div class="note">Ta progression (résultats, objectif, questions ajoutées) est sauvegardée sur ton compte et retrouvée sur tout nouvel appareil après activation. La déconnexion l'efface de cet appareil : un nouveau code sera nécessaire.</div>
    <button class="btn" style="background:#C62828;margin-top:14px" data-act="delacct">${delConfirm?"⚠️ Confirmer : supprimer définitivement":"🗑️ Supprimer mon compte et mes données"}</button>
    <div class="note">Supprime ton compte et toutes tes données (résultats, favoris, questions ajoutées) de cet appareil et du serveur d'activation. Action irréversible.</div>`};

  /* Concours / Actualiser / Annonces */
  S.track=()=>{const on=ls.g("notif",true),st=ls.g("fstat",{src:{}}),cv=ls.g("cfgver",null),items=ls.g("fitems",[]);
    let re;try{re=new RegExp(C.FEED_KEYWORDS||"concours","i")}catch(e){re=/concours/i}
    const list=(afilt?items.filter(x=>x.off||re.test(nz(x.titre+" "+x.texte))||re.test(x.titre+" "+x.texte)):items).slice(0,25);
    const srcRows=Object.entries(st.src||{}).map(([k,v])=>`<div class="row"><small>${v.ok?"✅":"⚠️"} ${esc(k)}</small><small>${v.ok?v.n+" annonce(s)":"indisponible"}</small></div>`).join("")||"<small>Aucun flux configuré.</small>";
    return`<button class="btn alt" data-act="sync">🔄 Actualiser</button>
    <div class="card" style="background:#eef8f1"><b>🧾 Concours directs de la Fonction publique</b><p style="margin:6px 0"><small>L'inscription se fait uniquement sur le site officiel e-concours.</small></p>
     <button class="btn" data-act="open" data-a="${esc(C.ECONCOURS)}">S'inscrire sur econcours.gov.bf</button></div>
    <button class="btn alt" data-act="go" data-a="insclist">📋 Mes inscriptions (${ls.g("insc",[]).length})</button>
    <div class="card row"><span>🔔 Notifications</span><button class="chip ${on?"green":"grey"}" data-act="tgnotif">${on?"Activées":"Désactivées"}</button></div>
    <details><summary>⚙️ Sources en ligne</summary>
     <div class="row"><small>Configuration en ligne</small><small>${C.CONFIG_URL?(st.cfg===false?"⚠️ indisponible":"✅ active"+(cv&&cv.v?" (v"+esc(cv.v)+")":"")):"non configurée"}</small></div>
     ${srcRows}
     <small>Dernière mise à jour : ${st.t?new Date(st.t).toLocaleString("fr-FR"):"jamais"}</small>
     <p style="margin:8px 0 0"><small>Les liens et flux se règlent dans <b>data.js</b> (CONFIG) ou à distance via CONFIG_URL.</small></p></details>
    <h3 class="sec">Calendrier des concours</h3>`+
    A.getC().map((c,i)=>{const s=A.status(c);return`<div class="card"><div class="row"><b>${esc(c.nom)}</b><span class="chip ${s[1]}">${s[0]}</span></div>
     <p style="margin:8px 0 0">${c.debut?`📅 ${A.fmt(c.debut)} → ${A.fmt(c.fin)}<br>`:""}<small>${esc(c.lieu||"")}</small></p>
     ${s[0]==="En cours"&&c.online!==false?`<button class="btn" data-act="go" data-a="inscr|${i}">📝 S'inscrire en ligne</button>`:""}
     ${c.lien?`<button class="btn alt" data-act="open" data-a="${esc(c.lien)}">🌐 Site officiel</button>`:""}</div>`}).join("")+
    `<div class="note">Vérifie toujours les dates sur les communiqués officiels.</div>
    <h3 class="sec">Sites officiels</h3>`+(C.SITES||[]).map(x=>`<button class="mod" data-act="open" data-a="${esc(x.u)}"><span class="ic">🌐</span><b>${esc(x.n)}</b></button>`).join("")+
    `<h3 class="sec">Annonces en direct</h3>
    <div class="row" style="margin-bottom:8px"><button class="chip ${afilt?"green":"grey"}" data-act="afilt" data-a="1">Concours &amp; recrutement</button><button class="chip ${afilt?"grey":"green"}" data-act="afilt" data-a="0">Toutes</button></div>`+
    (list.length?list.map(n=>`<div class="card"><small>${esc(n.src||"")}${n.date?" · "+A.fmt(n.date):""}</small><br><b>${esc(n.titre)}</b>${n.texte?`<p style="margin:4px 0">${esc(n.texte)}</p>`:""}${n.lien?`<button class="chip blue" data-act="open" data-a="${esc(n.lien)}">Lire</button>`:""}</div>`).join(""):
     A.getN().map(n=>`<div class="card"><b>${esc(n.titre)}</b><p style="margin:4px 0">${esc(n.texte)}</p><small>${esc(n.date||"")}</small></div>`).join("")+`<div class="note">Aucune annonce en cache : touche « Actualiser » avec internet.</div>`)};

  /* Admin : codes d'activation + réglages en ligne */
  S.admin=()=>`<div class="card"><b>🔐 Accès administrateur</b><small style="display:block">Jeton administrateur du serveur (ADMIN_TOKEN). Il n'est jamais enregistré dans l'application.</small><input id="apin" type="password" placeholder="Jeton administrateur" autocomplete="off" autocapitalize="none"></div>
   <div class="card"><b>🔑 Codes d'activation en attente</b><small style="display:block">Comptes créés avec un numéro de téléphone : envoie-leur le code par WhatsApp ou SMS.</small><button class="btn" data-act="pending">Afficher les codes en attente</button><div id="agout"></div></div>
   <div class="card"><b>🎟️ Codes d'activation (usage unique)</b><small style="display:block">Suivi des codes donnés : libres ou utilisés, et par qui.</small><button class="btn" data-act="codes">Voir l'état des codes</button><div id="cout"></div></div>
   <div class="card"><b>⭐ Abonnement client</b><small style="display:block">Après avoir vérifié le paiement, active l'abonnement du client (numéro ou Gmail de son compte).</small><input id="gc" placeholder="Numéro ou Gmail du client" autocapitalize="none"><select id="gp"><option value="month">Mensuel (+30 jours)</option><option value="life">À vie</option><option value="revoke">Retirer l'abonnement</option></select><button class="btn" data-act="grant">Valider</button><div id="gout"></div></div>
   <div class="card"><b>📊 Serveur</b><button class="btn" data-act="stats">Statistiques</button><button class="btn alt" data-act="pingsrv">Tester la connexion au serveur</button><div id="sout"></div></div>
   <div class="card"><b>⚙️ Liens en ligne (remplacent data.js)</b>${[["CONFIG_URL","Source de configuration (JSON)"],["FEED_URL","Annonces officielles (JSON)"],["ACCOUNT_URL","Serveur de comptes et d'assistant IA"],["AI_URL","Serveur de l'assistant IA (si différent)"],["REGISTER_URL","Inscriptions aux concours"]].map(x=>`<small>${x[1]}</small><input id="o_${x[0]}" value="${esc((ls.g("ovr",{})[x[0]])||"")}" placeholder="https://… (vide = valeur de data.js)" autocapitalize="none">`).join("")}
   <button class="btn" data-act="saveovr">Enregistrer</button></div>`;
}

/* ---------- actions ---------- */

/* ---------- abonnement : essai gratuit, mensuel, à vie (état vérifié par le serveur) ---------- */
const subGet=()=>ls.g("sub",null);
const subNow=()=>{const s=subGet()||{};return Math.max(Date.now()+(s.off||0),s.seen||0)};
function subState(){
  const a=acct();if(!a||!a.act)return{k:"none"};
  if(a.acode&&adminLocal(a.acode))return{k:"admin"};
  const s=subGet(),t=subNow();
  if(s&&s.plan==="life")return{k:"life"};
  if(s&&s.plan==="month"&&s.exp>t)return{k:"month",until:s.exp};
  if(s&&s.srv){if(s.trialEnd&&s.trialEnd>t)return{k:"trial",until:s.trialEnd};return{k:"expired"}}
  if(!a.actAt){a.actAt=Date.now();ls.s("acct",a)}   // serveur pas encore joint : essai local provisoire
  const e=a.actAt+(C.TRIAL_HOURS||48)*36e5;return e>Date.now()?{k:"trial",until:e}:{k:"expired"}}
const prem=()=>["admin","life","month","trial"].includes(subState().k);
let subBusy=false;
async function subSync(manual){
  const a=acct();if(!a||!a.act||!C.ACCOUNT_URL||subBusy)return false;
  if(!navigator.onLine){if(manual)toast("Hors ligne : vérification impossible");return false}
  subBusy=true;const before=subState().k;
  try{const r=await post({action:"substatus",contact:a.contact,did:a.did});
    if(r&&r.ok&&r.now){ls.s("sub",{srv:true,off:r.now-Date.now(),seen:Math.max(r.now,(subGet()||{}).seen||0),plan:r.plan||"",exp:r.expires||0,trialEnd:r.trial_end||0});
      const k=subState().k;if(k!==before&&A.cur()!=="quizrun")A.draw();
      if(manual)toast(k==="month"||k==="life"?"Abonnement actif ✔":k==="trial"?"Essai gratuit en cours":"Paiement pas encore enregistré : réessaie dans quelques minutes");return true}
    if(manual)toast("Vérification impossible pour le moment")}
  catch(e){if(manual)toast(errMsg(e))}finally{subBusy=false}return false}
const fdate=t=>new Date(t).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
function banner(){const st=subState(),gp=`<button class="mod" style="background:#fff8e1;border-left-color:var(--y)" data-act="go" data-a="premium"><span class="ic">⭐</span><span><b>S'abonner — 1500 F/mois ou 3000 F à vie</b><small>Toutes les matières, tests chronométrés, audio, PDF…</small></span></button>`;
  if(C.ALL_FREE)return`<div class="card" style="background:#e6f6ec">🎉 <b>Tout est gratuit</b></div>`;
  if(st.k==="admin")return`<div class="card" style="background:#fff8e1">🛡️ <b>Accès administrateur</b></div>`;
  if(st.k==="life")return`<div class="card" style="background:#fff8e1">⭐ <b>Abonnement à vie actif</b></div>`;
  if(st.k==="month")return`<div class="card" style="background:#fff8e1">⭐ <b>Abonnement actif</b> jusqu'au ${fdate(st.until)}</div>`;
  if(st.k==="trial"){const h=Math.max(1,Math.ceil((st.until-subNow())/36e5));return`<div class="card" style="background:#e6f6ec">🎁 <b>Essai gratuit</b> : il te reste ${h} h</div>`+gp}
  return gp}
function subCard(){const st=subState();const t={admin:"🛡️ Administrateur",life:"⭐ Abonnement à vie",month:"⭐ Abonné jusqu'au "+(st.until?fdate(st.until):""),trial:"🎁 Essai gratuit en cours",expired:"🔒 Essai terminé : abonne-toi",none:""}[st.k]||"";
  return t?`<div class="card"><b>${t}</b><button class="btn alt" data-act="go" data-a="premium">Gérer mon abonnement</button></div>`:""}
const EXT_PDF={};
async function act(a0,a,t){
  switch(a0){
  case"afilt":afilt=a==="1";A.draw();return;
  case"plan":planSel=a==="life"?"life":"month";A.draw();return;
  case"subcheck":await subSync(true);A.draw();return;
  case"proof":{const ac=acct()||{},P=C.PLANS[planSel],u=`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("Bonjour, j'ai payé "+P.prix+" F pour l'abonnement "+P.nom+" PREP' CONCOURS BF.\nMon compte : "+shown({...ac,t:ac.type})+"\nRéférence de la transaction : ")}`,B=window.Android;if(B&&B.open)B.open(u);else window.open(u,"_blank");return}
  case"grant":{const c=normContact(($("#gc").value||"").trim()),tok=(($("#apin")||{}).value||"").trim();
    if(!c)return toast("Entre un numéro à 8 chiffres ou une adresse e-mail valide");if(!tok)return toast(ERR.notok);if(!C.ACCOUNT_URL)return toast(ERR.nourl);
    try{const r=await fetch(admBase()+"/admin/subs",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({contact:c.v,plan:$("#gp").value})});
      if(r.status===401)return toast(ERR.unauth);const j=await r.json();
      $("#gout").innerHTML=j&&j.ok?`<div class="note">✔ ${esc(c.v)} : ${j.plan==="life"?"à vie":j.plan==="month"?"mensuel jusqu'au "+fdate(j.expires):"aucun abonnement"}</div>`:`<div class="note">Échec : vérifie le jeton et le contact</div>`}catch(err){toast(ERR.net)}return}
  case"botsend":botSend();return;
  case"pdf":EXT_PDF.open(a);return;
  case"pdfcat":EXT_PDF.cat(a);return;
  case"gomode":gateMode=a==="signup"?"signup":"login";A.draw();return;
  case"botclear":chat=[];ls.s("chat",[]);A.draw();return;
  case"signup":{const g=id=>($("#"+id).value||"").trim();
    const nom=g("sn"),prenom=g("sp"),nai="2000-01-01",c=normContact(g("sc"));
    if(!nom||!prenom)return toast("Remplis ton nom et ton prénom");
    if(!c)return toast("Entre un numéro à 8 chiffres ou une adresse e-mail valide");
    const a2={nom:nom.toUpperCase(),prenom,naissance:nai,contact:c.v,type:c.t,date:Date.now(),act:false,pending:true,mode:C.ACCOUNT_URL?"server":"manual",did:A.did()};
    let note="";
    if(C.ACCOUNT_URL){t.disabled=true;
      try{const r=await post({action:"signup",contact:a2.contact,type:a2.type,nom:a2.nom,prenom:a2.prenom,naissance:a2.naissance,did:a2.did});
        if(!r||!r.ok)throw fail((r&&r.error)||"srv");a2.sent=r.sent||""}
      catch(e){a2.mode="manual";a2.sent="failed";note=errMsg(e)}   // le serveur ne bloque jamais la création du compte
      t.disabled=false}
    if(a2.sent==="failed"&&a2.mode==="server")a2.mode="manual";
    ls.s("acct",a2);A.draw();
    toast(note?"Compte créé sur ce téléphone. "+note+". Demande ton code à l'administrateur.":(a2.sent==="failed"?"Compte créé, mais le code n'a pas pu être envoyé par e-mail : demande-le à l'administrateur.":(a2.mode==="server"&&a2.type==="email"?"Code envoyé ✔":"Compte créé : demande ton code d'activation")));return}
  case"resend":{const a2=acct();if(!a2||!C.ACCOUNT_URL)return;
    try{let r;
      if(a2.mode==="server"&&a2.sent!=="failed")r=await post({action:"resend",contact:a2.contact,did:a2.did});
      else{r=await post({action:"signup",contact:a2.contact,type:a2.type,nom:a2.nom,prenom:a2.prenom,naissance:a2.naissance,did:a2.did});
        if(r&&r.ok&&r.sent!=="failed"){a2.mode="server";a2.sent="";ls.s("acct",a2);A.draw()}else if(r&&r.ok)r={ok:false,error:"mail"}}
      toast(r&&r.ok?"Code renvoyé ✔":ERR[r&&r.error]||"Renvoi impossible pour le moment")}catch(e){toast(errMsg(e))}return}
  case"editacct":ls.s("acct",null);A.draw();return;
  case"actv":{const a2=acct();if(!a2)return;const lk=ls.g("alock",{n:0,t:0});
    if(Date.now()<lk.t)return toast("Trop d'essais. Réessaie dans quelques minutes.");
    const code=A.cleanCode($("#ac").value);if(code.length<6)return toast("Entre ton code d'activation");
    const master=adminLocal(code),single=!master&&activLocal(code);   // codes reconnus sur le téléphone (fonctionnent sans serveur)
    let r=null,err=null;
    if(C.ACCOUNT_URL){try{r=await post({action:"verify",contact:a2.contact,code,did:a2.did,type:a2.type,nom:a2.nom,prenom:a2.prenom,naissance:a2.naissance})}catch(e){err=e}}
    if(r&&r.error==="used")return toast("Ce code d'activation a déjà été utilisé par une autre personne. Demande un autre code à l'administrateur.");
    const local=master||(single&&(!C.ACCOUNT_URL||!!err||(r&&!r.ok&&!["rate","locked","expired"].includes(r.error))));   // serveur injoignable ou sans cette liste : on accepte sur le téléphone
    if((r&&r.ok&&r.token)||local){a2.act=true;a2.pending=false;a2.actAt=a2.actAt||Date.now();if(r&&r.token)a2.token=r.token;if(master||single)a2.acode=code;
      ls.s("acct",a2);ls.s("alock",{n:0,t:0});toast("Compte activé ✔");A.reset();cloud(false);subSync(false);return}
    if(err)return toast(errMsg(err));
    if(r&&(r.error==="locked"||r.error==="expired"||r.error==="rate"))return toast(ERR[r.error]);
    lk.n++;if(lk.n>=5){lk.t=Date.now()+300000;lk.n=0}ls.s("alock",lk);toast("Code incorrect");return}
  case"logout":if(!outConfirm){outConfirm=true;A.draw();setTimeout(()=>{outConfirm=false},4000);return}
    outConfirm=false;const a3=acct();
    if(a3&&a3.token&&C.ACCOUNT_URL){const saved=await cloud(false);try{await post({action:"logout",token:a3.token})}catch(e){}
      if(saved)["hist","cq","cqAt","target","targetAt"].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}   // progression gardée sur le compte, effacée de l'appareil
    ls.s("acct",null);A.reset();return;
  case"delacct":{if(!delConfirm){delConfirm=true;A.draw();setTimeout(()=>{delConfirm=false},5000);return}
    delConfirm=false;const a2=acct();let srv="";
    if(a2&&C.ACCOUNT_URL){try{const r=await post({action:"delete",contact:a2.contact,did:a2.did,token:a2.token||""});srv=r&&r.ok?"":" (suppression serveur non confirmée : écris au support)"}catch(e){srv=" (hors connexion : écris au support pour effacer les données du serveur)"}}
    try{localStorage.clear()}catch(e){}
    A.reset();toast("Compte supprimé"+srv);return}
  case"cloudsync":await cloud(true);return;
  case"activate":{const v=A.cleanCode(($("#pc").value||""));if(!v)return toast("Entre ton code Premium");
    if(!C.ACCOUNT_URL)return toast("Activation impossible : "+ERR.nourl.toLowerCase());
    try{const r=await post({action:"premium",did:A.did(),code:v});
      if(r&&r.ok){ls.s("prem",{did:A.did(),code:v});toast("Premium activé 🎉");A.reset()}else toast(r&&r.error==="rate"?ERR.rate:"Code incorrect")}catch(e){toast(errMsg(e))}return}
  case"gen":{const id=($("#aid").value||"").trim().toUpperCase();if(!id)return toast("Saisis l'identifiant");
    try{const j=await adm("/admin/premium-code?did="+encodeURIComponent(id));if(!j||!j.code)return toast(ERR.srv);const c=j.code;
      $("#aout").innerHTML=`<div class="corr"><b style="font-size:22px">${esc(c)}</b><br><small>Pour l'identifiant ${esc(id)}</small></div><button class="btn alt" data-act="open" data-a="https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("Ton code Premium PREP' CONCOURS BF : "+c)}">Envoyer par WhatsApp</button>`}catch(e){toast(errMsg(e))}return}
  case"pending":{try{const j=await adm("/admin/pending-codes"),L=(j&&j.items)||[];
      $("#agout").innerHTML=L.length?L.map(x=>{const msg="Ton code d'activation PREP' CONCOURS BF : "+x.code;
        return`<div class="card"><b>${esc(x.prenom||"")} ${esc(x.nom||"")}</b><br><small>+226 ${esc(x.contact)}</small><br><b style="font-size:22px">${esc(x.code)}</b>
        <button class="btn alt" data-act="open" data-a="https://wa.me/226${esc(x.contact)}?text=${encodeURIComponent(msg)}">Envoyer par WhatsApp</button>
        <button class="btn alt" data-act="open" data-a="sms:+226${esc(x.contact)}?body=${encodeURIComponent(msg)}">Envoyer par SMS</button></div>`}).join(""):`<div class="note">Aucun code en attente.</div>`}catch(e){toast(errMsg(e))}return}
  case"codes":{try{const j=await adm("/admin/activation-codes"),L=(j&&j.codes)||[],u=L.filter(x=>x.used_by).length;
      $("#cout").innerHTML=L.length?`<div class="note">${u} utilisé(s) · ${L.length-u} libre(s) sur ${L.length}</div>`+L.map(x=>`<small style="display:block">${esc(x.label)} · ${x.used_by?"✅ utilisé par "+esc(x.used_by)+(x.used_at?" ("+new Date(x.used_at).toLocaleDateString("fr-FR")+")":""):"⬜ libre"}</small>`).join(""):`<div class="note">Aucun code enregistré sur le serveur.</div>`}catch(e){toast(errMsg(e))}return}
  case"stats":{try{const j=await adm("/admin/stats");$("#sout").innerHTML=`<div class="note">👥 ${+j.users} comptes · ✅ ${+j.actifs} activés · 📝 ${+j.inscriptions} inscriptions · 🤖 ${+j.ia_6h} questions IA (6 h)</div>`}catch(e){toast(errMsg(e))}return}
  case"pingsrv":{if(!C.ACCOUNT_URL)return toast(ERR.nourl);const o=$("#sout");o.innerHTML="<small>Test en cours…</small>";
    try{const c=new AbortController(),t=setTimeout(()=>c.abort(),15000);const r=await fetch(C.ACCOUNT_URL,{cache:"no-store",signal:c.signal});clearTimeout(t);let j=null;try{j=await r.json()}catch(e){}
      o.innerHTML=j&&j.ok?`<div class="note">✅ Serveur joignable (HTTP ${r.status}${j.service?" · "+esc(j.service):""})</div>`:`<div class="note">⚠️ Le serveur répond (HTTP ${r.status}) mais pas comme attendu : adresse incorrecte ou ancien script ?</div>`}
    catch(e){o.innerHTML=`<div class="note">❌ Serveur injoignable (${e&&e.name==="AbortError"?"délai dépassé":"adresse incorrecte, serveur éteint ou pas de réseau"})</div>`}return}
  case"saveovr":{const o={};let bad=0;["CONFIG_URL","FEED_URL","ACCOUNT_URL","AI_URL","REGISTER_URL"].forEach(k=>{const v=($("#o_"+k).value||"").trim();if(!v)return;if(isHttps(v))o[k]=v;else bad++});
    if(bad)return toast("Les adresses doivent commencer par https://");
    if(C.ACCOUNT_URL){try{await adm("/admin/stats")}catch(e){if(e.code==="unauth"||e.code==="notok")return toast(errMsg(e));toast("Serveur injoignable : enregistré sans vérifier le jeton")}}
    ls.s("ovr",o);applyCfg();toast("Enregistré ✔");sync(true);return}
  default:if(window.EXAM)return EXAM.act(a0,a,t)
  }}

/* ---------- init ---------- */
function init(APP){A=APP;C=APP.C;D=APP.D;ls=APP.ls;esc=APP.esc;toast=APP.toast;
  rawSet=ls.s;   // toute modification de la progression déclenche une synchronisation différée
  ls.s=(k,v)=>{rawSet(k,v);if(k==="cq")rawSet("cqAt",Date.now());else if(k==="target")rawSet("targetAt",Date.now());if(SYNCK.includes(k)){lver++;cloudSoon()}};
  setTimeout(()=>cloud(false),2500);
  BASEREP=window.REP;applyCfg();applyRep();
  screens(A.S,A.T);
  if(window.EXAM)EXAM.init(APP,{post,ensureToken,errMsg,acct});
  document.addEventListener("keydown",e=>{if(e.target&&e.target.id==="bi"&&e.key==="Enter"){e.preventDefault();botSend()}});
}
function after(cur){if(window.EXAM)EXAM.after(cur);const f=$("#botFab");if(f)f.style.display=(cur==="bot"||document.body.classList.contains("gate"))?"none":"flex"}
window.EXT={init,gate,act,sync:async m=>{await sync(m);await cloud(false);await subSync(false)},after,prem,banner};
})();
