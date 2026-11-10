import test from 'node:test';
import assert from 'node:assert';
import { createNote, logStudySession } from './notes.js';
import { getOrCreateUser, getUserProfile } from './users.js';

test('1. Unconfigured database throws error on note creation rather than faking success', async () => {
  const origHost = process.env.SQL_HOST;
  const origUrl = process.env.DATABASE_URL;
  delete process.env.SQL_HOST;
  delete process.env.DATABASE_URL;

  await assert.rejects(
    async () => {
      await createNote('user_123', 'Test Note', 'Test Content', 'Math');
    },
    /Database is not configured/
  );

  process.env.SQL_HOST = origHost;
  process.env.DATABASE_URL = origUrl;
});

test('2. Unconfigured database throws error on user profile fetch rather than faking success', async () => {
  const origHost = process.env.SQL_HOST;
  const origUrl = process.env.DATABASE_URL;
  delete process.env.SQL_HOST;
  delete process.env.DATABASE_URL;

  await assert.rejects(
    async () => {
      await getUserProfile('user_123');
    },
    /Database is not configured/
  );

  process.env.SQL_HOST = origHost;
  process.env.DATABASE_URL = origUrl;
});

test('3. Unconfigured database throws error on study session logging rather than faking success', async () => {
  const origHost = process.env.SQL_HOST;
  const origUrl = process.env.DATABASE_URL;
  delete process.env.SQL_HOST;
  delete process.env.DATABASE_URL;

  await assert.rejects(
    async () => {
      await logStudySession('user_123', 'Physics', 30, 'Mechanics', 50);
    },
    /Database is not configured/
  );

  process.env.SQL_HOST = origHost;
  process.env.DATABASE_URL = origUrl;
});

test('4. Unconfigured database throws error on user sync rather than faking success', async () => {
  const origHost = process.env.SQL_HOST;
  const origUrl = process.env.DATABASE_URL;
  delete process.env.SQL_HOST;
  delete process.env.DATABASE_URL;

  await assert.rejects(
    async () => {
      await getOrCreateUser('user_123', 'test@example.com', 'Test User');
    },
    /Database is not configured/
  );

  process.env.SQL_HOST = origHost;
  process.env.DATABASE_URL = origUrl;
});
