import { safeFetch } from './geminiService';

// Sync user account with Cloud SQL using safeFetch
export async function syncUserWithSql(displayName?: string, photoUrl?: string) {
  try {
    const res = await safeFetch("/api/user/sync", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName, photoUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (err) {
    console.warn('SQL User sync notice:', err);
  }
  return null;
}

// Fetch user profile & stats from Cloud SQL
export async function fetchSqlUserProfile() {
  try {
    const res = await safeFetch("/api/user/profile", {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.profile;
    }
  } catch (err) {
    console.warn('SQL fetch profile notice:', err);
  }
  return null;
}

// Save study session in Cloud SQL
export async function logSqlStudySession(subject: string, durationMinutes: number, topic?: string, xpEarned: number = 25) {
  try {
    const res = await safeFetch("/api/study-sessions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, durationMinutes, topic, xpEarned }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('SQL study session log notice:', err);
  }
  return null;
}

// Save mock exam result in Cloud SQL
export async function logSqlMockExam(subject: string, score: number, totalQuestions: number, details?: string) {
  try {
    const res = await safeFetch("/api/mock-exams", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, score, totalQuestions, details }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('SQL mock exam log notice:', err);
  }
  return null;
}
