import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Chip } from '@/components/inputs/chip';
import { SearchEntry } from '@/components/inputs/search-bar';
import { Screen } from '@/components/layouts/screen';
import { memberKeys } from '@/features/auth';
import { COLLECTION_FILTERS } from '@/features/products/constants/collections';
import { productKeys } from '@/features/products/query-keys';
import { makeStyles, useTheme } from '@/theme';

import { HomeHero } from '../components/home-hero';
import { MemberGreeting } from '../components/member-greeting';
import { ProductSection } from '../components/product-section';

export function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: productKeys.sections(), type: 'active' }),
        queryClient.refetchQueries({ queryKey: memberKeys.me(), type: 'active' }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.primaryStrong}
          colors={[colors.primaryStrong]}
        />
      }
    >
      <HomeHero />
      <View style={styles.content}>
        <View style={styles.padded}>
          <MemberGreeting />
          <SearchEntry onPress={() => router.push({ pathname: '/menu', params: { focus: 'search' } })} />
        </View>

        <View style={styles.categories}>
          <AppText variant="heading" style={styles.padded} accessibilityRole="header">
            Browse by category
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {COLLECTION_FILTERS.map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                icon={filter.icon}
                selected={false}
                onPress={() => router.push({ pathname: '/menu', params: { collection: filter.key } })}
              />
            ))}
          </ScrollView>
        </View>

        <ProductSection title="Most popular" order="productViews" />
        <ProductSection title="New on the menu" order="createdAt" />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  content: { paddingTop: t.spacing.xl, gap: t.spacing.xxl },
  padded: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  categories: { gap: t.spacing.md },
  chips: { gap: t.spacing.sm, paddingHorizontal: t.spacing.xl },
}));
