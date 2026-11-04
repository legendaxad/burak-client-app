import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, PageHeader, Surface } from '@/components/app-ui';
import { colors, radius, spacing } from '@/theme/colors';

function PreferenceRow({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}><Text style={styles.preferenceTitle}>{title}</Text><Text style={styles.preferenceDescription}>{description}</Text></View>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={onToggle} style={[styles.toggle, enabled && styles.toggleEnabled]}>
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobEnabled]} />
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(false);
  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Settings" subtitle="Make BURAK feel right for you." back />
      <View style={styles.content}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <Surface style={styles.card}>
          <PreferenceRow title="Order updates" description="Local demo preference for delivery updates." enabled={orderUpdates} onToggle={() => setOrderUpdates((value) => !value)} />
          <View style={styles.divider} />
          <PreferenceRow title="Offers and news" description="Hear about seasonal dishes and specials." enabled={offers} onToggle={() => setOffers((value) => !value)} />
        </Surface>

        <Text style={styles.sectionLabel}>ABOUT THIS DEMO</Text>
        <Surface style={styles.infoCard}>
          <View style={styles.infoIcon}><AppIcon name="info" size={17} color={colors.goldDeep} /></View>
          <View style={styles.infoCopy}><Text style={styles.infoTitle}>Your data stays on this device</Text><Text style={styles.infoDescription}>Profile details, cart items, and mock orders are stored locally for this demo.</Text></View>
        </Surface>
        <Text style={styles.disclaimer}>Notification switches are a local UI preference. This demo does not send notifications or contact a backend.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 32 },
  content: { paddingHorizontal: spacing.xl, gap: 10 },
  sectionLabel: { color: colors.muted, fontSize: 9, letterSpacing: 1, fontWeight: '800', marginTop: 5 },
  card: { gap: 12 },
  preferenceRow: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 12 },
  preferenceCopy: { flex: 1, gap: 4 },
  preferenceTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  preferenceDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  toggle: { width: 43, height: 25, borderRadius: radius.pill, backgroundColor: '#D9D5CD', padding: 3, justifyContent: 'center' },
  toggleEnabled: { backgroundColor: colors.goldDeep, alignItems: 'flex-end' },
  toggleKnob: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  toggleKnobEnabled: { backgroundColor: colors.white },
  divider: { height: 1, backgroundColor: colors.line },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, gap: 4 },
  infoTitle: { color: colors.text, fontSize: 11, fontWeight: '800' },
  infoDescription: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 15 },
});
