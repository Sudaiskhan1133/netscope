# NetScope - Native Mobile App Build Guide

## Prerequisites

Install on your local computer:
- **Node.js** (v18+) - https://nodejs.org
- **Android Studio** - https://developer.android.com/studio (for Android)
- **Xcode** (Mac only) - From App Store (for iOS)
- **Java JDK 17** - Required for Android builds

## Step 1: Download the Project

Download/export this entire project to your local machine.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: AdMob Configuration (Already Done)

Your AdMob credentials are already configured:

- **App ID**: `ca-app-pub-2693019276790458~1288831514`
- **Banner (Home Screen)**: `ca-app-pub-2693019276790458/4378029287`
- **Interstitial (After Speed Test)**: `ca-app-pub-2693019276790458/1752370525`
- **Rewarded Interstitial**: `ca-app-pub-2693019276790458/5866729569`
- **Rewarded**: `ca-app-pub-2693019276790458/8074090502`

Files configured:
- `capacitor.config.ts` - App ID
- `client/src/lib/admob.ts` - All ad unit IDs

## Step 4: Build the Web App

```bash
npm run build
```

This creates the production build in `dist/public/`.

## Step 5: Add Android Platform

```bash
npx cap add android
```

## Step 6: Sync & Copy

```bash
npx cap sync
```

This copies the web build to the Android project and syncs plugins.

## Step 7: Open in Android Studio

```bash
npx cap open android
```

## Step 8: Configure Android Manifest

In `android/app/src/main/AndroidManifest.xml`, verify the AdMob metadata is present:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-2693019276790458~1288831514"/>
```

The AdMob Capacitor plugin should add this automatically during sync.

## Step 9: Build APK/AAB

In Android Studio:
1. Go to **Build > Generate Signed Bundle / APK**
2. Choose **APK** for testing or **Android App Bundle** for Play Store
3. Create or select your keystore
4. Choose **release** build variant
5. Click **Finish**

The APK will be in `android/app/build/outputs/apk/release/`

## Ad Placements

| Ad Type | Location | Trigger |
|---------|----------|---------|
| Banner | Bottom of screen | Always shown on home screen |
| Interstitial | Full screen | After speed test completes |
| Interstitial | Full screen | Every 5 page navigations |
| Rewarded | Full screen | Available for future use (e.g., unlock features) |

## After Making Code Changes

When you change any web code:

```bash
npm run build
npx cap sync
```

Then rebuild in Android Studio.

## App Signing (Play Store)

For Google Play Store release:
1. Create a keystore:
   ```bash
   keytool -genkey -v -keystore netscope.keystore -alias netscope -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Use this keystore when generating signed APK/AAB in Android Studio

## For iOS (Mac only)

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

Then build in Xcode with your Apple Developer account.

## Troubleshooting

- **Ads don't show**: AdMob needs time to serve ads to new app IDs (can take hours). Also check that your AdMob account is approved.
- **App crashes on start**: Run `npx cap sync` again
- **White screen**: Make sure `npm run build` ran successfully before `npx cap sync`
- **AdMob policy**: Don't click your own ads, ensure content compliance
