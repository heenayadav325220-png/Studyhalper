import test from 'node:test';
import assert from 'node:assert';
import { getFriendlyAuthErrorMessage } from './firebase.js';

test('1. operation-not-allowed produces failure message in English and Hindi', () => {
  const msgEn = getFriendlyAuthErrorMessage('auth/operation-not-allowed', 'en');
  const msgHi = getFriendlyAuthErrorMessage('auth/operation-not-allowed', 'hi');
  assert.strictEqual(msgEn.includes('not enabled'), true);
  assert.strictEqual(msgHi.includes('सक्षम नहीं'), true);
  assert.strictEqual(msgEn.toLowerCase().includes('success'), false);
  assert.strictEqual(msgHi.includes('सफल'), false);
});

test('2. unauthorized-domain produces failure message', () => {
  const msgEn = getFriendlyAuthErrorMessage('auth/unauthorized-domain', 'en');
  assert.strictEqual(msgEn.includes('not authorized'), true);
  assert.strictEqual(msgEn.toLowerCase().includes('processing'), false);
});

test('3. Invalid credentials produce failure message', () => {
  const msg = getFriendlyAuthErrorMessage('auth/invalid-credential', 'en');
  assert.strictEqual(msg.includes('Invalid email or password'), true);
});

test('4. Wrong password never produces success', () => {
  const msg = getFriendlyAuthErrorMessage('auth/wrong-password', 'en');
  assert.strictEqual(msg.includes('Invalid email or password'), true);
  assert.strictEqual(msg.toLowerCase().includes('success'), false);
});

test('5. Cancelled Google popup does not produce success', () => {
  const msg = getFriendlyAuthErrorMessage('auth/popup-closed-by-user', 'en');
  assert.strictEqual(msg.includes('popup was closed'), true);
  assert.strictEqual(msg.toLowerCase().includes('success'), false);
});

test('6. Network failure produces appropriate message', () => {
  const msg = getFriendlyAuthErrorMessage('auth/network-request-failed', 'en');
  assert.strictEqual(msg.includes('Network error'), true);
});

test('7. All supported messages work in Hindi and English', () => {
  const errors = [
    'auth/user-not-found',
    'auth/email-already-in-use',
    'auth/weak-password',
    'auth/invalid-email',
    'auth/popup-blocked',
    'auth/too-many-requests'
  ];
  for (const err of errors) {
    const en = getFriendlyAuthErrorMessage(err, 'en');
    const hi = getFriendlyAuthErrorMessage(err, 'hi');
    assert.notStrictEqual(en, '');
    assert.notStrictEqual(hi, '');
  }
});

test('8. Unknown Firebase errors remain failures', () => {
  const msg = getFriendlyAuthErrorMessage('auth/some-unknown-code', 'en');
  assert.strictEqual(msg.includes('auth/some-unknown-code'), true);
  assert.strictEqual(msg.toLowerCase().includes('success'), false);
});
