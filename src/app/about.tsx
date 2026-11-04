import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen, BrandMark, PageHeader, Surface } from '@/components/app-ui';
import { colors, radius, spacing } from '@/theme/colors';

const heroImage = require('@/assets/images/burak/hero.png');

export default function AboutScreen() {
  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="About BURAK" subtitle="A generous table, a little closer to home." back />
      <View style={styles.content}>
        <View style={styles.hero}>
          <Image source={heroImage} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.heroShade} />
          <View style={styles.heroBrand}><BrandMark light /></View>
          <Text style={styles.heroText}>Made with warmth.{ '\n' }Shared with everyone.</Text>
        </View>
        <Surface style={styles.storyCard}>
          <Text style={styles.eyebrow}>OUR KITCHEN</Text>
          <Text style={styles.title}>Hospitality is the heart of every meal.</Text>
          <Text style={styles.body}>BURAK brings the spirit of a welcoming Turkish table to everyday moments. We cook with care, serve generous plates, and believe a good meal is always better when it is shared.</Text>
          <Text style={styles.body}>From charcoal-grilled favorites to something sweet at the end, every order is prepared fresh and sent with a little extra warmth.</Text>
        </Surface>
        <View style={styles.valuesRow}>
          <View style={styles.valueCard}><Text style={styles.valueIcon}>✦</Text><Text style={styles.valueTitle}>Made fresh</Text><Text style={styles.valueCopy}>Prepared when you order.</Text></View>
          <View style={styles.valueCard}><Text style={styles.valueIcon}>♡</Text><Text style={styles.valueTitle}>Made to share</Text><Text style={styles.valueCopy}>Big-hearted portions.</Text></View>
          <View style={styles.valueCard}><Text style={styles.valueIcon}>⌂</Text><Text style={styles.valueTitle}>Made for you</Text><Text style={styles.valueCopy}>A familiar welcome.</Text></View>
        </View>
        <Text style={styles.footer}>BURAK · MODERN TURKISH KITCHEN</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 34 },
  content: { paddingHorizontal: spacing.xl, gap: 14 },
  hero: { height: 190, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.ink, padding: 18, justifyContent: 'space-between' },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.78 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,14,13,0.55)' },
  heroBrand: { zIndex: 1 },
  heroText: { color: colors.white, fontSize: 21, lineHeight: 27, fontWeight: '800' },
  storyCard: { gap: 10, padding: 18 },
  eyebrow: { color: colors.goldDeep, fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  title: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  valuesRow: { flexDirection: 'row', gap: 8 },
  valueCard: { flex: 1, minHeight: 102, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, gap: 4 },
  valueIcon: { color: colors.goldDeep, fontSize: 17, fontWeight: '800' },
  valueTitle: { color: colors.text, fontSize: 10, fontWeight: '800' },
  valueCopy: { color: colors.muted, fontSize: 9, lineHeight: 13 },
  footer: { color: colors.muted, fontSize: 8, letterSpacing: 1, textAlign: 'center', marginTop: 4 },
});
