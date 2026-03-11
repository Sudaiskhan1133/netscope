# NetScope - Smart Network Toolkit

## Overview
A mobile-first network diagnostic app built with React + Express, designed to be wrapped as a native mobile app using Capacitor. Branded as "NetScope" by Sudais Tech.

## Architecture
- **Frontend**: React + TypeScript with Tailwind CSS, shadcn/ui components
- **Backend**: Express.js API for network tools (DNS, ping, WHOIS, SSL, speed test)
- **Storage**: Browser localStorage (no database, no account required)
- **Routing**: wouter for client-side navigation
- **Native**: Capacitor for Android/iOS wrapping
- **Ads**: AdMob via @capacitor-community/admob (banner, interstitial, rewarded)

## AdMob Configuration
- **App ID**: `ca-app-pub-2693019276790458~1288831514`
- **Banner (Home Screen)**: `ca-app-pub-2693019276790458/4378029287`
- **Interstitial (After Speed Test)**: `ca-app-pub-2693019276790458/1752370525`
- **Rewarded Interstitial**: `ca-app-pub-2693019276790458/5866729569`
- **Rewarded**: `ca-app-pub-2693019276790458/8074090502`
- Config files: `capacitor.config.ts`, `client/src/lib/admob.ts`
- Ads only activate in native Capacitor context (not in browser)

## Ad Placements
- Banner: bottom of screen (always visible on home)
- Interstitial: after speed test completes + every 5 page navigations
- Rewarded: prepared and ready, available via `showRewarded()` API

## Key Features
1. **Splash Screen** - Logo + "NetScope" + "Powered by Sudais Tech" for ~3s
2. **Dashboard** - Connection status, last speed test, tool cards
3. **Speed Test** - Download/upload + interstitial ad after completion
4. **IP Info** - Public IP, location, ISP, device/browser info
5. **Ping Tool** - Ping hosts with stats
6. **DNS Lookup** - Query DNS records
7. **WHOIS Lookup** - Domain registration details
8. **SSL Certificate Checker** - Verify SSL certificates
9. **WebRTC Leak Test** - Detect IP exposure (client-side)
10. **WiFi QR Generator** - Generate/share WiFi QR codes
11. **History** - Speed test and ping history (localStorage)

## Branding
- App Name: **NetScope**
- Powered by: **Sudais Tech**
- Logo: `/client/public/logo.png`
- App ID: `com.sudaistech.netscope`

## Build
- Dev: `npm run dev`
- Production build: `npm run build`
- Native app: See `BUILD_NATIVE_APP.md`

## Backend API Endpoints
- `HEAD /api/ping-check` - Latency check
- `GET /api/speed-test/download?size=N` - Download test data
- `POST /api/speed-test/upload` - Upload test endpoint
- `GET /api/ip-info` - Public IP + geolocation
- `POST /api/ping` - DNS reachability check
- `POST /api/dns-lookup` - DNS record queries
- `POST /api/whois` - WHOIS protocol lookup
- `POST /api/ssl-check` - TLS certificate inspection
