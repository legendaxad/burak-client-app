import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView. Use false for screens that own a FlatList. */
  scroll?: boolean;
  /** Push content above the software keyboard (forms). */
  keyboardAware?: boolean;
  edges?: Edge[];
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Root container for every screen: applies safe-area insets, theme background,
 * a readable max width on tablets, and optional keyboard handling.
 * Tab screens omit the bottom edge because the tab bar already handles it.
 */
export function Screen({
  children,
  scroll = true,
  keyboardAware = false,
  edges = ['top', 'left', 'right'],
  refreshControl,
  contentStyle,
}: ScreenProps) {
  const styles = useStyles();

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={styles.width}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.width, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {keyboardAware ? (
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  safeArea: { flex: 1, backgroundColor: t.colors.background },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: t.spacing.xxxl },
  width: { width: '100%', maxWidth: t.sizes.contentMaxWidth, alignSelf: 'center' },
}));
