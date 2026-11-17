import { useLocalSearchParams } from 'expo-router';

import { findCollectionFilter, SORT_OPTIONS } from '@/features/products/constants/collections';
import { MenuScreen } from '@/features/products/screens/menu-screen';

export default function MenuRoute() {
  const params = useLocalSearchParams<{ collection?: string; sort?: string; focus?: string }>();
  const collection = findCollectionFilter(params.collection)?.key;
  const sort = SORT_OPTIONS.find((option) => option.key === params.sort)?.key;
  // Remount when navigated to with new params (e.g. a category chip on Home), so the filters reset.
  const key = `${collection ?? 'all'}-${sort ?? 'default'}-${params.focus ?? ''}`;
  return (
    <MenuScreen key={key} initialCollection={collection} initialSort={sort} autoFocusSearch={params.focus === 'search'} />
  );
}
