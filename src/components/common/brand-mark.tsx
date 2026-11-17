import { Text, View } from 'react-native';

import { makeStyles, palette } from '@/theme';

export function BrandMark({ onDark = false }: { onDark?: boolean }) {
  const styles = useStyles();
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="BURAK, modern Turkish kitchen">
      <Text style={[styles.name, onDark && styles.nameOnDark]}>BURAK</Text>
      <Text style={[styles.caption, onDark && styles.captionOnDark]}>MODERN TURKISH KITCHEN</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  name: { color: t.colors.text, fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  nameOnDark: { color: palette.gold },
  caption: { color: t.colors.textMuted, fontSize: 7, letterSpacing: 1.5, marginTop: 1, fontWeight: '700' },
  captionOnDark: { color: '#D6D0C4' },
}));
