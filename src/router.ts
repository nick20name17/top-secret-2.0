import type { QueryClient } from '@tanstack/react-query'
import { type RouterHistory, createRouter } from '@tanstack/react-router'

import { RouteError } from '@/components/route-error'
import { RouteNotFound } from '@/components/route-not-found'
import { RoutePending } from '@/components/route-pending'
import { queryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

type SearchValue = string | number | boolean

// Values stay text: the default parser makes ?q=2024 a number (TanStack/router#6044)
// A repeated key is a list: ?tag=a&tag=b gives ['a', 'b'], but ?tag=a gives 'a'
export function parseSearch(searchStr: string) {
  const search = new Map<string, string | string[]>()
  for (const [key, value] of new URLSearchParams(searchStr)) {
    const previous = search.get(key)
    if (previous === undefined) search.set(key, value)
    else if (Array.isArray(previous)) previous.push(value)
    else search.set(key, [previous, value])
  }
  return Object.fromEntries(search)
}

export function stringifySearch(search: Record<string, SearchValue | SearchValue[] | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (Array.isArray(value)) for (const item of value) params.append(key, String(item))
    else if (value !== undefined) params.set(key, String(value))
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
