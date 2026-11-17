import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { makeStyles } from '@/theme';

interface AuthFormLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFormLayout({ title, subtitle, children, footer }: AuthFormLayoutProps) {
  const styles = useStyles();
  return (
    <Screen keyboardAware edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader back title={title} />
      <View style={styles.body}>
        <AppText tone="muted">{subtitle}</AppText>
        <View style={styles.form}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.xl },
  form: { gap: t.spacing.lg },
  footer: { alignItems: 'center' },
}));
