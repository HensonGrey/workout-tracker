import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { createProgram, deleteProgram, getProgram, renameProgram } from '@/db/programs';

/** Creates a program, or renames / deletes the one in `programId`. */
export default function EditProgramScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { programId: programIdParam } = useLocalSearchParams<{ programId?: string }>();
  const programId = programIdParam ? Number(programIdParam) : null;

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (programId === null) return;
    getProgram(db, programId).then((program) => setName(program?.name ?? ''));
  }, [db, programId]);

  async function saveProgram() {
    try {
      if (programId === null) {
        await createProgram(db, name);
      } else {
        await renameProgram(db, programId, name);
      }
      router.back();
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  function confirmDeleteProgram() {
    if (programId === null) return;
    Alert.alert(`Delete ${name}?`, 'This deletes its training days, exercises and workout history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete program',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProgram(db, programId);
            router.back();
          } catch (deleteError) {
            Alert.alert('Could not delete the program', (deleteError as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-4 py-6"
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: programId === null ? 'New program' : 'Edit program' }} />

      <TextField
        label="Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        error={error}
        autoFocus={programId === null}
        returnKeyType="done"
        onSubmitEditing={saveProgram}
      />
      <Button label={programId === null ? 'Create program' : 'Save'} onPress={saveProgram} />

      {programId !== null ? (
        <Button label="Delete program" variant="destructive" onPress={confirmDeleteProgram} />
      ) : null}
    </ScrollView>
  );
}
