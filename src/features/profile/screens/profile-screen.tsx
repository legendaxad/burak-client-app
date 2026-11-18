import { router } from 'expo-router';
import { Alert, Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { Icon, type IconName } from '@/components/common/icon';
import { Skeleton } from '@/components/common/skeleton';
import { ErrorState } from '@/components/common/state-message';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useCurrentMember, useLogout } from '@/features/auth';
import { getErrorMessage } from '@/services/api';
import { makeStyles, useTheme } from '@/theme';
import type { Member } from '@/types/member';
import { formatDate } from '@/utils/format-date';

import { ProfileAvatar } from '../components/profile-avatar';

/** The signed-in member from GET /member/detail, with edit and logout. */
export function ProfileScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const member = useCurrentMember();
  const logout = useLogout();

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to sign in again to order. Your cart on this device will be emptied.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout.mutate() },
    ]);

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
          <MemberDetails member={member.data} />
        ) : member.isError ? (
          <ErrorState title="Could not load your profile" message={getErrorMessage(member.error)} onRetry={() => void member.refetch()} />
        ) : (
          <ProfileSkeleton />
        )}

        <Button
          title="Log out"
          icon="logout"
          variant="danger"
          fullWidth
          loading={logout.isPending}
          disabled={logout.isPending}
          onPress={confirmLogout}
          testID="logout"
        />
      </View>
    </Screen>
  );
}

function MemberDetails({ member }: { member: Member }) {
  const styles = useStyles();
  return (
    <>
      <View style={styles.identity}>
        <ProfileAvatar nickname={member.memberNick} imagePath={member.memberImage} />
        <View style={styles.identityText}>
          <AppText variant="heading" numberOfLines={1}>
            {member.memberNick}
          </AppText>
          <AppText variant="caption" tone="muted">
            Member since {formatDate(member.createdAt)}
          </AppText>
        </View>
      </View>

      <Button title="Edit profile" icon="edit" variant="secondary" fullWidth onPress={() => router.push('/profile/edit')} />

      <View style={styles.points} accessibilityLabel={`${member.memberPoint} BURAK points`}>
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
        <InfoRow icon="note" label="About" value={member.memberDesc?.trim() || 'Not provided'} />
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => router.navigate('/orders')}
        style={({ pressed }) => [styles.card, styles.linkRow, pressed && styles.pressed]}
      >
        <Icon name="receipt" size={20} />
        <AppText variant="bodyStrong" style={styles.linkText}>
          My orders
        </AppText>
        <Icon name="next" size={18} />
      </Pressable>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={colors.primaryStrong} />
      <View style={styles.identityText}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText>{value}</AppText>
      </View>
    </View>
  );
}

function ProfileSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.skeleton} accessibilityLabel="Loading your profile">
      <View style={styles.identity}>
        <Skeleton width={72} height={72} radius={36} />
        <View style={styles.identityText}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <Skeleton height={120} radius={24} />
      <Skeleton height={140} radius={18} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  identityText: { flex: 1, gap: t.spacing.xxs },
  points: { backgroundColor: t.colors.heroBackground, borderRadius: t.radius.xl, padding: t.spacing.xl, gap: t.spacing.xs },
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
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md },
  linkText: { flex: 1 },
  pressed: { opacity: 0.8 },
  skeleton: { gap: t.spacing.lg },
}));
