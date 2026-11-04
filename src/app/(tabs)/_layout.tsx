import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors } from '@/theme/colors';

function TabIcon({ name, color, size, badge }: { name: string; color: string; size: number; badge?: number }) {
  return (
    <View style={styles.iconWrap}>
      <AppIcon name={name} color={color} size={size} />
      {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text></View> : null}
    </View>
  );
}

export default function TabLayout() {
  const { cartCount } = useAppData();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.goldDeep,
      tabBarInactiveTintColor: colors.muted,
      tabBarLabelStyle: styles.label,
      tabBarItemStyle: styles.item,
      tabBarStyle: styles.tabBar,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: ({ color, size }) => <TabIcon name="menu" color={color} size={size} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color, size }) => <TabIcon name="bag" color={color} size={size} badge={cartCount} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'My Orders', tabBarIcon: ({ color, size }) => <TabIcon name="orders" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <TabIcon name="profile" color={color} size={size} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.surface, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 6, paddingBottom: 4, elevation: 12, shadowColor: '#1B1916', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
  label: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  item: { paddingTop: 2 },
  iconWrap: { minWidth: 30, minHeight: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', minWidth: 16, height: 16, paddingHorizontal: 3, top: -5, right: -9, borderRadius: 8, borderWidth: 1.5, borderColor: colors.surface, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },
});
