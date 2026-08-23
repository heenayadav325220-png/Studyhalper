import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
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
    console.error("Failed to get or create user:", error);
    throw new Error("Failed to synchronize user account.", { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    throw new Error("Failed to fetch user profile.", { cause: error });
  }
}

export async function updateUserStats(uid: string, xpEarned: number, streak?: number) {
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
    console.error("Failed to update user stats:", error);
    throw new Error("Failed to update user stats.", { cause: error });
  }
}
