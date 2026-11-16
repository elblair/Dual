import { useState } from 'react';
import { View } from 'react-native';
import { Camera, Check, MessageSquare, Copy } from 'lucide-react-native';
import { Avatar, BackButton, Button, Card, Dots, Logo, Pill, Screen, TabBar, Text, buildDays, type TabKey } from '@/components';
import { useTheme } from '@/theme';

/** Dev-only preview of every base component (Phase 1). Removed or hidden before the demo. */
export default function KitchenSink() {
  const t = useTheme();
  const [tab, setTab] = useState<TabKey>('today');

  const section = (title: string) => (
    <Text variant="eyebrow" color="orangeDark" style={{ marginTop: t.spacing.section }}>
      {title}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Screen scroll tabBar>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <BackButton />
          <Logo />
        </View>
        <Text variant="title">Component preview</Text>
        <Text variant="subtitle" color="muted">
          Phase 1: theme + base components. Everything here reads from theme.ts.
        </Text>

        {section('Type')}
        <Text variant="display">Display 34</Text>
        <Text variant="title">Title 28</Text>
        <Text variant="heading">Heading 20</Text>
        <Text variant="subheading">Subheading 18</Text>
        <Text variant="body">Body 15 regular</Text>
        <Text variant="bodyStrong">Body 15 semibold</Text>
        <Text variant="subtitle" color="muted">Subtitle 14 muted</Text>
        <Text variant="caption" color="muted">Caption 12 muted</Text>

        {section('Buttons')}
        <Button label="Next: pick a friend" />
        <Button label="I did it" variant="orange" icon={Check} />
        <Button label="Continue with Google" variant="outline" />
        <Button label="See how it ends (Saturday)" variant="soft" />
        <Button label="Send by text" icon={MessageSquare} />

        {section('Pills')}
        <View style={{ flexDirection: 'row', gap: t.spacing.lg }}>
          <Pill label="OK" tone="maroon" />
          <Pill label="Copy" icon={Copy} />
          <Pill label="Photo" icon={Camera} />
        </View>

        {section('Avatars')}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
          <Avatar name="Ari" size="xs" />
          <Avatar name="Eleanor" tone="opponent" size="sm" />
          <Avatar name="Tanish" size="md" />
          <Avatar name="Ben" tone="neutral" size="md" />
          <Avatar name="Ari" tone="brand" size="lg" ring="orange" />
          <Avatar name="Ari" size="xl" ring="white" />
        </View>

        {section('Dots (7 per person)')}
        <Card variant="outline" style={{ gap: t.spacing.lg }}>
          <Dots days={buildDays([0, 1, 2, 3], 4)} tone="you" />
          <Dots days={buildDays([0, 1, 2, 3])} tone="opponent" />
          <Dots days={buildDays([0, 1, 2], 3, [4])} tone="you" size="lg" />
        </Card>

        {section('Cards')}
        <Card variant="surface"><Text>surface</Text></Card>
        <Card variant="outline"><Text>outline</Text></Card>
        <Card variant="selected"><Text>selected (maroon border + tint)</Text></Card>
        <Card variant="orangeTint"><Text>orange tint</Text></Card>
        <Card variant="successTint"><Text>success tint</Text></Card>
        <Card variant="maroon"><Text color="white">maroon hero</Text></Card>
        <Card variant="slate"><Text color="white">slate (Groups hero)</Text></Card>
      </Screen>
      <TabBar active={tab} onSelect={setTab} onPlus={() => setTab('today')} />
    </View>
  );
}
