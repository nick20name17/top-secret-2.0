import type { QueryClient } from '@tanstack/react-query'
import { type RouterHistory, createRouter } from '@tanstack/react-router'

import { RouteError } from '@/components/route-error'
import { RouteNotFound } from '@/components/route-not-found'
import { RoutePending } from '@/components/route-pending'
import { queryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

// Keep values as text: the default parser and parseSearchWith make ?q=2024 a number (TanStack/router#6044)
function parseSearch(searchStr: string) {
  return Object.fromEntries(new URLSearchParams(searchStr))
}

function stringifySearch(search: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const searchStr = params.toString()
  return searchStr ? `?${searchStr}` : ''
}

export function createAppRouter(client: QueryClient, history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient: client },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultNotFoundComponent: RouteNotFound,
    defaultErrorComponent: RouteError,
    defaultPendingComponent: RoutePending,
  })
}

export const router = createAppRouter(queryClient)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
