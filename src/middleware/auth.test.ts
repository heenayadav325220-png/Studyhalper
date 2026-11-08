import test from 'node:test';
import assert from 'node:assert';
import { requireAuth, AuthRequest } from './auth.js';
import { adminAuth } from '../lib/firebase-admin.js';

const originalVerifyIdToken = adminAuth.verifyIdToken;

function mockVerify(impl: (token: string) => Promise<any>) {
  (adminAuth as any).verifyIdToken = impl;
}

function restoreVerify() {
  adminAuth.verifyIdToken = originalVerifyIdToken;
}

function createMockReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as AuthRequest;
  let statusCode = 200;
  let jsonBody: any = null;
  let nextCalled = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: any) {
      jsonBody = body;
      return res;
    }
  } as unknown as any;

  const next = () => {
    nextCalled = true;
  };

  return { req, res, next, getResult: () => ({ statusCode, jsonBody, nextCalled }) };
}

test('1. Valid Firebase token -> request proceeds', async () => {
  mockVerify(async (token) => {
    if (token === 'valid-token') {
      return { uid: 'user_123', email: 'test@example.com' };
    }
    throw new Error('Invalid token');
  });

  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer valid-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, true);
  assert.strictEqual(req.user?.uid, 'user_123');
  restoreVerify();
});

test('2. Missing token -> 401', async () => {
  const { req, res, next, getResult } = createMockReqRes({});
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Missing authorization header' });
});

test('3. Empty Bearer token -> 401', async () => {
  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer   ' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Empty authorization token' });
});

test('4. Malformed token (missing Bearer) -> 401', async () => {
  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Basic some-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Malformed authorization header' });
});

test('5. Expired token -> 401', async () => {
  mockVerify(async () => {
    const err: any = new Error('Firebase ID token has expired.');
    err.code = 'auth/id-token-expired';
    throw err;
  });

  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer expired-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Invalid or expired token' });
  restoreVerify();
});

test('6. Invalid token -> 401', async () => {
  mockVerify(async () => {
    throw new Error('Argument passed in is invalid or malformed.');
  });

  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer invalid-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Invalid or expired token' });
  restoreVerify();
});

test('7. Firebase Admin infrastructure failure -> 503', async () => {
  mockVerify(async () => {
    const err: any = new Error('Network request failed.');
    err.code = 'auth/network-request-failed';
    throw err;
  });

  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer some-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 503);
  assert.deepStrictEqual(result.jsonBody, { error: 'Authentication service unavailable' });
  restoreVerify();
});

test('8. x-user-id without a valid token -> 401', async () => {
  const { req, res, next, getResult } = createMockReqRes({ 'x-user-id': 'hacker_guest_123' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, false);
  assert.strictEqual(result.statusCode, 401);
  assert.deepStrictEqual(result.jsonBody, { error: 'Missing authorization header' });
});

test('9. Valid Firebase Anonymous Auth token -> request proceeds', async () => {
  mockVerify(async (token) => {
    if (token === 'anon-token') {
      return { 
        uid: 'anon_user_999', 
        firebase: { sign_in_provider: 'anonymous' } 
      };
    }
    throw new Error('Invalid token');
  });

  const { req, res, next, getResult } = createMockReqRes({ authorization: 'Bearer anon-token' });
  await requireAuth(req, res, next);
  const result = getResult();

  assert.strictEqual(result.nextCalled, true);
  assert.strictEqual(req.user?.uid, 'anon_user_999');
  assert.strictEqual((req.user as any)?.firebase?.sign_in_provider, 'anonymous');
  restoreVerify();
});
