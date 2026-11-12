import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { ProductForm } from '@/features/products/product-form'
import { loadProduct, productDetailQuery } from '@/features/products/queries'

export const Route = createFileRoute('/_authed/products_/$id/edit')({
  loader: ({ context, params }) => loadProduct(context.queryClient, params.id),
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title }] }),
  component: EditProductPage,
})

function EditProductPage() {
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()
  const { data } = useQuery(productDetailQuery(id))

  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 p-6'>
      <h1 className='text-lg font-medium'>Edit product</h1>
      {data && (
        <ProductForm
          product={data}
          onSaved={() => void navigate({ to: '/products/$id', params: { id } })}
        />
      )}
    </div>
  )
}
