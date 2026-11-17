import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { makeStyles, useTheme } from '@/theme';

import { AppText } from './app-text';
import { Icon, type IconName } from './icon';

interface StateMessageProps {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'info', title, message, action }: StateMessageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.icon}>
        <Icon name={icon} size={24} color={colors.primaryStrong} />
      </View>
      <AppText variant="subheading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" tone="muted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  action,
}: Omit<StateMessageProps, 'icon' | 'title'> & { title?: string; onRetry?: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.icon, styles.iconDanger]}>
        <Icon name="warning" size={22} color={colors.danger} />
      </View>
      <AppText variant="subheading" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" tone="muted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {onRetry ? <Button title="Try again" icon="refresh" variant="secondary" onPress={onRetry} /> : null}
      {action}
    </View>
  );
}

export function LoadingView({ message }: { message?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={message ?? 'Loading'}>
      <ActivityIndicator color={colors.primaryStrong} />
      {message ? (
        <AppText variant="caption" tone="muted">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: t.radius.xl,
    alignItems: 'center',
    paddingHorizontal: t.spacing.xxl,
    paddingVertical: t.spacing.xxxl,
    gap: t.spacing.md,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: t.colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDanger: { backgroundColor: t.colors.dangerSoft },
  message: { maxWidth: 300 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm },
}));
