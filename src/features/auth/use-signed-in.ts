import { useSyncExternalStore } from 'react'

import { getSession, subscribeSession } from '@/lib/session'

export function useSignedIn() {
  return useSyncExternalStore(subscribeSession, () => getSession() !== undefined)
}
