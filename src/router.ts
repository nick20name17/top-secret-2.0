import { createRouter } from '@tanstack/react-router'

import { RouteError } from '@/components/route-error'
import { RouteNotFound } from '@/components/route-not-found'
import { RoutePending } from '@/components/route-pending'
import { queryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultNotFoundComponent: RouteNotFound,
  defaultErrorComponent: RouteError,
  defaultPendingComponent: RoutePending,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
