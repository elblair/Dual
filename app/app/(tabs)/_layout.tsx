import { Redirect, Tabs, useRouter } from 'expo-router';
import { TabBar, type TabKey } from '@/components';
import { useMe } from '@/data';

const tabPaths = { today: '/today', groups: '/groups', you: '/you' } as const;

/** Four tabs, not five: Today · Groups · + · You. The "+" starts a new duel (Hobby flow). */
export default function TabsLayout() {
  const router = useRouter();
  const { data: me } = useMe();
  // Signed in but the email code was never typed: finish that first.
  if (me && !me.emailVerified) return <Redirect href="/verify" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => (
        <TabBar
          active={state.routes[state.index].name as TabKey}
          onSelect={(key) => router.navigate(tabPaths[key])}
          onPlus={() => router.push('/hobby')}
        />
      )}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="you" />
    </Tabs>
  );
}
