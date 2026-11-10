import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { meQuery } from '@/features/auth/queries'
import { getSession, subscribeSession } from '@/lib/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const toLogin = redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    if (!getSession()) throw toLogin
    try {
      await context.queryClient.query(meQuery())
    } catch (error) {
      // api clears a session it cannot refresh: send the user to sign in, not to an error page
      if (!getSession()) throw toLogin
      throw error
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: user } = useSuspenseQuery(meQuery())

  // Sign-out or another user here or in another tab: beforeLoad sends to sign in or loads the new user
  useEffect(
    () =>
      subscribeSession(() => {
        // A token refresh writes the session too
        const session = getSession()
        if (session?.userId === user.id) return
        // Pages read the user from the cache: reset refetches it as the new user, remove would leave them on the old one
        if (session) void queryClient.resetQueries()
        else queryClient.removeQueries()
        void router.invalidate()
      }),
    [queryClient, router, user.id],
  )

  return <Outlet />
}
