import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Avatar, type AvatarSize, type AvatarTone } from './Avatar';
import { Dots, type DayState } from './Dots';
import { Text } from './Text';

interface PlayerRowProps {
  name: string;
  /** Text shown next to the dots when it differs from the name (your own row says "You"). */
  label?: string;
  avatarTone: AvatarTone;
  dotsTone: 'you' | 'opponent';
  days: DayState[];
  /** 'xxs' (24) on Today cards, 'xs' (26) on Done and Result. */
  avatarSize?: Extract<AvatarSize, 'xxs' | 'xs'>;
}

/** One player: avatar, name (13 Medium, 62 wide) and their 7 dots. */
export function PlayerRow({ name, label, avatarTone, dotsTone, days, avatarSize = 'xxs' }: PlayerRowProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
      <Avatar name={name} tone={avatarTone} size={avatarSize} />
      <Text variant="smallMedium" numberOfLines={1} style={{ width: t.sizes.playerName }}>
        {label ?? name}
      </Text>
      <Dots days={days} tone={dotsTone} />
    </View>
  );
}
