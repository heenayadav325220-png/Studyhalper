# Implementation Plan - Fix AI Usage Quota & Rate-Limit Bypass (QUOTA-01)

## Overview
Eliminate the process-local in-memory quota fallback (`serverUsageStore` / `firestoreUnavailable`) in `server.ts`. When Firestore is unavailable, do not silently grant unlimited AI usage or rely on per-instance memory counters. Instead, return a retryable HTTP 503 Service Unavailable response to enforce robust, multi-instance production quota limits.

## Proposed Changes

### 1. Update Quota Enforcement Engine (`server.ts`)
- Remove `firestoreUnavailable` flag and process-local memory quota store (`serverUsageStore`).
- In `checkAndIncrementQuota`:
  - Require Firestore (`adminDb`). If `adminDb` is unavailable or throws a transient network/service error, catch and throw an explicit retryable error (or return `{ allowed: false, error: 'QUOTA_STORAGE_UNAVAILABLE' }`).
  - Do not fall back to `memRecord` / process-local memory.
  - Enforce consistent UTC date boundaries (`new Date().toISOString().split('T')[0]`).
- In `checkDailyLimit`:
  - If quota check encounters a storage/Firestore error, return HTTP 503 (`{ error: 'Authentication service unavailable' }` or `{ error: 'Quota service temporarily unavailable, please try again.', code: 'QUOTA_STORAGE_UNAVAILABLE' }`).
  - Ensure authenticated `user.uid` from `req.user` is strictly used (preventing client UID manipulation).

### 2. Update Quota Reset & Fetch Endpoints (`server.ts`)
- In `/api/user/ai-usage` and related endpoints, handle Firestore connection failures gracefully without returning fake zeroed counters or bypassing limits.

### 3. Add Automated Unit Tests (`src/services/quota.test.ts`)
- Test normal quota consumption.
- Test daily quota exhaustion (429 response).
- Test Firestore unavailable behavior (503 response).
- Test Firestore recovery.
- Test attempt to manipulate another user's quota or unauthenticated requests (401 response).
- Test daily reset date boundary logic.

### 4. Verification
- Run `npm test`, `npm run lint`, and `npm run build`.
