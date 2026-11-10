import { db } from './index.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
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

    if (!result || result.length === 0) {
      throw new Error("User sync returned no result.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in getOrCreateUser:", error);
    throw new Error(`Database operation failed: ${error?.message || error}`);
  }
}

export async function getUserProfile(uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error: any) {
    console.error("Database error in getUserProfile:", error);
    throw new Error(`Database operation failed: ${error?.message || error}`);
  }
}

export async function updateUserStats(uid: string, xpEarned: number, streak?: number) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
  try {
    const existing = await getUserProfile(uid);
    if (!existing) {
      throw new Error("User profile not found for stats update.");
    }

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

    if (!result || result.length === 0) {
      throw new Error("User stats update failed.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in updateUserStats:", error);
    throw new Error(`Database write failed: ${error?.message || error}`);
  }
}
