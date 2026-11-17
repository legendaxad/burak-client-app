import { View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Icon } from '@/components/common/icon';
import { Skeleton } from '@/components/common/skeleton';
import { useCurrentMember } from '@/features/auth';
import { makeStyles, useTheme } from '@/theme';

function greetingForHour(hour: number): string {
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function MemberGreeting() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { data: member, isPending } = useCurrentMember();
  const greeting = greetingForHour(new Date().getHours());

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {isPending && !member ? (
          <Skeleton width={180} height={22} />
        ) : (
          <AppText variant="heading" numberOfLines={1}>
            {member ? `${greeting}, ${member.memberNick}` : greeting}
          </AppText>
        )}
        <AppText variant="caption" tone="muted">
          What would you like today?
        </AppText>
      </View>
      {member ? (
        <View style={styles.points} accessibilityLabel={`${member.memberPoint} points`}>
          <Icon name="star" size={14} color={colors.primaryStrong} />
          <AppText variant="caption" style={styles.pointsText}>
            {member.memberPoint} pts
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing.md },
  copy: { flex: 1, gap: t.spacing.xxs },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.xs,
    paddingHorizontal: t.spacing.md,
    minHeight: 32,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.accentSoft,
  },
  pointsText: { color: t.colors.primaryStrong, fontWeight: '800' },
}));
