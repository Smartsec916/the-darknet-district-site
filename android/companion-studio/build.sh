#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:?Android SDK required}}"
TOOLS="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"
mkdir -p build/classes build/dex
"$TOOLS/aapt2" compile --dir res -o build/resources.zip
"$TOOLS/aapt2" link -I "$PLATFORM" --manifest AndroidManifest.xml -o build/unsigned.apk build/resources.zip
javac -source 8 -target 8 -classpath "$PLATFORM" -d build/classes StudioActivity.java
"$TOOLS/d8" --lib "$PLATFORM" --min-api 23 --output build/dex build/classes/com/darknetdistrict/companionstudio/StudioActivity.class
(cd build/dex && zip -q ../unsigned.apk classes.dex)
"$TOOLS/zipalign" -f 4 build/unsigned.apk build/aligned.apk
# A fresh development key is used for this sideloadable build only. No production signing key or secrets.
keytool -genkeypair -alias studio -keyalg RSA -keysize 2048 -validity 3650 -keystore build/studio-dev.p12 -storepass android -keypass android -dname 'CN=Companion Studio Development' -storetype PKCS12 -noprompt
"$TOOLS/apksigner" sign --ks build/studio-dev.p12 --ks-pass pass:android --key-pass pass:android --out build/CompanionStudio.apk build/aligned.apk
"$TOOLS/apksigner" verify --verbose build/CompanionStudio.apk
"$TOOLS/aapt2" dump badging build/CompanionStudio.apk
