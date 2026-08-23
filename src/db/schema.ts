import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  xp: integer('xp').default(0),
  streak: integer('streak').default(1),
  petLevel: integer('pet_level').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'notes' table
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(), // User's Firebase UID
  title: text('title').notNull(),
  content: text('content').notNull(),
  subject: text('subject').notNull(),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define the 'study_sessions' table
export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  subject: text('subject').notNull(),
  topic: text('topic'),
  durationMinutes: integer('duration_minutes').notNull().default(25),
  xpEarned: integer('xp_earned').default(25),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'mock_exams' table
export const mockExams = pgTable('mock_exams', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull(),
  subject: text('subject').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  studySessions: many(studySessions),
  mockExams: many(mockExams),
}));
