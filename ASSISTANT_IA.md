# Assistant IA : réponses sur tous les domaines, dans le monde entier

L'assistant s'appuie d'abord sur le contenu de l'application (cours, repères, annales), puis complète avec une IA pour **toutes** les autres questions.
Hors connexion, il répond avec le contenu de l'application. Les refus (sexe, politique partisane, discrimination, terrorisme, religion/crédibilité) restent actifs **dans l'application et dans le serveur**.

## Pourquoi pas directement gemini.google.com ou chatgpt.com ?
Ce sont des **sites de discussion** (connexion personnelle obligatoire) : une application ne peut pas y envoyer une question et en lire la réponse, et leurs conditions d'utilisation l'interdisent. La bonne méthode est leur **API**, appelée par ton script Google (la clé reste cachée, hors de l'APK).
Pour dépanner, quand l'IA est indisponible, l'assistant propose aussi deux boutons : **💬 Demander à ChatGPT** (ouvre chatgpt.com avec la question) et **✨ Demander à Gemini** (ouvre gemini.google.com : colle ta question).

## Choisir le fournisseur (un seul suffit)
| Fournisseur | Clé | Coût |
|---|---|---|
| **Gemini (conseillé pour démarrer)** | https://aistudio.google.com/app/apikey → « Create API key » | Palier gratuit limité (quelques requêtes par minute et par jour, sans carte bancaire) ; limites visibles dans AI Studio |
| ChatGPT / OpenAI | https://platform.openai.com → API keys | Payant à l'usage (l'abonnement ChatGPT ne donne pas de clé API) |
| Anthropic (Claude) | https://console.anthropic.com → API Keys | Payant à l'usage |

Attention palier gratuit Gemini : (1) les limites sont strictes, donc avec beaucoup d'utilisateurs l'assistant affichera « limite atteinte » ; passe alors au palier payant ; (2) Google peut utiliser les données du palier gratuit pour améliorer ses produits : c'est indiqué dans la politique de confidentialité. Fixe une limite de dépense si tu prends un palier payant.

## Installation (Google Apps Script)
1. Google Sheet des comptes → Extensions → **Apps Script**.
2. Remplace **tout** le code par `serveur/apps_script_comptes_et_ia.gs`.
3. Engrenage **Paramètres du projet** → **Propriétés du script** → ajoute :
   - `AI_PROVIDER` = `gemini` (ou `openai`, ou `anthropic`)
   - `AI_KEY` = ta clé API
   - `ADMIN_CODES` = `069833,402903`
   - (facultatif) `AI_MODEL` = nom du modèle si le modèle par défaut est refusé (par défaut : `gemini-2.5-flash`, `gpt-4o-mini`, `claude-haiku-5-5`). Les noms de modèles changent souvent : vérifie ceux proposés dans ton tableau de bord.
4. **Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version → Déployer** (l'adresse `/exec` ne change pas). Accepte les autorisations.
5. Dans un navigateur, ouvre l'adresse `/exec` : tu dois voir `{"ok":true,"service":"prepconcours"}`.

## Donner l'adresse du serveur à TOUS les utilisateurs
Dans Termux, dans le dossier du projet (remplace `TON_ADRESSE`) :

    sed -i 's|ACCOUNT_URL: ""|ACCOUNT_URL: "https://script.google.com/macros/s/TON_ADRESSE/exec"|' app/src/main/assets/www/data.js
    grep -n ACCOUNT_URL app/src/main/assets/www/data.js

puis `./release.sh`. Pour un essai immédiat sur ton téléphone : 7 appuis sur le titre → PIN → Liens en ligne → Serveur de comptes.

## Comptes autorisés
Seuls les comptes **activés** (colonne I = « oui » dans la feuille) peuvent utiliser l'IA : cela empêche l'usage de ta clé par n'importe qui. Un compte activé avant la mise à jour : écris « oui » à la main dans la colonne I.

## Limites (modifiables en haut du script)
25 questions IA par appareil et par période de 6 h ; 800 au total par période de 6 h. Si le fournisseur répond « quota dépassé », l'assistant affiche « limite atteinte » et propose le support, ChatGPT et Gemini.

## Actualité en direct (option)
`USE_WEB = true` dans le script active la recherche web (Gemini : Google Search ; Anthropic : web_search). Peut être payant. Sans cela, l'assistant dit de vérifier les informations récentes.

## En cas de problème
Sous la réponse de l'assistant, une ligne « ⚙️ IA indisponible : … » indique la cause :
- *adresse du serveur non configurée* : `ACCOUNT_URL` est vide.
- *réponse invalide du serveur* : script non redéployé ou déploiement non ouvert à « Tout le monde ».
- *serveur : config* : `AI_KEY` absente ou `AI_PROVIDER` inconnu.
- *serveur : auth* : compte non activé côté feuille (colonne I).
- *serveur : ai – …* : message du fournisseur (clé invalide, modèle introuvable, crédit insuffisant, contenu bloqué).
Apps Script → **Exécutions** donne le détail côté serveur.

## Précisions honnêtes
Une IA peut se tromper : l'application l'indique sous chaque réponse. Sans recherche web, ses connaissances s'arrêtent à une date passée. Les questions sont envoyées au fournisseur choisi via ton script.
