import { useSyncExternalStore } from 'react'

import { getSession, subscribeSession } from '@/lib/session'

// A boolean: getSession returns a new object on each call, which useSyncExternalStore reads as a change
export function useSignedIn() {
  return useSyncExternalStore(subscribeSession, () => getSession() !== undefined)
}
