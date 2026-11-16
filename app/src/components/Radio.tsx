import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme';

/** 22pt radio: filled maroon with a white check when selected, 1.5pt muted outline otherwise. */
export function Radio({ selected }: { selected: boolean }) {
  const t = useTheme();
  const size = t.sizes.radio;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? t.colors.maroon : 'transparent',
        borderWidth: selected ? 0 : t.borders.thick,
        borderColor: t.colors.muted,
      }}
    >
      {selected ? <Check size={t.sizes.icon.badge} color={t.colors.white} strokeWidth={3} /> : null}
    </View>
  );
}
