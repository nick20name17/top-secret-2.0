import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { render } from 'vitest-browser-react'

import { ThemeProvider } from '@/features/theme/theme-provider'
import { createQueryClient } from '@/lib/query-client'
import { createAppRouter } from '@/router'

export function renderRoute(url: string) {
  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient, createMemoryHistory({ initialEntries: [url] }))
  router.update({ ...router.options, defaultPreload: false })
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
