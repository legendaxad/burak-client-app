import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, PageHeader, SectionTitle, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';

function ProfileLink({ icon, label, detail, onPress }: { icon: string; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.linkCard, pressed && styles.pressed]}>
      <View style={styles.linkIcon}><AppIcon name={icon} size={18} color={colors.goldDeep} /></View>
      <View style={styles.linkCopy}><Text style={styles.linkLabel}>{label}</Text>{detail ? <Text style={styles.linkDetail}>{detail}</Text> : null}</View>
      <AppIcon name="next" size={15} color={colors.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { customer, orders } = useAppData();
  const initials = customer.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'G';
  const activeCount = orders.filter((order) => ['Pending', 'Preparing', 'Ready'].includes(order.status)).length;

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Your profile" subtitle="All your BURAK details, in one place." />
      <View style={styles.content}>
        <Surface style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.profileCopy}><Text style={styles.name}>{customer.name || 'Welcome to BURAK'}</Text><Text style={styles.email}>{customer.email || 'Guest profile · saved on this device'}</Text></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.profileDetail}><AppIcon name="phone" size={15} color={colors.muted} /><Text style={styles.profileDetailText}>{customer.phone || 'Add a phone number'}</Text></View>
          <View style={styles.profileDetail}><AppIcon name="pin" size={15} color={colors.muted} /><Text style={styles.profileDetailText}>{customer.address || 'Add a delivery address'}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')}><Text style={styles.editLink}>Edit profile details</Text></Pressable>
        </Surface>

        <View style={styles.ordersSummary}>
          <View><Text style={styles.ordersCount}>{orders.length}</Text><Text style={styles.ordersCaption}>Total orders</Text></View>
          <View style={styles.summaryDivider} />
          <View><Text style={styles.ordersCount}>{activeCount}</Text><Text style={styles.ordersCaption}>On the way</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/orders')}><Text style={styles.ordersLink}>View orders ›</Text></Pressable>
        </View>

        <View style={styles.linkSection}>
          <SectionTitle title="Your account" />
          <ProfileLink icon="settings" label="Settings" detail="Preferences and notifications" onPress={() => router.navigate('/settings')} />
          <ProfileLink icon="help" label="Help & support" detail="FAQs, delivery, and order help" onPress={() => router.navigate('/help')} />
          <ProfileLink icon="info" label="About BURAK" detail="Our kitchen and story" onPress={() => router.navigate('/about')} />
        </View>
        <Text style={styles.version}>BURAK CUSTOMER · 1.0.0</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 34 },
  content: { paddingHorizontal: spacing.xl, gap: 14 },
  profileCard: { gap: 13 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.gold, fontSize: 16, fontWeight: '900' },
  profileCopy: { flex: 1, gap: 4 },
  name: { color: colors.text, fontSize: 15, fontWeight: '800' },
  email: { color: colors.muted, fontSize: 10 },
  divider: { height: 1, backgroundColor: colors.line },
  profileDetail: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  profileDetailText: { flex: 1, color: colors.text, fontSize: 11 },
  editLink: { color: colors.goldDeep, fontSize: 11, fontWeight: '800', marginTop: 1 },
  ordersSummary: { minHeight: 68, borderRadius: radius.lg, backgroundColor: colors.ink, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ordersCount: { color: colors.gold, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  ordersCaption: { color: '#D3CEC4', fontSize: 9, marginTop: 2 },
  summaryDivider: { height: 30, width: 1, backgroundColor: 'rgba(255,255,255,0.16)' },
  ordersLink: { marginLeft: 'auto', color: colors.gold, fontSize: 10, fontWeight: '800' },
  linkSection: { gap: 9 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, padding: 11 },
  pressed: { opacity: 0.7 },
  linkIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  linkCopy: { flex: 1, gap: 3 },
  linkLabel: { color: colors.text, fontSize: 12, fontWeight: '800' },
  linkDetail: { color: colors.muted, fontSize: 10 },
  version: { color: colors.muted, fontSize: 8, textAlign: 'center', letterSpacing: 1, marginTop: 4 },
});
