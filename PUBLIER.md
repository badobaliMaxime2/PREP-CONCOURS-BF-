# Publier PREP' CONCOURS BF : APK, AAB (Google Play) et iOS (App Store)

| Livrable | Où le fabriquer | Remarque |
|---|---|---|
| APK d'essai (installation directe) | Termux : `./build.sh` | Déjà testé chez toi |
| APK + AAB **signés** (cible API 34) | Termux : `./make_keystore.sh` puis `./release.sh` | Pour partager l'APK ; **l'AAB ne passe plus sur Google Play** (API 36 exigée) |
| **AAB Google Play** (cible API 36) | GitHub Actions (ci-dessous) ou Android Studio sur PC | Voie recommandée |
| **iOS (IPA / TestFlight)** | Un Mac avec Xcode, ou GitHub Actions (runner macOS) | Compte Apple Developer payant obligatoire |

> Ce que j'ai pu vérifier ici : les scripts shell, les fichiers YAML des workflows, la génération de la clé, le pont JavaScript iOS (simulé) et toute l'application web.
> Ce que je n'ai **pas** pu exécuter : la compilation Android avec API 36 et la compilation Swift/Xcode (pas de SDK Android ni de Mac dans mon environnement). Les premières exécutions peuvent donc demander un petit ajustement : envoie-moi le message d'erreur.

## 1. Créer la clé de signature (une seule fois, à ne jamais perdre)
Dans Termux : `./make_keystore.sh` → crée `prepconcours-release.jks` et `keystore.properties`.
**Sauvegarde le fichier .jks et son mot de passe** (Drive, e-mail à toi-même). Sans eux, impossible de mettre l'app à jour.

## 2. APK/AAB signés depuis Termux (essais, partage hors Play Store)
    ./release.sh
Résultats dans Téléchargements : `PrepConcoursBF-v4.6-release.apk` et `PrepConcoursBF-v4.6.aab`.

## 3. AAB pour Google Play (API 36) avec GitHub Actions (gratuit)
1. Crée un compte sur github.com, puis un dépôt **privé** « prepconcours ».
2. Envoie-y le contenu du dossier `prepconcoursbf` (sans `keystore.properties` ni `.jks`, déjà exclus par `.gitignore`).
3. Dépôt → Settings → Secrets and variables → Actions → New repository secret. Ajoute :
   - `KEYSTORE_B64` : résultat de la commande `base64 -w0 prepconcours-release.jks` (dans Termux)
   - `KEYSTORE_PASSWORD` : ton mot de passe
   - `KEY_ALIAS` : `prepconcours`
   - `KEY_PASSWORD` : le même mot de passe
4. Onglet Actions → « Android (APK + AAB…) » → Run workflow.
5. À la fin, télécharge l'artefact **PrepConcoursBF-android** : il contient l'APK et l'**AAB signé**.

**Alternative sur PC** : Android Studio → ouvrir le dossier → dans `gradle.properties` mettre `agpVersion=8.13.0`, `compileApi=36`, `targetApi=36` → Build → Generate Signed App Bundle.

## 4. Mettre l'AAB sur Google Play
1. Compte développeur : https://play.google.com/console (25 USD, une fois).
2. Créer l'application → Production ou Test fermé → importer l'AAB. Accepter **Play App Signing** (ta clé sert de clé d'envoi).
3. Fiches obligatoires : description, captures d'écran, icône 512×512, **URL de la politique de confidentialité**, classification du contenu, **Sécurité des données** (nom, prénom, date de naissance, e-mail/téléphone, identifiant d'appareil collectés pour la création de compte), public cible.
4. **Suppression de compte** : l'application la propose (Plus → Mon compte). Indique-le dans le formulaire.
5. Les comptes personnels récents doivent souvent faire un **test fermé avec plusieurs testeurs pendant une durée minimale** avant la production : vérifie les conditions actuelles dans la Play Console.
6. Cible API : la version publiée par GitHub Actions cible l'API 36, comme Google l'exige depuis le 31 août 2026.

## 5. iOS
Prérequis : **Apple Developer Program** (99 USD/an) pour TestFlight/App Store ; un **Mac** avec Xcode, ou le runner macOS de GitHub.
Le projet est dans `ios/` (même application web, coque native WKWebView avec notifications, ouverture de WhatsApp/e-mail/téléphone, réseau natif sans blocage CORS).

**Sur un Mac :**
    brew install xcodegen
    cd ios && xcodegen generate && open PrepConcoursBF.xcodeproj
Dans Xcode : Signing & Capabilities → choisir ton Team → brancher l'iPhone → Run. Pour publier : Product → Archive → Distribute App → App Store Connect → TestFlight puis soumission.

**Sans Mac (GitHub Actions)** : le workflow « iOS » compile pour le simulateur à chaque lancement (contrôle). Pour un IPA signé, ajoute les secrets `IOS_CERT_P12_B64`, `IOS_CERT_PASSWORD`, `IOS_PROFILE_B64`, `IOS_TEAM_ID` (certificat de distribution + profil de provisionnement créés sur developer.apple.com) puis lance le workflow avec « signer » coché. Cette partie n'a jamais été exécutée : prévois un ou deux essais.

**Points d'attention App Store**
- Apple peut refuser une simple « page web emballée » (règle 4.2). Les points forts à mettre en avant : contenu éducatif hors ligne (1 600+ QCM, cours, repères), notifications d'annonces, compte et assistant intégrés.
- Suppression de compte dans l'application : fait (Plus → Mon compte).
- Politique de confidentialité en ligne : obligatoire.
- Le bundle ID est `bf.prepconcours.app` (modifiable dans `ios/project.yml`).

**Sans payer Apple (solution immédiate pour les iPhone)** : héberger l'application en ligne (GitHub Pages) et l'ajouter à l'écran d'accueil depuis Safari (Partager → Sur l'écran d'accueil). Aucune boutique n'est nécessaire.

## 6. Avant toute publication
- Faire relire les QCM de droit et d'économie et les Repères (ministres, institutions).
- Héberger `POLITIQUE_CONFIDENTIALITE.md` en ligne (GitHub Pages, Google Sites) et mettre son URL dans les fiches des boutiques.
- Plus de secret dans `data.js` : le PIN et la clé secrète ont été retirés de l'application (codes admin et Premium gérés par le serveur, voir backend/).
- Mettre à jour le script Apps Script (action « delete ») puis redéployer une **nouvelle version**.
