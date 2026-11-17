import { Redirect } from 'expo-router';

import { useSessionStore } from '@/store/auth/session-store';

/**
 * Entry route for "/" (cold start, deep links, web root). It is deliberately NOT
 * behind a Stack.Protected guard: when "/" belonged to the protected tabs, a signed-out
 * cold start had no matching screen and Expo Router showed "Unmatched Route".
 * The root layout only renders after the session is restored, so the status is final here.
 */
export default function Index() {
  const isAuthenticated = useSessionStore((state) => state.status === 'authenticated');
  return <Redirect href={isAuthenticated ? '/home' : '/welcome'} />;
}
