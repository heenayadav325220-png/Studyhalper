import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

const memoryUsers = new Map<string, any>();

function getMemoryUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  if (!memoryUsers.has(uid)) {
    memoryUsers.set(uid, {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoUrl: photoUrl || '',
      xp: 0,
      streak: 1,
      petLevel: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    const existing = memoryUsers.get(uid);
    existing.email = email || existing.email;
    if (displayName) existing.displayName = displayName;
    if (photoUrl) existing.photoUrl = photoUrl;
    existing.updatedAt = new Date();
  }
  return memoryUsers.get(uid);
}

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return getMemoryUser(uid, email, displayName, photoUrl);
  }
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
        photoUrl: photoUrl || '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || email.split('@')[0],
          photoUrl: photoUrl || '',
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    return getMemoryUser(uid, email, displayName, photoUrl);
  }
}

export async function getUserProfile(uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return memoryUsers.get(uid) || null;
  }
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    return memoryUsers.get(uid) || null;
  }
}

export async function updateUserStats(uid: string, xpEarned: number, streak?: number) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const user = memoryUsers.get(uid);
    if (!user) return null;
    user.xp = (user.xp || 0) + xpEarned;
    if (streak !== undefined) user.streak = streak;
    user.petLevel = Math.max(1, Math.floor(user.xp / 150) + 1);
    user.updatedAt = new Date();
    return user;
  }
  try {
    const existing = await getUserProfile(uid);
    if (!existing) return null;

    const newXp = (existing.xp || 0) + xpEarned;
    const newStreak = streak !== undefined ? streak : existing.streak;
    const newPetLevel = Math.max(1, Math.floor(newXp / 150) + 1);

    const result = await db.update(users)
      .set({
        xp: newXp,
        streak: newStreak,
        petLevel: newPetLevel,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory store:", error);
    const user = memoryUsers.get(uid);
    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      if (streak !== undefined) user.streak = streak;
      user.petLevel = Math.max(1, Math.floor(user.xp / 150) + 1);
      user.updatedAt = new Date();
      return user;
    }
    return null;
  }
}
