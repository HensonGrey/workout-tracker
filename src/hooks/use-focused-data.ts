import { useFocusEffect } from 'expo-router';
import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

/** Loads screen data each time the screen comes into focus; `load` must be stable (module-level or useCallback). */
export function useFocusedData<T>(load: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>();

  const reload = useCallback(async () => {
    setData(await load(db));
  }, [db, load]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, reload };
}
