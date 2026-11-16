import { Redirect } from 'expo-router';

// Phase 1: land on the component preview. Phase 2 replaces this with the Hobby screen.
export default function Index() {
  return <Redirect href="/kitchen-sink" />;
}
