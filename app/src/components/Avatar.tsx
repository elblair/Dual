import { View } from 'react-native';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

export type AvatarTone = 'you' | 'opponent' | 'brand' | 'neutral';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const toneColor: Record<AvatarTone, ColorName> = {
  you: 'blue',
  opponent: 'maroonBright',
  brand: 'maroon',
  neutral: 'mutedSoft',
};

interface AvatarProps {
  name: string;
  tone?: AvatarTone;
  size?: AvatarSize;
  /** 'white' = white border (Accept screen), 'orange' = highlighted (Duel, You). */
  ring?: 'white' | 'orange';
}

export function Avatar({ name, tone = 'you', size = 'md', ring }: AvatarProps) {
  const t = useTheme();
  const px = t.sizes.avatar[size];
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        backgroundColor: t.colors[toneColor[tone]],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? t.borders.ring : 0,
        borderColor: ring ? t.colors[ring === 'white' ? 'white' : 'orange'] : undefined,
      }}
    >
      <Text color="white" style={{ fontFamily: t.fonts.semibold, fontSize: Math.round(px * 0.375) }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
