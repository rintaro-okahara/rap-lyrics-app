import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { StartupLogoSplash } from '@/components/StartupLogoSplash';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SessionProvider, useSession } from '@/hooks/useSession';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session } = useSession();

  return (
    <Stack>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isStartupAnimationDone, setIsStartupAnimationDone] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (!loaded) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
        {!isStartupAnimationDone ? (
          <StartupLogoSplash onFinished={() => setIsStartupAnimationDone(true)} />
        ) : null}
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
