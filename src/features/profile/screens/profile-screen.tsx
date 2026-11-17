import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, RefreshControl, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { Icon, type IconName } from '@/components/common/icon';
import { ErrorState, LoadingView } from '@/components/common/state-message';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useCurrentMember, useLogout } from '@/features/auth';
import { getErrorMessage } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';
import type { Member } from '@/types/member';
import { resolveMediaUrl } from '@/utils/media-url';

/**
 * Phase 2 scope: the signed-in member (GET /member/detail) and logout.
 * Profile editing and favorites arrive in Phase 6.
 */
export function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const member = useCurrentMember();
  const logout = useLogout();

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to sign in again to place orders.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

  const logoutButton = (
    <Button title="Log out" icon="logout" variant="danger" fullWidth loading={logout.isPending} onPress={confirmLogout} />
  );

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={member.isRefetching}
          onRefresh={() => void member.refetch()}
          tintColor={colors.primaryStrong}
          colors={[colors.primaryStrong]}
        />
      }
    >
      <PageHeader title="Profile" />
      <View style={styles.body}>
        {member.data ? (
          <MemberSummary member={member.data} />
        ) : member.isError ? (
          <ErrorState
            title="Could not load your profile"
            message={getErrorMessage(member.error)}
            onRetry={() => void member.refetch()}
          />
        ) : (
          <LoadingView message="Loading your profile…" />
        )}
        {logoutButton}
      </View>
    </Screen>
  );
}

function MemberSummary({ member }: { member: Member }) {
  const styles = useStyles();
  const avatarUri = resolveMediaUrl(member.memberImage);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initials = member.memberNick.slice(0, 2).toUpperCase();

  return (
    <>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          {avatarUri && !avatarFailed ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} onError={() => setAvatarFailed(true)} />
          ) : (
            <AppText variant="subheading" style={styles.initials}>
              {initials}
            </AppText>
          )}
        </View>
        <View style={styles.identityCopy}>
          <AppText variant="heading">{member.memberNick}</AppText>
          <AppText variant="caption" tone="muted">
            {member.memberPhone}
          </AppText>
        </View>
      </View>

      <View style={styles.pointsCard}>
        <AppText variant="overline" style={styles.pointsLabel}>
          BURAK points
        </AppText>
        <AppText variant="display" style={styles.pointsValue}>
          {member.memberPoint}
        </AppText>
        <AppText variant="caption" style={styles.pointsHint}>
          You earn 1 point for every order you confirm.
        </AppText>
      </View>

      <View style={styles.card}>
        <InfoRow icon="phone" label="Phone" value={member.memberPhone} />
        <InfoRow icon="home" label="Address" value={member.memberAddress?.trim() || 'Not provided'} />
      </View>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={colors.primaryStrong} />
      <View style={styles.identityCopy}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  identityCopy: { flex: 1, gap: t.spacing.xxs },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: t.colors.selected,
    borderWidth: 2,
    borderColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  initials: { color: t.colors.onSelected },
  pointsCard: { backgroundColor: t.colors.heroBackground, borderRadius: t.radius.xl, padding: t.spacing.xl, gap: t.spacing.xs },
  pointsLabel: { color: t.colors.primary },
  pointsValue: { color: t.colors.heroText },
  pointsHint: { color: t.colors.heroTextMuted },
  card: {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: t.spacing.lg,
    gap: t.spacing.lg,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
}));
