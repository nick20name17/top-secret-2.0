import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { ProductForm } from '@/features/products/product-form'
import { productDetailQuery } from '@/features/products/queries'

export const Route = createFileRoute('/products_/$id/edit')({
  component: EditProductPage,
})

function EditProductPage() {
  const { id } = Route.useParams()
  const router = useRouter()
  const { data } = useSuspenseQuery(productDetailQuery(id))

  return (
    <>
      <h1 className='text-lg font-medium'>Edit product</h1>
      <ProductForm
        product={data}
        // invalidate reloads the parent route, whose loader data names the tab
        onSaved={() =>
          void router
            .navigate({ to: '/products/$id', params: { id } })
            .then(() => router.invalidate())
        }
      />
    </>
  )
}
