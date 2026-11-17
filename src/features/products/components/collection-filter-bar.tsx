import { ScrollView } from 'react-native';

import { Chip } from '@/components/inputs/chip';
import { makeStyles } from '@/theme';

import { COLLECTION_FILTERS } from '../constants/collections';
import type { ProductCollection } from '../types';

interface CollectionFilterBarProps {
  value?: ProductCollection;
  onChange: (value: ProductCollection | undefined) => void;
}

export function CollectionFilterBar({ value, onChange }: CollectionFilterBarProps) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      <Chip label="All" selected={!value} onPress={() => onChange(undefined)} />
      {COLLECTION_FILTERS.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          icon={filter.icon}
          selected={value === filter.key}
          onPress={() => onChange(value === filter.key ? undefined : filter.key)}
        />
      ))}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  row: { gap: t.spacing.sm, paddingHorizontal: t.spacing.xl },
}));
