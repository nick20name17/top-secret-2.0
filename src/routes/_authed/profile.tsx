import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { meQuery } from '@/features/auth/queries'
import { clearSession } from '@/lib/session'

export const Route = createFileRoute('/_authed/profile')({
  head: () => ({ meta: [{ title: 'Profile' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const { data: user } = useSuspenseQuery(meQuery())

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-2 p-6'>
      <h1 className='text-lg font-medium'>{`${user.firstName} ${user.lastName}`}</h1>
      <p className='text-sm text-muted-foreground'>{user.email}</p>
      <div>
        <Button variant='outline' onClick={clearSession}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
