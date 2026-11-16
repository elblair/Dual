import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ColorName } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default false: fixed column, use a flex spacer to push buttons down). */
  scroll?: boolean;
  background?: ColorName;
  /** A tab bar sits below this screen (it handles the bottom safe area itself). */
  tabBar?: boolean;
  /** Gap between blocks: tight = 14 (Friend, Accept, Done, Result, Save), loose = 16 (Hobby, Today, Duel, Groups, You). */
  gap?: 'tight' | 'loose';
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page wrapper: 22pt side padding, about 60pt top on a notched phone, 30pt bottom, safe-area aware. */
export function Screen({ children, scroll, background = 'bg', tabBar, gap = 'tight', contentStyle }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: Math.max(insets.top + t.spacing.screenTopExtra, t.spacing.screenTop),
    paddingBottom: tabBar ? t.spacing.screenBottomMin : Math.max(insets.bottom, t.spacing.screenBottomMin),
    paddingHorizontal: t.spacing.gutter,
    gap: gap === 'loose' ? t.spacing.screenGapLoose : t.spacing.screenGap,
  };
  const bg = { backgroundColor: t.colors[background] };

  if (scroll) {
    return (
      <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={[{ flexGrow: 1 }, padding, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[{ flex: 1 }, bg, padding, contentStyle]}>{children}</View>;
}
