import { migrateDatabase } from '../src/db/migrate-database';
import {
  createProgram,
  deleteProgram,
  getActiveProgram,
  listPrograms,
  renameProgram,
  setActiveProgram,
} from '../src/db/programs';
import { openTestDatabase } from '../test-utils/open-test-database';

async function openMigratedDatabase() {
  const db = openTestDatabase();
  await migrateDatabase(db);
  return db;
}

describe('programs', () => {
  it('lists programs in creation order with trimmed names', async () => {
    const db = await openMigratedDatabase();
    await createProgram(db, '  Strength ');
    await createProgram(db, 'Travel');

    const programs = await listPrograms(db);

    expect(programs.map((program) => program.name)).toEqual(['Strength', 'Travel']);
    expect(programs.map((program) => program.position)).toEqual([0, 1]);
  });

  it('makes the first program active and leaves later ones inactive', async () => {
    const db = await openMigratedDatabase();
    const firstId = await createProgram(db, 'Strength');
    await createProgram(db, 'Travel');

    expect((await getActiveProgram(db))?.id).toBe(firstId);
  });

  it('keeps exactly one program active when switching', async () => {
    const db = await openMigratedDatabase();
    await createProgram(db, 'Strength');
    const secondId = await createProgram(db, 'Travel');

    await setActiveProgram(db, secondId);

    const programs = await listPrograms(db);
    expect(programs.map((program) => [program.name, program.isActive])).toEqual([
      ['Strength', 0],
      ['Travel', 1],
    ]);
  });

  it('keeps the current active program when asked to activate one that does not exist', async () => {
    const db = await openMigratedDatabase();
    const firstId = await createProgram(db, 'Strength');

    await expect(setActiveProgram(db, 999)).rejects.toThrow('Program not found.');

    expect((await getActiveProgram(db))?.id).toBe(firstId);
  });

  it('renames a program', async () => {
    const db = await openMigratedDatabase();
    const id = await createProgram(db, 'Strength');

    await renameProgram(db, id, 'Strength 2');

    expect((await listPrograms(db))[0].name).toBe('Strength 2');
  });

  it('rejects blank names', async () => {
    const db = await openMigratedDatabase();
    const id = await createProgram(db, 'Strength');

    await expect(createProgram(db, '   ')).rejects.toThrow('Name is required.');
    await expect(renameProgram(db, id, '')).rejects.toThrow('Name is required.');
  });

  it('leaves no active program after deleting the active one', async () => {
    const db = await openMigratedDatabase();
    const id = await createProgram(db, 'Strength');
    await createProgram(db, 'Travel');

    await deleteProgram(db, id);

    expect(await getActiveProgram(db)).toBeNull();
    expect((await listPrograms(db)).map((program) => program.name)).toEqual(['Travel']);
  });

  it('activates the next program created after the active one is deleted', async () => {
    const db = await openMigratedDatabase();
    await deleteProgram(db, await createProgram(db, 'Strength'));

    const newId = await createProgram(db, 'Travel');

    expect((await getActiveProgram(db))?.id).toBe(newId);
  });

  it('refuses to delete a program with a workout in progress', async () => {
    const db = await openMigratedDatabase();
    const id = await createProgram(db, 'Strength');
    await db.runAsync(
      "INSERT INTO workout_session (programId, dayName, status) VALUES (?, 'Day A', 'in_progress')",
      [id],
    );

    await expect(deleteProgram(db, id)).rejects.toThrow('workout in progress');
    expect(await listPrograms(db)).toHaveLength(1);
  });
});
