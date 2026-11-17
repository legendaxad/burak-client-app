import { View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { makeStyles } from '@/theme';

import type { Product } from '../types';
import { getStockState } from '../utils/product-display';

export function StockBadge({ product }: { product: Pick<Product, 'productLeftCount'> }) {
  const styles = useStyles();
  const stock = getStockState(product);
  if (stock.kind === 'available') return null;
  const soldOut = stock.kind === 'soldOut';
  return (
    <View style={[styles.badge, soldOut ? styles.soldOut : styles.low]}>
      <AppText variant="overline" style={soldOut ? styles.soldOutText : styles.lowText}>
        {soldOut ? 'Sold out' : `Only ${stock.left} left`}
      </AppText>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: { alignSelf: 'flex-start', paddingHorizontal: t.spacing.sm, paddingVertical: 3, borderRadius: t.radius.pill },
  soldOut: { backgroundColor: t.colors.dangerSoft },
  low: { backgroundColor: t.colors.accentSoft },
  soldOutText: { color: t.colors.danger, fontSize: 9, letterSpacing: 0.6 },
  lowText: { color: t.colors.primaryStrong, fontSize: 9, letterSpacing: 0.6 },
}));
