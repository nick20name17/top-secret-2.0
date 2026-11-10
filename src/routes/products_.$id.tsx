import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { isHTTPError } from 'ky'

import { buttonVariants } from '@/components/ui/button'
import { ProductDetails } from '@/features/products/product-details'
import { productDetailQuery } from '@/features/products/queries'

export const Route = createFileRoute('/products_/$id')({
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.query(productDetailQuery(params.id))
    } catch (error) {
      if (isHTTPError(error) && error.response.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title }] }),
  component: ProductPage,
})

function ProductPage() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(productDetailQuery(id))

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 p-6'>
      <div>
        <Link to='/products' className={buttonVariants({ variant: 'outline' })}>
          All products
        </Link>
      </div>
      <ProductDetails product={data} />
    </div>
  )
}
