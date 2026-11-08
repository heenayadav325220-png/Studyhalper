# Implementation Plan - Ascend Study Authentication System Hardening

## Overview
Fix and harden the Ascend Study authentication system to ensure robust, real, and trustworthy Firebase Authentication and Firestore data synchronization across Chrome desktop, mobile browsers, and the Android APK/AAB. Remove all fallback mocks and plaintext password storage in localStorage.

## Proposed Changes

### 1. Security & Cleanup (`localStorage` & Mock Fallbacks)
- Clear any existing `account_` keys from `localStorage` on app startup.
- Remove all mock user fabrication in `AuthContext`, `AuthModal`, and service files. Never fake success on failure.

### 2. Authentication Flow (`src/contexts/AuthContext.tsx` & `src/services/firebase.ts`)
- **Email Sign-Up**: If current user is anonymous, upgrade with `linkWithCredential(EmailAuthProvider.credential(email, password))` and update profile displayName. Otherwise, `createUserWithEmailAndPassword`. Handle errors cleanly with bilingual mapping.
- **Email Sign-In**: Strict `signInWithEmailAndPassword`. Any failure surfaces the error and does not log in.
- **Google Sign-In**:
  - Web: `signInWithPopup`, with fallback to `signInWithRedirect` if blocked or unsupported.
  - Native Android (`Capacitor.isNativePlatform()`): Use `@capacitor-firebase/authentication` plugin (`FirebaseAuthentication.signInWithGoogle()`), extract `idToken`, build `GoogleAuthProvider.credential(idToken)`, and sign in with the Firebase Web SDK.
  - Link with credential if user is anonymous.
- **Password Reset & Account Deletion**: Ensure `sendPasswordResetEmail` and account deletion (re-authenticating when required, deleting Auth user + Firestore document) function reliably.

### 3. Firestore Profile Synchronization
- Ensure user profile documents strictly sync to `users/{auth.currentUser.uid}`.
- Payload adheres to `firestore.rules` (`isValidUserCreate`: `uid == request.auth.uid`, numeric `xp` and `streak`, NO `role` field).
- Graceful error handling and retry mechanism for profile sync.

### 4. Build & Verification
- Run `compile_applet` and `lint_applet` to ensure zero TypeScript errors or build issues.
- Verify sign-up, sign-in, Google auth, and profile persistence flow.
