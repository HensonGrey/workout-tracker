import { Stack, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { getActiveProgram, listPrograms } from '@/db/programs';
import { useFocusedData } from '@/hooks/use-focused-data';

async function loadHome(db: SQLiteDatabase) {
  const [programs, activeProgram] = await Promise.all([listPrograms(db), getActiveProgram(db)]);
  return { hasPrograms: programs.length > 0, activeProgram };
}

export default function HomeScreen() {
  const router = useRouter();
  const { data } = useFocusedData(loadHome);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 py-6 gap-6">
      <Stack.Screen
        options={{
          title: 'Workout',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/programs')}
              className="min-h-12 justify-center px-2">
              <Text className="text-[17px] text-text underline">Programs</Text>
            </Pressable>
          ),
        }}
      />

      {data && !data.hasPrograms ? (
        <EmptyState
          title="Build your first program."
          actionLabel="Create program"
          onAction={() => router.push('/edit-program')}
        />
      ) : null}

      {data?.hasPrograms && !data.activeProgram ? (
        <EmptyState
          title="Choose a program to train."
          actionLabel="Choose program"
          onAction={() => router.push('/programs')}
        />
      ) : null}

      {data?.activeProgram ? (
        <View className="gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-[28px] font-bold text-text">{data.activeProgram.name}</Text>
            <Text className="text-sm font-semibold text-success">Active</Text>
          </View>
          <Text className="text-[17px] text-text-muted">No training days yet.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
