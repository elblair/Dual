import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ColorName } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Scrollable content (default false: fixed column, use a flex spacer to push buttons down). */
  scroll?: boolean;
  background?: ColorName;
  /** Remove the bottom padding when a tab bar sits below the screen. */
  tabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page wrapper: 22pt side padding, about 60pt top on a notched phone, safe-area aware, 14pt gap between blocks. */
export function Screen({ children, scroll, background = 'bg', tabBar, contentStyle }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + t.spacing.screenTopExtra,
    paddingBottom: tabBar ? t.spacing.xxl : Math.max(insets.bottom, t.spacing.screenBottomMin),
    paddingHorizontal: t.spacing.gutter,
    gap: t.spacing.xl,
  };
  const bg = { backgroundColor: t.colors[background] };

  if (scroll) {
    return (
      <ScrollView style={[{ flex: 1 }, bg]} contentContainerStyle={[padding, contentStyle]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[{ flex: 1 }, bg, padding, contentStyle]}>{children}</View>;
}
