import { Redirect } from 'expo-router';
import { LoadingView, Screen } from '@/components';
import { useMe } from '@/data';

/** Launcher: signed-in people land on Today, everyone else starts at the Hobby picker. */
export default function Index() {
  const { data: me, loading } = useMe();
  if (loading) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }
  return <Redirect href={me ? '/today' : '/hobby'} />;
}
