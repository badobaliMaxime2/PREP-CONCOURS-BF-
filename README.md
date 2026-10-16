# PREP' CONCOURS BF v4.6

## Compiler (Termux)
    cd ~ && rm -rf prepconcoursbf
    tar xzf ~/storage/downloads/PrepConcoursBF-v4.6.tar.gz
    cd prepconcoursbf && chmod +x *.sh && ./build.sh
Résultat : /sdcard/Download/PrepConcoursBF-v4.6.apk

## Publication Android (APK/AAB) et iOS
Voir **PUBLIER.md** (Google Play, App Store, GitHub Actions) et **POLITIQUE_CONFIDENTIALITE.md** (modèle à héberger en ligne).
Bouton « Supprimer mon compte » ajouté (obligatoire dans les boutiques) : mettre à jour et redéployer le script Apps Script ci-dessous.

## Nouveautés v4
- **Compte obligatoire** (nom, prénom, date de naissance, téléphone ou e-mail) + **code d'activation à 6 chiffres**.
- **Assistant PREP'** (bouton 🤖) : répond avec le contenu de l'application ; refuse les sujets sexuels, politiques/partisans,
  discriminatoires, terroristes, religieux ou remettant en cause la crédibilité d'un groupe/institution
  (« Je ne suis pas programmé pour répondre à ce type de question ») ; renvoie vers le Gmail / WhatsApp du support.
- **Annales & sujets** : 200 QCM corrigés (10 séries de 20, avec quiz) pour chacune des 8 matières :
  culture générale, français, psychotechnique, droit, économie, mathématiques, histoire, géographie.
- **Cours** : vocabulaire, règles grammaticales, conjugaison ; formules de maths (arithmétique, algèbre, géométrie) ; histoire ; géographie.
- **Repères du Burkina Faso** (Réviser > Culture générale) : présidents 1960-2026, institutions et dates de création, Charte de la Révolution, AES, gouvernement.
- **Tout est gratuit** : `ALL_FREE: true` dans data.js (mettre `false` pour réactiver le Premium).
- **e-concours** : https://www.econcours.gov.bf/ (inscription officielle aux concours directs de la Fonction publique).

## Compte et code d'activation (data.js)
**Codes administrateur (v4.1)** : `ADMIN_EMAILS` (data.js) contient vos deux Gmail. Chacun a un code personnel à 6 chiffres, visible dans
*Admin > Afficher les codes administrateur* (PIN requis). Ce code active n'importe quel compte, dans tous les modes. Les demandes d'activation
par Gmail sont envoyées aux deux adresses. Ne communiquez ce code qu'aux personnes à activer.

`REQUIRE_ACCOUNT:true` oblige la création du compte. Deux modes :
1. **Sans serveur (`ACCOUNT_URL:""`)** : l'utilisateur envoie sa demande par WhatsApp/e-mail ; toi, tu génères son code dans
   *Plus > (7 appuis sur le titre) Admin > Code d'activation* et tu le lui renvoies sur le **même** numéro/e-mail.
2. **Avec serveur (e-mail automatique)** : crée une Google Sheet > Extensions > Apps Script, colle ce code,
   Déployer > Application web (Exécuter en tant que : moi ; Accès : tout le monde), puis copie l'URL dans `ACCOUNT_URL`.

        function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
        function doPost(e){
          var d=JSON.parse(e.postData.contents),sh=SpreadsheetApp.getActiveSheet(),rows=sh.getDataRange().getValues(),k=String(d.contact).toLowerCase();
          function find(){for(var i=rows.length-1;i>=0;i--){if(String(rows[i][4]).toLowerCase()===k&&String(rows[i][6])===String(d.did))return i}return -1}
          if(d.action==="signup"){
            var code=("000000"+Math.floor(Math.random()*1000000)).slice(-6);
            sh.appendRow([new Date(),d.nom,d.prenom,d.naissance,d.contact,d.type,d.did,code,"non"]);
            if(d.type==="email")MailApp.sendEmail(d.contact,"Code d'activation PREP' CONCOURS BF","Bonjour "+d.prenom+",\nTon code d'activation : "+code);
            return out({ok:true});
          }
          var i=find(); if(i<0)return out({ok:false});
          if(d.action==="resend"){ if(String(rows[i][5])==="email")MailApp.sendEmail(d.contact,"Code d'activation PREP' CONCOURS BF","Ton code d'activation : "+rows[i][7]); return out({ok:true}) }
          if(d.action==="delete"){ sh.deleteRow(i+1); return out({ok:true}) }   // suppression de compte (exigée par Google Play / App Store)
          if(d.action==="verify"){ var good=String(rows[i][7])===String(d.code); if(good)sh.getRange(i+1,9).setValue("oui"); return out({ok:good}) }
          return out({ok:false});
        }
**Important** : l'envoi automatique par SMS n'existe pas sans passerelle SMS payante. Pour un numéro de téléphone, le code est
enregistré dans la feuille (colonne H) et tu l'envoies par SMS/WhatsApp ; seul l'envoi par e-mail est automatique.

## Backend Node.js (recommandé, remplace Apps Script)
Dossier **backend/** : comptes, codes hachés, synchronisation de la progression, assistant IA, inscriptions, annonces, API admin. Voir **backend/README.md** et **backend/DEPLOY.md** (mise en ligne). L'ancien script `serveur/*.gs` est remplacé.

## Annonces officielles en direct (FEED)
- `FEED_RSS` (data.js) : liste de flux RSS/Atom lus à l'ouverture, toutes les 5 min et au retour du réseau ; seules les annonces contenant
  un mot de `FEED_KEYWORDS` (concours, recrutement, résultats…) déclenchent une notification. L'écran **Concours > Actualiser** affiche l'état de chaque source.
  Flux configurés : leFaso.net (vérifié), Sidwaya, AIB, Burkina24 (adresses standard `/feed/`, à vérifier dans Actualiser).
- `FEED_URL` : JSON que **tu** publies (annonces vraiment officielles) : `{"notifications":[{"id":"1","titre":"…","texte":"…","date":"2026-10-08","lien":"https://…"}],"concours":[{"nom":"…","debut":"2026-11-01","fin":"2026-11-30","lien":"https://www.econcours.gov.bf/"}]}`
- Aucun flux RSS gouvernemental officiel pour les concours n'a été trouvé : publie les communiqués officiels dans `FEED_URL`.

## Source de configuration en ligne (CONFIG_URL)
JSON hébergé en HTTPS (que toi seul peux modifier) lu à chaque « Actualiser » : permet de changer sans recompiler
`FEED_URL, FEED_RSS, FEED_KEYWORDS, REGISTER_URL, ACCOUNT_URL, AI_URL, WHATSAPP, PHONE, EMAIL, FACEBOOK, ECONCOURS, SITES`,
et d'ajouter concours/annonces/FAQ. Le prix et le numéro de paiement ne sont **jamais** modifiables à distance (sécurité).
Les liens peuvent aussi être saisis dans l'écran Admin.

## Assistant IA
Répond sur tous les domaines grâce à un modèle d'IA (Gemini, ChatGPT/OpenAI ou Claude, au choix) appelé par ton script Google (la clé API reste côté serveur). Installation : voir **ASSISTANT_IA.md** et `serveur/apps_script_comptes_et_ia.gs` (ce script remplace celui de la section « Compte et code d'activation »). Hors ligne, il répond avec le contenu de l'application.

## Repères du Burkina Faso
Données dans `assets/www/reperes.js` (arrêtées au 8 octobre 2026). À mettre à jour après chaque remaniement ou changement de texte.
Les biographies des ministres se limitent aux éléments vérifiés ; la plupart n'ont pas de publication recensée.

## Inscriptions en ligne (candidats)
Dans Concours, chaque concours « En cours » affiche « S'inscrire en ligne ». Pour recevoir les inscriptions : Google Sheet > Apps Script
(`doPost` qui fait `appendRow([new Date(),d.ref,d.concours,d.nom,d.prenom,d.naissance,d.lieu,d.sexe,d.tel,d.email,d.cnib,d.diplome])`), URL dans `REGISTER_URL`.

## Audio, questions
Lecture vocale native (Réviser > Audio). Banques : `questions.js`, `questions2.js` (quiz) et `bank.js` (annales : 8 × 200 QCM).
Ajout de questions dans l'app : Plus > Ajouter des questions.
