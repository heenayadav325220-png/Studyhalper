#!/bin/bash
# Exit on any error
set -e

# Define paths in /tmp (highly spacious, persistent during this run)
TMP_DIR="/tmp/apk-build"
mkdir -p "$TMP_DIR"

ANDROID_HOME="$TMP_DIR/android-sdk"
GRADLE_HOME="$TMP_DIR/gradle-8.9"
export ANDROID_HOME

echo "=== Step 1: Checking and Installing Java 17 ==="
if ! command -v java &> /dev/null; then
    echo "Java not found. Installing OpenJDK 17..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" openjdk-17-jdk-headless unzip curl
else
    echo "Java is already installed."
fi

# Find and export JAVA_HOME
JVM_PATH="/usr/lib/jvm/java-17-openjdk-amd64"
if [ -d "$JVM_PATH" ]; then
    export JAVA_HOME="$JVM_PATH"
    export PATH="$JAVA_HOME/bin:$PATH"
    echo "Set JAVA_HOME to $JAVA_HOME"
fi

java -version

echo "=== Step 2: Checking and Downloading Gradle 8.9 ==="
if [ ! -d "$GRADLE_HOME" ]; then
    echo "Downloading Gradle 8.9..."
    curl -sSL -o "$TMP_DIR/gradle-8.9-bin.zip" https://services.gradle.org/distributions/gradle-8.9-bin.zip
    echo "Unzipping Gradle 8.9..."
    unzip -q "$TMP_DIR/gradle-8.9-bin.zip" -d "$TMP_DIR"
    rm "$TMP_DIR/gradle-8.9-bin.zip"
else
    echo "Gradle 8.9 is already present."
fi
export PATH="$GRADLE_HOME/bin:$PATH"
gradle -v

echo "=== Step 3: Checking and Setting Up Android SDK ==="
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "Android SDK not found. Installing Android SDK in $ANDROID_HOME..."
    mkdir -p "$ANDROID_HOME"
    curl -sSL -o "$TMP_DIR/cmdline-tools.zip" https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
    mkdir -p "$TMP_DIR/cmdline"
    unzip -q "$TMP_DIR/cmdline-tools.zip" -d "$TMP_DIR/cmdline"
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    mv "$TMP_DIR/cmdline/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf "$TMP_DIR/cmdline" "$TMP_DIR/cmdline-tools.zip"
else
    echo "Android SDK is already present."
fi

# Set up licenses and install platform 35 and build-tools 35.0.0
echo "Setting up Android SDK licenses, platforms, and build-tools..."
# Accept licenses
yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null
# Install required tools
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platforms;android-35" "build-tools;35.0.0" "platform-tools"

echo "=== Step 4: Compiling React/Vite Web Assets ==="
npm run build

echo "=== Step 5: Syncing Capacitor Assets with Android Project ==="
npx cap sync android

echo "=== Step 6: Running Gradle Build to Generate APKs ==="
# We use the direct downloaded Gradle binary to bypass corrupt gradle wrapper files!
gradle -p android assembleDebug assembleRelease

echo "=== Step 7: Copying Generated APKs to Workspace Root ==="
mkdir -p apks
if [ -f android/app/build/outputs/apk/debug/app-debug.apk ]; then
    cp -f android/app/build/outputs/apk/debug/app-debug.apk ./apks/AscendStudy-debug.apk
    cp -f android/app/build/outputs/apk/debug/app-debug.apk ./AscendStudy-debug.apk
    echo "Successfully copied Debug APK!"
fi

if [ -f android/app/build/outputs/apk/release/app-release.apk ]; then
    cp -f android/app/build/outputs/apk/release/app-release.apk ./apks/AscendStudy-release.apk
    cp -f android/app/build/outputs/apk/release/app-release.apk ./AscendStudy-release.apk
    echo "Successfully copied Release APK!"
fi

echo "=== APK Build Completed Successfully! ==="
ls -lh apks/
