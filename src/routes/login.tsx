import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { LoginForm } from '@/features/auth/login-form'
import { getSession } from '@/lib/session'

const searchSchema = z.object({
  // Paths on this site only: browsers read // and /\ as another host and drop tabs and newlines
  redirect: z.catch(z.optional(z.string().check(z.regex(/^\/(?![/\\])\S*$/))), undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (getSession()) throw redirect({ href: search.redirect ?? '/', replace: true })
  },
  head: () => ({ meta: [{ title: 'Sign in' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <div className='flex flex-1 items-center justify-center p-6'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <h1 className='text-lg font-medium'>Sign in</h1>
        <LoginForm
          onSignedIn={() => void navigate({ href: search.redirect ?? '/', replace: true })}
        />
      </div>
    </div>
  )
}
