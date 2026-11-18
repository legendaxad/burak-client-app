import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';

import { ErrorState } from '@/components/common/state-message';
import { useSessionBootstrap } from '@/features/auth';
import { AppProviders } from '@/providers/app-providers';
import { useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const status = useSessionBootstrap();
  const { colors, scheme } = useTheme();

  useEffect(() => {
    if (status !== 'restoring') void SplashScreen.hideAsync().catch(() => undefined);
  }, [status]);

  // Keep the splash screen up while the token is read from SecureStore, so the
  // user never sees a flash of the wrong (auth vs app) screens.
  if (status === 'restoring') return null;

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {/* Unguarded entry route: redirects "/" to /home or /welcome (see app/index.tsx). */}
        <Stack.Screen name="index" />
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="products/[id]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="orders/[id]" />
          <Stack.Screen name="profile/edit" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

/** Last-resort boundary for render errors in any route. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <AppProviders>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <ErrorState title="Something went wrong" message={error.message} onRetry={() => void retry()} />
      </View>
    </AppProviders>
  );
}
