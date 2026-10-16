#!/data/data/com.termux/files/usr/bin/bash
# Étape 1 : installer les outils (une seule fois)
set -e
pkg update -y
pkg install -y openjdk-17 gradle aapt2 wget unzip
export ANDROID_HOME=$HOME/android-sdk
mkdir -p $ANDROID_HOME/cmdline-tools
if [ ! -d $ANDROID_HOME/cmdline-tools/latest ]; then
  cd $TMPDIR
  wget -O cmd.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -q cmd.zip -d $ANDROID_HOME/cmdline-tools
  mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest
fi
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-34" "build-tools;34.0.0"
echo "Installation terminée. Lance maintenant : ./build.sh"
