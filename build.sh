#!/data/data/com.termux/files/usr/bin/bash
# Compile l'APK de PREP' CONCOURS BF
set -e
cd "$(dirname "$0")"
export ANDROID_HOME=$HOME/android-sdk
export JAVA_HOME=${JAVA_HOME:-$PREFIX/lib/jvm/java-17-openjdk}
echo "sdk.dir=$ANDROID_HOME" > local.properties
if [ ! -f gradlew ]; then          # génère le wrapper Gradle 8.9 dans un dossier temporaire
  T=$(mktemp -d); (cd $T && touch settings.gradle && gradle wrapper --gradle-version 8.9 -q)
  cp -r $T/gradlew $T/gradle .; chmod +x gradlew
fi
./gradlew assembleDebug -Pandroid.aapt2FromMavenOverride=$PREFIX/bin/aapt2 --no-daemon
APK=app/build/outputs/apk/debug/app-debug.apk
OUT=/sdcard/Download/PrepConcoursBF-v4.6.apk
cp "$APK" "$OUT" 2>/dev/null && echo "=== APK PRÊT : $OUT ===" || echo "APK : $APK (fais termux-setup-storage puis relance)"
