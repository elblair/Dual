import { View } from 'react-native';
import { useTheme, type ColorName } from '@/theme';
import { Text } from './Text';

export type AvatarTone = 'you' | 'opponent' | 'brand' | 'neutral';
/** Pixel sizes: xxs 24 (dot rows), xs 26 (Done/Result), sm 32 (leaderboard), md 40, header 42, crew 50 (Today crew row), lg 56 (Duel), xl 64 (You), xxl 72 (Accept), hero 92 (Break). */
export type AvatarSize = 'xxs' | 'xs' | 'sm' | 'md' | 'header' | 'crew' | 'lg' | 'xl' | 'xxl' | 'hero';

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
