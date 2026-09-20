import { db } from './index.ts';
import { notes, studySessions, mockExams } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

const memoryNotes: any[] = [];
const memoryStudySessions: any[] = [];
const memoryMockExams: any[] = [];

export async function getUserNotes(uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    return memoryNotes.filter(n => n.uid === uid).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  try {
    return await db.select().from(notes).where(eq(notes.uid, uid)).orderBy(desc(notes.updatedAt));
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    return memoryNotes.filter(n => n.uid === uid).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
}

export async function createNote(uid: string, title: string, content: string, subject: string, tags?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const newNote = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      title,
      content,
      subject,
      tags: tags || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryNotes.push(newNote);
    return newNote;
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
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    const newNote = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      title,
      content,
      subject,
      tags: tags || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryNotes.push(newNote);
    return newNote;
  }
}

export async function deleteNote(id: number, uid: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const idx = memoryNotes.findIndex(n => n.id === id && n.uid === uid);
    if (idx !== -1) {
      const deleted = memoryNotes.splice(idx, 1);
      return deleted[0];
    }
    return { id };
  }
  try {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.uid, uid)))
      .returning();
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory notes:", error);
    const idx = memoryNotes.findIndex(n => n.id === id && n.uid === uid);
    if (idx !== -1) {
      const deleted = memoryNotes.splice(idx, 1);
      return deleted[0];
    }
    return { id };
  }
}

export async function logStudySession(uid: string, subject: string, durationMinutes: number, topic?: string, xpEarned: number = 25) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const session = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      subject,
      durationMinutes,
      topic: topic || '',
      xpEarned,
      createdAt: new Date(),
    };
    memoryStudySessions.push(session);
    return session;
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
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory study sessions:", error);
    const session = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      subject,
      durationMinutes,
      topic: topic || '',
      xpEarned,
      createdAt: new Date(),
    };
    memoryStudySessions.push(session);
    return session;
  }
}

export async function logMockExam(uid: string, subject: string, score: number, totalQuestions: number, details?: string) {
  if (!process.env.SQL_HOST && !process.env.DATABASE_URL) {
    const exam = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      subject,
      score,
      totalQuestions,
      details: details || '',
      createdAt: new Date(),
    };
    memoryMockExams.push(exam);
    return exam;
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
    return result[0];
  } catch (error) {
    console.warn("Database unavailable, falling back to memory mock exams:", error);
    const exam = {
      id: Math.floor(Math.random() * 10000) + 1,
      uid,
      subject,
      score,
      totalQuestions,
      details: details || '',
      createdAt: new Date(),
    };
    memoryMockExams.push(exam);
    return exam;
  }
}
