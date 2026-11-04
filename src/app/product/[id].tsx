import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, PageHeader, PrimaryButton, QuantityStepper, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, radius, spacing } from '@/theme/colors';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart } = useAppData();
  const product = products.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(1);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const selectedExtras = useMemo(() => product?.extras.filter((extra) => extraIds.includes(extra.id)) ?? [], [extraIds, product]);

  if (!product) {
    return <AppScreen><PageHeader title="Dish not found" back /><View style={styles.missing}><Text style={styles.body}>This menu item may no longer be available.</Text></View></AppScreen>;
  }

  const unitPrice = product.price + selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const toggleExtra = (extraId: string) => setExtraIds((current) => current.includes(extraId) ? current.filter((idValue) => idValue !== extraId) : [...current, extraId]);

  const handleAdd = () => {
    addToCart(product.id, quantity, extraIds);
    router.push('/cart');
  };

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="A little more detail" back />
      <View style={styles.content}>
        <View style={styles.imageWrap}>
          <Image source={product.image} style={styles.image} contentFit="cover" cachePolicy="memory-disk" transition={200} />
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.imageBack}><AppIcon name="arrow" color={colors.white} size={19} /></Pressable>
        </View>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}><Text style={styles.category}>{product.category}</Text><Text style={styles.title}>{product.name}</Text></View>
          <Text style={styles.price}>{`$${product.price.toFixed(2)}`}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}><AppIcon name="star" size={14} color={colors.goldDeep} /><Text style={styles.metaText}>{product.rating.toFixed(1)} rating</Text></View>
          <View style={styles.metaItem}><AppIcon name="clock" size={14} color={colors.muted} /><Text style={styles.metaText}>{product.prepMinutes} min</Text></View>
          <View style={[styles.availabilityDot, product.availability === 'Sold out' && styles.soldOutDot]} /><Text style={[styles.metaText, product.availability === 'Sold out' && styles.soldOutText]}>{product.availability}</Text>
        </View>
        <Text style={styles.description}>{product.description}</Text>

        {product.extras.length > 0 ? (
          <View style={styles.extrasSection}>
            <View><Text style={styles.sectionTitle}>Make it yours</Text><Text style={styles.sectionSubtitle}>Add a little something extra</Text></View>
            {product.extras.map((extra) => {
              const selected = extraIds.includes(extra.id);
              return (
                <Pressable key={extra.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleExtra(extra.id)} style={styles.extraRow}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <AppIcon name="check" size={13} color={colors.ink} /> : null}</View>
                  <Text style={styles.extraName}>{extra.name}</Text><Text style={styles.extraPrice}>{`+$${extra.price.toFixed(2)}`}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Surface style={styles.quantityCard}>
          <View><Text style={styles.quantityTitle}>Quantity</Text><Text style={styles.quantityHint}>Made fresh when you order</Text></View>
          <QuantityStepper value={quantity} onChange={(next) => setQuantity(Math.max(1, next))} />
        </Surface>
        <PrimaryButton title={product.availability === 'Available' ? `Add to cart · $${(unitPrice * quantity).toFixed(2)}` : 'Currently unavailable'} onPress={handleAdd} disabled={product.availability !== 'Available'} icon="bag" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 36 },
  content: { paddingHorizontal: spacing.xl, gap: 16 },
  imageWrap: { height: 250, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#E6E0D6', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageBack: { position: 'absolute', top: 13, left: 13, width: 39, height: 39, borderRadius: 20, backgroundColor: 'rgba(23,22,21,0.72)', alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  titleCopy: { flex: 1, gap: 4 },
  category: { color: colors.goldDeep, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', lineHeight: 30 },
  price: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 13, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  availabilityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green, marginRight: -8 },
  soldOutDot: { backgroundColor: colors.red },
  soldOutText: { color: colors.red },
  description: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  extrasSection: { gap: 11 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  extraRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  extraName: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' },
  extraPrice: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  quantityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  quantityTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  quantityHint: { color: colors.muted, fontSize: 10, marginTop: 3 },
  missing: { paddingHorizontal: spacing.xl },
  body: { color: colors.muted, fontSize: 13 },
});
