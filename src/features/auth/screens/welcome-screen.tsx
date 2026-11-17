import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { BrandMark } from '@/components/common/brand-mark';
import { makeStyles, palette } from '@/theme';

const heroImage = require('@/assets/images/burak/hero.png');

export function WelcomeScreen() {
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <Image source={heroImage} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <View style={styles.scrim} />
      <SafeAreaView style={styles.content} edges={['top', 'bottom', 'left', 'right']}>
        <BrandMark onDark />
        <View style={styles.bottom}>
          <AppText variant="overline" style={styles.eyebrow}>
            Welcome to BURAK
          </AppText>
          <AppText variant="display" style={styles.title}>
            Good food brings{'\n'}us together.
          </AppText>
          <AppText style={styles.subtitle}>
            Browse the menu, place orders with the kitchen, and collect points with every confirmed order.
          </AppText>
          <View style={styles.actions}>
            <Button title="Create an account" fullWidth onPress={() => router.push('/register')} />
            <Button
              title="I already have an account"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/login')}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.heroBackground },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(15,14,13,0.62)' },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.xl,
    paddingTop: t.spacing.lg,
    paddingBottom: t.spacing.lg,
    width: '100%',
    maxWidth: t.sizes.contentMaxWidth,
    alignSelf: 'center',
  },
  bottom: { gap: t.spacing.md },
  eyebrow: { color: palette.gold },
  title: { color: t.colors.heroText },
  subtitle: { color: t.colors.heroTextMuted, maxWidth: 340 },
  actions: { gap: t.spacing.md, marginTop: t.spacing.lg },
}));
