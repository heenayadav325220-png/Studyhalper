# 📱 StudyHelper - Full APK Build Setup Guide

Your StudyHelper app is now fully configured to build as an Android APK! Follow these steps to create your app.

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Java JDK 11+** - [Download](https://adoptopenjdk.net/)
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (API 34) - Install via Android Studio

### Build Debug APK (Testing)
```bash
# One command to build everything
npm run apk:debug
```
✅ APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Install on Phone
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📋 Detailed Setup Steps

### Step 1: Clone & Install
```bash
# Install dependencies
npm install

# Add Android platform (if not already added)
npm run capacitor:add
```

### Step 2: Create Signing Key (for Release only)
This is required to publish on Google Play Store. **Save this file securely!**

```bash
keytool -genkey -v -keystore studyhelper-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias studyhelper-key
```

**You'll be prompted to enter:**
- Keystore password (remember this!)
- Key alias: `studyhelper-key`
- Key password (can be same as keystore)
- Name, organization, etc.

### Step 3: Build APK

#### Option A: Debug APK (Testing)
```bash
npm run apk:debug
```

#### Option B: Release APK (Production/Play Store)
```bash
# Edit android/app/build.gradle first and set:
# - keystore path
# - passwords

npm run apk:release
```

#### Option C: Using the Build Script
```bash
chmod +x build-apk.sh
./build-apk.sh
```

---

## 🔑 Environment Setup

### Set Up Android Studio
1. Open Android Studio
2. **Tools → SDK Manager**
3. Install:
   - Android SDK Platform 34
   - Android SDK Tools
   - Android Emulator
   - Android SDK Build-Tools 34.x.x

### Set ANDROID_HOME
**Linux/Mac:**
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows:**
```powershell
setx ANDROID_HOME "C:\Users\YourUsername\AppData\Local\Android\sdk"
setx PATH "%PATH%;%ANDROID_HOME%\emulator"
setx PATH "%PATH%;%ANDROID_HOME%\tools"
setx PATH "%PATH%;%ANDROID_HOME%\tools\bin"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools"
```

---

## 📲 Testing Your APK

### Using Android Emulator
```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_4_API_34

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# View logs
adb logcat
```

### Using Physical Device
1. Enable **Developer Mode**: Settings → About → Tap Build Number 7 times
2. Enable **USB Debugging**: Developer Options → USB Debugging
3. Connect via USB
4. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🎯 Signing Release APK

### Manual Signing
```bash
cd android/app/build/outputs/apk/release/
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ../../studyhelper-key.keystore \
  app-release-unsigned.apk studyhelper-key

zipalign -v 4 app-release-unsigned.apk app-release.apk
```

### Verify Signature
```bash
jarsigner -verify -verbose -certs app-release.apk
```

---

## 🌐 Publishing to Google Play Store

### 1. Create Developer Account
- Visit [Google Play Console](https://play.google.com/console)
- Pay $25 one-time fee
- Create app entry

### 2. Prepare Store Listing
- App name: "Ascend Study"
- Icon: 512x512 PNG
- Screenshots: 2-8 per device type
- Description: ~80 characters
- Full description: ~4000 characters
- Changelog

### 3. Upload APK
- Build → Releases → Create release
- Upload `app-release.apk`
- Set version name & code
- Add release notes

### 4. Content Rating
- Complete questionnaire
- Google provides rating

### 5. Submit for Review
- Check all sections complete
- Click "Submit for review"
- Review takes 24-48 hours

---

## 🐛 Troubleshooting

### Build Fails: "Gradle not found"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### "ANDROID_HOME not set"
```bash
echo $ANDROID_HOME
# If empty, set it (see Environment Setup above)
```

### App Won't Install
```bash
# Check device storage
adb shell df -h /data

# Uninstall old version
adb uninstall com.ascendstudy.app

# Try again
adb install app-debug.apk
```

### Permission Denied on Keystore
```bash
chmod 600 studyhelper-key.keystore
```

### Build Slow
- Close other apps
- Use `-x` to skip tests: `./gradlew assembleDebug -x test`
- Increase Gradle memory in `gradle.properties`

---

## 📦 Project Structure
```
Studyhalper/
├── src/                 # React TypeScript source
├── android/             # Android native code
│   ├── app/
│   │   ├── build.gradle # App config
│   │   └── proguard-rules.pro
│   └── build.gradle
├── capacitor.config.ts  # Capacitor config
├── package.json         # NPM scripts
├── APK_BUILD_GUIDE.md   # This guide
└── build-apk.sh         # Build script
```

---

## 📚 Useful Commands

```bash
# Build web & sync
npm run build && npm run capacitor:sync

# Open in Android Studio
npm run capacitor:open

# View Capacitor status
npx cap doctor

# Clean build
cd android && ./gradlew clean && cd ..

# Build with verbose output
cd android && ./gradlew assembleDebug --info && cd ..
```

---

## ✅ Checklist Before Publishing

- [ ] App name: "Ascend Study"
- [ ] App ID: `com.ascendstudy.app`
- [ ] Version code incremented
- [ ] All features tested on device
- [ ] Permissions in AndroidManifest.xml correct
- [ ] No API keys in source code (use env vars)
- [ ] Firebase/Google AI configured
- [ ] APK signed with final keystore
- [ ] Backup of keystore file created
- [ ] Google Play account created
- [ ] App icon & screenshots ready
- [ ] Description & changelog written

---

## 🔗 Resources

- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [Google Play Console](https://play.google.com/console)
- [Android Studio Docs](https://developer.android.com/studio/intro)
- [Gradle Documentation](https://gradle.org/documentation/)

---

**Questions?** Check the APK_BUILD_GUIDE.md or Capacitor docs!

Good luck with your StudyHelper app! 🎓
