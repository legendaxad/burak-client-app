import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

/** Imperative handle of the underlying TextInput (focus, blur…). */
export type TextFieldHandle = ComponentRef<typeof TextInput>;

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  label: string;
  error?: string;
  hint?: string;
  /** Renders a password field with a show/hide toggle. */
  password?: boolean;
  ref?: Ref<TextFieldHandle>;
}

export function TextField({ label, error, hint, password = false, ref, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
      <View style={[styles.field, focused && styles.fieldFocused, Boolean(error) && styles.fieldError]}>
        <TextInput
          ref={ref}
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry={password && !revealed}
          autoCapitalize={password ? 'none' : inputProps.autoCapitalize}
          autoCorrect={password ? false : inputProps.autoCorrect}
          style={[styles.input, inputProps.multiline && styles.multiline]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            onPress={() => setRevealed((value) => !value)}
            hitSlop={10}
            style={styles.toggle}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={19} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.spacing.xs + 2 },
  label: { color: t.colors.text, fontWeight: '700' },
  field: {
    minHeight: t.sizes.inputHeight,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: t.spacing.md + 2,
  },
  fieldFocused: { borderColor: t.colors.primaryStrong },
  fieldError: { borderColor: t.colors.danger },
  input: { flex: 1, color: t.colors.text, fontSize: 15, paddingVertical: t.spacing.md },
  multiline: { minHeight: 96, maxHeight: 180, textAlignVertical: 'top' },
  toggle: { paddingLeft: t.spacing.sm, height: t.sizes.touchTarget, justifyContent: 'center' },
}));
