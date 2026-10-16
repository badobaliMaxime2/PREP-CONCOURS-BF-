/* EXAMENS : le candidat compose et envoie sa copie ; le président du jury reçoit, note et publie les résultats.
   Nécessite le serveur (ACCOUNT_URL). Chargé avant ext.js, initialisé par ext.js (EXAM.init). */
(function(){
"use strict";
let A,C,ls,esc,toast,api,tm=0,jtok="",sending=false,confirmAt=0,autoDone=false,curId=null,pend=null,saveTm=0,quotaWarned=false,lastPush="";
const $=s=>document.querySelector(s);
const dt=t=>t?new Date(t).toLocaleString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
const num=v=>{const n=parseFloat(String(v).replace(",","."));return Number.isFinite(n)?n:null};
const EM={auth:"Session expirée : reconnecte-toi",closed:"Cet examen n'est pas ouvert",notfound:"Examen introuvable",notstarted:"Ouvre d'abord l'épreuve",invalid:"Nom et prénom obligatoires",rate:"Trop de tentatives : réessaie dans quelques minutes",has_copies:"Des copies sont déjà reçues : le sujet ne peut plus être modifié",ungraded:"Des copies ne sont pas encore corrigées"};
const msg=r=>EM[r&&r.error]||"Le serveur a refusé la demande";
const origin=()=>{try{return new URL(C.ACCOUNT_URL).origin}catch(e){return""}};
const box=(t,inner,cls)=>`<div class="exbox ${cls||""}"><b>${t}</b>${inner}</div>`;
const field=(id,label,val,ro,ph)=>`<small>${label}</small><input id="${id}" aria-label="${esc(label)}" data-exf="${id}" value="${esc(val||"")}" ${ro?"readonly":""} placeholder="${esc(ph||"")}">`;

/* ================= CANDIDAT ================= */
/* Attention : dans le BROUILLON (exd_), « ref » est l'objet des références du candidat ; dans la COPIE (excp_), « ref » est la chaîne de référence donnée par le serveur. */
const draftK=id=>"exd_"+id, copyK=id=>"excp_"+id;
/* Brouillon : modifié en mémoire à chaque frappe, écrit sur le téléphone au plus toutes les 400 ms (et à chaque sortie de l'écran) */
function flushDraft(){clearTimeout(saveTm);saveTm=0;if(!pend)return;const p=pend;pend=null;
  try{localStorage.setItem(draftK(p.id),JSON.stringify(p.d))}
  catch(e){if(!quotaWarned){quotaWarned=true;toast("⚠️ Mémoire du téléphone pleine : tes réponses ne sont plus enregistrées automatiquement. Libère de l'espace.")}}}
function editDraft(id,fn){if(pend&&String(pend.id)!==String(id))flushDraft();
  const d=pend?pend.d:ls.g(draftK(id),null);if(!d)return;fn(d);pend={id,d};clearTimeout(saveTm);saveTm=setTimeout(flushDraft,400)}
async function tok(){const t=await api.ensureToken();if(!t)toast("Active d'abord ton compte (connexion au serveur requise)");return t}
const hasSrv=()=>{if(!C.ACCOUNT_URL){toast("Serveur non configuré");return false}return true};

async function loadList(){
  const o=$("#exl");if(!o)return;
  if(!hasSrv()){o.innerHTML=`<div class="note">Le serveur n'est pas configuré : les examens ne sont pas disponibles.</div>`;return}
  const t=await api.ensureToken();if(!t){o.innerHTML=`<div class="note">Active ton compte pour accéder aux examens.</div>`;return}
  let r;try{r=await api.post({action:"exam_list",token:t})}catch(e){o.innerHTML=`<div class="note">${esc(api.errMsg(e))}</div>`;return}
  if(!r||!r.ok){o.innerHTML=`<div class="note">${esc(msg(r))}</div>`;return}
  ls.s("exlist",r.items);
  o.innerHTML=r.items.length?r.items.map(e=>{
    const lc=ls.g(copyK(e.id),null),sent=e.copie||(lc&&lc.ref?{ref:lc.ref,statut:"recue"}:null),pend=lc&&lc.pending;
    const chip=e.copie&&e.copie.statut==="corrigee"?`<span class="chip green">Résultat disponible</span>`:sent?`<span class="chip blue">Copie envoyée ✔</span>`:pend?`<span class="chip red" style="background:#d93025">À renvoyer</span>`:e.ouvert?`<span class="chip green">Ouvert</span>`:`<span class="chip grey">Fermé</span>`;
    return`<button class="mod" data-act="go" data-a="exam|${e.id}"><span class="ic">📝</span><span><b>${esc(e.titre)}</b> ${chip}<small>${e.nb_questions} questions · ${e.duree_min} min · sur ${e.sur}${e.ferme?" · jusqu'au "+dt(e.ferme):""}</small></span></button>`}).join(""):`<div class="note">Aucun examen pour le moment. Tu seras informé(e) de l'ouverture du prochain.</div>`}

const S_exam=id=>`<div id="exb" data-id="${esc(id)}"><small>Chargement…</small></div>`;

async function showExam(id){
  const o=$("#exb");if(!o)return;flushDraft();clearInterval(tm);confirmAt=0;
  if(String(curId)!==String(id)){curId=id;autoDone=false;sending=false;lastPush=""}   // un simple redessin ne doit pas relancer un envoi
  const lc=ls.g(copyK(id),null);
  if(lc&&lc.ref)return showReceipt(id,lc);
  if(lc&&lc.pending)return showPending(id,lc);
  const d=ls.g(draftK(id),null);
  if(d&&d.exam)return showSheet(id,d);          // épreuve déjà ouverte : on reprend (hors ligne possible)
  const it=(ls.g("exlist",[])||[]).find(x=>String(x.id)===String(id));
  if(!it){o.innerHTML=`<div class="note">Retourne à la liste des examens.</div>`;return}
  o.innerHTML=`<div class="card"><h3 style="margin-top:0">${esc(it.titre)}</h3><p>${esc(it.description)}</p>
   <p><small>⏱ Durée : <b>${it.duree_min} minutes</b> · ${it.nb_questions} questions rédigées · notées sur ${it.sur}</small></p>
   <div class="note">⚠️ Le chronomètre démarre dès que tu ouvres l'épreuve et ne s'arrête pas si tu quittes l'application. <b>Tes réponses sont sauvegardées sur le serveur toutes les 30 secondes quand tu as du réseau : si tu quittes l'application, la dernière version sera transmise automatiquement à la fin du temps.</b> Prépare-toi, assure-toi d'avoir une bonne connexion pour l'envoi, puis commence. Une seule copie par candidat.</div>
   ${it.ouvert?`<button class="btn" data-act="exstart" data-a="${esc(id)}">▶️ Commencer l'épreuve</button>`:`<div class="note">Cet examen n'est pas ouvert actuellement.</div>`}</div>`}

async function startExam(id){
  if(!hasSrv())return;const t=await tok();if(!t)return;
  let r;try{r=await api.post({action:"exam_get",token:t,id:+id})}catch(e){return toast(api.errMsg(e))}
  if(!r||!r.ok)return toast(msg(r));
  if(r.deja){ls.s(copyK(id),{ref:r.ref,recu:Date.now()});return showExam(id)}
  const a=api.acct()||{};
  ls.s(draftK(id),{exam:r.exam,debut:r.debut,limite:r.limite,off:r.now-Date.now(),ref:{nom:a.nom||"",prenom:a.prenom||"",naissance:a.naissance||"",contact:a.contact||"",did:a.did||""},rep:{}});
  showExam(id)}

function showSheet(id,d){
  const o=$("#exb");if(!o)return;const e=d.exam,R=d.ref||{};
  o.innerHTML=`<div class="card" style="position:sticky;top:0;z-index:3;margin-bottom:8px"><div class="row"><b>⏱ Temps restant</b><span id="extm" class="chip green" style="font-size:15px">--:--:--</span></div></div>
   <div class="card"><div style="text-align:center"><small>FEUILLE DE RÉPONSES</small><h3 style="margin:2px 0">${esc(e.titre)}</h3><small>Durée ${e.duree_min} min · sur ${e.sur} points</small></div>
   ${e.consignes?`<div class="note">${esc(e.consignes)}</div>`:""}
   ${box("1 · RÉFÉRENCES DU CANDIDAT",
     field("exr_nom","Nom",R.nom)+field("exr_prenom","Prénom(s)",R.prenom)+field("exr_naissance","Date de naissance",R.naissance,false,"JJ/MM/AAAA")+field("exr_lieu","Lieu de naissance",R.lieu)+
     field("exr_tel","Téléphone",R.tel,false,"8 chiffres")+field("exr_contact","Contact du compte",R.contact,true)+field("exr_cnib","N° CNIB (facultatif)",R.cnib)+
     field("exr_concours","Concours / poste visé",R.concours,false,"ex. Greffier, Infirmier…")+field("exr_niveau","Niveau d'études",R.niveau,false,"ex. Licence, BAC…")+
     `<small>Identifiant appareil : <b>${esc(R.did||"")}</b></small>`)}
   ${box("2 · RÉPONSES",e.questions.map((q,i)=>`<div style="margin:10px 0"><b>Question ${i+1}</b> <span class="chip grey">${q.points} pt${q.points>1?"s":""}</span><p style="margin:4px 0">${esc(q.enonce).replace(/\n/g,"<br>")}</p><textarea class="exq" aria-label="Réponse à la question ${i+1}" data-exq="${esc(q.id)}" rows="7" placeholder="Ta réponse…">${esc((d.rep||{})[q.id]||"")}</textarea></div>`).join(""))}
   ${box("3 · RÉSULTATS — réservé au jury",`<div class="grid2"><div><small>Note</small><input disabled placeholder="…… / ${e.sur}"></div><div><small>Mention</small><input disabled placeholder="……"></div></div><small>Appréciation du jury</small><textarea disabled rows="2" placeholder="Rempli par le président du jury"></textarea>`,"exres")}
   <label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="excert" style="width:auto;margin-top:3px" ${d.cert?"checked":""}><small>Je certifie avoir composé seul(e), sans aide extérieure, et que mes références sont exactes.</small></label>
   <button class="btn" id="exsendb" data-act="exsend" data-a="${esc(id)}">📤 Envoyer ma copie</button>
   <small>Tes réponses sont enregistrées automatiquement sur ton téléphone.</small></div>`;
  let k=0;const tick=()=>{k++;if(k%30===5)pushDraft(id);const left=d.limite-(Date.now()+d.off),el=$("#extm");if(!el)return clearInterval(tm);
    const s=Math.max(0,Math.floor(left/1000)),h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),x=String(s%60).padStart(2,"0");
    el.textContent=`${h}:${m}:${x}`;el.style.background=s<300?"#d93025":s<900?"#b45f06":"";
    if(s<=0&&!autoDone){autoDone=true;toast("Temps écoulé : envoi automatique de ta copie");sendCopy(id,true)}};
  tick();tm=setInterval(tick,1000)}

function collect(id){
  flushDraft();const d=ls.g(draftK(id),null);if(!d)return null;const g=k=>(($("#exr_"+k)||{}).value||"").trim();
  const candidat={};["nom","prenom","naissance","lieu","tel","contact","cnib","concours","niveau"].forEach(k=>candidat[k]=g(k));candidat.did=(d.ref||{}).did||"";
  const reponses={};document.querySelectorAll("[data-exq]").forEach(t=>reponses[t.dataset.exq]=t.value);
  return{candidat,reponses,d}}

/* Envoie le brouillon au serveur (si modifié) : filet de sécurité si le téléphone s'éteint ou si le candidat quitte l'écran */
async function pushDraft(id){
  if(sending||!navigator.onLine||!C.ACCOUNT_URL||!$("#extm"))return;
  const c=collect(id);if(!c)return;const sig=JSON.stringify([c.candidat,c.reponses]);if(sig===lastPush)return;
  const t=await api.ensureToken();if(!t)return;
  try{const r=await api.post({action:"exam_draft",token:t,id:+id,candidat:c.candidat,reponses:c.reponses});if(r&&r.ok&&!r.deja)lastPush=sig}catch(e){}}

async function sendCopy(id,auto){
  if(sending)return;const c=collect(id);if(!c)return;
  if(!auto){if(!c.candidat.nom||!c.candidat.prenom)return toast("Remplis ton nom et ton prénom");
    if(!($("#excert")||{}).checked)return toast("Coche la déclaration sur l'honneur");
    if(Date.now()-confirmAt>8000){confirmAt=Date.now();const b=$("#exsendb");if(b){b.textContent="⚠️ Touche encore pour confirmer (envoi définitif)";b.classList.add("red")}return}}
  if(!c.candidat.nom)c.candidat.nom=((api.acct()||{}).nom)||"?";if(!c.candidat.prenom)c.candidat.prenom=((api.acct()||{}).prenom)||"?";
  sending=true;const b=$("#exsendb");if(b){b.disabled=true;b.textContent="Envoi en cours…"}
  const payload={action:"exam_submit",id:+id,candidat:c.candidat,reponses:c.reponses};
  ls.s(copyK(id),{pending:payload,at:Date.now()});       // sécurité : la copie est gardée sur le téléphone tant que le serveur n'a pas confirmé
  const ok=await trySend(id);sending=false;
  if(A.cur()==="exam")showExam(id)}

async function trySend(id){
  const lc=ls.g(copyK(id),null);if(!lc||!lc.pending)return false;
  const t=await api.ensureToken();if(!t){toast("Connexion au serveur impossible : copie gardée sur ton téléphone");return false}
  let r;try{r=await api.post(Object.assign({},lc.pending,{token:t}))}catch(e){toast("Pas de connexion : ta copie est gardée sur ton téléphone. Renvoie-la dès que possible.");return false}
  if(r&&r.ok){clearInterval(tm);ls.s(copyK(id),{ref:r.ref,recu:r.recu||Date.now(),late:!!r.late});pend=null;clearTimeout(saveTm);localStorage.removeItem(draftK(id));toast("Copie envoyée ✔");return true}
  toast(msg(r));return false}

function waText(id,lc){const p=lc.pending,e=(ls.g(draftK(id),{}).exam)||{questions:[]};
  return`COPIE — ${e.titre||"Examen "+id}\nNom : ${p.candidat.nom} ${p.candidat.prenom}\nNé(e) le : ${p.candidat.naissance} ${p.candidat.lieu?"à "+p.candidat.lieu:""}\nTél : ${p.candidat.tel}\nIdentifiant : ${p.candidat.did}\n\n`+e.questions.map((q,i)=>`Q${i+1}. ${p.reponses[q.id]||"(sans réponse)"}`).join("\n\n")}
function showPending(id,lc){const o=$("#exb");if(!o)return;
  o.innerHTML=`<div class="card"><h3 style="margin-top:0">⚠️ Copie non envoyée</h3><p>Ta copie est bien enregistrée sur ton téléphone, mais le serveur ne l'a pas encore reçue. <b>Ne désinstalle pas l'application.</b> Reconnecte-toi à internet et touche « Renvoyer ».</p>
   <button class="btn" data-act="exretry" data-a="${esc(id)}">🔄 Renvoyer ma copie</button>
   <button class="btn alt" data-act="open" data-a="https://wa.me/${esc(C.WHATSAPP)}?text=${encodeURIComponent(waText(id,lc))}">💬 Secours : l'envoyer par WhatsApp</button></div>`}

async function showReceipt(id,lc){
  const o=$("#exb");if(!o)return;const it=(ls.g("exlist",[])||[]).find(x=>String(x.id)===String(id))||{titre:"Examen"};
  o.innerHTML=`<div class="card" style="text-align:center"><div style="font-size:40px">✅</div><h3 style="margin:4px 0">Copie reçue</h3><small>${esc(it.titre)}</small>
   <p style="font-size:22px;font-weight:800;margin:8px 0">${esc(lc.ref)}</p><small>Garde cette référence.${lc.recu?" Reçue le "+dt(lc.recu)+".":""}${lc.late?" (hors délai : le jury en tiendra compte)":""}</small></div>
   <div id="exres"><div class="exbox exres"><b>RÉSULTATS — réservé au jury</b><small>Chargement…</small></div></div>`;
  const t=await api.ensureToken();if(!t)return;let r;try{r=await api.post({action:"exam_result",token:t,id:+id})}catch(e){return}
  const z=$("#exres");if(!z||!r||!r.ok)return;
  z.innerHTML=!r.publie?box("RÉSULTATS — réservé au jury",`<p style="margin:6px 0">⏳ Ta copie est en cours de correction. Les résultats seront publiés par le président du jury.</p><button class="btn alt" data-act="exrefresh" data-a="${esc(id)}">🔄 Actualiser</button>`,"exres")
   :box("RÉSULTATS",`<div style="text-align:center"><div style="font-size:34px;font-weight:800">${r.note20} / 20</div><span class="chip ${r.note20>=10?"green":"grey"}" style="background:${r.note20>=10?"":"#d93025"}">${esc(r.mention)}</span><p style="margin:8px 0">Total : <b>${r.total} / ${r.sur}</b>${r.rang?` · Rang : <b>${r.rang}</b> / ${r.effectif}`:""}</p></div>${r.appreciation?`<small>Appréciation du jury</small><div class="note" style="background:#eef7f1">${esc(r.appreciation)}</div>`:""}`,"exres")}

/* ================= JURY ================= */
async function jr(method,path,body){
  if(!jtok)throw{code:"notok"};let r;
  try{r=await fetch(origin()+path,{method,headers:{Authorization:"Bearer "+jtok,"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,cache:"no-store"})}catch(e){throw{code:"net"}}
  if(r.status===401){jtok="";throw{code:"unauth"}}let j;try{j=await r.json()}catch(e){throw{code:"bad"}}return{status:r.status,j}}
const jerr=e=>e.code==="notok"||e.code==="unauth"?"Jeton administrateur requis : retourne dans Admin et saisis-le":e.code==="net"?"Serveur injoignable":"Réponse inattendue du serveur";
const needTok=()=>jtok?"":`<div class="note">Jeton administrateur requis : retourne dans <b>Plus › Admin</b>, saisis le jeton puis touche « Ouvrir le jury ».</div>`;

async function jLoadList(){
  const o=$("#jbox");if(!o)return;if(!jtok){o.innerHTML=needTok();return}
  try{const {j}=await jr("GET","/admin/exams");if(!j||!j.ok){o.innerHTML=`<div class="note">${esc(msg(j))}</div>`;return}
    o.innerHTML=`<button class="btn" data-act="go" data-a="jnew">➕ Créer un examen</button>`+(j.exams.length?j.exams.map(e=>`<button class="mod" data-act="go" data-a="jexam|${e.id}"><span class="ic">🎓</span><span><b>${esc(e.titre)}</b> <span class="chip ${e.statut==="ouvert"?"green":e.statut==="ferme"?"grey":"blue"}">${e.statut==="ouvert"?"Ouvert":e.statut==="ferme"?"Fermé":"Brouillon"}</span><small>📥 ${e.copies} copie${e.copies>1?"s":""} reçue${e.copies>1?"s":""} · ✅ ${e.corrigees} corrigée${e.corrigees>1?"s":""}${e.resultats_publies?" · 📢 publié":""}</small></span></button>`).join(""):`<div class="note">Aucun examen créé.</div>`)}
  catch(e){o.innerHTML=`<div class="note">${esc(jerr(e))}</div>`}}

const S_jnew=()=>needTok()+`<div class="card"><b>Nouvel examen</b>
  <small>Titre</small><input id="jn_t" placeholder="ex. Concours blanc Greffier 2026">
  <small>Description (facultatif)</small><input id="jn_d">
  <small>Consignes aux candidats (facultatif)</small><textarea id="jn_c" rows="3" placeholder="ex. Répondez de façon rédigée, sans aide."></textarea>
  <div class="grid2"><div><small>Durée (minutes)</small><input id="jn_m" type="number" value="120"></div><div><small>Points par défaut / question</small><input id="jn_p" type="number" value="5"></div></div>
  <small>Ouverture (facultatif)</small><input id="jn_o" type="datetime-local"><small>Fermeture (facultatif)</small><input id="jn_f" type="datetime-local">
  <small>Questions — sépare chaque question par une ligne vide. Pour un nombre de points différent, commence par [10]</small>
  <textarea id="jn_q" rows="10" placeholder="[10] Expliquez le rôle du greffier dans une audience pénale.&#10;&#10;Citez trois principes de la Constitution du Burkina Faso."></textarea>
  <button class="btn alt" data-act="jcreate" data-a="brouillon">Enregistrer en brouillon</button><button class="btn" data-act="jcreate" data-a="ouvert">Créer et ouvrir aux candidats</button></div>`;

function parseQs(txt,def){return String(txt||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const m=x.match(/^\[(\d+(?:[.,]\d+)?)\]\s*([\s\S]*)$/);return m?{enonce:m[2].trim(),points:num(m[1])||def}:{enonce:x,points:def}}).filter(q=>q.enonce)}
async function jCreate(statut){
  const g=i=>(($("#"+i)||{}).value||"").trim(),qs=parseQs(g("jn_q"),num(g("jn_p"))||5);
  if(!g("jn_t")||!qs.length)return toast("Titre et au moins une question requis");
  const iso=v=>v?new Date(v).toISOString():null;
  try{const {status,j}=await jr("POST","/admin/exams",{titre:g("jn_t"),description:g("jn_d"),consignes:g("jn_c"),duree_min:num(g("jn_m"))||120,ouvre:iso(g("jn_o")),ferme:iso(g("jn_f")),statut,questions:qs});
    if(!j.ok)return toast(msg(j));toast(statut==="ouvert"?"Examen ouvert ✔":"Brouillon enregistré ✔");A.reset();A.go("jury")}catch(e){toast(jerr(e))}}

const S_jexam=id=>`<div id="jbox" data-id="${esc(id)}"><small>Chargement…</small></div>`;
async function jLoadExam(id){
  const o=$("#jbox");if(!o)return;if(!jtok){o.innerHTML=needTok();return}
  try{const [E,L]=await Promise.all([jr("GET","/admin/exams/"+id),jr("GET",`/admin/exams/${id}/copies`)]);
    if(!E.j.ok||!L.j.ok){o.innerHTML=`<div class="note">${esc(msg(E.j.ok?L.j:E.j))}</div>`;return}
    const e=E.j.exam,cp=L.j.copies;
    o.innerHTML=`<div class="card"><div class="row"><b>${esc(e.titre)}</b><span class="chip ${e.statut==="ouvert"?"green":e.statut==="ferme"?"grey":"blue"}">${e.statut==="ouvert"?"Ouvert":e.statut==="ferme"?"Fermé":"Brouillon"}</span></div>
     <small>${e.questions.length} questions · ${e.duree_min} min · sur ${e.sur}${e.ouvre?" · ouvre le "+dt(e.ouvre):""}${e.ferme?" · ferme le "+dt(e.ferme):""}</small>
     ${e.statut!=="ouvert"?`<button class="btn" data-act="jstat" data-a="${e.id}|ouvert">▶️ Ouvrir aux candidats</button>`:`<button class="btn alt" data-act="jstat" data-a="${e.id}|ferme">⏹ Fermer l'examen</button>`}
     <button class="btn ${e.resultats_publies?"alt":""}" data-act="jpub" data-a="${e.id}|${e.resultats_publies?0:1}">${e.resultats_publies?"🔒 Retirer les résultats":"📢 Publier les résultats aux candidats"}</button>
     <button class="btn alt" data-act="jrank" data-a="${e.id}">🏆 Classement</button><div id="jrk"></div></div>
     <h3 class="sec">Copies reçues (${cp.length})</h3>`+(cp.length?cp.map(c=>`<button class="mod" data-act="go" data-a="jcopy|${c.id}"><span class="ic">${c.statut==="corrigee"?"✅":c.statut==="encours"?"✏️":"📄"}</span><span><b>${esc(c.nom)} ${esc(c.prenom)}</b> <small>${esc(c.ref)}</small><small>${dt(c.created_at)}${c.late?" · ⏰ hors délai":""}${c.auto?" · 📡 envoi automatique":""}${c.note20!=null?" · "+c.note20+"/20 · "+esc(c.mention):" · à corriger"}</small></span></button>`).join(""):`<div class="note">Aucune copie reçue pour le moment.</div>`)}
  catch(e){o.innerHTML=`<div class="note">${esc(jerr(e))}</div>`}}

const S_jcopy=id=>`<div id="jbox" data-id="${esc(id)}"><small>Chargement…</small></div>`;
async function jLoadCopy(id){
  const o=$("#jbox");if(!o)return;if(!jtok){o.innerHTML=needTok();return}
  try{const {j}=await jr("GET","/admin/copies/"+id);if(!j||!j.ok){o.innerHTML=`<div class="note">${esc(msg(j))}</div>`;return}
    const c=j.copie,e=j.exam,k=c.candidat||{};
    o.dataset.sur=e.sur;
    o.innerHTML=`${box("1 · RÉFÉRENCES DU CANDIDAT",`<p style="margin:4px 0"><b>${esc(k.nom)} ${esc(k.prenom)}</b><br><small>Né(e) le ${esc(k.naissance)} ${k.lieu?"à "+esc(k.lieu):""} · Tél ${esc(k.tel)} · ${esc(k.contact)}<br>Concours : ${esc(k.concours)} · Niveau : ${esc(k.niveau)}${k.cnib?" · CNIB "+esc(k.cnib):""}<br>Copie <b>${esc(c.ref)}</b> · reçue le ${dt(c.created_at)}${c.late?" · <b>⏰ hors délai</b>":""}${c.auto?" · <b>📡 envoi automatique du dernier brouillon</b>":""}</small></p>`)}
     ${box("2 · RÉPONSES ET NOTES",e.questions.map((q,i)=>`<div style="margin:10px 0"><b>Question ${i+1}</b> <span class="chip grey">/${q.points}</span><p style="margin:4px 0"><small>${esc(q.enonce).replace(/\n/g,"<br>")}</small></p><div class="note" style="background:#f4f7f5;white-space:pre-wrap">${esc((c.reponses||{})[q.id]||"(sans réponse)")}</div><input type="number" aria-label="Note de la question ${i+1}" step="0.25" min="0" max="${q.points}" data-jn="${esc(q.id)}" data-max="${q.points}" value="${c.notes&&c.notes[q.id]!=null?c.notes[q.id]:""}" placeholder="Note sur ${q.points}"></div>`).join(""))}
     ${box("3 · RÉSULTATS",`<div id="jtot" style="font-size:22px;font-weight:800;text-align:center;margin:6px 0">—</div><small>Appréciation du jury</small><textarea id="jap" aria-label="Appréciation du jury" rows="3" placeholder="Appréciation (visible par le candidat à la publication)">${esc(c.appreciation||"")}</textarea><button class="btn" data-act="jgrade" data-a="${c.id}">💾 Enregistrer la note</button>`,"exres")}`;
    jTotal()}catch(e){o.innerHTML=`<div class="note">${esc(jerr(e))}</div>`}}
function jTotal(){const o=$("#jbox");if(!o||!$("#jtot"))return;let t=0,n=0,all=true;document.querySelectorAll("[data-jn]").forEach(i=>{const v=num(i.value);n++;if(v==null)all=false;else t+=Math.min(+i.dataset.max,Math.max(0,v))});
  const sur=+o.dataset.sur||0;t=Math.round(t*100)/100;$("#jtot").innerHTML=`${t} / ${sur}${sur?` <small>(${Math.round(t/sur*2000)/100} / 20)</small>`:""}${all?"":`<br><small>notes incomplètes</small>`}`}

async function jGrade(id){
  const notes={};document.querySelectorAll("[data-jn]").forEach(i=>{if(i.value!=="")notes[i.dataset.jn]=i.value});
  try{const {j}=await jr("POST",`/admin/copies/${id}/grade`,{notes,appreciation:($("#jap")||{}).value||""});
    if(!j.ok)return toast(msg(j));toast(j.statut==="corrigee"?`Note enregistrée ✔ ${j.note20}/20 · ${j.mention}`:"Brouillon de note enregistré (questions restantes)")}catch(e){toast(jerr(e))}}

function copyText(t){const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}a.remove();return ok}
async function jRank(id){
  const o=$("#jrk");if(!o)return;
  try{const {j}=await jr("GET",`/admin/exams/${id}/ranking`);if(!j||!j.ok)return toast(msg(j));const L=j.classement;
    if(!L.length){o.innerHTML=`<div class="note">Aucune copie corrigée pour le moment.</div>`;return}
    window.__rk=`CLASSEMENT — ${j.titre}\n`+L.map(r=>`${r.rang}. ${r.nom} ${r.prenom} — ${r.note20}/20 (${r.mention}) · ${r.ref}`).join("\n");
    o.innerHTML=`<div style="margin-top:8px">`+L.map(r=>`<div class="row" style="padding:5px 0;border-bottom:1px solid #eee"><span><b>${r.rang}.</b> ${esc(r.nom)} ${esc(r.prenom)}</span><b>${r.note20}/20</b></div>`).join("")+`</div><button class="btn alt" data-act="jcopyrk">📋 Copier le classement</button>`}
  catch(e){toast(jerr(e))}}

/* ================= branchement ================= */
async function act(a0,a,t){
  switch(a0){
  case"exstart":return startExam(a);
  case"exsend":return sendCopy(a,false);
  case"exretry":{await trySend(a);if(A.cur()==="exam")showExam(a);return}
  case"exrefresh":return showExam(a);
  case"jopen":{const v=(($("#apin")||{}).value||"").trim();if(!v)return toast("Saisis d'abord le jeton administrateur");if(!C.ACCOUNT_URL)return toast("Serveur non configuré");
    jtok=v;try{await jr("GET","/admin/exams");A.go("jury")}catch(e){const m=jerr(e);jtok="";toast(e.code==="unauth"?"Jeton administrateur incorrect":m)}return}
  case"jcreate":return jCreate(a);
  case"jstat":{const[p,s]=a.split("|");try{const {j}=await jr("PUT","/admin/exams/"+p,{statut:s});if(!j.ok)return toast(msg(j));toast(s==="ouvert"?"Examen ouvert ✔":"Examen fermé ✔");jLoadExam(p)}catch(e){toast(jerr(e))}return}
  case"jpub":{const[p,v]=a.split("|");try{const {j}=await jr("POST",`/admin/exams/${p}/publish`,{publie:v==="1"});
    if(j.error==="ungraded")return toast(`${j.restantes} copie(s) non corrigée(s) : corrige-les d'abord`);if(!j.ok)return toast(msg(j));toast(v==="1"?"Résultats publiés ✔":"Résultats retirés");jLoadExam(p)}catch(e){toast(jerr(e))}return}
  case"jrank":return jRank(a);
  case"jcopyrk":return toast(copyText(window.__rk||"")?"Classement copié ✔":"Copie impossible");
  case"jgrade":return jGrade(a);
  }}
function after(cur){
  if(cur!=="exam"){clearInterval(tm);flushDraft()}
  if(cur==="exams")loadList();
  else if(cur==="exam"){const id=($("#exb")||{dataset:{}}).dataset.id;if(id)showExam(id)}
  else if(cur==="jury")jLoadList();
  else if(cur==="jexam"){const id=($("#jbox")||{dataset:{}}).dataset.id;if(id)jLoadExam(id)}
  else if(cur==="jcopy"){const id=($("#jbox")||{dataset:{}}).dataset.id;if(id)jLoadCopy(id)}}

function init(APP,API){A=APP;C=APP.C;ls=APP.ls;esc=APP.esc;toast=APP.toast;api=API;const S=A.S,T=A.T;
  Object.assign(T,{exams:"Examens",exam:"Épreuve",jury:"Jury des examens",jnew:"Nouvel examen",jexam:"Examen · copies",jcopy:"Copie du candidat"});
  S.exams=()=>`<div class="note">📝 Épreuves organisées par le jury. Compose dans le temps imparti puis envoie ta copie.</div><div id="exl"><small>Chargement…</small></div>`;
  S.exam=S_exam;S.jury=()=>`<div id="jbox"><small>Chargement…</small></div>`;S.jnew=S_jnew;S.jexam=S_jexam;S.jcopy=S_jcopy;
  const oldAdmin=S.admin;S.admin=()=>oldAdmin()+`<div class="card"><b>🎓 Jury des examens</b><small style="display:block">Président du jury : crée un examen, reçois les copies, note-les et publie les résultats. Saisis d'abord le jeton administrateur ci-dessus.</small><button class="btn" data-act="jopen">Ouvrir le jury</button></div>`;
  document.addEventListener("input",e=>{const t=e.target;if(!t)return;
    if(t.id==="excert"){const id=($("#exb")||{dataset:{}}).dataset.id;if(id)editDraft(id,d=>{d.cert=t.checked});return}
    if(!t.dataset)return;
    if(t.dataset.exq||t.dataset.exf){const id=($("#exb")||{dataset:{}}).dataset.id;if(!id)return;
      editDraft(id,d=>{if(t.dataset.exq){d.rep=d.rep||{};d.rep[t.dataset.exq]=t.value}else{d.ref=d.ref||{};d.ref[t.dataset.exf.replace("exr_","")]=t.value}})}
    else if(t.dataset.jn!==undefined)jTotal()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){flushDraft();const id=($("#exb")||{dataset:{}}).dataset.id;if(id)pushDraft(id)}});window.addEventListener("pagehide",flushDraft);
  window.addEventListener("online",()=>{Object.keys(localStorage).filter(k=>k.startsWith("excp_")).forEach(async k=>{const v=ls.g(k,null);
    if(!(v&&v.pending))return;const id=k.slice(5);
    if(await trySend(id)){const cur=A.cur();if(cur==="exams")loadList();else if(cur==="exam"&&String(($("#exb")||{dataset:{}}).dataset.id)===String(id))showExam(id)}})})}
window.EXAM={init,act,after};
})();
