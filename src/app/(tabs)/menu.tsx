import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppScreen, ChoiceChip, PageHeader, ProductRow, SearchField } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, spacing } from '@/theme/colors';

export default function MenuScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { products, categories, addToCart } = useAppData();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    if (params.q) setSearch(params.q);
    if (params.category) setCategory(params.category);
  }, [params.category, params.q]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === 'All' || product.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  }), [products, category, search]);

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="The menu" subtitle="A few favorites, made fresh for your table." />
      <View style={styles.content}>
        <SearchField value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <ChoiceChip label="All dishes" selected={category === 'All'} onPress={() => setCategory('All')} />
          {categories.map((item) => <ChoiceChip key={item.id} label={item.name} icon={item.icon} selected={category === item.id} onPress={() => setCategory(item.id)} />)}
        </ScrollView>
        <View style={styles.resultsHeader}><Text style={styles.resultsTitle}>{category === 'All' ? 'Everything we love' : category}</Text><Text style={styles.resultsCount}>{visibleProducts.length} dishes</Text></View>
        {visibleProducts.length ? visibleProducts.map((product) => (
          <ProductRow key={product.id} product={product} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })} onQuickAdd={() => addToCart(product.id, 1)} />
        )) : (
          <View style={styles.noResults}><Text style={styles.noResultsTitle}>No dishes found</Text><Text style={styles.noResultsCopy}>Try a different search or choose another category.</Text></View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 28 },
  content: { paddingHorizontal: spacing.xl, gap: 14 },
  filters: { gap: 8, paddingRight: 16 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 },
  resultsTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  resultsCount: { color: colors.muted, fontSize: 11 },
  noResults: { paddingVertical: 36, alignItems: 'center', gap: 7 },
  noResultsTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  noResultsCopy: { color: colors.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
});
