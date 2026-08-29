import { auth } from './firebase';

// Get current user auth token
async function getAuthToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.warn("Failed to get ID token:", err);
    return null;
  }
}

// Sync user account with Cloud SQL
export async function syncUserWithSql(displayName?: string, photoUrl?: string) {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/user/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` },
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
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/study-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/mock-exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
