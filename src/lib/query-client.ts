import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: false,
        throwOnError: (_error, query) => query.state.data === undefined,
      },
    },
  })
}

export const queryClient = createQueryClient()
