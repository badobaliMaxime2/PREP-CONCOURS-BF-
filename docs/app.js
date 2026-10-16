(function(){
"use strict";
const D=window.DATA,C=window.CONFIG,B=window.Android;
const $=s=>document.querySelector(s);
const ls={g:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
          s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const norm=s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const M=Object.fromEntries(D.matieres.map(m=>[m.id,m]));
const fmt=d=>new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"});
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let nav=[{n:"home",a:[]}],Q=null,tmr=null,qs={m:"all",mode:"free",n:10},taps=0,tapT=0;
/* ----- identifiant appareil, codes premium ----- */
function did(){let d=(B&&B.deviceId&&B.deviceId())||ls.g("did","");if(!d){d=Array.from({length:8},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("")}ls.s("did",d);return d.toUpperCase()}
function h53(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0)}
const cleanCode=x=>String(x||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
const isPrem=()=>{if(C.ALL_FREE)return true;const p=ls.g("prem",null);return !!(p&&typeof p==="object"&&p.code&&p.did===did())};
const locked=m=>!isPrem()&&!(C.FREE_MATIERES||[]).includes(m);
const lk=m=>locked(m)?"🔒 ":"";
const cq=()=>ls.g("cq",[]);
const allQ=m=>(D.questions[m]||[]).concat(cq().filter(x=>x.m===m));

/* ---------- données (flux en ligne si dispo, sinon local) ---------- */
const feed=()=>Object.assign({},ls.g("rdata",{}),ls.g("feed",{}));
const getC=()=>feed().concours||D.concours, getN=()=>feed().notifications||D.notifications, getR=()=>feed().resultats||D.resultats;
const hist=()=>ls.g("hist",[]);
function stats(){const h=hist(),n=h.length;return{n,h,avg:n?Math.round(h.reduce((a,x)=>a+x.s/x.t,0)/n*100):0}}
function status(c){if(!c.debut||!c.fin)return["Voir le site officiel","blue"];const t=Date.now(),a=new Date(c.debut).getTime(),b=new Date(c.fin).getTime()+864e5;return t<a?["À venir","blue"]:t<=b?["En cours","green"]:["Clôturé","grey"]}
function nextC(){const t=Date.now();return getC().filter(c=>new Date(c.fin).getTime()+864e5>=t).sort((a,b)=>new Date(a.debut)-new Date(b.debut))[0]}
function dtxt(c){const t=Date.now(),a=new Date(c.debut).getTime();if(t<a){const d=Math.ceil((a-t)/864e5);return`Ouverture dans ${d} jour${d>1?"s":""}`}return"Inscriptions en cours"}
function toast(m){const d=document.createElement("div");d.className="toast";d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}
const open=u=>{if(B&&B.open)B.open(u);else window.open(u,"_blank")};

/* ---------- écrans ---------- */
const S={
home(){const st=stats(),nx=nextC();
 return`<div class="hero"><h2>Bienvenue 👋</h2><p>Prépare ton concours, un jour à la fois.</p></div>
 ${C.ALL_FREE?`<div class="card" style="background:#e6f6ec">🎉 <b>Tout est gratuit</b> — toutes les matières et fonctions sont débloquées.</div>`:isPrem()?`<div class="card" style="background:#fff8e1">⭐ <b>Premium actif</b> — tout est débloqué.</div>`:`<button class="mod" style="background:#fff8e1;border-left-color:var(--y)" data-act="go" data-a="premium"><span class="ic">⭐</span><span><b>Passer en Premium — ${esc(C.PRICE)}</b><small>Débloque toutes les matières, les tests chronométrés, l'audio…</small></span></button>`}
 <div class="grid2"><div class="card stat"><b>${st.n}</b><small>Quiz réalisés</small></div><div class="card stat"><b>${st.avg}%</b><small>Moyenne</small></div></div>
 ${nx?`<div class="card" style="margin-top:12px"><small>Prochain concours</small><h3 style="margin:4px 0">${esc(nx.nom)}</h3><span class="chip ${status(nx)[1]}">${dtxt(nx)}</span></div>`:""}
 <h3 class="sec">Accès rapide</h3>
 <div class="grid2">
  <button class="mod" data-act="go" data-a="quiz"><span class="ic">📝</span><b>Quiz</b></button>
  <button class="mod" data-act="go" data-a="annales"><span class="ic">📄</span><b>Annales</b></button>
  <button class="mod" data-act="go" data-a="fiches"><span class="ic">🗂️</span><b>Fiches</b></button>
  <button class="mod" data-act="go" data-a="dash"><span class="ic">📊</span><b>Progrès</b></button>
 </div>`},
learn(){return`
 <button class="mod" data-act="go" data-a="annales"><span class="ic">📄</span><span><b>Annales & sujets corrigés</b><small>200 QCM corrigés par matière : culture générale, français, psychotechnique, droit, économie, maths, histoire, géographie</small></span></button>
 <button class="mod" data-act="go" data-a="qr"><span class="ic">❓</span><span><b>Questions & réponses</b><small>des centaines de questions, avec explications</small></span></button>
 <button class="mod" data-act="go" data-a="quiz"><span class="ic">📝</span><span><b>Quiz interactifs & tests chronométrés</b><small>QCM avec correction</small></span></button>
 <button class="mod" data-act="go" data-a="fiches"><span class="ic">🗂️</span><span><b>Fiches de révision & synthèses</b><small>L'essentiel en un coup d'œil</small></span></button>
 <button class="mod" data-act="go" data-a="audio"><span class="ic">🎧</span><span><b>Espace audio</b><small>Écoute tes fiches et cours</small></span></button>`},
annales(){return`<div class="note">Pour chaque matière : <b>200 QCM corrigés</b> (séries de 20) et des sujets rédigés avec corrigé. Les sujets officiels peuvent être ajoutés dans data.js.</div>`+
 D.matieres.map(m=>`<button class="mod" data-act="go" data-a="annaleList|${m.id}"><span class="ic">${m.ic}</span><span><b>${lk(m.id)}${m.nom}</b><small>${((D.annalesQ||{})[m.id]||[]).length} QCM corrigés · ${(D.annales[m.id]||[]).length} sujets rédigés${locked(m.id)?" · Premium":""}</small></span></button>`).join("")},
annaleList(m){const n=((D.annalesQ||{})[m]||[]).length,A=D.annales[m]||[];
 return(n?`<h3 class="sec">${n} QCM corrigés</h3><div class="grid2">`+Array.from({length:Math.ceil(n/20)},(_,k)=>`<button class="mod" data-act="go" data-a="qcmset|${m}|${k}"><b>Série ${k+1}</b><small>Q${k*20+1} à ${Math.min(n,k*20+20)}</small></button>`).join("")+`</div><button class="btn" style="margin-top:12px" data-act="qcmquiz" data-a="${m}|all">🎲 Quiz sur les ${n} QCM</button>`:"")+
 (A.length?`<h3 class="sec">Sujets rédigés</h3>`:"")+A.map((x,i)=>`<div class="card"><b>${esc(x.t)}</b><p>${esc(x.s)}</p>
 <details><summary>Voir le corrigé</summary><div class="corr">${x.c}</div></details></div>`).join("")},
qcmset(m,k){k=+k;const L=((D.annalesQ||{})[m]||[]).slice(k*20,k*20+20),Lt="ABCD";
 return`<div class="note">Réponds d'abord dans ta tête, puis touche « Réponse ».</div>`+L.map((x,i)=>`<div class="card"><b>${k*20+i+1}. ${esc(x.q)}</b>${x.o.map((o,j)=>`<div style="margin:5px 0">${Lt[j]}. ${esc(o)}</div>`).join("")}<details><summary>Réponse</summary><div class="corr">✅ <b>${Lt[x.a]}. ${esc(x.o[x.a])}</b>${x.e?`<br><small>${esc(x.e)}</small>`:""}</div></details></div>`).join("")+`<button class="btn" data-act="qcmquiz" data-a="${m}|${k}">▶ Faire cette série en quiz (${L.length} questions)</button>`},
quiz(){const mats=[{id:"all",nom:"Toutes mes matières accessibles",ic:"🎯"},...D.matieres];
 return`<h3 class="sec">Matière</h3>`+mats.map(m=>`<button class="opt ${qs.m===m.id?"sel":""}" data-act="selm" data-a="${m.id}">${m.ic} ${m.id!=="all"?lk(m.id):""}${m.nom}${m.id!=="all"?` <small>(${allQ(m.id).length})</small>`:""}</button>`).join("")+
 `<h3 class="sec">Nombre de questions</h3><div class="row">${[5,10,20,0].map(n=>`<button class="opt ${qs.n===n?"sel":""}" style="margin:0" data-act="seln" data-a="${n}">${n||"Toutes"}</button>`).join("")}</div>
 <h3 class="sec">Mode</h3>
 <button class="opt ${qs.mode==="free"?"sel":""}" data-act="selmode" data-a="free">📘 Entraînement (correction immédiate)</button>
 <button class="opt ${qs.mode==="timed"?"sel":""}" data-act="selmode" data-a="timed">⏱️ Test chronométré (45 s / question) ${isPrem()?"":"🔒"}</button>
 <button class="btn" data-act="start">Commencer</button>
 <button class="btn alt" data-act="go" data-a="addq">➕ Ajouter mes propres questions</button>`},
quizrun(){
 if(!Q)return"";
 if(Q.done){const pc=Math.round(Q.s/Q.list.length*100);
  return`<div class="card stat"><b>${Q.s} / ${Q.list.length}</b><small>${pc}% — ${pc>=70?"Excellent 👏":pc>=50?"Bien, continue 💪":"À retravailler 📚"}</small></div>`+
  Q.list.map((q,k)=>`<div class="card"><b>${k+1}. ${esc(q.q)}</b><p>${Q.ans[k]===q.a?"✅":"❌"} Bonne réponse : <b>${esc(q.o[q.a])}</b></p><small>${esc(q.e)}</small></div>`).join("")+
  `<button class="btn" data-act="go" data-a="quiz">Rejouer</button>`}
 const q=Q.list[Q.i],pc=Math.round(Q.i/Q.list.length*100);
 return`<div class="row"><small>Question ${Q.i+1}/${Q.list.length} · ${M[q.m].nom}</small>${Q.mode==="timed"?`<span class="timer" id="tm">${tm(Q.left)}</span>`:""}</div>
 <div class="bar"><i style="width:${pc}%"></i></div>
 <div class="card" style="margin-top:12px"><b>${esc(q.q)}</b>
 ${q.o.map((o,k)=>{let c="opt";if(Q.mode==="free"&&Q.sel!=null){if(k===q.a)c+=" ok";else if(k===Q.sel)c+=" ko"}
  return`<button class="${c}" data-act="pick" data-a="${k}">${esc(o)}</button>`}).join("")}
 ${Q.mode==="free"&&Q.sel!=null?`<div class="corr">${esc(q.e)}</div><button class="btn" data-act="next">${Q.i+1>=Q.list.length?"Terminer":"Suivant"}</button>`:""}</div>`},
fiches(){return D.fiches.map(f=>`<button class="mod" data-act="go" data-a="fiche|${f.id}"><span class="ic">${M[f.m].ic}</span><span><b>${lk(f.m)}${esc(f.t)}</b><small>${M[f.m].nom}</small></span></button>`).join("")},
fiche(id){const f=D.fiches.find(x=>x.id===id);
 return`<div class="card"><h3 style="margin-top:0">${esc(f.t)}</h3>${f.h}</div><button class="btn alt" data-act="speak" data-a="${id}">🎧 Écouter cette fiche</button>`},
audio(){return`<div class="card"><b>🎧 Aide audio</b><p style="margin:6px 0"><small>Les fiches sont lues par la voix de ton téléphone. Si tu n'entends rien, teste la voix puis installe la voix française.</small></p>
 <button class="btn" data-act="ttstest">🔊 Tester la voix</button>
 <button class="btn alt" data-act="ttsset">⚙️ Réglages de la synthèse vocale</button>
 <button class="btn alt" data-act="open" data-a="https://play.google.com/store/apps/details?id=com.google.android.tts">⬇️ Installer « Synthèse vocale Google »</button></div>`+
 D.fiches.map(f=>`<div class="card row"><span>${M[f.m].ic} <b>${lk(f.m)}${esc(f.t)}</b></span><span><button class="chip green" data-act="speak" data-a="${f.id}">▶ Lire</button> <button class="chip grey" data-act="stopspeak">■</button></span></div>`).join("")+
 (D.audios||[]).map(a=>`<div class="card"><b>${a.m&&locked(a.m)?"🔒 ":""}${esc(a.t)}</b>${a.m&&locked(a.m)?`<br><button class="chip grey" data-act="go" data-a="premium">Premium</button>`:`<audio controls preload="none" style="width:100%;margin-top:6px" src="${a.u?esc(a.u):"audio/"+esc(a.f)}"></audio>`}</div>`).join("")},
track(){const on=ls.g("notif",true);
 return`<button class="btn alt" data-act="sync">🔄 Actualiser</button>
 <button class="btn alt" data-act="go" data-a="insclist">📋 Mes inscriptions (${ls.g("insc",[]).length})</button>
 <div class="card row"><span>🔔 Notifications</span><button class="chip ${on?"green":"grey"}" data-act="tgnotif">${on?"Activées":"Désactivées"}</button></div>
 <h3 class="sec">Calendrier des concours</h3>`+
 getC().map((c,i)=>{const s=status(c);return`<div class="card"><div class="row"><b>${esc(c.nom)}</b><span class="chip ${s[1]}">${s[0]}</span></div>
 <p style="margin:8px 0 0">📅 ${fmt(c.debut)} → ${fmt(c.fin)}<br><small>${esc(c.lieu||"")}</small></p>
 ${s[0]==="En cours"&&c.online!==false?`<button class="btn" data-act="go" data-a="inscr|${i}">📝 S'inscrire en ligne</button>`:""}
 ${c.lien?`<button class="btn alt" data-act="open" data-a="${esc(c.lien)}">🌐 Site officiel</button>`:""}</div>`}).join("")+
 `<div class="note">Vérifie toujours les dates sur les communiqués officiels.</div>
 <h3 class="sec">Annonces</h3>`+getN().map(n=>`<div class="card"><b>${esc(n.titre)}</b><p style="margin:4px 0">${esc(n.texte)}</p><small>${esc(n.date||"")}</small></div>`).join("")},
results(){return`<div class="card"><b>🔎 Rechercher un résultat</b>
 <input id="rn" placeholder="Nom" autocomplete="off"><input id="rp" placeholder="Prénom" autocomplete="off"><input id="rr" placeholder="N° de récépissé" autocomplete="off"></div>
 <div id="rout"><small>Saisis au moins un critère.</small></div>`},
more(){return[["premium","⭐","Premium"],["addq","➕","Ajouter des questions"],["dash","📊","Tableau de bord de professionnalisation"],["faq","❓","Centre d'aide (FAQ)"],["contact","📞","Contact direct"],["sugg","💡","Suggestions"],["about","ℹ️","À propos"]]
 .map(x=>`<button class="mod" data-act="go" data-a="${x[0]}"><span class="ic">${x[1]}</span><b>${x[2]}</b></button>`).join("")},
dash(){if(!isPrem())return`<div class="card stat"><b>🔒</b><p>Le tableau de bord est réservé au Premium.</p><button class="btn" data-act="go" data-a="premium">Voir le Premium</button></div>`;
 const st=stats(),h=st.h,by={};
 h.forEach(x=>Object.entries(x.by||{}).forEach(([k,v])=>{by[k]=by[k]||[0,0];by[k][0]+=v[0];by[k][1]+=v[1]}));
 let weak=null,wv=101;
 const bars=D.matieres.map(m=>{const v=by[m.id],p=v?Math.round(v[0]/v[1]*100):0;if(v&&p<wv){wv=p;weak=m}
  return`<div style="margin:10px 0"><div class="row"><span>${m.ic} ${m.nom}</span><b>${v?p+"%":"—"}</b></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join("");
 const days=new Set(h.map(x=>new Date(x.d).toDateString()));let streak=0,d=new Date();if(!days.has(d.toDateString()))d.setDate(d.getDate()-1);
 while(days.has(d.toDateString())){streak++;d.setDate(d.getDate()-1)}
 const wk=h.filter(x=>Date.now()-x.d<7*864e5).length,goal=Math.min(100,Math.round(wk/3*100));
 const tg=ls.g("target",""),tc=getC().find(c=>c.nom===tg);
 return`<div class="grid2"><div class="card stat"><b>${st.n}</b><small>Quiz</small></div><div class="card stat"><b>🔥 ${streak}</b><small>Jours d'affilée</small></div></div>
 <div class="card" style="margin-top:12px"><b>Objectif de la semaine : 3 quiz</b><div class="bar" style="margin:8px 0"><i style="width:${goal}%"></i></div><small>${wk}/3 réalisés</small></div>
 <div class="card"><b>Niveau par matière</b>${bars}${weak?`<div class="corr">💡 À renforcer : <b>${weak.nom}</b></div>`:`<small>Fais un quiz pour voir tes statistiques.</small>`}</div>
 <div class="card"><b>🎯 Mon concours cible</b><select data-act="settarget"><option value="">— Choisir —</option>${getC().map(c=>`<option ${c.nom===tg?"selected":""}>${esc(c.nom)}</option>`).join("")}</select>${tc?`<p><span class="chip ${status(tc)[1]}">${dtxt(tc)}</span></p>`:""}</div>
 <div class="card"><b>Dernières séances</b>${h.slice(-5).reverse().map(x=>`<div class="row"><small>${fmt(x.d)} · ${x.mode==="timed"?"⏱️":"📘"} ${M[x.m]?M[x.m].nom:"Toutes"}</small><b>${x.s}/${x.t}</b></div>`).join("")||"<small>Aucune séance.</small>"}</div>`},
faq(){return D.faq.map(f=>`<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")},
contact(){return`<button class="btn" style="background:#1877F2" data-act="open" data-a="${esc(C.FACEBOOK)}">Facebook</button>
 <button class="btn" style="background:#25D366" data-act="open" data-a="https://wa.me/${C.WHATSAPP}">WhatsApp</button>
 <button class="btn" data-act="open" data-a="tel:${C.PHONE}">📞 Appeler le service client</button>
 <button class="btn alt" data-act="open" data-a="mailto:${C.EMAIL}">✉️ Écrire un e-mail</button>`},
sugg(){const l=ls.g("sugg",[]);
 return`<div class="card"><b>💡 Ton idée</b><select id="sc"><option>Nouvelle fonctionnalité</option><option>Contenu / matière</option><option>Problème technique</option><option>Autre</option></select>
 <textarea id="st" rows="4" placeholder="Décris ta suggestion…"></textarea>
 <button class="btn" data-act="savesugg">Enregistrer</button><button class="btn alt" data-act="sendsugg">Envoyer via WhatsApp</button></div>
 ${l.map(x=>`<div class="card"><small>${fmt(x.d)} · ${esc(x.c)}</small><p style="margin:4px 0">${esc(x.t)}</p></div>`).join("")}`},
premium(){if(C.ALL_FREE)return`<div class="card stat"><b>🎉</b><h3>Tout est gratuit</h3><p>Toutes les matières, les tests chronométrés, l'audio et le tableau de bord sont accessibles sans paiement.</p></div>`;const id=did();
 if(isPrem())return`<div class="card stat"><b>⭐</b><h3>Premium actif</h3><p>Merci ! Toutes les fonctions sont débloquées.</p><small>Code : ${esc((ls.g("prem",null)||{}).code||"")}</small></div>`;
 return`<div class="hero" style="background:linear-gradient(135deg,#b8860b,#e0a800)"><h2>⭐ Premium — ${esc(C.PRICE)}</h2><p>Paiement unique. Accès à vie sur ce téléphone.</p></div>
 <div class="card"><b>Gratuit</b><ul><li>${(C.FREE_MATIERES||[]).map(x=>M[x].nom).join(" et ")} (annales, quiz, fiches)</li><li>Calendrier, notifications, résultats, FAQ, contact</li></ul>
 <b>Premium</b><ul><li>Toutes les matières : ${D.matieres.filter(m=>locked(m.id)).map(m=>m.nom).join(", ")}</li><li>Tests chronométrés</li><li>Audio des fiches</li><li>Tableau de bord de professionnalisation</li></ul></div>
 <div class="card"><b>Étape 1 — Payer ${esc(C.PRICE)}</b><p style="margin:6px 0">Compose ce code sur ton téléphone :<br><b>${esc(C.USSD)}</b></p>
 <button class="btn" data-act="open" data-a="tel:${C.USSD.replace(/#/g,"%23")}">📲 Payer maintenant</button></div>
 <div class="card"><b>Étape 2 — Recevoir ton code</b><p style="margin:6px 0">Ton identifiant : <b>${esc(id)}</b></p>
 <button class="btn alt" data-act="sendproof">💬 J'ai payé : envoyer la preuve</button></div>
 <div class="card"><b>Étape 3 — Entrer ton code</b><input id="pc" placeholder="XXXX-XXXX" autocapitalize="characters" autocomplete="off">
 <button class="btn" data-act="activate">Activer le Premium</button></div>`},
admin(){return""},
addq(){const l=cq();
 return`<div class="card"><b>➕ Nouvelle question</b>
 <select id="qm">${D.matieres.map(m=>`<option value="${m.id}">${m.nom}</option>`).join("")}</select>
 <textarea id="qq" rows="2" placeholder="Question"></textarea>
 ${["A","B","C","D"].map((x,i)=>`<input id="qo${i}" placeholder="Réponse ${x}">`).join("")}
 <select id="qa"><option value="0">Bonne réponse : A</option><option value="1">Bonne réponse : B</option><option value="2">Bonne réponse : C</option><option value="3">Bonne réponse : D</option></select>
 <input id="qe" placeholder="Explication (facultatif)"><button class="btn" data-act="saveq">Enregistrer la question</button></div>
 <div class="card"><b>📥 Importer plusieurs questions</b><p><small>Une question par ligne :<br>Question | A | B | C | D | n° bonne réponse (1-4) | explication</small></p>
 <select id="bm">${D.matieres.map(m=>`<option value="${m.id}">${m.nom}</option>`).join("")}</select>
 <textarea id="bt" rows="5" placeholder="Capitale du Burkina ? | Bobo | Ouagadougou | Koudougou | Dori | 2 | Ouaga est la capitale"></textarea>
 <button class="btn alt" data-act="importq">Importer</button></div>
 <h3 class="sec">Mes questions (${l.length})</h3>
 ${l.map((x,i)=>`<div class="card row"><span><small>${M[x.m].nom}</small><br>${esc(x.q)}</span><button class="chip red" style="background:var(--r);border:0" data-act="delq" data-a="${i}">Supprimer</button></div>`).join("")||"<small>Aucune question ajoutée.</small>"}`},
qr(){return`<div class="note">des centaines de questions et réponses. Touche une question pour voir la réponse.</div>`+
 D.matieres.map(m=>`<button class="mod" data-act="go" data-a="qrlist|${m.id}"><span class="ic">${m.ic}</span><span><b>${lk(m.id)}${m.nom}</b><small>${allQ(m.id).length} questions${locked(m.id)?" · Premium":""}</small></span></button>`).join("")},
qrlist(m){return allQ(m).map((x,i)=>`<details><summary>${i+1}. ${esc(x.q)}</summary><p style="margin:6px 0">✅ <b>${esc(x.o[x.a])}</b></p>${x.e?`<small>${esc(x.e)}</small>`:""}</details>`).join("")},
inscr(i){const c=getC()[i];if(!c)return"";const st=status(c);
 if(st[0]!=="En cours")return`<div class="card">Les inscriptions ne sont pas ouvertes pour ce concours (${st[0]}).</div>`;
 return`<div class="card"><b>${esc(c.nom)}</b><br><small>Clôture : ${fmt(c.fin)}</small></div>
 <div class="card"><b>📝 Formulaire d'inscription</b><small style="display:block">Les champs avec * sont obligatoires.</small>
 <input id="in" placeholder="Nom *" autocomplete="family-name"><input id="ip" placeholder="Prénom(s) *" autocomplete="given-name">
 <small>Date de naissance *</small><input id="ib" type="date">
 <input id="il" placeholder="Lieu de naissance"><select id="is"><option value="">Sexe *</option><option>Masculin</option><option>Féminin</option></select>
 <input id="it" type="tel" placeholder="Téléphone * (ex : 70 00 00 00)"><input id="ie" type="email" placeholder="E-mail">
 <input id="ic" placeholder="N° CNIB (facultatif)"><select id="id"><option value="">Niveau d'études *</option><option>BEPC</option><option>BAC</option><option>BAC+2</option><option>Licence</option><option>Master</option><option>Doctorat</option><option>Autre</option></select>
 <label style="display:block;margin:8px 0"><input id="ik" type="checkbox" style="width:auto"> <small>J'accepte que mes informations soient transmises à l'organisateur pour mon inscription.</small></label>
 <button class="btn" data-act="submitinsc" data-a="${i}">Valider mon inscription</button></div>`},
insclist(){const l=ls.g("insc",[]);
 return l.map((r,k)=>`<button class="mod" data-act="go" data-a="inscview|${k}"><span class="ic">🧾</span><span><b>${esc(r.concours)}</b><small>${esc(r.ref)} · ${fmt(r.date)}</small><br><span class="chip ${r.statut==="envoyee"?"green":r.statut==="attente"?"blue":"grey"}">${r.statut==="envoyee"?"Envoyée":r.statut==="attente"?"En attente d'envoi":"Enregistrée"}</span></span></button>`).join("")||`<div class="card">Aucune inscription pour le moment.</div>`},
inscview(k){const r=ls.g("insc",[])[k];if(!r)return"";
 return`<div class="card stat"><small>Récépissé d'inscription</small><b style="font-size:20px">${esc(r.ref)}</b><span class="chip ${r.statut==="envoyee"?"green":r.statut==="attente"?"blue":"grey"}">${r.statut==="envoyee"?"Envoyée à l'organisateur":r.statut==="attente"?"En attente d'envoi (hors ligne)":"Enregistrée sur ce téléphone"}</span></div>
 <div class="card"><b>${esc(r.concours)}</b><p style="margin:6px 0">${esc(r.nom)} ${esc(r.prenom)}<br>Né(e) le ${esc(r.naissance)}${r.lieu?" à "+esc(r.lieu):""}<br>${esc(r.sexe)} · ${esc(r.diplome)}<br>📞 ${esc(r.tel)}${r.email?"<br>✉️ "+esc(r.email):""}${r.cnib?"<br>CNIB : "+esc(r.cnib):""}</p><small>Inscrit le ${fmt(r.date)}. Conserve ton numéro de récépissé.</small></div>
 <button class="btn alt" data-act="wainsc" data-a="${k}">💬 Envoyer par WhatsApp</button>
 ${r.statut==="attente"?`<button class="btn" data-act="retryinsc">🔄 Réessayer l'envoi</button>`:""}`},
about(){return`<div class="card"><h3 style="margin-top:0">PREP' CONCOURS BF</h3><p>Application de préparation aux concours au Burkina Faso. Version 1.0.</p></div>`}
};
const T={home:"PREP' CONCOURS BF",learn:"Préparation & révision",track:"Suivi des concours",results:"Résultats d'admissibilité",more:"Plus",
 annales:"Annales & sujets corrigés",annaleList:"Sujets corrigés",quiz:"Quiz & tests",quizrun:"Quiz",fiches:"Fiches de révision",fiche:"Fiche",audio:"Espace audio",
 dash:"Tableau de bord",qr:"Questions & réponses",qrlist:"Questions & réponses",inscr:"Inscription",insclist:"Mes inscriptions",inscview:"Récépissé",premium:"Premium",admin:"Administration",addq:"Mes questions",faq:"Centre d'aide",contact:"Contact",sugg:"Suggestions",about:"À propos"};
const tm=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

const APP={C,D,ls,esc,toast,S,T,B,h53,locked,allQ,nextC,fmt,getC,getN,status,did,cleanCode,draw:()=>draw(),go:(...x)=>go(...x),cur:()=>nav[nav.length-1].n,reset:()=>{nav=[{n:"home",a:[]}];draw()}};
T.qcmset="Série de QCM";
if(window.EXT)EXT.init(APP);
function draw(){if(window.EXT&&EXT.gate())return;const c=nav[nav.length-1];
 if(c.n!=="quizrun"){clearInterval(tmr)}
 if(!["audio","fiche"].includes(c.n))stopSpeech();
 const sc=$("#view").scrollTop;
 $("#view").innerHTML=S[c.n](...(c.a||[]));
 if(c.n!=="quizrun")$("#view").scrollTop=0;else $("#view").scrollTop=Q&&Q.sel!=null?sc:0;
 let t=T[c.n];if(c.n==="annaleList"||c.n==="qrlist")t=M[c.a[0]].nom;if(c.n==="qcmset")t=M[c.a[0]].nom+" · Série "+(+c.a[1]+1);if(c.n==="fiche")t=M[D.fiches.find(f=>f.id===c.a[0]).m].nom;
 $("#title").textContent=t;$("#backBtn").hidden=nav.length<2;
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.a===nav[0].n));
 if(c.n==="results")search();if(window.EXT)EXT.after(c.n)}
function go(n,...a){nav.push({n,a});draw()}
function back(){if(nav.length>1){nav.pop();draw();return true}return false}
window.handleBack=back;

/* ---------- quiz ---------- */
function start(){if(qs.mode==="timed"&&!isPrem())return go("premium");
 const pool=[],add=m=>allQ(m).forEach(q=>pool.push({...q,m}));
 if(qs.m==="all")D.matieres.filter(m=>!locked(m.id)).forEach(m=>add(m.id));
 else{if(locked(qs.m))return go("premium");add(qs.m)}
 if(!pool.length)return toast("Aucune question disponible");
 const list=shuffle(pool).slice(0,qs.n||999);
 Q={list,i:0,ans:[],sel:null,mode:qs.mode,left:list.length*45,done:false,m:qs.m};
 nav.push({n:"quizrun",a:[]});draw();
 if(Q.mode==="timed"){tmr=setInterval(()=>{Q.left--;const e=$("#tm");if(e)e.textContent=tm(Q.left);if(Q.left<=0)finish()},1000)}}
function finish(){clearInterval(tmr);const by={};let s=0;
 Q.list.forEach((q,k)=>{by[q.m]=by[q.m]||[0,0];by[q.m][1]++;if(Q.ans[k]===q.a){s++;by[q.m][0]++}});
 Q.s=s;Q.done=true;const h=hist();h.push({m:Q.m,s,t:Q.list.length,d:Date.now(),mode:Q.mode,by});ls.s("hist",h);draw()}

/* ---------- résultats ---------- */
function search(){const n=norm(($("#rn")||{}).value),p=norm(($("#rp")||{}).value),r=norm(($("#rr")||{}).value),o=$("#rout");if(!o)return;
 if(!n&&!p&&!r){o.innerHTML="<small>Saisis au moins un critère.</small>";return}
 const res=getR().filter(x=>(!n||norm(x.nom).includes(n))&&(!p||norm(x.prenom).includes(p))&&(!r||norm(x.recepisse).includes(r)));
 o.innerHTML=res.length?res.map(x=>`<div class="card"><div class="row"><b>${esc(x.nom)} ${esc(x.prenom)}</b><span class="chip ${/non/i.test(x.statut)?"grey":"green"}">${esc(x.statut)}</span></div>
  <small>Récépissé : ${esc(x.recepisse)}<br>${esc(x.concours||"")}</small></div>`).join(""):`<div class="card">Aucun résultat trouvé.</div>`}

/* ---------- audio ---------- */
function stopSpeech(){try{B&&B.stopSpeak&&B.stopSpeak()}catch(e){}if("speechSynthesis" in window)speechSynthesis.cancel()}
function speak(id){const f=D.fiches.find(x=>x.id===id);if(locked(f.m))return go("premium");
 const tmp=document.createElement("div");tmp.innerHTML=f.h;say(f.t+". "+tmp.textContent.replace(/→/g," donne "))}

/* ---------- inscriptions ---------- */
const makeRef=c=>"PCBF-"+(c.code||"CC")+"-"+Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
async function sendInsc(r){if(!C.REGISTER_URL)return false;
 try{await fetch(C.REGISTER_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(r)});return true}catch(e){return false}}
async function pushPending(manual){const l=ls.g("insc",[]);let ch=false,n=0;
 for(const r of l){if(r.statut==="attente"){n++;if(await sendInsc(r)){r.statut="envoyee";ch=true}}}
 if(ch){ls.s("insc",l);if(["insclist","inscview"].includes(nav[nav.length-1].n))draw()}
 if(manual)toast(ch?"Inscription envoyée ✔":n?"Envoi impossible, réessaie avec internet":"Rien à envoyer")}
function say(txt){if(B&&B.speak){const r=B.speak(txt);
  if(r==="nolang")toast("Voix française absente : touche « Réglages de la synthèse vocale »");
  else if(r==="noinit")toast("Aucune synthèse vocale : installe « Synthèse vocale Google »");
  else toast("Lecture en cours…");return}
 if(!("speechSynthesis" in window))return toast("Lecture vocale indisponible");
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang="fr-FR";speechSynthesis.speak(u)}

/* ---------- synchronisation / notifications ---------- */
async function sync(manual){pushPending();if(window.EXT)await EXT.sync(manual)}

/* ---------- événements ---------- */
document.addEventListener("click",e=>{const t=e.target.closest("[data-act]");if(!t||t.tagName==="SELECT")return;
 const a=t.dataset.a,act=t.dataset.act;
 switch(act){
  case"tab":nav=[{n:a,a:[]}];draw();break;
  case"go":{const p=a.split("|");
   const mm=(p[0]==="annaleList"||p[0]==="qrlist"||p[0]==="qcmset")?p[1]:p[0]==="fiche"?(D.fiches.find(f=>f.id===p[1])||{}).m:null;
   if(mm&&locked(mm))return go("premium");
   go(p[0],...p.slice(1));break}
  case"back":back();break;
  case"open":open(a);break;
  case"selm":if(a!=="all"&&locked(a))return go("premium");qs.m=a;draw();break;
  case"seln":qs.n=+a;draw();break;
  case"selmode":if(a==="timed"&&!isPrem())return go("premium");qs.mode=a;draw();break;
  case"start":start();break;
  case"pick":{const i=+a;if(Q.mode==="free"){if(Q.sel!=null)return;Q.sel=i;Q.ans[Q.i]=i;draw()}
   else{Q.ans[Q.i]=i;Q.i++;Q.i>=Q.list.length?finish():draw()}break}
  case"next":Q.sel=null;Q.i++;Q.i>=Q.list.length?finish():draw();break;
  case"speak":speak(a);break;
  case"stopspeak":"speechSynthesis" in window&&speechSynthesis.cancel();break;
  case"sync":sync(true);break;
  case"qcmquiz":{const p=a.split("|"),L=(D.annalesQ||{})[p[0]]||[],sel=p[1]==="all"?L:L.slice(+p[1]*20,+p[1]*20+20);
   const list=shuffle(sel.map(q=>({...q,m:p[0]})));if(!list.length)return toast("Aucune question");
   Q={list,i:0,ans:[],sel:null,mode:"free",left:0,done:false,m:p[0]};nav.push({n:"quizrun",a:[]});draw();break}
  case"ttstest":say("Bonjour. Ceci est un test de la voix de Prep Concours B F.");break;
  case"ttsset":if(B&&B.ttsSettings)B.ttsSettings();else toast("Ouvre les réglages du téléphone, Synthèse vocale");break;
  case"retryinsc":pushPending(true);break;
  case"wainsc":{const r=ls.g("insc",[])[+a];open(`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("INSCRIPTION "+r.ref+"\nConcours : "+r.concours+"\nNom : "+r.nom+" "+r.prenom+"\nNé(e) le : "+r.naissance+(r.lieu?" à "+r.lieu:"")+"\nSexe : "+r.sexe+"\nNiveau : "+r.diplome+"\nTél : "+r.tel+(r.email?"\nE-mail : "+r.email:"")+(r.cnib?"\nCNIB : "+r.cnib:""))}`);break}
  case"submitinsc":{const c=getC()[+a];if(!c)return;const g=id=>$("#"+id).value.trim();
   const r={nom:g("in").toUpperCase(),prenom:g("ip"),naissance:g("ib"),lieu:g("il"),sexe:g("is"),tel:g("it"),email:g("ie"),cnib:g("ic"),diplome:g("id")};
   if(!r.nom||!r.prenom||!r.naissance||!r.sexe||!r.diplome||r.tel.replace(/\D/g,"").length<8)return toast("Remplis les champs obligatoires (*)");
   if(!$("#ik").checked)return toast("Coche l'autorisation de transmission");
   const l=ls.g("insc",[]);if(l.some(x=>x.concours===c.nom&&x.tel.replace(/\D/g,"")===r.tel.replace(/\D/g,"")))return toast("Tu es déjà inscrit à ce concours");
   r.concours=c.nom;r.ref=makeRef(c);r.date=Date.now();r.statut=C.REGISTER_URL?"attente":"local";l.unshift(r);ls.s("insc",l);
   nav.pop();go("inscview",0);toast("Inscription enregistrée ✔");pushPending();break}
  case"sendproof":open(`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("Bonjour, j'ai payé "+C.PRICE+" pour le Premium PREP' CONCOURS BF. Mon identifiant : "+did()+". Référence de la transaction : ")}`);break;
  case"saveq":{const q=$("#qq").value.trim(),o=[0,1,2,3].map(i=>$("#qo"+i).value.trim());if(!q||o.some(x=>!x))return toast("Remplis la question et les 4 réponses");
   const l=cq();l.push({m:$("#qm").value,q,o,a:+$("#qa").value,e:$("#qe").value.trim()});ls.s("cq",l);toast("Question ajoutée ✔");draw();break}
  case"importq":{const l=cq();let n=0,bad=0;$("#bt").value.split("\n").forEach(line=>{line=line.trim();if(!line)return;const p=line.split("|").map(x=>x.trim());const k=parseInt(p[5],10)-1;
    if(p.length<6||!p.slice(0,5).every(Boolean)||!(k>=0&&k<4)){bad++;return}l.push({m:$("#bm").value,q:p[0],o:p.slice(1,5),a:k,e:p[6]||""});n++});
   ls.s("cq",l);toast(n+" ajoutée(s)"+(bad?", "+bad+" ligne(s) invalide(s)":""));draw();break}
  case"delq":{const l=cq();l.splice(+a,1);ls.s("cq",l);draw();break}
  case"tgnotif":ls.s("notif",!ls.g("notif",true));draw();break;
  case"savesugg":{const v=$("#st").value.trim();if(!v)return toast("Écris ta suggestion");const l=ls.g("sugg",[]);
   l.unshift({c:$("#sc").value,t:v,d:Date.now()});ls.s("sugg",l);toast("Suggestion enregistrée ✔");draw();break}
  case"sendsugg":{const v=$("#st").value.trim();if(!v)return toast("Écris ta suggestion");
   open(`https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("[PREP' CONCOURS BF] "+$("#sc").value+" : "+v)}`);break}
  default:if(window.EXT)EXT.act(act,a,t)
 }});
$("#title").addEventListener("click",()=>{const t=Date.now();taps=t-tapT<1500?taps+1:1;tapT=t;if(taps>=7){taps=0;go("admin")}});
document.addEventListener("change",e=>{if(e.target.dataset.act==="settarget"){ls.s("target",e.target.value);draw()}});
document.addEventListener("input",e=>{if(["rn","rp","rr"].includes(e.target.id))search()});
const net=()=>{const n=$("#net");n.classList.toggle("off",!navigator.onLine);n.title=navigator.onLine?"En ligne":"Hors ligne"};
window.addEventListener("online",()=>{net();sync()});window.addEventListener("offline",net);
net();draw();sync();setInterval(sync,300000);
})();
