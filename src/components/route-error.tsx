import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, Link, useRouter } from '@tanstack/react-router'
import { TriangleAlertIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  // Lets "Try again" refetch queries that threw into this boundary
  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className='flex min-h-svh'>
      <title>Something went wrong</title>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>
            <h1>Something went wrong</h1>
          </EmptyTitle>
          <EmptyDescription>
            {import.meta.env.DEV && error instanceof Error
              ? error.message
              : 'An unexpected error occurred. Try again.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className='flex gap-2'>
            <Button onClick={() => router.invalidate()}>Try again</Button>
            <Link to='/' className={buttonVariants({ variant: 'outline' })}>
              Go home
            </Link>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}
