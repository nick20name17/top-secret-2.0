import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { useSignedIn } from '@/features/auth/use-signed-in'
import { ProductDetails } from '@/features/products/product-details'
import { loadProduct, productDetailQuery } from '@/features/products/queries'

export const Route = createFileRoute('/products_/$id')({
  loader: ({ context, params }) => loadProduct(context.queryClient, params.id),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title }] }),
  component: ProductPage,
})

function ProductPage() {
  const { id } = Route.useParams()
  const signedIn = useSignedIn()
  const { data } = useSuspenseQuery(productDetailQuery(id))

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 p-6'>
      <div className='flex gap-2'>
        <Link to='/products' className={buttonVariants({ variant: 'outline' })}>
          All products
        </Link>
        {signedIn && (
          <Link to='/products/$id/edit' params={{ id }} className={buttonVariants()}>
            Edit
          </Link>
        )}
      </div>
      <ProductDetails product={data} />
    </div>
  )
}
