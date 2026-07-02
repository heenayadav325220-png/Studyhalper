# StudyHelper APK Build Guide

## Prerequisites
- **Android Studio** (latest version)
- **JDK 11+**
- **Node.js 18+**
- **npm or yarn**

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Add Android Platform
```bash
npx cap add android
```

## Step 3: Build Web App
```bash
npm run build
```

## Step 4: Sync with Android
```bash
npx cap sync android
```

## Step 5: Create Signing Key (for Release APK only)
```bash
keytool -genkey -v -keystore studyhelper-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias studyhelper-key
```

**Keep this file safe!** You'll need it for app updates.

## Step 6: Build APK

### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
cd ..
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for Google Play)
```bash
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=../studyhelper-key.keystore \
  -Pandroid.injected.signing.store.password=YOUR_PASSWORD \
  -Pandroid.injected.signing.key.alias=studyhelper-key \
  -Pandroid.injected.signing.key.password=YOUR_PASSWORD
cd ..
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Step 7: Test APK
```bash
# Install on connected device/emulator
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or use Android Studio
# File > Run > Run 'app'
```

## Troubleshooting

### Gradle Build Fails
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Capacitor Sync Issues
```bash
npx cap copy
npx cap open android
```

### Update Existing APK
Always use the same keystore file and credentials!

## Uploading to Google Play
1. Create Google Play Developer account ($25 one-time)
2. Create a new app
3. Upload release APK
4. Fill in app details, screenshots, description
5. Submit for review

For more info: https://capacitorjs.com/docs/android
