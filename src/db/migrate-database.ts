import type { SQLiteDatabase } from 'expo-sqlite';

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

// Frozen with this migration; later additions to the seed go in a new migration.
const SEEDED_LIBRARY_EXERCISES = [
  // Chest
  'Bench Press',
  'Incline Bench Press',
  'Decline Bench Press',
  'Dumbbell Bench Press',
  'Incline Dumbbell Press',
  'Close-Grip Bench Press',
  'Machine Chest Press',
  'Dumbbell Fly',
  'Cable Fly',
  'Pec Deck',
  'Push-Up',
  'Dips',
  // Back
  'Pull-Up',
  'Chin-Up',
  'Lat Pulldown',
  'Close-Grip Pulldown',
  'Straight-Arm Pulldown',
  'Barbell Row',
  'Pendlay Row',
  'Dumbbell Row',
  'Seated Cable Row',
  'T-Bar Row',
  'Chest-Supported Row',
  'Machine Row',
  'Inverted Row',
  'Face Pull',
  'Shrug',
  'Deadlift',
  'Rack Pull',
  'Back Extension',
  // Shoulders
  'Overhead Press',
  'Seated Dumbbell Press',
  'Arnold Press',
  'Push Press',
  'Machine Shoulder Press',
  'Lateral Raise',
  'Cable Lateral Raise',
  'Front Raise',
  'Rear Delt Fly',
  'Reverse Pec Deck',
  'Upright Row',
  // Arms
  'Barbell Curl',
  'EZ-Bar Curl',
  'Dumbbell Curl',
  'Hammer Curl',
  'Incline Dumbbell Curl',
  'Preacher Curl',
  'Cable Curl',
  'Concentration Curl',
  'Triceps Pushdown',
  'Overhead Triceps Extension',
  'Skull Crusher',
  'Triceps Kickback',
  'Wrist Curl',
  // Legs
  'Squat',
  'Front Squat',
  'Goblet Squat',
  'Hack Squat',
  'Leg Press',
  'Bulgarian Split Squat',
  'Lunge',
  'Walking Lunge',
  'Step-Up',
  'Romanian Deadlift (RDL)',
  'Stiff-Leg Deadlift',
  'Sumo Deadlift',
  'Good Morning',
  'Hip Thrust',
  'Glute Bridge',
  'Leg Extension',
  'Lying Leg Curl',
  'Seated Leg Curl',
  'Nordic Curl',
  'Hip Abduction',
  'Hip Adduction',
  'Standing Calf Raise',
  'Seated Calf Raise',
  // Core
  'Hanging Leg Raise',
  'Hanging Knee Raise',
  'Cable Crunch',
  'Ab Wheel Rollout',
  'Crunch',
  'Russian Twist',
  'Pallof Press',
  // Full body
  'Kettlebell Swing',
  'Power Clean',
  'Muscle-Up',
];

const EXERCISE_LIBRARY_V2 = `
  CREATE TABLE exercise_library (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE CHECK (trim(name) <> '')
  );
  INSERT INTO exercise_library (name) VALUES
    ${SEEDED_LIBRARY_EXERCISES.map((name) => `('${name.replaceAll("'", "''")}')`).join(',\n    ')};
`;

// Index + 1 is the schema version; never edit an applied migration, append a new one.
const MIGRATIONS = [SCHEMA_V1, EXERCISE_LIBRARY_V2];

export const DATABASE_VERSION = MIGRATIONS.length;

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    for (const migration of MIGRATIONS.slice(currentVersion)) {
      await db.execAsync(migration);
    }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
