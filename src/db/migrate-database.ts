import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

const SCHEMA_V1 = `
  CREATE TABLE program (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL CHECK (trim(name) <> ''),
    isActive INTEGER NOT NULL DEFAULT 0 CHECK (isActive IN (0, 1)),
    position INTEGER NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX program_single_active ON program (isActive) WHERE isActive = 1;

  CREATE TABLE training_day (
    id INTEGER PRIMARY KEY,
    programId INTEGER NOT NULL REFERENCES program (id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (trim(name) <> ''),
    position INTEGER NOT NULL
  );

  CREATE TABLE exercise (
    id INTEGER PRIMARY KEY,
    programId INTEGER NOT NULL REFERENCES program (id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (trim(name) <> ''),
    sets INTEGER NOT NULL CHECK (sets > 0),
    reps TEXT NOT NULL CHECK (trim(reps) <> ''),
    UNIQUE (programId, name COLLATE NOCASE, sets, reps)
  );

  CREATE TABLE training_day_exercise (
    trainingDayId INTEGER NOT NULL REFERENCES training_day (id) ON DELETE CASCADE,
    exerciseId INTEGER NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (trainingDayId, exerciseId)
  );

  -- trainingDayId is nulled rather than cascaded so history survives deleting a day.
  CREATE TABLE workout_session (
    id INTEGER PRIMARY KEY,
    programId INTEGER NOT NULL REFERENCES program (id) ON DELETE CASCADE,
    trainingDayId INTEGER REFERENCES training_day (id) ON DELETE SET NULL,
    dayName TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'skipped')),
    startedAt TEXT NOT NULL DEFAULT (datetime('now')),
    finishedAt TEXT
  );
  CREATE UNIQUE INDEX workout_session_single_in_progress ON workout_session (status) WHERE status = 'in_progress';

  CREATE TABLE set_entry (
    id INTEGER PRIMARY KEY,
    sessionId INTEGER NOT NULL REFERENCES workout_session (id) ON DELETE CASCADE,
    exerciseId INTEGER NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    setNumber INTEGER NOT NULL CHECK (setNumber > 0),
    weight REAL NOT NULL CHECK (weight >= 0),
    reps INTEGER NOT NULL CHECK (reps > 0)
  );
  CREATE INDEX set_entry_exercise ON set_entry (exerciseId);

  CREATE TABLE session_exercise (
    sessionId INTEGER NOT NULL REFERENCES workout_session (id) ON DELETE CASCADE,
    exerciseId INTEGER NOT NULL REFERENCES exercise (id) ON DELETE CASCADE,
    skipped INTEGER NOT NULL DEFAULT 0 CHECK (skipped IN (0, 1)),
    notes TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (sessionId, exerciseId)
  );
`;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (currentVersion === 0) {
      await db.execAsync(SCHEMA_V1);
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
