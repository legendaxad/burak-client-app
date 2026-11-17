import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { BrandMark } from '@/components/common/brand-mark';
import { makeStyles, palette } from '@/theme';

const heroImage = require('@/assets/images/burak/hero.png');

/** Brand artwork only: no offers, discounts or opening hours (the backend has none). */
export function HomeHero() {
  const styles = useStyles();
  return (
    <View style={styles.hero}>
      <Image source={heroImage} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <BrandMark onDark />
        <View style={styles.copy}>
          <AppText variant="overline" style={styles.eyebrow}>
            A little taste of BURAK
          </AppText>
          <AppText variant="display" style={styles.title}>
            Good food brings{'\n'}us together.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { minHeight: 230, overflow: 'hidden', backgroundColor: t.colors.heroBackground },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t.colors.scrim },
  content: { minHeight: 230, padding: t.spacing.xl, justifyContent: 'space-between' },
  copy: { gap: t.spacing.xs },
  eyebrow: { color: palette.gold },
  title: { color: t.colors.heroText },
}));
