import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, BrandMark, ProductCard, SearchField, SectionTitle } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { promotions } from '@/data/promotions';
import { colors, radius, spacing } from '@/theme/colors';

const heroImage = require('@/assets/images/burak/hero.png');

export default function HomeScreen() {
  const { products, categories, customer, restaurant, addToCart } = useAppData();
  const [search, setSearch] = useState('');
  const popular = useMemo(() => products.filter((product) => product.isPopular), [products]);
  const recommended = useMemo(() => products.filter((product) => product.isRecommended), [products]);
  const firstName = customer.name.trim().split(/\s+/)[0] || 'there';

  const openMenu = (params?: { q?: string; category?: string }) => router.push({ pathname: '/menu', params: params ?? {} });
  const openProduct = (id: string) => router.push({ pathname: '/product/[id]', params: { id } });

  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <Image source={heroImage} style={styles.heroImage} contentFit="cover" cachePolicy="memory-disk" />
        <View style={styles.heroShade} />
        <View style={styles.heroContent}>
          <View style={styles.heroTopRow}>
            <BrandMark light />
            <View style={styles.openPill}><View style={styles.openDot} /><Text style={styles.openLabel}>OPEN TODAY</Text></View>
          </View>
          <Text style={styles.eyebrow}>A LITTLE TASTE OF BURAK</Text>
          <Text style={styles.heroTitle}>Good food brings{'\n'}us together.</Text>
          <Text style={styles.heroSubtitle}>Thoughtful Turkish cooking, made for your table.</Text>
          <Pressable accessibilityRole="button" onPress={() => openMenu()} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
            <Text style={styles.heroButtonText}>ORDER SOMETHING LOVELY</Text><AppIcon name="next" size={15} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeRow}>
          <View><Text style={styles.welcomeTitle}>Good evening, {firstName}</Text><Text style={styles.welcomeSubtitle}>What sounds good today?</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.navigate('/profile')} style={styles.avatar}><Text style={styles.avatarText}>{customer.name ? customer.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() : 'G'}</Text></Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Choose delivery address" onPress={() => router.navigate('/profile')} style={styles.deliveryCard}>
          <View style={styles.deliveryIcon}><AppIcon name="pin" size={19} color={colors.goldDeep} /></View>
          <View style={styles.deliveryCopy}><Text style={styles.deliveryEyebrow}>DELIVERING TO</Text><Text numberOfLines={1} style={styles.deliveryAddress}>{customer.address || 'Add your delivery address'}</Text></View>
          <AppIcon name="next" size={16} color={colors.muted} />
        </Pressable>

        <SearchField value={search} onChangeText={setSearch} onSubmitEditing={() => openMenu(search.trim() ? { q: search.trim() } : undefined)} />

        <View style={styles.sectionBlock}>
          <SectionTitle title="Explore the menu" actionLabel="See all" onAction={() => openMenu()} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {categories.map((category) => (
              <Pressable key={category.id} accessibilityRole="button" onPress={() => openMenu({ category: category.id })} style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
                <View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{category.icon}</Text></View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.promoCard}>
          <Image source={heroImage} style={styles.promoImage} contentFit="cover" cachePolicy="memory-disk" />
          <View style={styles.promoShade} />
          <View style={styles.promoCopy}>
            <Text style={styles.promoEyebrow}>{promotions[0].eyebrow}</Text>
            <Text style={styles.promoTitle}>{promotions[0].title}</Text>
            <Text style={styles.promoDescription}>{promotions[0].description}</Text>
            <Pressable accessibilityRole="button" onPress={() => openMenu()} style={styles.promoAction}><Text style={styles.promoActionText}>{promotions[0].action}</Text><AppIcon name="next" size={13} color={colors.gold} /></Pressable>
          </View>
          <View style={styles.promoDots}><View style={styles.promoDotActive} /><View style={styles.promoDot} /></View>
        </View>

        <View style={styles.sectionBlock}>
          <SectionTitle title="Popular right now" actionLabel="Full menu" onAction={() => openMenu()} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
            {popular.map((product) => <ProductCard key={product.id} product={product} horizontal onPress={() => openProduct(product.id)} onQuickAdd={() => addToCart(product.id, 1)} />)}
          </ScrollView>
        </View>

        <View style={styles.sectionBlock}>
          <SectionTitle title="Picked for you" actionLabel="Browse" onAction={() => openMenu()} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsRow}>
            {recommended.map((product) => <ProductCard key={product.id} product={product} horizontal onPress={() => openProduct(product.id)} onQuickAdd={() => addToCart(product.id, 1)} />)}
          </ScrollView>
        </View>

        <View style={styles.restaurantCard}>
          <View style={styles.restaurantMark}><Text style={styles.restaurantMarkText}>B</Text></View>
          <View style={styles.restaurantCopy}><Text style={styles.restaurantTitle}>{restaurant.name} · {restaurant.tagline}</Text><Text style={styles.restaurantMeta}>{restaurant.hours}</Text></View>
          <View style={styles.restaurantRating}><AppIcon name="star" size={13} color={colors.goldDeep} /><Text style={styles.restaurantRatingText}>{restaurant.rating.toFixed(1)}</Text></View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 36 },
  hero: { minHeight: 300, overflow: 'hidden', backgroundColor: colors.ink },
  heroImage: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,14,13,0.56)' },
  heroContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 25, minHeight: 300, justifyContent: 'space-between' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  openPill: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.14)' },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8BC18B' },
  openLabel: { color: colors.white, fontSize: 9, letterSpacing: 0.8, fontWeight: '800' },
  eyebrow: { color: colors.gold, fontSize: 9, letterSpacing: 1.5, fontWeight: '800', marginTop: 14 },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6, marginTop: 7 },
  heroSubtitle: { color: '#E9E2D8', fontSize: 12, lineHeight: 19, maxWidth: 255, marginTop: 5 },
  heroButton: { minHeight: 42, alignSelf: 'flex-start', paddingHorizontal: 13, borderRadius: 11, backgroundColor: colors.gold, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  heroButtonText: { color: colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  pressed: { opacity: 0.75 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: 18 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  welcomeTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  welcomeSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.gold, fontSize: 12, fontWeight: '800' },
  deliveryCard: { minHeight: 62, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EBD9' },
  deliveryCopy: { flex: 1, minWidth: 0, gap: 3 },
  deliveryEyebrow: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  deliveryAddress: { color: colors.text, fontSize: 12, fontWeight: '700' },
  sectionBlock: { gap: 11 },
  categoriesRow: { gap: 14, paddingRight: 16 },
  categoryCard: { minWidth: 62, alignItems: 'center', gap: 7, paddingVertical: 2 },
  categoryIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  categoryEmoji: { fontSize: 22 },
  categoryName: { color: colors.text, fontSize: 10, fontWeight: '700' },
  promoCard: { height: 177, overflow: 'hidden', borderRadius: radius.xl, backgroundColor: colors.ink },
  promoImage: { ...StyleSheet.absoluteFillObject, opacity: 0.66 },
  promoShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,15,14,0.52)' },
  promoCopy: { flex: 1, padding: 18, paddingRight: 90, justifyContent: 'center', gap: 5 },
  promoEyebrow: { color: colors.gold, fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  promoTitle: { color: colors.white, fontSize: 20, fontWeight: '800' },
  promoDescription: { color: '#E6DED2', fontSize: 11, lineHeight: 16 },
  promoAction: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  promoActionText: { color: colors.gold, fontSize: 11, fontWeight: '800' },
  promoDots: { position: 'absolute', right: 15, bottom: 15, flexDirection: 'row', gap: 5 },
  promoDotActive: { width: 17, height: 5, borderRadius: 3, backgroundColor: colors.gold },
  promoDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  productsRow: { gap: 12, paddingRight: 16, paddingBottom: 5 },
  restaurantCard: { minHeight: 67, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  restaurantMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  restaurantMarkText: { color: colors.gold, fontWeight: '900', fontSize: 18 },
  restaurantCopy: { flex: 1, gap: 3 },
  restaurantTitle: { color: colors.text, fontSize: 11, fontWeight: '800' },
  restaurantMeta: { color: colors.muted, fontSize: 9 },
  restaurantRating: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  restaurantRatingText: { color: colors.text, fontSize: 11, fontWeight: '800' },
});
