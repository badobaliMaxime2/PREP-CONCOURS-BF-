# Backend PREP' CONCOURS BF

Serveur Node.js (≥ 22.13) **sans aucune dépendance** (base SQLite intégrée à Node). Il remplace le script Google Apps Script
et parle le **même protocole** : l'application n'a pas besoin d'être modifiée, il suffit de renseigner son adresse.

## Ce qu'il fait
| Fonction | Route | Utilisé par l'app via |
|---|---|---|
| Comptes : inscription, code, renvoi, vérification (renvoie un **jeton de session**), déconnexion, suppression | `POST /` ou `/api` (`action` = signup, resend, verify, adminactivate, logout, delete) | `ACCOUNT_URL` |
| **Synchronisation de la progression** (résultats, objectif, questions ajoutées) entre appareils | `POST /` (`action` = sync, avec jeton) | `ACCOUNT_URL` |
| Assistant IA (Gemini / OpenAI / Claude), réservé aux sessions valides, avec plafonds | `POST /` (`action` = ask, avec jeton) | `AI_URL` (ou `ACCOUNT_URL`) |
| Code Premium vérifié côté serveur | `POST /` (`action` = premium) | `ACCOUNT_URL` |
| Inscriptions aux concours | `POST /register` | `REGISTER_URL` |
| Annonces officielles / configuration à distance | `GET /feed.json`, `GET /config.json` | `FEED_URL`, `CONFIG_URL` |
| Administration (jeton) | `/admin/stats`, `/admin/users`, `/admin/pending-codes`, `/admin/premium-code?did=…`, `/admin/registrations[?format=csv]`, `PUT /admin/feed`, `PUT /admin/config` | écran **Admin** de l'app (7 appuis sur le titre) ou curl |

## Sécurité
- **Plus aucun secret dans l'APK** : le PIN admin et la clé qui fabriquait les codes ont disparu de l'application. Les codes Premium et les codes administrateur sont calculés/contrôlés par le serveur uniquement.
- Codes d'activation **hachés** (HMAC), valables 24 h, **5 essais** puis verrouillage, renvoi limité à 1 par minute. Seul le code des comptes « téléphone » est gardé en clair (tu dois l'envoyer par WhatsApp/SMS) ; il est effacé dès l'activation.
- Sessions par jeton aléatoire (seule son empreinte est stockée, 5 sessions maximum par compte), révoquées à la déconnexion.
- Suppression de compte : exige le jeton et efface **tous** les appareils et la progression du compte.
- Limitation de débit par IP, plafonds IA par compte et globaux, clé IA uniquement côté serveur, comparaisons à temps constant, données de synchronisation validées et bornées.

## Création de compte : jamais bloquée
- Si le serveur est injoignable, en panne ou refuse la demande, le compte est **quand même créé sur le téléphone** ; la personne peut l'activer avec un **code administrateur** (contrôlé sur le téléphone par empreinte, et sur le serveur dès qu'il répond).
- Un code administrateur crée le compte côté serveur même si l'inscription initiale avait échoué, et passe outre le verrouillage après de mauvais essais.
- Si l'e-mail d'activation ne part pas, le compte existe quand même et l'utilisateur est orienté vers l'administrateur.
- Les limites de débit sont larges (beaucoup d'utilisateurs partagent la même adresse IP sur les réseaux mobiles).

## Synchronisation de la progression
L'historique des quiz est fusionné (union), les questions ajoutées et l'objectif suivent « le plus récent gagne ». Après activation sur un nouveau téléphone avec le même e-mail/numéro, la progression est restaurée. Une modification faite pendant une synchronisation n'est jamais écrasée.

## Lancer en local
    cd backend
    cp .env.example .env     # puis remplis SERVER_SECRET et ADMIN_TOKEN (openssl rand -hex 32)
    set -a; . ./.env; set +a
    npm start                # http://localhost:3000
    npm test                 # 26 tests

Sans `RESEND_API_KEY`, les codes d'activation e-mail s'affichent dans la console (mode développement).

## Déployer et brancher l'application
Voir **DEPLOY.md** (Fly.io ou serveur loué, sauvegardes, dépannage).

## Exemples d'administration
    H="Authorization: Bearer $ADMIN_TOKEN"; S=https://TON-SERVEUR
    curl -H "$H" $S/admin/stats
    curl -H "$H" $S/admin/pending-codes                 # codes à envoyer par SMS/WhatsApp
    curl -H "$H" -X POST $S/admin/users/12/activate     # activer un compte à la main
    curl -H "$H" "$S/admin/registrations?format=csv" -o inscriptions.csv
    curl -H "$H" -X PUT $S/admin/feed -d '{"notifications":[{"id":"1","titre":"…","texte":"…","date":"2026-10-13","lien":"https://www.econcours.gov.bf/"}],"concours":[]}'

## Limites actuelles
- Ce serveur remplace `serveur/apps_script_comptes_et_ia.gs` (ancien script, conservé pour mémoire, à ne plus utiliser).
- Les anciens codes administrateur (6 chiffres, calculés avec l'ancienne clé de l'APK) ne fonctionnent plus : utiliser les nouveaux codes longs (`scripts/admin-code.js`).
- Les comptes déjà activés avec l'ancienne version devront se réactiver une fois (nouveau code) pour obtenir une session.
- Un seul serveur (SQLite) suffit pour des milliers d'utilisateurs ; au-delà, passer à PostgreSQL.
- `npm test` : 26 tests (API, et vrai code de l'app contre le vrai serveur).

## Paiement des abonnements par MSY PAY (MONDIASYSTEM)

Les abonnements (1 500 F par mois, 3 000 F à vie) sont encaissés par **MONDIASYSTEM** grâce à MSY PAY
Développeurs (Orange Money, Moov Money, Wave…). La répartition suit la convention PREP' CONCOURS BF /
MONDIASYSTEM : **45 % des recettes nettes pour PREP' CONCOURS BF, 55 % pour MONDIASYSTEM**. Elle est
calculée et tenue par MONDIASYSTEM (onglet « Mes revenus » de mondiasystem.com/store-publier).

1. Sur `mondiasystem.com/store-publier`, carte « MSY PAY — achats intégrés » : indiquer l'adresse d'avis
   `https://<ton-adresse>/msy-pay/avis`, puis **Créer ma clé API**. Copier aussitôt les deux secrets.
2. Variables du serveur (jamais dans l'application, jamais dans Git) :
   - `MSY_PAY_API_KEY` : la clé `msk_….mss_…` ;
   - `MSY_PAY_WEBHOOK_SECRET` : le secret `whs_…` ;
   - `MSY_PAY_RETURN_URL` : `https://<ton-adresse>/msy-pay/retour` ;
   - facultatif : `PRIX_MOIS` (1500) et `PRIX_VIE` (3000), qui doivent rester égaux aux prix affichés dans l'application.
3. Parcours : « Payer » dans l'application → page MSY PAY → paiement → MSY PAY prouve le paiement chez le
   fournisseur et prévient le serveur (`POST /msy-pay/avis`, signé) → le serveur relit le statut et active
   l'abonnement **une seule fois** ; « Vérifier mon abonnement » fait la même vérification si l'avis tarde.
4. Suivi : `GET /admin/msy-payments` (paiements demandés, payés, appliqués).

Sans ces trois variables, le paiement en ligne reste désactivé et le paiement manuel (code USSD + preuve) continue.

## E-mails (codes d'inscription) par MSY Mail (MONDIASYSTEM)

Les codes d'activation envoyés par e-mail partent par **MSY Mail** dès que `MSY_MAIL_KEY` est défini : expéditeur
`no-reply@mondiasystem.com` au nom de l'application, signé DKIM, donc reçu en boîte de réception.

1. Sur `mondiasystem.com/msy-cloud`, application `prep-concours`, section « E-mails de l'application (MSY Mail) » :
   **Créer ma clé d'envoi**, puis la copier aussitôt (affichée une seule fois).
2. Variable du serveur : `MSY_MAIL_KEY` (jamais dans l'application ni dans Git), puis redéployer.
3. Plafonds du pilote : 300 e-mails par jour, 5 par destinataire et par heure (au-delà : erreur 429).

Sans `MSY_MAIL_KEY`, l'envoi reste celui de Resend (attention : l'expéditeur de test `onboarding@resend.dev` ne livre
qu'au titulaire du compte Resend, d'où les codes jamais reçus).
