import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndRankStreakEntries,
  getLocalDateStrings,
  sanitizeLeaderboardAvatar,
  buildLeaderboardPayloadFields
} from './leaderboardUtils.js';
import type { PublicLeaderboardEntry } from '../types.js';

function makeEntry(overrides: Partial<PublicLeaderboardEntry> & { uid: string }): PublicLeaderboardEntry {
  return {
    uid: overrides.uid,
    name: overrides.name ?? `Student ${overrides.uid}`,
    xp: overrides.xp ?? 100,
    streak: overrides.streak ?? 1,
    level: overrides.level ?? 2,
    avatar: overrides.avatar ?? '🧑‍🎓',
    lastStreakDate: overrides.lastStreakDate ?? '2026-11-16',
    showOnLeaderboard: overrides.showOnLeaderboard ?? true
  };
}

test('getLocalDateStrings handles month and year boundaries accurately', () => {
  const marchFirst = new Date(2026, 2, 1, 14, 30, 0);
  assert.deepStrictEqual(getLocalDateStrings(marchFirst), {
    today: '2026-03-01',
    yesterday: '2026-02-28'
  });

  const janFirst = new Date(2026, 0, 1, 9, 0, 0);
  assert.deepStrictEqual(getLocalDateStrings(janFirst), {
    today: '2026-01-01',
    yesterday: '2025-12-31'
  });
});

test('filterAndRankStreakEntries filters by today/yesterday, requires streak >= 1, breaks ties by xp, and caps at 10', () => {
  const today = '2026-11-16';
  const yesterday = '2026-11-15';

  const candidates: PublicLeaderboardEntry[] = [
    // Eligible: today, streak 12, xp 500
    makeEntry({ uid: 'u1', streak: 12, xp: 500, lastStreakDate: today }),
    // Eligible: yesterday, streak 12, xp 900 (should beat u1 via XP tie-break)
    makeEntry({ uid: 'u2', streak: 12, xp: 900, lastStreakDate: yesterday }),
    // Ineligible: stale 2 days ago even with high streak
    makeEntry({ uid: 'u_stale', streak: 99, xp: 9999, lastStreakDate: '2026-11-14' }),
    // Ineligible: empty lastStreakDate
    makeEntry({ uid: 'u_empty', streak: 50, xp: 5000, lastStreakDate: '' }),
    // Ineligible: 0-day streak even if date is today
    makeEntry({ uid: 'u_zero', streak: 0, xp: 4000, lastStreakDate: today }),
    // Ineligible: opted out
    makeEntry({ uid: 'u_hidden', streak: 30, xp: 3000, lastStreakDate: today, showOnLeaderboard: false }),
    // Fill out more eligible entries to verify Top 10 cap
    makeEntry({ uid: 'u3', streak: 10, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u4', streak: 9, xp: 200, lastStreakDate: yesterday }),
    makeEntry({ uid: 'u5', streak: 8, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u6', streak: 7, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u7', streak: 6, xp: 200, lastStreakDate: yesterday }),
    makeEntry({ uid: 'u8', streak: 5, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u9', streak: 4, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u10', streak: 3, xp: 200, lastStreakDate: today }),
    makeEntry({ uid: 'u11', streak: 2, xp: 999, lastStreakDate: today })
  ];

  const ranked = filterAndRankStreakEntries(candidates, today, yesterday, 10);

  assert.equal(ranked.length, 10);
  assert.deepStrictEqual(
    ranked.map((r) => r.uid),
    ['u2', 'u1', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10']
  );
});

test('sanitizeLeaderboardAvatar permits only emojis or https URLs', () => {
  assert.equal(sanitizeLeaderboardAvatar('🚀'), '🚀');
  assert.equal(sanitizeLeaderboardAvatar('https://lh3.googleusercontent.com/a/avatar.png'), 'https://lh3.googleusercontent.com/a/avatar.png');
  assert.equal(sanitizeLeaderboardAvatar('http://insecure.example/a.png'), '🧑‍🎓');
  assert.equal(sanitizeLeaderboardAvatar('javascript:alert(1)'), '🧑‍🎓');
  assert.equal(sanitizeLeaderboardAvatar('data:image/png;base64,abc'), '🧑‍🎓');
  assert.equal(sanitizeLeaderboardAvatar('/assets/local.png', 'https://example.com/safe.jpg'), 'https://example.com/safe.jpg');
  assert.equal(sanitizeLeaderboardAvatar('<script>'), '🧑‍🎓');
});

test('buildLeaderboardPayloadFields strips private fields and clamps numeric bounds', () => {
  const payload = buildLeaderboardPayloadFields({
    uid: 'user_123',
    name: '   Rohit Yadav   ',
    email: 'private@example.com',
    schoolName: 'Private School',
    xp: 99_999_999,
    streak: -5,
    level: 0,
    avatar: 'javascript:evil()',
    photoURL: 'https://example.com/photo.png',
    lastStreakDate: '2026-11-16'
  });

  assert.equal('email' in payload, false);
  assert.equal('schoolName' in payload, false);
  assert.equal(payload.uid, 'user_123');
  assert.equal(payload.name, 'Rohit Yadav');
  assert.equal(payload.xp, 50_000_000);
  assert.equal(payload.streak, 0);
  assert.equal(payload.level, 1);
  assert.equal(payload.avatar, 'https://example.com/photo.png');
  assert.equal(payload.showOnLeaderboard, true);
});
