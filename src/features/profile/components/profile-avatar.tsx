import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { makeStyles } from '@/theme';
import { resolveMediaUrl } from '@/utils/media-url';

interface ProfileAvatarProps {
  nickname: string;
  /** Backend path (uploads/members/…) or a local file URI of a newly picked image. */
  imagePath?: string;
  isLocal?: boolean;
  size?: number;
}

/** Profile photo with an initials fallback for missing or broken images. */
export function ProfileAvatar({ nickname, imagePath, isLocal = false, size = 72 }: ProfileAvatarProps) {
  const styles = useStyles();
  const uri = isLocal ? imagePath : resolveMediaUrl(imagePath);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;

  return (
    <View
      style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityLabel={showImage ? `${nickname}'s profile photo` : `${nickname}, no profile photo`}
    >
      {showImage && uri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          onError={() => setFailedUri(uri)}
          testID="profile-avatar-image"
        />
      ) : (
        <AppText variant="heading" style={[styles.initials, { fontSize: size * 0.32 }]}>
          {nickname.slice(0, 2).toUpperCase()}
        </AppText>
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  frame: {
    overflow: 'hidden',
    backgroundColor: t.colors.selected,
    borderWidth: 2,
    borderColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  initials: { color: t.colors.onSelected },
}));
