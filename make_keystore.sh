#!/data/data/com.termux/files/usr/bin/bash
# Crée UNE SEULE FOIS la clé de signature de l'application (à conserver toute la vie de l'app).
set -e
cd "$(dirname "$0")"
if [ -f prepconcours-release.jks ]; then
  echo "La clé existe déjà : ne la recrée JAMAIS (sans elle, tu ne pourras plus mettre l'app à jour)."; exit 1
fi
echo "Choisis un mot de passe de 8 caractères minimum, SANS espace (lettres et chiffres)."
echo "Il s'affiche à l'écran pour éviter les erreurs de saisie."
read -p "Mot de passe > " PW
PW=$(printf '%s' "$PW" | tr -d ' ')
if [ ${#PW} -lt 8 ]; then echo "Trop court : ${#PW} caractères. Relance ./make_keystore.sh"; exit 1; fi
echo
echo "Mot de passe retenu : $PW"
echo ">>> NOTE-LE sur papier maintenant. <<<"
read -p "Appuie sur Entrée pour créer la clé " X
keytool -genkeypair -keystore prepconcours-release.jks -alias prepconcours \
  -keyalg RSA -keysize 2048 -validity 10000 -storepass "$PW" -keypass "$PW" \
  -dname "CN=PREP CONCOURS BF, O=PREP CONCOURS BF, C=BF"
cat > keystore.properties <<EOP
storeFile=prepconcours-release.jks
storePassword=$PW
keyAlias=prepconcours
keyPassword=$PW
EOP
chmod 600 keystore.properties prepconcours-release.jks
echo
echo "Clé créée : $(pwd)/prepconcours-release.jks"
echo "SAUVEGARDE-LA maintenant (Drive, e-mail à toi-même…) avec son mot de passe. Ne la partage jamais."
