import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/buttons/icon-button';
import { AppText } from '@/components/common/app-text';
import { BrandMark } from '@/components/common/brand-mark';
import { makeStyles } from '@/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button instead of the brand mark. */
  back?: boolean;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, back = false, action }: PageHeaderProps) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {back ? (
          <IconButton
            icon="back"
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        ) : (
          <BrandMark />
        )}
        {action}
      </View>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="caption" tone="muted">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.sectionRow}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {action}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: { paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.md, paddingBottom: t.spacing.lg, gap: t.spacing.xs },
  topRow: {
    minHeight: t.sizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: t.spacing.md,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md },
}));
