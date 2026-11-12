import { keepPreviousData, noop, useQuery } from '@tanstack/react-query'
import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductList, ProductListSkeleton } from '@/features/products/product-list'
import { productListQuery } from '@/features/products/queries'
import { PAGE_SIZES, Pager } from '@/routes/-components/pager'

const defaultSearch = { q: '', page: 1, limit: 12 }

const searchSchema = z.object({
  q: z.prefault(z.catch(z.string(), defaultSearch.q), defaultSearch.q),
  page: z.prefault(
    z.catch(z.coerce.number<number>().check(z.int(), z.positive()), defaultSearch.page),
    defaultSearch.page,
  ),
  limit: z.prefault(
    z.catch(
      z.coerce.number<number>().check(z.refine((limit) => PAGE_SIZES.includes(limit))),
      defaultSearch.limit,
    ),
    defaultSearch.limit,
  ),
})

export const Route = createFileRoute('/products')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => void context.queryClient.query(productListQuery(deps)).catch(noop),
  head: () => ({ meta: [{ title: 'Products' }] }),
  component: ProductsPage,
})

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useQuery({ ...productListQuery(search), placeholderData: keepPreviousData })

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 p-6'>
      <h1 className='text-lg font-medium'>Products</h1>
      <search>
        <form
          className='flex gap-2'
          onSubmit={(event) => {
            event.preventDefault()
            const q = new FormData(event.currentTarget).get('q')
            void navigate({
              search: (prev) => ({ ...prev, q: typeof q === 'string' ? q.trim() : '', page: 1 }),
            })
          }}
        >
          {/* key resets the input when the URL changes */}
          <Input
            key={search.q}
            type='search'
            name='q'
            defaultValue={search.q}
            aria-label='Search products'
          />
          <Button type='submit'>Search</Button>
        </form>
      </search>
      {data ? (
        <>
          <ProductList products={data.products} />
          <Pager
            page={search.page}
            pageCount={Math.max(1, Math.ceil(data.total / search.limit))}
            limit={search.limit}
          />
        </>
      ) : (
        <ProductListSkeleton count={search.limit} />
      )}
    </div>
  )
}
