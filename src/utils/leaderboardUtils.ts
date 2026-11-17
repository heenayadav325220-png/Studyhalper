import type { PublicLeaderboardEntry, UserProfile } from '../types';

const MAX_XP = 50_000_000;
const MAX_STREAK = 10_000;
const MAX_LEVEL = 10_000;

export function sanitizeLeaderboardAvatar(avatar?: string, photoURL?: string): string {
  const candidates = [avatar, photoURL];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('https://') && trimmed.length <= 500) {
      return trimmed;
    }
    if (
      trimmed.length >= 1 &&
      trimmed.length <= 24 &&
      !trimmed.includes(':') &&
      !trimmed.includes('/') &&
      !trimmed.includes('\\') &&
      !trimmed.includes('<') &&
      !trimmed.includes('>')
    ) {
      return trimmed;
    }
  }
  return '🧑‍🎓';
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalDateStrings(referenceDate: Date = new Date()): {
  today: string;
  yesterday: string;
} {
  const todayDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(todayDate.getDate() - 1);

  return {
    today: formatLocalDate(todayDate),
    yesterday: formatLocalDate(yesterdayDate)
  };
}

export function filterAndRankStreakEntries(
  entries: PublicLeaderboardEntry[],
  todayStr: string,
  yesterdayStr: string,
  limitCount: number = 10
): PublicLeaderboardEntry[] {
  return entries
    .filter((entry) => {
      if (entry.showOnLeaderboard === false) return false;
      const streak = Number(entry.streak) || 0;
      if (streak < 1) return false;
      return entry.lastStreakDate === todayStr || entry.lastStreakDate === yesterdayStr;
    })
    .sort((a, b) => {
      const streakDiff = (Number(b.streak) || 0) - (Number(a.streak) || 0);
      if (streakDiff !== 0) return streakDiff;
      const xpDiff = (Number(b.xp) || 0) - (Number(a.xp) || 0);
      if (xpDiff !== 0) return xpDiff;
      return (Number(b.level) || 1) - (Number(a.level) || 1);
    })
    .slice(0, limitCount);
}

export function buildLeaderboardPayloadFields(
  profile: Partial<UserProfile> & { uid: string }
): Omit<PublicLeaderboardEntry, 'updatedAt'> {
  const rawName = typeof profile.name === 'string' ? profile.name.trim() : '';
  const safeName = (rawName || 'Student').slice(0, 100);
  const safeXp = Math.max(0, Math.min(MAX_XP, Math.floor(Number(profile.xp) || 0)));
  const safeStreak = Math.max(0, Math.min(MAX_STREAK, Math.floor(Number(profile.streak) || 0)));
  const computedLevel = Math.floor(safeXp / 100) + 1;
  const rawLevel =
    profile.level !== undefined && profile.level !== null && !Number.isNaN(Number(profile.level))
      ? Number(profile.level)
      : computedLevel;
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(rawLevel)));
  const safeAvatar = sanitizeLeaderboardAvatar(profile.avatar, profile.photoURL);
  const safeLastStreakDate =
    typeof profile.lastStreakDate === 'string' ? profile.lastStreakDate.trim().slice(0, 40) : '';

  return {
    uid: profile.uid,
    name: safeName,
    xp: safeXp,
    streak: safeStreak,
    level: safeLevel,
    avatar: safeAvatar,
    lastStreakDate: safeLastStreakDate,
    showOnLeaderboard: profile.showOnLeaderboard !== false
  };
}
