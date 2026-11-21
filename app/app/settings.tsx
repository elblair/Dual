import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { BackButton, Button, Card, ErrorView, LoadingView, Pill, Screen, Text } from '@/components';
import { useData, useMe } from '@/data';
import { useAppearance, useTheme, type Appearance } from '@/theme';

const APPEARANCE_LABELS: Record<Appearance, string> = { system: 'Automatic', light: 'Light', dark: 'Dark' };

/** Settings: how the app looks and the account. Opened from the gear on the Profile (You tab), which keeps the person stuff. */
export default function SettingsScreen() {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const { data: me, error, loading, refetch } = useMe();
  const { appearance, setAppearance } = useAppearance();

  if (loading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  if (!me && !error) return <Redirect href="/welcome" />; // signed out
  if (!me) {
    return (
      <Screen>
        <ErrorView message={error?.message ?? 'Something went wrong.'} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen scroll gap="loose">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BackButton />
      </View>
      <Text variant="title">Settings</Text>

      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.lg }}>
        <Text variant="label">Appearance</Text>
        <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
          {(Object.keys(APPEARANCE_LABELS) as Appearance[]).map((a) => (
            <Pill key={a} label={APPEARANCE_LABELS[a]} tone={appearance === a ? 'maroon' : 'soft'} onPress={() => setAppearance(a)} style={{ flex: 1 }} />
          ))}
        </View>
      </Card>

      <Card variant="outline" style={{ padding: t.spacing.xxl, gap: t.spacing.lg }}>
        <Text variant="label">Signed in</Text>
        <Text variant="caption" color="muted">
          {me.email ?? me.name}
        </Text>
        <Button
          label="Log out"
          variant="outline"
          onPress={async () => {
            await data.logout();
            router.replace('/welcome');
          }}
        />
      </Card>
    </Screen>
  );
}
