import { Image } from 'expo-image';
import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { makeStyles, useTheme } from '@/theme';
import { resolveMediaUrl } from '@/utils/media-url';

import { getCollectionIcon } from '../constants/collections';

interface ProductImageProps {
  path?: string;
  collection: string;
  style?: StyleProp<ViewStyle>;
  /** Show the "No photo" caption (detail screen). */
  showCaption?: boolean;
}

/**
 * Renders a backend product image. Missing paths and failed loads fall back to a
 * neutral placeholder. Photos are never invented (data issue D3).
 */
export function ProductImage({ path, collection, style, showCaption = false }: ProductImageProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const uri = resolveMediaUrl(path);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPlaceholder = !uri || failedUri === uri;

  return (
    <View style={[styles.frame, style]}>
      {showPlaceholder ? (
        <View style={styles.placeholder} accessibilityLabel="No photo available">
          <Icon name={getCollectionIcon(collection)} size={showCaption ? 40 : 28} color={colors.primaryStrong} />
          {showCaption ? (
            <AppText variant="caption" tone="muted">
              No photo yet
            </AppText>
          ) : null}
        </View>
      ) : (
        <Image
          testID="product-image"
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={180}
          recyclingKey={uri}
          onError={() => setFailedUri(uri)}
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  frame: { overflow: 'hidden', backgroundColor: t.colors.placeholder },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.spacing.xs,
    backgroundColor: t.colors.accentSoft,
  },
}));
