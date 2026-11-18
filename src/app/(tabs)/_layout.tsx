import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/common/icon';
import { selectCartCount, useCartStore } from '@/store/cart/cart-store';
import { useTheme } from '@/theme';

function tabIcon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Icon name={name} size={22} color={color} />;
  };
}

export default function TabLayout() {
  const { colors, shadows } = useTheme();
  const cartCount = useCartStore(selectCartCount);
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + bottom,
          paddingTop: 6,
          paddingBottom: bottom,
          ...shadows.card,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: tabIcon('menu') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('bag'),
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.selected, color: colors.onSelected, fontSize: 11, fontWeight: '800' },
          tabBarAccessibilityLabel: cartCount ? `Cart, ${cartCount} items` : 'Cart',
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: tabIcon('orders') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('profile') }} />
    </Tabs>
  );
}
