import type { SQLiteDatabase } from 'expo-sqlite';

import { DATABASE_VERSION, migrateDatabase } from '../src/db/migrate-database';
import { openTestDatabase } from '../test-utils/open-test-database';

async function openMigratedDatabase() {
  const db = openTestDatabase();
  await migrateDatabase(db);
  return db;
}

async function countRows(db: SQLiteDatabase, table: string) {
  const row = await db.getFirstAsync<{ total: number }>(`SELECT COUNT(*) AS total FROM ${table}`);
  return row?.total ?? 0;
}

// One program with a day, an exercise on it, and a session with a set and a note.
async function seedProgramWithHistory(db: SQLiteDatabase) {
  await db.execAsync(`
    INSERT INTO program (id, name, position) VALUES (1, 'Strength', 0);
    INSERT INTO training_day (id, programId, name, position) VALUES (1, 1, 'Day A', 0);
    INSERT INTO exercise (id, programId, name, sets, reps) VALUES (1, 1, 'Dips', 4, '10');
    INSERT INTO training_day_exercise (trainingDayId, exerciseId, position, notes) VALUES (1, 1, 0, '@90%');
    INSERT INTO workout_session (id, programId, trainingDayId, dayName, status) VALUES (1, 1, 1, 'Day A', 'completed');
    INSERT INTO set_entry (sessionId, exerciseId, setNumber, weight, reps) VALUES (1, 1, 1, 20, 10);
    INSERT INTO session_exercise (sessionId, exerciseId, notes) VALUES (1, 1, 'felt good');
  `);
}

describe('migrateDatabase', () => {
  it('creates every table and sets the schema version on a fresh database', async () => {
    const db = await openMigratedDatabase();

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

    expect(tables.map((table) => table.name)).toEqual([
      'exercise',
      'exercise_library',
      'program',
      'session_exercise',
      'set_entry',
      'training_day',
      'training_day_exercise',
      'workout_session',
    ]);
    expect(version?.user_version).toBe(DATABASE_VERSION);
  });

  it('seeds the exercise library with common exercises', async () => {
    const db = await openMigratedDatabase();

    const names = (await db.getAllAsync<{ name: string }>('SELECT name FROM exercise_library')).map(
      (row) => row.name,
    );

    expect(names.length).toBeGreaterThanOrEqual(50);
    expect(names.length).toBeLessThanOrEqual(100);
    expect(names).toEqual(expect.arrayContaining(['Pull-Up', 'Lat Pulldown', 'Bench Press', 'Squat', "Romanian Deadlift (RDL)"]));
    expect(names.every((name) => name === name.trim())).toBe(true);
  });

  it('upgrades a version 1 database to the latest version and keeps its data', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);
    // Rewinds to the state a device left on version 1 would be in.
    await db.execAsync('DROP TABLE exercise_library; PRAGMA user_version = 1;');

    await migrateDatabase(db);

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(version?.user_version).toBe(DATABASE_VERSION);
    expect(await countRows(db, 'exercise_library')).toBeGreaterThanOrEqual(50);
    expect(await countRows(db, 'set_entry')).toBe(1);
  });

  it('rejects a library name that differs only in case', async () => {
    const db = await openMigratedDatabase();

    await expect(db.runAsync('INSERT INTO exercise_library (name) VALUES (?)', ['bench press'])).rejects.toThrow();
  });

  it('leaves an up-to-date database and its data untouched when run again', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);

    await migrateDatabase(db);

    expect(await countRows(db, 'set_entry')).toBe(1);
  });

  it('deletes everything under a program when the program is deleted', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);

    await db.runAsync('DELETE FROM program WHERE id = ?', [1]);

    for (const table of ['training_day', 'exercise', 'training_day_exercise', 'workout_session', 'set_entry', 'session_exercise']) {
      expect(await countRows(db, table)).toBe(0);
    }
  });

  it('keeps sessions, sets and notes when their training day is deleted', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);

    await db.runAsync('DELETE FROM training_day WHERE id = ?', [1]);

    const session = await db.getFirstAsync<{ trainingDayId: number | null; dayName: string }>(
      'SELECT trainingDayId, dayName FROM workout_session WHERE id = 1',
    );
    expect(session).toEqual({ trainingDayId: null, dayName: 'Day A' });
    expect(await countRows(db, 'set_entry')).toBe(1);
    expect(await countRows(db, 'session_exercise')).toBe(1);
    expect(await countRows(db, 'exercise')).toBe(1);
  });

  it('allows only one active program', async () => {
    const db = await openMigratedDatabase();
    await db.runAsync('INSERT INTO program (name, position, isActive) VALUES (?, ?, 1)', ['A', 0]);

    await expect(
      db.runAsync('INSERT INTO program (name, position, isActive) VALUES (?, ?, 1)', ['B', 1]),
    ).rejects.toThrow();
  });

  it('allows only one session in progress', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);
    const insertSession =
      "INSERT INTO workout_session (programId, trainingDayId, dayName, status) VALUES (1, 1, 'Day A', 'in_progress')";
    await db.runAsync(insertSession);

    await expect(db.runAsync(insertSession)).rejects.toThrow();
  });

  it('treats the same name, sets and reps in one program as one exercise, ignoring case', async () => {
    const db = await openMigratedDatabase();
    await seedProgramWithHistory(db);

    await expect(
      db.runAsync(
        'INSERT INTO exercise (programId, name, sets, reps) VALUES (?, ?, ?, ?)',
        [1, 'DIPS', 4, '10'],
      ),
    ).rejects.toThrow();
    await db.runAsync(
      'INSERT INTO exercise (programId, name, sets, reps) VALUES (?, ?, ?, ?)',
      [1, 'Dips', 3, '12'],
    );
    expect(await countRows(db, 'exercise')).toBe(2);
  });

  it('rejects blank names', async () => {
    const db = await openMigratedDatabase();

    await expect(db.runAsync('INSERT INTO program (name, position) VALUES (?, ?)', ['   ', 0])).rejects.toThrow();
  });
});
