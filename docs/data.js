/* ====== CONFIGURATION : modifie ces valeurs ====== */
window.CONFIG = {
  // URL d'un fichier JSON que tu publies pour les mises à jour "temps réel" (voir README). Laisse vide si inutilisé.
  FEED_URL: "https://recreation-landscapes-seafood-baptist.trycloudflare.com/feed.json",   // (facultatif) JSON d'annonces officielles que tu publies toi-même : {"notifications":[{id,titre,texte,date,lien}], "concours":[...]}
  // Flux d'annonces EN DIRECT (RSS/Atom ou JSON). L'application les lit à l'ouverture, toutes les 5 min et au retour du réseau.
  FEED_RSS: [
    {n:"leFaso.net",       u:"https://lefaso.net/spip.php?page=backend"},
    {n:"Sidwaya (public)", u:"https://www.sidwaya.info/feed/"},
    {n:"AIB (agence d'information)", u:"https://www.aib.media/feed/"},
    {n:"Burkina24",        u:"https://burkina24.com/feed/"}
  ],
  // Mots-clés : seules les annonces qui les contiennent déclenchent une notification et s'affichent dans « Concours & recrutement »
  FEED_KEYWORDS: "concours|recrutement|résultats|resultats|communiqué|communique|inscription|fonction publique|enam|admis|admissib|convocation|e-concours|econcours|bourse|session",
  // Source de configuration en ligne (JSON) : permet de changer les liens, ajouter des concours, mettre à jour les Repères SANS recompiler
  CONFIG_URL: "",
  ECONCOURS: "https://www.econcours.gov.bf/",   // inscription officielle aux concours directs de la Fonction publique
  SITES: [
    {n:"e-concours — inscription aux concours directs", u:"https://www.econcours.gov.bf/"},
    {n:"Ministère de la Fonction publique", u:"https://www.fonction-publique.gov.bf/"},
    {n:"Présidence du Faso (documentation officielle)", u:"https://www.presidencedufaso.bf/"},
    {n:"Primature — Gouvernement", u:"https://primature.gov.bf/"}
  ],
  /* ----- COMPTE UTILISATEUR ----- */
  // Empreintes (SHA-256) des codes administrateur : un code administrateur active n'importe quel compte, même sans serveur.
  // Les codes eux-mêmes ne sont PAS dans l'application. Pour en créer : « node backend/scripts/admin-code.js 2 » puis coller la ligne ADMIN_HASHES ici.
  ADMIN_HASHES: ["091bb73d24fd5439e401e12068a82ba8733b5ac3726035718ce09f30b86b8d9c", "b5df7e936dbe180d58115ed30f0450d56af0becccfcac4ac1b8292a877f0a813"],
  ADMIN_EMAILS: ["badobalimaxime@gmail.com","balimaximebado592@gmail.com"],   // adresses qui reçoivent les demandes d'activation (les codes administrateur sont définis sur le serveur : ADMIN_CODES)
  REQUIRE_ACCOUNT: true,        // true = compte + code d'activation obligatoires pour utiliser l'application
  ACCOUNT_URL: "https://recreation-landscapes-seafood-baptist.trycloudflare.com",              // script (Google Apps Script, voir README) qui envoie le code par e-mail et le vérifie
  /* ----- ASSISTANT ----- */
  AI_URL: "",                   // (facultatif) votre serveur/proxy IA ; sinon l'assistant répond avec le contenu de l'application
  WHATSAPP: "22656837328",                 // service client (indicatif 226, sans +)
  PHONE: "+22656837328",
  FACEBOOK: "https://www.facebook.com/maximelechancelier.bado",
  EMAIL: "badobalimaxime@gmail.com",      // Gmail du support

  /* ----- PREMIUM ----- */
  PRICE: "3000 F CFA",
  USSD: "*144*10*56837328*3000#",          // numéro à composer pour payer
  ALL_FREE: true,                          // true = TOUT est gratuit (matières, tests chronométrés, audio, tableau de bord). Mettre false pour réactiver le Premium
  FREE_MATIERES: ["cg","fr"],              // utilisé seulement si ALL_FREE est false : matières gratuites

  /* ----- INSCRIPTIONS EN LIGNE ----- */
  // Adresse qui reçoit les inscriptions (ex. script Google Sheets, voir README). Vide = inscription enregistrée sur le téléphone
  // + envoi possible par WhatsApp.
  REGISTER_URL: "https://recreation-landscapes-seafood-baptist.trycloudflare.com/register"
};

/* ====== CONTENU (remplace/ajoute les vrais sujets, fiches, dates) ====== */
window.DATA = {
matieres: [
  {id:"cg",nom:"Culture générale",ic:"🌍"},{id:"fr",nom:"Français",ic:"✍️"},
  {id:"psy",nom:"Psychotechnique",ic:"🧩"},{id:"droit",nom:"Droit",ic:"⚖️"},{id:"eco",nom:"Économie",ic:"📈"},
  {id:"math",nom:"Mathématiques",ic:"➗"},{id:"hist",nom:"Histoire",ic:"🏛️"},{id:"geo",nom:"Géographie",ic:"🗺️"}
],
questions: {},   /* rempli par questions.js / questions2.js / bank.js */
annales: {
 cg:[{t:"Sujet d'entraînement 1",s:"Expliquez le rôle de l'impôt dans le développement d'un pays.",c:"<b>Plan :</b> 1) L'impôt finance les services publics (écoles, santé, routes). 2) Il redistribue les richesses et réduit les inégalités. 3) Limites : fraude, mauvaise gestion → nécessité de transparence."},
     {t:"Sujet d'entraînement 2",s:"Citez trois enjeux de la jeunesse africaine aujourd'hui.",c:"Éducation/formation, emploi et entrepreneuriat, numérique/innovation (accepter aussi : santé, migration, engagement citoyen). Illustrer par des exemples."}],
 fr:[{t:"Sujet d'entraînement 1",s:"Corrigez : « Les enfants qu'il a vu partir sont revenu hier. »",c:"« Les enfants qu'il a <b>vus</b> partir sont <b>revenus</b> hier. » (COD « que » avant avoir ; sujet pluriel avec être)."},
     {t:"Sujet d'entraînement 2",s:"Distinguez « ces » et « ses » avec une phrase pour chacun.",c:"<b>Ces</b> = démonstratif (« Ces livres sont neufs »). <b>Ses</b> = possessif (« Il range ses livres »)."}],
 psy:[{t:"Sujet d'entraînement 1",s:"Complétez : 4, 9, 16, 25, ?",c:"<b>36</b> : suite des carrés (2², 3², 4², 5², 6²)."},
      {t:"Sujet d'entraînement 2",s:"Un train parcourt 180 km en 2 h 30. Quelle est sa vitesse moyenne ?",c:"2 h 30 = 2,5 h ; 180 ÷ 2,5 = <b>72 km/h</b>."}],
 droit:[{t:"Sujet d'entraînement 1",s:"Définissez la séparation des pouvoirs et citez ses trois organes.",c:"Principe qui répartit l'autorité entre <b>législatif</b> (fait la loi), <b>exécutif</b> (l'applique), <b>judiciaire</b> (juge), pour éviter l'abus de pouvoir."},
        {t:"Sujet d'entraînement 2",s:"Différence entre droit public et droit privé ?",c:"Public : organisation de l'État et rapports avec les citoyens. Privé : rapports entre particuliers (famille, contrats, propriété)."}],
 eco:[{t:"Sujet d'entraînement 1",s:"Définissez l'inflation et donnez deux conséquences.",c:"Hausse générale et durable des prix. Conséquences : baisse du pouvoir d'achat, érosion de l'épargne, hausse des coûts des entreprises."},
      {t:"Sujet d'entraînement 2",s:"Distinguez croissance et développement.",c:"Croissance : hausse quantitative du PIB. Développement : amélioration durable du niveau de vie (santé, éducation, revenus, institutions)."}]
},
fiches: [
 {id:"f1",m:"cg",t:"Repères Burkina Faso",h:"<ul><li>Capitale : Ouagadougou ; 2ᵉ ville : Bobo-Dioulasso</li><li>Indépendance : 5 août 1960 (Haute-Volta)</li><li>1984 : la Haute-Volta devient Burkina Faso (« pays des hommes intègres »)</li><li>Fête nationale : 11 décembre</li><li>Devise : Unité – Progrès – Justice ; hymne : Ditanyè</li><li>Langue officielle : français ; langues nationales : mooré, dioula, fulfuldé…</li><li>17 régions, 47 provinces, 350 départements, 351 communes (nouveau découpage du 2 juillet 2025 ; avant : 13 régions, 45 provinces)</li><li>Chef de l'État : Président du Faso, capitaine Ibrahim Traoré ; Premier ministre : Rimtalba Jean Emmanuel Ouédraogo (depuis décembre 2024)</li><li>Charte de la Révolution adoptée le 27 mars 2026 (l'ALT devient ALP) ; Confédération AES depuis le 6 juillet 2024</li></ul>"},
 {id:"f2",m:"fr",t:"Accords et homophones",h:"<ul><li>Participe passé avec <b>être</b> : s'accorde avec le sujet.</li><li>Avec <b>avoir</b> : s'accorde avec le COD placé avant.</li><li>Pluriels irréguliers : travail→travaux, cheval→chevaux, corail→coraux.</li><li>a/à, ce/se, et/est, on/ont, son/sont, ces/ses.</li></ul>"},
 {id:"f3",m:"psy",t:"Suites et logique",h:"<ul><li>Cherche d'abord la différence constante (+n), puis le rapport (×n).</li><li>Teste l'alternance de deux suites imbriquées.</li><li>Pense aux carrés, cubes, nombres premiers, Fibonacci.</li><li>Analogies : contraire, partie/tout, cause/effet.</li><li>Gère ton temps : saute une question bloquante.</li></ul>"},
 {id:"f4",m:"droit",t:"Hiérarchie des normes",h:"<ul><li>1. Constitution</li><li>2. Traités et accords internationaux ratifiés</li><li>3. Lois</li><li>4. Règlements (décrets, arrêtés)</li><li>Trois pouvoirs : législatif, exécutif, judiciaire.</li></ul>"},
 {id:"f5",m:"eco",t:"Notions clés d'économie",h:"<ul><li>PIB : richesse produite sur une période.</li><li>Inflation : hausse générale et durable des prix.</li><li>Secteurs : primaire (agriculture), secondaire (industrie), tertiaire (services).</li><li>FCFA géré par la BCEAO ; UEMOA : 8 États.</li><li>Balance commerciale = exportations − importations.</li></ul>"}
],
/* Fichiers audio : place les .mp3 dans assets/www/audio/ puis ajoute-les ici */
audios: [ /* {t:"Cours de droit – chapitre 1", f:"droit1.mp3"} */ ],
concours: [
 // Concours directs de la Fonction publique : l'inscription se fait UNIQUEMENT sur le site officiel e-concours (dates : voir les arrêtés/communiqués)
 {nom:"Concours directs de la Fonction publique — inscription sur e-concours",code:"CD",debut:"",fin:"",lieu:"Inscription en ligne sur econcours.gov.bf",lien:"https://www.econcours.gov.bf/",online:false},
 // code = sigle court (pour le n° de récépissé) ; lien = site officiel (facultatif) ; online:false = pas d'inscription dans l'app
  {nom:"Concours de la Santé (EXEMPLE)",code:"CS",debut:"2027-01-10",fin:"2027-02-20",lieu:"Selon l'arrêté officiel",lien:""},
 {nom:"Concours de l'Enseignement (EXEMPLE)",code:"CE",debut:"2026-09-01",fin:"2026-10-31",lieu:"Selon l'arrêté officiel",lien:""}
],
notifications: [
 {id:"n1",titre:"Bienvenue",texte:"Les annonces en direct (concours, recrutements, communiqués) arrivent via les flux configurés. Inscriptions aux concours directs : econcours.gov.bf.",date:"2026-10-07"}
],
resultats: [
 {nom:"OUEDRAOGO",prenom:"Awa",recepisse:"BF-2026-00123",concours:"Exemple – session 2026",statut:"Admissible"},
 {nom:"SAWADOGO",prenom:"Ibrahim",recepisse:"BF-2026-00456",concours:"Exemple – session 2026",statut:"Non admissible"},
 {nom:"KABORE",prenom:"Fatimata",recepisse:"BF-2026-00789",concours:"Exemple – session 2026",statut:"Admissible"}
],
faq: [
 {q:"Comment fonctionne le mode hors ligne ?",a:"Tous les cours, quiz et fiches sont dans l'application. Les annonces et résultats se mettent en cache dès que tu es connecté."},
 {q:"Comment rechercher mes résultats ?",a:"Onglet Résultats : saisis ton nom, ton prénom ou ton numéro de récépissé. Un seul champ suffit."},
 {q:"Les notifications sont-elles en temps réel ?",a:"L'application vérifie les annonces à l'ouverture, toutes les 5 minutes et au retour de la connexion. Active-les dans Concours."},
 {q:"Comment calculer mon score au test chronométré ?",a:"1 point par bonne réponse. Le temps est limité à 45 s par question."},
 {q:"Comment contacter le support ?",a:"Menu Plus → Contact : Facebook, WhatsApp ou appel direct."}
]
};
