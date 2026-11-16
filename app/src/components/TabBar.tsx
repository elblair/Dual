import { Pressable, View } from 'react-native';
import { House, Plus, User, Users, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type TabKey = 'today' | 'groups' | 'you';

interface TabBarProps {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
  /** The center "+" starts a new duel. */
  onPlus: () => void;
}

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'today', label: 'Today', icon: House },
  { key: 'groups', label: 'Groups', icon: Users },
  { key: 'you', label: 'You', icon: User },
];

/** Four tabs, not five: Today · Groups · + · You. Presentational; the router wires it up in Phase 3. */
export function TabBar({ active, onSelect, onPlus }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = ({ key, label, icon: Icon }: (typeof tabs)[number]) => {
    const selected = key === active;
    const color = selected ? t.colors.maroon : t.colors.muted;
    return (
      <Pressable
        key={key}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={() => onSelect(key)}
        style={{ flex: 1, alignItems: 'center', gap: t.spacing.xs }}
      >
        <Icon size={t.sizes.tabIcon} color={color} strokeWidth={2} />
        <Text variant="captionStrong" style={{ color }}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const plus = (
    <View key="plus" style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New duel"
        onPress={onPlus}
        style={({ pressed }) => ({
          width: t.sizes.plusButton,
          height: t.sizes.plusButton,
          borderRadius: t.sizes.plusButton / 2,
          backgroundColor: t.colors.orange,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -t.spacing.sm,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Plus size={t.sizes.iconLg + 6} color={t.colors.white} strokeWidth={2.4} />
      </Pressable>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.colors.bg,
        borderTopWidth: t.borders.hairline,
        borderTopColor: t.colors.border,
        paddingTop: t.spacing.lg,
        paddingBottom: Math.max(insets.bottom, t.spacing.lg),
      }}
    >
      {renderTab(tabs[0])}
      {renderTab(tabs[1])}
      {plus}
      {renderTab(tabs[2])}
    </View>
  );
}
