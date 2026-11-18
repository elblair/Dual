import { useCallback, useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ErrorView, LoadingView, Screen } from '@/components';
import { API_URL } from '@/config';
import { useData, useMe } from '@/data';

/**
 * Launcher. First make sure the server can be reached (a clear error with "Try again" if it cannot, never mock data),
 * then send signed-in people to Today (or Verify, until they typed their email code) and everyone else to the Welcome screen (sign up / log in).
 */
export default function Index() {
  const data = useData();
  const { data: me, loading } = useMe();
  const [check, setCheck] = useState<'checking' | 'ok' | 'failed'>('checking');

  const connect = useCallback(() => {
    setCheck('checking');
    // Generous timeout: a sleeping free-tier server takes about a minute to wake up.
    data.ping(60_000).then((ok) => setCheck(ok ? 'ok' : 'failed'));
  }, [data]);

  useEffect(connect, [connect]);

  if (check === 'failed') {
    return (
      <Screen>
        <ErrorView
          message={
            data.mode === 'api' && !API_URL
              ? 'The app is not set up: EXPO_PUBLIC_API_URL is missing. Add it to app/.env and restart with `npx expo start -c`.'
              : `Can’t reach the server (${data.host}). Check that it is running and that you are online, then try again.`
          }
          onRetry={connect}
        />
      </Screen>
    );
  }
  if (check === 'checking' || loading) {
    return (
      <Screen>
        <LoadingView label={`Connecting to ${data.host}…`} />
      </Screen>
    );
  }
  return <Redirect href={!me ? '/welcome' : me.emailVerified ? '/today' : '/verify'} />;
}
