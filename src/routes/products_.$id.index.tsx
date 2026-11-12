import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { ProductDetails } from '@/features/products/product-details'
import { productDetailQuery } from '@/features/products/queries'

export const Route = createFileRoute('/products_/$id/')({
  component: ProductPage,
})

function ProductPage() {
  const { id } = Route.useParams()
  const { data } = useSuspenseQuery(productDetailQuery(id))

  return (
    <>
      <div className='flex gap-2'>
        <Link to='/products' className={buttonVariants({ variant: 'outline' })}>
          All products
        </Link>
        <Link to='/products/$id/edit' params={{ id }} className={buttonVariants()}>
          Edit
        </Link>
      </div>
      <ProductDetails product={data} />
    </>
  )
}
