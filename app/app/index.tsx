import { Redirect } from 'expo-router';
import { useDuels } from '@/data';

/** Launcher: people with duels land on Today, everyone else starts at the Hobby picker. */
export default function Index() {
  const { data, loading } = useDuels();
  if (loading) return null;
  return <Redirect href={data && data.length > 0 ? '/today' : '/hobby'} />;
}
