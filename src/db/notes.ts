import { db } from './index.js';
import { notes, studySessions, mockExams } from './schema.js';
import { eq, desc, and } from 'drizzle-orm';

export async function getUserNotes(uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
  try {
    return await db.select().from(notes).where(eq(notes.uid, uid)).orderBy(desc(notes.updatedAt));
  } catch (error: any) {
    console.error("Database error in getUserNotes:", error);
    throw new Error(`Database operation failed: ${error?.message || error}`);
  }
}

export async function createNote(uid: string, title: string, content: string, subject: string, tags?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
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
    if (!result || result.length === 0) {
      throw new Error("Note insert returned no result.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in createNote:", error);
    throw new Error(`Database write failed: ${error?.message || error}`);
  }
}

export async function deleteNote(id: number, uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
  try {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.uid, uid)))
      .returning();
    if (!result || result.length === 0) {
      throw new Error("Note not found or could not be deleted.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in deleteNote:", error);
    throw new Error(`Database delete failed: ${error?.message || error}`);
  }
}

export async function logStudySession(uid: string, subject: string, durationMinutes: number, topic?: string, xpEarned: number = 25) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
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
    if (!result || result.length === 0) {
      throw new Error("Study session log failed.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in logStudySession:", error);
    throw new Error(`Database write failed: ${error?.message || error}`);
  }
}

export async function logMockExam(uid: string, subject: string, score: number, totalQuestions: number, details?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    throw new Error("Database is not configured. Data persistence is unavailable.");
  }
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
    if (!result || result.length === 0) {
      throw new Error("Mock exam log failed.");
    }
    return result[0];
  } catch (error: any) {
    console.error("Database error in logMockExam:", error);
    throw new Error(`Database write failed: ${error?.message || error}`);
  }
}
