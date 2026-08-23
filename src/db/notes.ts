import { db } from './index.ts';
import { notes, studySessions, mockExams } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

export async function getUserNotes(uid: string) {
  try {
    return await db.select().from(notes).where(eq(notes.uid, uid)).orderBy(desc(notes.updatedAt));
  } catch (error) {
    console.error("Failed to fetch user notes:", error);
    throw new Error("Failed to fetch user notes.", { cause: error });
  }
}

export async function createNote(uid: string, title: string, content: string, subject: string, tags?: string) {
  try {
    const result = await db.insert(notes)
      .values({
        uid,
        title,
        content,
        subject,
        tags: tags || '',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to create note:", error);
    throw new Error("Failed to save note.", { cause: error });
  }
}

export async function deleteNote(id: number, uid: string) {
  try {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.uid, uid)))
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to delete note:", error);
    throw new Error("Failed to delete note.", { cause: error });
  }
}

export async function logStudySession(uid: string, subject: string, durationMinutes: number, topic?: string, xpEarned: number = 25) {
  try {
    const result = await db.insert(studySessions)
      .values({
        uid,
        subject,
        durationMinutes,
        topic: topic || '',
        xpEarned,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to log study session:", error);
    throw new Error("Failed to log study session.", { cause: error });
  }
}

export async function logMockExam(uid: string, subject: string, score: number, totalQuestions: number, details?: string) {
  try {
    const result = await db.insert(mockExams)
      .values({
        uid,
        subject,
        score,
        totalQuestions,
        details: details || '',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Failed to log mock exam:", error);
    throw new Error("Failed to log mock exam.", { cause: error });
  }
}
