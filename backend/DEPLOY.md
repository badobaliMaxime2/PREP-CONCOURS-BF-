# Mettre le serveur en ligne

Le serveur a besoin d'une adresse **HTTPS publique** et d'un **disque persistant** (la base SQLite).
Aucune offre gratuite durable avec disque n'a été retenue : prévoir quelques dollars par mois.

| Option | Coût indicatif* | Difficulté |
|---|---|---|
| **A. Fly.io** (recommandé) | ≈ 2 à 4 $/mois (machine à partir d'environ 2,19 $ + volume 0,15 $/Go) | Facile |
| **B. Petit serveur loué (VPS)** | ≈ 5 $/mois | Moyenne (il faut un nom de domaine, même gratuit type duckdns.org) |

\*Prix à vérifier sur la page officielle du fournisseur avant de s'engager.

## Avant de commencer : préparer les secrets
    openssl rand -hex 32     # → SERVER_SECRET
    openssl rand -hex 32     # → ADMIN_TOKEN  (à noter : tu le saisiras dans l'écran Admin de l'app)
    node scripts/admin-code.js 2       # → 2 codes administrateur longs (voir ci-dessous)
Clés à créer : une clé IA (Google AI Studio pour Gemini, ou OpenAI / Anthropic) et une clé **Resend** (resend.com) pour les e-mails d'activation.

## Option A : Fly.io
    curl -L https://fly.io/install.sh | sh
    fly auth signup                      # ou : fly auth login   (carte bancaire demandée)
    cd backend
    # 1) éditer fly.toml : mettre un nom d'application unique à la ligne  app = "..."
    fly apps create TON-NOM-UNIQUE
    fly volumes create data --size 1 --region cdg
    fly secrets set SERVER_SECRET=... ADMIN_TOKEN=... ADMIN_CODES=T68K-NXHR-QQ3Z,J9HF-5ZRZ-LD9X \
        AI_PROVIDER=gemini AI_KEY=... RESEND_API_KEY=... MAIL_FROM="PREP' CONCOURS BF <onboarding@resend.dev>"
    fly deploy
    curl https://TON-NOM-UNIQUE.fly.dev/        # doit répondre {"ok":true,"service":"prepconcours"}
⚠️ Fly ne permet pas de relire les secrets : garde ton ADMIN_TOKEN dans un gestionnaire de mots de passe.
Garde **une seule machine** (`fly scale count 1`) : SQLite ne se partage pas entre plusieurs machines.

## Option B : VPS (Debian/Ubuntu avec Docker)
    # DNS : faire pointer ton domaine (ex. prepbf.duckdns.org) vers l'IP du serveur
    git clone … && cd backend       # ou copier le dossier backend/ sur le serveur
    cp .env.example .env && nano .env          # remplir les secrets
    echo "DOMAIN=prepbf.duckdns.org" >> .env
    docker compose --env-file .env up -d --build
Le HTTPS est obtenu et renouvelé automatiquement (Caddy).

## Codes administrateur
Un **code administrateur** permet à une personne de créer et d'activer son compte, avec ou sans internet, sans attendre de code par e-mail.
- Le serveur reçoit les codes dans `ADMIN_CODES` (séparés par des virgules).
- L'application ne contient que leurs **empreintes** (`ADMIN_HASHES` dans `data.js`) : on ne peut pas retrouver un code à partir de l'APK.
- Pour en créer de nouveaux : `node scripts/admin-code.js 2` affiche les codes, la ligne `ADMIN_CODES=` du serveur et la ligne `ADMIN_HASHES:` de `data.js`.
- Donne un code à une personne = elle peut activer **un** compte à tout moment. Si un code circule trop, remplace-le (nouvelle empreinte dans `data.js` + nouvel APK + nouvelle valeur sur le serveur).

## Brancher l'application
Dans `app/src/main/assets/www/data.js`, avec ton adresse (sans `/` final) :

    ACCOUNT_URL:  "https://TON-SERVEUR",           // comptes, activation, assistant IA, synchronisation
    REGISTER_URL: "https://TON-SERVEUR/register",  // inscriptions aux concours
    FEED_URL:     "https://TON-SERVEUR/feed.json", // annonces officielles
puis `./release.sh` et publier le nouvel APK. **Test avant publication** : installer l'APK, 7 appuis sur le titre →
saisir le jeton → « Tester la connexion au serveur » doit afficher ✅.

## Sauvegardes (important : ce sont les données de tes utilisateurs)
    # Fly.io
    fly ssh console -C "node --no-warnings scripts/backup.js /data/backups"
    # VPS
    docker compose exec app node --no-warnings scripts/backup.js /data/backups
Fais-le régulièrement et récupère les fichiers `.db` ailleurs que sur le serveur.

## En cas de problème
- **L'app affiche « Serveur injoignable »** : l'adresse est fausse, le serveur est éteint, ou l'adresse ne commence pas par `https://`.
- **« Réponse inattendue du serveur »** : l'adresse pointe vers autre chose que ce serveur (ex. ancien script Google).
- **« Le code n'a pas pu être envoyé par e-mail »** : vérifier `RESEND_API_KEY` ; avec l'expéditeur de test `onboarding@resend.dev`, Resend n'écrit qu'à l'adresse de ton propre compte Resend → vérifier ton propre domaine sur resend.com pour écrire à tout le monde.
- Journaux : `fly logs` ou `docker compose logs -f app`.
