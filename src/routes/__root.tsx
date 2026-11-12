import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

import { ThemeToggle } from '@/features/theme/theme-toggle'
import { APP_NAME } from '@/lib/app-name'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: APP_NAME }] }),
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <HeadContent />
      <header className='flex items-center gap-6 border-b px-6 py-2 text-sm'>
        <Link to='/' className='font-medium'>
          {APP_NAME}
        </Link>
        <nav aria-label='Main' className='flex gap-4 text-muted-foreground'>
          <Link to='/products' className='aria-[current=page]:text-foreground'>
            Products
          </Link>
          <Link to='/profile' className='aria-[current=page]:text-foreground'>
            Profile
          </Link>
        </nav>
        <div className='ml-auto'>
          <ThemeToggle />
        </div>
      </header>
      <main className='flex flex-1 flex-col *:w-full'>
        <Outlet />
      </main>
    </>
  )
}
