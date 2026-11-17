import { Pressable, TextInput, View } from 'react-native';

import { Icon } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search the menu',
  autoFocus,
  onSubmitEditing,
}: SearchBarProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Icon name="search" size={19} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        autoFocus={autoFocus}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText('')}
          hitSlop={10}
        >
          <Icon name="close" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Non-editable variant used as an entry point that navigates to the menu search. */
export function SearchEntry({ placeholder = 'Search the menu', onPress }: { placeholder?: string; onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      onPress={onPress}
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}
    >
      <Icon name="search" size={19} color={colors.textMuted} />
      <TextInput editable={false} pointerEvents="none" placeholder={placeholder} placeholderTextColor={colors.inputPlaceholder} style={styles.input} />
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  field: {
    minHeight: t.sizes.inputHeight,
    paddingHorizontal: t.spacing.md + 2,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm + 2,
  },
  input: { flex: 1, color: t.colors.text, fontSize: 14, paddingVertical: t.spacing.sm + 2 },
  pressed: { opacity: 0.8 },
}));
