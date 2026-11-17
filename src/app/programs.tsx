import { Stack, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { listPrograms, setActiveProgram } from '@/db/programs';
import { useFocusedData } from '@/hooks/use-focused-data';

export default function ProgramsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { data: programs, reload } = useFocusedData(listPrograms);

  async function activateProgram(programId: number) {
    try {
      await setActiveProgram(db, programId);
      await reload();
    } catch (error) {
      Alert.alert('Could not set the active program', (error as Error).message);
    }
  }

  function openProgram(programId: number) {
    router.push({ pathname: '/edit-program', params: { programId: String(programId) } });
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Programs' }} />

      <FlatList
        data={programs ?? []}
        keyExtractor={(program) => String(program.id)}
        contentContainerClassName="px-4"
        ListEmptyComponent={
          programs ? (
            <EmptyState
              title="No programs yet."
              actionLabel="Create program"
              onAction={() => router.push('/edit-program')}
            />
          ) : undefined
        }
        renderItem={({ item: program }) => (
          <View className="min-h-16 flex-row items-center gap-3 border-b border-border py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Opens the program to rename or delete it"
              onPress={() => openProgram(program.id)}
              className="min-h-12 flex-1 justify-center rounded-lg px-1 active:bg-surface">
              <Text className="text-[17px] text-text">{program.name}</Text>
            </Pressable>
            {program.isActive ? (
              <Text className="text-sm font-semibold text-success">Active</Text>
            ) : (
              <Button label="Set active" variant="secondary" onPress={() => activateProgram(program.id)} />
            )}
          </View>
        )}
      />

      {programs?.length ? (
        <View className="border-t border-border bg-background p-4">
          <Button label="+ Program" onPress={() => router.push('/edit-program')} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
