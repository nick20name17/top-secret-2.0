import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { meQuery } from '@/features/auth/queries'
import { requireSession } from '@/features/auth/require-session'
import { getSession, subscribeSession } from '@/lib/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: requireSession,
  component: AuthedLayout,
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: user } = useSuspenseQuery(meQuery())

  useEffect(
    () =>
      subscribeSession(() => {
        // A token refresh writes the session too
        const session = getSession()
        if (session?.userId === user.id) return
        // reset refetches the new user; remove would leave pages on the old one
        if (session) void queryClient.resetQueries()
        else queryClient.removeQueries()
        void router.invalidate()
      }),
    [queryClient, router, user.id],
  )

  return <Outlet />
}
