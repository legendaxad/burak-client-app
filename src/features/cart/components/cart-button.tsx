import { router } from 'expo-router';
import { View } from 'react-native';

import { IconButton } from '@/components/buttons/icon-button';
import { AppText } from '@/components/common/app-text';
import { selectCartCount, useCartStore } from '@/store/cart/cart-store';
import { makeStyles } from '@/theme';

/** Header shortcut to the cart with a live item-count badge. */
export function CartButton({ tone = 'surface' }: { tone?: 'surface' | 'overlay' }) {
  const styles = useStyles();
  const count = useCartStore(selectCartCount);
  return (
    <View>
      <IconButton
        icon="bag"
        tone={tone}
        accessibilityLabel={count ? `Cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Cart, empty'}
        onPress={() => router.navigate('/cart')}
      />
      {count > 0 ? (
        <View style={styles.badge} pointerEvents="none">
          <AppText variant="caption" style={styles.badgeText}>
            {count > 99 ? '99+' : count}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: t.colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: t.colors.onSelected, fontSize: 11, lineHeight: 14, fontWeight: '800' },
}));
