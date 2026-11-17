import { openTestDatabase } from '../test-utils/open-test-database';

describe('openTestDatabase', () => {
  it('runs real SQL and returns rows', async () => {
    const db = openTestDatabase();
    await db.execAsync('CREATE TABLE item (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');

    const inserted = await db.runAsync('INSERT INTO item (name) VALUES (?)', ['first']);

    expect(inserted).toEqual({ lastInsertRowId: 1, changes: 1 });
    expect(await db.getAllAsync('SELECT * FROM item')).toEqual([{ id: 1, name: 'first' }]);
    expect(await db.getFirstAsync('SELECT * FROM item WHERE id = ?', [2])).toBeNull();
  });

  it('rolls a failed transaction back', async () => {
    const db = openTestDatabase();
    await db.execAsync('CREATE TABLE item (id INTEGER PRIMARY KEY, name TEXT NOT NULL)');

    const failingTransaction = db.withTransactionAsync(async () => {
      await db.runAsync('INSERT INTO item (name) VALUES (?)', ['kept?']);
      await db.runAsync('INSERT INTO item (name) VALUES (?)', [null]);
    });

    await expect(failingTransaction).rejects.toThrow();
    expect(await db.getAllAsync('SELECT * FROM item')).toEqual([]);
  });

  it('enforces foreign keys', async () => {
    const db = openTestDatabase();
    await db.execAsync(`
      CREATE TABLE parent (id INTEGER PRIMARY KEY);
      CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parent(id));
    `);

    await expect(db.runAsync('INSERT INTO child (parent_id) VALUES (?)', [99])).rejects.toThrow();
  });
});
