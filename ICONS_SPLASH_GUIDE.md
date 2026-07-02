# 🎨 Adding App Icons & Splash Screen to StudyHelper

Your app is configured to use the **Ascend Study** branding. Follow this guide to add your custom icons and splash screen images.

## 📱 App Icons Setup

### Icon Sizes Required

Android requires icons in multiple resolutions (density buckets):

| Size | DPI | Folder | Use |
|------|-----|--------|-----|
| 48×48 | LDPI | `ldpi` | Low density phones |
| 72×72 | MDPI | `mdpi` | Medium density (baseline) |
| 96×96 | HDPI | `hdpi` | High density |
| 144×144 | XHDPI | `xhdpi` | Extra high density |
| 192×192 | XXHDPI | `xxhdpi` | Extra extra high density |
| 256×256 | XXXHDPI | `xxxhdpi` | Ultra high density |
| 512×512 | - | root | Google Play Store |

### Step 1: Generate Icon Assets

#### Option A: Using Android Studio (Recommended)
1. Open Android Studio
2. **File → New → Image Asset**
3. Select **Icon Type: Launcher Icons**
4. Choose your source image (use Image 1 - the Ascend logo)
5. Adjust margins & colors as needed
6. Click **Next → Finish**

#### Option B: Manual Setup
1. Save your app icon (Image 1) as `ic_launcher.png`
2. Use an online tool to generate multiple sizes:
   - https://appicon.co/
   - https://makeappicon.com/
   - https://resizeimage.net/

3. Place generated icons in:
```
android/app/src/main/res/
├── mipmap-ldpi/
│   └── ic_launcher.png (48×48)
├── mipmap-mdpi/
│   └── ic_launcher.png (72×72)
├── mipmap-hdpi/
│   └── ic_launcher.png (96×96)
├── mipmap-xhdpi/
│   └── ic_launcher.png (144×144)
├── mipmap-xxhdpi/
│   └── ic_launcher.png (192×192)
└── mipmap-xxxhdpi/
    └── ic_launcher.png (256×256)
```

### Step 2: Round Icon (Optional)

Android 7.1+ supports adaptive icons. Create a rounded version:

1. Create a rounded version of your icon
2. Place it in same folders as `ic_launcher_round.png`
3. It's already configured in `AndroidManifest.xml`:
```xml
android:roundIcon="@mipmap/ic_launcher_round"
```

### Step 3: Verify Icon Configuration

Check `android/app/src/main/AndroidManifest.xml`:
```xml
<application
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ...
/>
```

---

## 🎬 Splash Screen Setup

### Current Configuration

Your app uses the **Ascend Study** splash screen with:
- **Background Color**: Dark Blue (`#001a4d`)
- **Duration**: 3 seconds
- **Auto Hide**: Enabled
- **Fade Out Duration**: 3 seconds

### Step 1: Create Splash Screen Image

Create an image with these specifications:

| Aspect Ratio | Size | Use |
|---|---|---|
| 9:16 (Portrait) | 1080×1920 | Phone splash screens |
| 16:9 (Landscape) | 1920×1080 | Tablet landscape |
| 1:1 | 1024×1024 | Square splash |

**Design Tips:**
- Use Image 2 as your splash screen
- Include app name "Ascend Study"
- Use brand colors: Navy blue (#001a4d) + Light blue (#0066ff)
- Add logo/icon centered
- Keep text in top/center area (account for safe zones)

### Step 2: Place Splash Image

Create drawable folders and add your splash image:

```
android/app/src/main/res/
├── drawable-ldpi/
│   └── splash.png
├── drawable-mdpi/
│   └── splash.png
├── drawable-hdpi/
│   └── splash.png
├── drawable-xhdpi/
│   └── splash.png
├── drawable-xxhdpi/
│   └── splash.png
└── drawable-xxxhdpi/
    └── splash.png
```

Or use a universal drawable:
```
android/app/src/main/res/
└── drawable/
    └── splash.png (1080×1920)
```

### Step 3: Create Splash Layout (Optional)

For more control, create a custom splash layout.

Create `android/app/src/main/res/layout/splash_screen.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/splashScreenBackgroundColor"
    android:gravity="center"
    android:orientation="vertical">

    <ImageView
        android:id="@+id/splash_logo"
        android:layout_width="200dp"
        android:layout_height="200dp"
        android:contentDescription="@string/app_name"
        android:src="@mipmap/ic_launcher" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="30dp"
        android:text="@string/app_name"
        android:textColor="@android:color/white"
        android:textSize="28sp"
        android:textStyle="bold" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="10dp"
        android:text="Learn • Grow • Achieve"
        android:textColor="@color/colorAccent"
        android:textSize="16sp" />
</LinearLayout>
```

### Step 4: Configure in capacitor.config.ts

Already configured! Check your `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 3000,      // 3 seconds
    launchAutoHide: true,
    launchFadeOutDuration: 3000,
    backgroundColor: '#001a4d',     // Dark blue
    showSpinner: false
  }
}
```

#### Customize Splash Screen Timing
Edit `capacitor.config.ts`:
```typescript
SplashScreen: {
  launchShowDuration: 2000,      // Change to 2 seconds
  launchAutoHide: true,
  launchFadeOutDuration: 500,    // Fade faster
  backgroundColor: '#001a4d'
}
```

---

## 🛠️ Quick Setup Using Android Studio

### Automated Icon Generation

1. **Open Android Studio**
2. **Right-click** `android/app/src/main/res` → **New → Image Asset**
3. Choose **Icon Type:**
   - Launcher Icons (Default)
4. **Source Asset:**
   - Click folder icon
   - Select your Ascend logo image (Image 1)
5. **Foreground:**
   - Trim: Adjust as needed
   - Scale: 100%
6. **Background:**
   - Color: `#001a4d` (Navy blue)
7. Click **Next**
8. Review all sizes, then click **Finish**

---

## 📸 Google Play Store Assets

### Additional Images Needed

| Asset | Size | Purpose |
|---|---|---|
| Feature Graphic | 1024×500 | Play Store header |
| Icon | 512×512 | Play Store icon |
| Screenshots | 1080×1920 | App preview (2-8) |
| Banner | 1280×720 | Tablet banner |

### Generated Icon Location
After Android Studio generates:
- **Icon**: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- **Round Icon**: `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

---

## ⚙️ Build & Test with Icons

After adding icons:

```bash
# Sync with Capacitor
npm run capacitor:sync

# Build debug APK with icons
npm run apk:debug

# Install & test
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Check if icons appear on home screen! ✅

---

## 📋 Checklist

- [ ] Icon image prepared (192×192 minimum)
- [ ] Icon placed in correct mipmap folders
- [ ] Round icon created & placed
- [ ] Splash screen image designed (1080×1920)
- [ ] Splash image placed in drawable folders
- [ ] `capacitor.config.ts` updated with splash settings
- [ ] Colors in `colors.xml` match your design
- [ ] Strings in `strings.xml` updated
- [ ] APK built and tested on device
- [ ] Icons display correctly on home screen
- [ ] Splash screen appears for 3 seconds

---

## 🔗 Resources

- [Android Icon Design Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design)
- [Material Design Icons](https://fonts.google.com/icons)
- [AppIcon Generator](https://appicon.co/)
- [Splash Screen Best Practices](https://developer.android.com/develop/ui/splash-screen)
- [Capacitor SplashScreen Plugin](https://capacitorjs.com/docs/apis/splash-screen)

---

## ❓ Troubleshooting

### Icons not showing after build
```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Rebuild
npm run apk:debug
```

### Splash screen not appearing
- Check `capacitor.config.ts` has SplashScreen plugin configured
- Ensure `backgroundColor` is valid hex color
- Verify `launchShowDuration` is > 0

### Icon looks pixelated
- Use higher resolution source image (512×512 minimum)
- Ensure image is PNG with transparency if needed
- Avoid heavy compression

---

**Next Step**: Add these icon and splash assets, then rebuild your APK! 🚀
