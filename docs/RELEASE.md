# Guess It! release checklist

## Build
1. Install Node.js 20+.
2. Run `npm install`.
3. Run `npm run typecheck`.
4. Run `npm run build`.

## Android
1. Run `npx cap add android`.
2. Run `npx cap sync android`.
3. Run `npx cap open android`.
4. Configure release signing and versionCode/versionName in Android Studio.
5. Build a signed Android App Bundle (`.aab`).

## Current data model
This release is local-first: profile, results, streaks and leaderboard data are stored on the device. A real cross-device online leaderboard requires a production backend before presenting it as globally competitive.

## Google Play
Prepare a privacy-policy URL, screenshots, app icon, content rating, Data safety answers, and a signed `.aab`. Test first with Play Console internal testing.
