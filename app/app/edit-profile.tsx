import { useState } from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { BackButton, Button, CategoryPicker, ErrorView, LoadingView, Screen, Text, TextField } from '@/components';
import { useData, useMe, type Me } from '@/data';
import { BIO_MAX, INTERESTS_MAX } from '@/data/catalog';
import { useTheme } from '@/theme';

/** The form itself, shown once the person is loaded so the fields start from what is saved. */
function EditProfileForm({ me }: { me: Me }) {
  const t = useTheme();
  const router = useRouter();
  const data = useData();
  const [bio, setBio] = useState(me.bio ?? '');
  const [interests, setInterests] = useState(me.interests);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await data.updateProfile({ bio, interests });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
      setSaving(false);
    }
  }

  return (
    <Screen scroll gap="loose">
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <BackButton />
      </View>
      <Text variant="title">Edit profile</Text>

      <View style={{ gap: t.spacing.sm }}>
        <TextField label="Bio" placeholder="A line about you" value={bio} onChangeText={setBio} maxLength={BIO_MAX} multiline autoCapitalize="sentences" />
        <Text variant="caption" color="muted" align="right">
          {`${bio.length}/${BIO_MAX}`}
        </Text>
      </View>

      <View style={{ gap: t.spacing.md }}>
        <Text variant="label">Interests</Text>
        <Text variant="caption" color="muted">
          {`${interests.length} of ${INTERESTS_MAX} picked`}
        </Text>
        <CategoryPicker multiple value={interests} onChange={(next) => setInterests(next.slice(0, INTERESTS_MAX))} />
      </View>

      <View style={{ flex: 1 }} />

      {error ? (
        <Text variant="caption" color="maroonBright" align="center">
          {error}
        </Text>
      ) : null}
      <Button label="Save" disabled={saving} onPress={save} />
    </Screen>
  );
}

/** Edit profile: bio and interests. (The avatar picker comes with its own ticket.) */
export default function EditProfileScreen() {
  const { data: me, error, loading, refetch } = useMe();
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
  return <EditProfileForm me={me} />;
}
