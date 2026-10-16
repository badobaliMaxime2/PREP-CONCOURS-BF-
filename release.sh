#!/data/data/com.termux/files/usr/bin/bash
# Compile l'APK signé (release) et l'AAB signé. Prérequis : ./setup_termux.sh puis ./make_keystore.sh
set -e
cd "$(dirname "$0")"
[ -f keystore.properties ] || { echo "Crée d'abord ta clé de signature : ./make_keystore.sh"; exit 1; }
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=${JAVA_HOME:-$PREFIX/lib/jvm/java-17-openjdk}
echo "sdk.dir=$ANDROID_HOME" > local.properties
if [ ! -f gradlew ]; then
  T=$(mktemp -d); (cd $T && touch settings.gradle && gradle wrapper --gradle-version 8.9 -q)
  cp -r $T/gradlew $T/gradle .; chmod +x gradlew
fi
./gradlew assembleRelease bundleRelease -Pandroid.aapt2FromMavenOverride=$PREFIX/bin/aapt2 --no-daemon
APK=app/build/outputs/apk/release/app-release.apk
AAB=app/build/outputs/bundle/release/app-release.aab
mkdir -p /sdcard/Download 2>/dev/null || true
cp "$APK" /sdcard/Download/PrepConcoursBF-v4.6-release.apk && echo "=== APK signé : /sdcard/Download/PrepConcoursBF-v4.6-release.apk ==="
cp "$AAB" /sdcard/Download/PrepConcoursBF-v4.6.aab && echo "=== AAB signé : /sdcard/Download/PrepConcoursBF-v4.6.aab ==="
echo "NB : cette version cible l'API 34 (essais, partage direct). Pour Google Play (API 36) utilise GitHub Actions : voir PUBLIER.md"
