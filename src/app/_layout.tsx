import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { migrateDatabase } from '@/db/migrate-database';
import { darkTheme, lightTheme, toThemeVariables } from '@/themes';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavigationTheme,
    colors: {
      ...baseNavigationTheme.colors,
      primary: theme.accent,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <View className="flex-1" style={toThemeVariables(theme)}>
        <SQLiteProvider databaseName="workout.db" onInit={migrateDatabase}>
          <AnimatedSplashOverlay />
          {/* iOS 26 headers are transparent by default; these screens want a solid one. */}
          <Stack screenOptions={{ headerTransparent: false }}>
            <Stack.Screen name="edit-program" options={{ presentation: 'modal' }} />
          </Stack>
        </SQLiteProvider>
      </View>
    </ThemeProvider>
  );
}
