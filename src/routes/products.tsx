import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { z } from 'zod/mini'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductList } from '@/features/products/product-list'
import { PAGE_SIZE, productListQuery } from '@/features/products/queries'

const defaultSearch = { q: '', page: 1 }

// URL values are text, so numbers are coerced; z.catch makes a bad value the default
// and z.prefault lets a link leave the param out
const searchSchema = z.object({
  q: z.prefault(z.catch(z.string(), defaultSearch.q), defaultSearch.q),
  page: z.prefault(
    z.catch(z.coerce.number<number>().check(z.int(), z.positive()), defaultSearch.page),
    defaultSearch.page,
  ),
})

export const Route = createFileRoute('/products')({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.query(productListQuery(deps)),
  head: () => ({ meta: [{ title: 'Products' }] }),
  component: ProductsPage,
})

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useSuspenseQuery(productListQuery(search))
  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 p-6'>
      <h1 className='text-lg font-medium'>Products</h1>
      <search>
        <form
          className='flex gap-2'
          onSubmit={(event) => {
            event.preventDefault()
            const q = new FormData(event.currentTarget).get('q')
            void navigate({ search: { q: typeof q === 'string' ? q.trim() : '', page: 1 } })
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
      <ProductList products={data.products} />
      <nav aria-label='Pagination' className='flex items-center justify-between gap-2 text-sm'>
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page - 1 })}
          disabled={search.page <= 1}
          className={buttonVariants({ variant: 'outline' })}
        >
          Previous page
        </Link>
        <span className='tabular-nums'>
          Page {search.page} of {pageCount}
        </span>
        <Link
          from={Route.fullPath}
          search={(prev) => ({ ...prev, page: prev.page + 1 })}
          disabled={search.page >= pageCount}
          className={buttonVariants({ variant: 'outline' })}
        >
          Next page
        </Link>
      </nav>
    </div>
  )
}
