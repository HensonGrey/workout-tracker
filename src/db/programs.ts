import type { SQLiteDatabase } from 'expo-sqlite';

import { type Program, WorkoutSessionStatus } from './entities';

export function requireName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name is required.');
  return trimmed;
}

export async function listPrograms(db: SQLiteDatabase): Promise<Program[]> {
  return db.getAllAsync<Program>('SELECT * FROM program ORDER BY position, id');
}

export async function getProgram(db: SQLiteDatabase, programId: number): Promise<Program | null> {
  return db.getFirstAsync<Program>('SELECT * FROM program WHERE id = ?', [programId]);
}

export async function getActiveProgram(db: SQLiteDatabase): Promise<Program | null> {
  return db.getFirstAsync<Program>('SELECT * FROM program WHERE isActive = 1');
}

/** The first program created while none is active becomes the active one. */
export async function createProgram(db: SQLiteDatabase, name: string): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO program (name, position, isActive) VALUES (
      ?,
      (SELECT COALESCE(MAX(position) + 1, 0) FROM program),
      NOT EXISTS (SELECT 1 FROM program WHERE isActive = 1)
    )`,
    [requireName(name)],
  );
  return result.lastInsertRowId;
}

export async function renameProgram(db: SQLiteDatabase, programId: number, name: string): Promise<void> {
  await db.runAsync('UPDATE program SET name = ? WHERE id = ?', [requireName(name), programId]);
}

export async function setActiveProgram(db: SQLiteDatabase, programId: number): Promise<void> {
  // Cleared first because the single-active index is checked row by row.
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE program SET isActive = 0 WHERE isActive = 1');
    const result = await db.runAsync('UPDATE program SET isActive = 1 WHERE id = ?', [programId]);
    if (result.changes === 0) throw new Error('Program not found.');
  });
}

export async function deleteProgram(db: SQLiteDatabase, programId: number): Promise<void> {
  const sessionInProgress = await db.getFirstAsync(
    'SELECT 1 FROM workout_session WHERE programId = ? AND status = ?',
    [programId, WorkoutSessionStatus.InProgress],
  );
  if (sessionInProgress) {
    throw new Error('Finish or skip the workout in progress before deleting this program.');
  }
  await db.runAsync('DELETE FROM program WHERE id = ?', [programId]);
}
