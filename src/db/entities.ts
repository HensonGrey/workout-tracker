// Row shapes of the tables in migrate-database.ts; keep both in step when the schema changes.

/** SQLite has no boolean type, so flags are stored as 0 or 1. */
export type SqliteFlag = 0 | 1;

/** A training program; at most one is active. */
export type Program = {
  id: number;
  name: string;
  isActive: SqliteFlag;
  position: number;
  /** UTC, `YYYY-MM-DD HH:MM:SS`. */
  createdAt: string;
};

/** A day of a program, e.g. "Day A". */
export type TrainingDay = {
  id: number;
  programId: number;
  name: string;
  position: number;
};

/** An exercise is identified by program + name (case-insensitive) + sets + reps, and owns the history. */
export type Exercise = {
  id: number;
  programId: number;
  name: string;
  /** How many set rows to pre-render, not a requirement. */
  sets: number;
  /** Free text such as "10" or "8-12". */
  reps: string;
};

/** Places an exercise on a training day, with the note written when building the program. */
export type TrainingDayExercise = {
  trainingDayId: number;
  exerciseId: number;
  position: number;
  /** Program note, e.g. "@90%". */
  notes: string;
};

// Values are stored as text; the CHECK in migrate-database.ts lists them literally, so a new value needs a migration.
export enum WorkoutSessionStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Skipped = 'skipped',
}

/** One started training day; at most one is in progress. */
export type WorkoutSession = {
  id: number;
  programId: number;
  /** Null once the training day is deleted; the session and its history stay. */
  trainingDayId: number | null;
  /** The day's name when the session started, kept for history. */
  dayName: string;
  status: WorkoutSessionStatus;
  /** UTC, `YYYY-MM-DD HH:MM:SS`. */
  startedAt: string;
  finishedAt: string | null;
};

/** One set actually done. */
export type SetEntry = {
  id: number;
  sessionId: number;
  exerciseId: number;
  setNumber: number;
  /** Kilograms. */
  weight: number;
  reps: number;
};

/** A known exercise name offered when adding an exercise to a day; seeded with common ones, grows with names you type. */
export type LibraryExercise = {
  id: number;
  name: string;
};

/** Per-session state of an exercise; a row exists only when it was skipped or has a note. */
export type SessionExercise = {
  sessionId: number;
  exerciseId: number;
  skipped: SqliteFlag;
  /** Session note, e.g. "left shoulder sore". */
  notes: string;
};
