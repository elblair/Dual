import { Tabs, useRouter } from 'expo-router';
import { TabBar, type TabKey } from '@/components';

const tabPaths = { today: '/today', groups: '/groups', you: '/you' } as const;

/** Four tabs, not five: Today · Groups · + · You. The "+" starts a new duel (Hobby flow). */
export default function TabsLayout() {
  const router = useRouter();
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
