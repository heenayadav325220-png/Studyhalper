/**
 * Firestore Security Rules Emulator Tests for /leaderboard/{uid} & /users/{uid}
 *
 * Run against the Firebase Firestore Emulator:
 *   firebase emulators:exec --only firestore "node --import tsx --test firestore.rules.test.ts"
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const PROJECT_ID = 'coreai-a7cf4';
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '';
const BASE_URL = EMULATOR_HOST
  ? `http://${EMULATOR_HOST}/v1/projects/${PROJECT_ID}/databases/(default)/documents`
  : '';

function base64Url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function makeEmulatorJwt(uid: string, provider: 'password' | 'google.com' | 'anonymous' = 'password'): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    iss: `https://securetoken.google.com/${PROJECT_ID}`,
    aud: PROJECT_ID,
    auth_time: now,
    user_id: uid,
    sub: uid,
    iat: now,
    exp: now + 3600,
    firebase: {
      sign_in_provider: provider
    }
  };
  return `${base64Url(header)}.${base64Url(payload)}.`;
}

async function clearEmulatorDb() {
  await fetch(
    `http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' }
  );
}

async function writeLeaderboardDoc(
  docUid: string,
  authUid: string | null,
  fields: Record<string, unknown>,
  provider: 'password' | 'google.com' | 'anonymous' = 'password',
  useServerTimestamp = true
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authUid) {
    headers.Authorization = `Bearer ${makeEmulatorJwt(authUid, provider)}`;
  }

  const firestoreFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') firestoreFields[k] = { stringValue: v };
    else if (typeof v === 'number') firestoreFields[k] = { integerValue: String(v) };
    else if (typeof v === 'boolean') firestoreFields[k] = { booleanValue: v };
  }

  const res = await fetch(`${BASE_URL}:commit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      writes: [
        {
          update: {
            name: `projects/${PROJECT_ID}/databases/(default)/documents/leaderboard/${docUid}`,
            fields: firestoreFields
          },
          ...(useServerTimestamp
            ? {
                updateTransforms: [
                  {
                    fieldPath: 'updatedAt',
                    setToServerValue: 'REQUEST_TIME'
                  }
                ]
              }
            : {})
        }
      ]
    })
  });

  return res;
}

const skipReason = !EMULATOR_HOST
  ? 'FIRESTORE_EMULATOR_HOST is not set (run via firebase emulators:exec)'
  : undefined;

test('Firestore Rules: /users list remains denied for signed-in users', { skip: skipReason }, async () => {
  await clearEmulatorDb();
  const res = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${makeEmulatorJwt('alice', 'password')}` }
  });
  assert.equal(res.status, 403);
});

test('Firestore Rules: /leaderboard allows registered owner create & signed-in list, blocks anonymous create', { skip: skipReason }, async () => {
  await clearEmulatorDb();

  // Anonymous guest cannot create leaderboard entry
  const anonRes = await writeLeaderboardDoc(
    'anon1',
    'anon1',
    {
      uid: 'anon1',
      name: 'Guest',
      xp: 100,
      streak: 0,
      level: 1,
      avatar: '🧑‍🎓',
      lastStreakDate: '',
      showOnLeaderboard: true
    },
    'anonymous'
  );
  assert.equal(anonRes.status, 403);

  // Registered user can create their own entry
  const createRes = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 250,
    streak: 2,
    level: 3,
    avatar: '🚀',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(createRes.status, 200);

  // Signed-in user can list leaderboard
  const listRes = await fetch(`${BASE_URL}/leaderboard`, {
    headers: { Authorization: `Bearer ${makeEmulatorJwt('bob', 'password')}` }
  });
  assert.equal(listRes.status, 200);

  // Unauthenticated user cannot read leaderboard
  const unauthRes = await fetch(`${BASE_URL}/leaderboard`);
  assert.equal(unauthRes.status, 403);
});

test('Firestore Rules: rejects PII fields, cross-user writes, bad avatars, and XP/streak cheats', { skip: skipReason }, async () => {
  await clearEmulatorDb();

  // Seed valid entry for alice
  const seed = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 200,
    streak: 2,
    level: 3,
    avatar: '🧑‍🎓',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(seed.status, 200);

  // 1. Cross-user write rejected
  const crossUser = await writeLeaderboardDoc('alice', 'bob', {
    uid: 'alice',
    name: 'Hacked',
    xp: 250,
    streak: 2,
    level: 3,
    avatar: '🧑‍🎓',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(crossUser.status, 403);

  // 2. Shadow / PII field (email) rejected
  const piiInject = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    email: 'alice@example.com',
    xp: 250,
    streak: 2,
    level: 3,
    avatar: '🧑‍🎓',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(piiInject.status, 403);

  // 3. Insecure http:// or javascript: avatar rejected
  const badAvatar = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 250,
    streak: 2,
    level: 3,
    avatar: 'http://evil.example/a.png',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(badAvatar.status, 403);

  // 4. XP cheat (+5000 immediately) rejected
  const xpCheat = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 5200,
    streak: 2,
    level: 53,
    avatar: '🧑‍🎓',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(xpCheat.status, 403);

  // 5. Streak jump cheat (+5 in one write) rejected
  const streakCheat = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 250,
    streak: 7,
    level: 3,
    avatar: '🧑‍🎓',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(streakCheat.status, 403);

  // 6. Legitimate update (+50 XP, +1 streak) succeeds
  const legitUpdate = await writeLeaderboardDoc('alice', 'alice', {
    uid: 'alice',
    name: 'Alice',
    xp: 250,
    streak: 3,
    level: 3,
    avatar: 'https://example.com/alice.png',
    lastStreakDate: '2026-11-16',
    showOnLeaderboard: true
  });
  assert.equal(legitUpdate.status, 200);

  // 7. Owner delete succeeds (opt-out)
  const delRes = await fetch(`${BASE_URL}/leaderboard/alice`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${makeEmulatorJwt('alice', 'password')}` }
  });
  assert.equal(delRes.status, 200);
});
