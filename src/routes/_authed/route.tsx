import { useQuery, useQueryClient } from '@tanstack/react-query'
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
      // api cleared a session it could not refresh
      if (!getSession()) throw toLogin
      throw error
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: user } = useQuery(meQuery())

  useEffect(
    () =>
      subscribeSession(() => {
        // A token refresh writes the session too
        const session = getSession()
        if (session?.userId === user?.id) return
        // reset refetches the new user; remove would leave pages on the old one
        if (session) void queryClient.resetQueries()
        else queryClient.removeQueries()
        void router.invalidate()
      }),
    [queryClient, router, user?.id],
  )

  return <Outlet />
}
