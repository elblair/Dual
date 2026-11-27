import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { CATEGORIES, categoryOf, searchCatalog, type Hobby } from '@/data/catalog';
import { categoryIconRotation, categoryIcons } from '@/lib/hobbyIcons';
import { useTheme } from '@/theme';
import { HobbyTile } from './HobbyTile';
import { Text } from './Text';
import { TextField } from './TextField';

/** Category tiles per row (the Hobby step is a grid of three, as in the design). */
const TILES_PER_ROW = 3;

interface CategoryPickerProps {
  /** Selected hobby ids. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Pick several hobbies (for interests) instead of exactly one (for a duel). */
  multiple?: boolean;
  /** When true, a "Something else" chip is shown. The parent sets value to ['custom'] when selected. */
  showCustom?: boolean;
  /** The typed name when value is ['custom']. */
  customName?: string;
  /** Called when the user types in the custom name input. */
  onCustomName?: (name: string) => void;
}

function HobbyChips({ hobbies, value, onToggle, multiple }: { hobbies: Hobby[]; value: string[]; onToggle: (id: string) => void; multiple: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
      {hobbies.map((h) => {
        const selected = value.includes(h.id);
        return (
          <Pressable
            key={h.id}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={multiple ? { checked: selected } : { selected }}
            accessibilityLabel={h.label}
            onPress={() => onToggle(h.id)}
            style={({ pressed }) => ({
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.s9,
              borderRadius: t.radii.pill,
              backgroundColor: selected ? t.colors.maroon : t.colors.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text variant="smallStrong" color={selected ? 'white' : 'ink'}>
              {`${h.emoji} ${h.label}`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Pick a hobby from the catalog: categories first (Music, Fitness, Languages...), tap one and its specific hobbies open
 * right below. The search box filters both levels at once. One pick for a duel, several with `multiple` (interests).
 */
export function CategoryPicker({ value, onChange, multiple = false, showCustom, customName, onCustomName }: CategoryPickerProps) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  // Start with the category of the current pick open, so the choice is visible.
  const [openId, setOpenId] = useState<string | null>(() => categoryOf(value[0] ?? '')?.id ?? null);
  const searching = query.trim().length > 0;
  const results = searchCatalog(query);

  function toggle(id: string) {
    if (!multiple) return onChange([id]);
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  const rows = [];
  for (let i = 0; i < CATEGORIES.length; i += TILES_PER_ROW) rows.push(CATEGORIES.slice(i, i + TILES_PER_ROW));
  const open = CATEGORIES.find((c) => c.id === openId);

  return (
    <View style={{ gap: t.spacing.md }}>
      <TextField label="Find a hobby" placeholder={'Try "piano" or "languages"'} value={query} onChangeText={setQuery} />

      {searching ? (
        results.length === 0 ? (
          <Text variant="small" color="muted">{`No hobbies match "${query.trim()}".`}</Text>
        ) : (
          results.map(({ category, hobbies }) => (
            <View key={category.id} style={{ gap: t.spacing.sm }}>
              <Text variant="eyebrow" color="muted">
                {category.label}
              </Text>
              <HobbyChips hobbies={hobbies} value={value} onToggle={toggle} multiple={multiple} />
            </View>
          ))
        )
      ) : (
        rows.map((row, i) => (
          <View key={i} style={{ gap: t.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
              {row.map((c) => (
                <HobbyTile
                  key={c.id}
                  label={c.label}
                  icon={categoryIcons[c.id]}
                  iconRotation={categoryIconRotation[c.id]}
                  selected={c.id === openId}
                  onPress={() => setOpenId(c.id === openId ? null : c.id)}
                />
              ))}
              {/* Keep a short last row the same tile width as the others. */}
              {Array.from({ length: TILES_PER_ROW - row.length }, (_, k) => (
                <View key={`pad${k}`} style={{ flex: 1 }} />
              ))}
            </View>
            {open && row.some((c) => c.id === open.id) ? <HobbyChips hobbies={open.hobbies} value={value} onToggle={toggle} multiple={multiple} /> : null}
          </View>
        ))
      )}

      {showCustom ? (
        <View style={{ gap: t.spacing.sm }}>
          <Pressable
            onPress={() => toggle('custom')}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingHorizontal: t.spacing.xxl,
              paddingVertical: t.spacing.s9,
              borderRadius: t.radii.pill,
              backgroundColor: value.includes('custom') ? t.colors.maroon : t.colors.surface,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text variant="smallStrong" color={value.includes('custom') ? 'white' : 'ink'}>
              {'✏️ Something else'}
            </Text>
          </Pressable>
          {value.includes('custom') ? (
            <View style={{ borderRadius: t.radii.md, borderWidth: t.borders.selected,
              borderColor: t.colors.mutedSoft, backgroundColor: t.colors.surface,
              paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.s9 }}>
              <TextInput
                value={customName ?? ''}
                onChangeText={onCustomName}
                placeholder="e.g. Powerlifting, Chess, Calligraphy"
                placeholderTextColor={t.colors.muted}
                maxLength={40}
                style={[t.text.body, { color: t.colors.ink }]}
                autoFocus
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
