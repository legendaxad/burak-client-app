import { Stack } from 'expo-router';

import { AppProvider } from '@/context/app-context';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="order-confirmation" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="help" />
        <Stack.Screen name="about" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="login" />
      </Stack>
    </AppProvider>
  );
}
