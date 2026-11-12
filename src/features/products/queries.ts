import { type QueryClient, mutationOptions, queryOptions } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { isHTTPError } from 'ky'
import { z } from 'zod/mini'

import { api } from '@/lib/api'
import { apiSchema } from '@/lib/api-schema'

const productSchema = apiSchema(
  'Product',
  z.object({
    id: z.number(),
    title: z.string(),
    price: z.number(),
    thumbnail: z.string(),
  }),
)

export type Product = z.infer<typeof productSchema>

const productPageSchema = apiSchema(
  'ProductList',
  z.object({
    products: z.array(productSchema),
    total: z.number(),
  }),
)

interface ProductListParams {
  q: string
  page: number
  limit: number
}

function fetchProducts({ q, page, limit }: ProductListParams, signal: AbortSignal) {
  return api
    .get(q ? 'products/search' : 'products', {
      searchParams: {
        ...(q && { q }),
        limit,
        skip: (page - 1) * limit,
        select: 'title,price,thumbnail',
      },
      signal,
    })
    .json(productPageSchema)
}

export function productListQuery(params: ProductListParams) {
  return queryOptions({
    queryKey: ['products', 'list', params],
    queryFn: ({ signal }) => fetchProducts(params, signal),
  })
}

const productDetailSchema = apiSchema(
  'Product',
  z.extend(productSchema, { description: z.string() }),
)

export type ProductDetail = z.infer<typeof productDetailSchema>

export function productDetailQuery(id: string) {
  return queryOptions({
    queryKey: ['products', 'detail', id],
    queryFn: ({ signal }) =>
      api
        .get(`products/${id}`, {
          searchParams: { select: 'title,price,thumbnail,description' },
          signal,
        })
        .json(productDetailSchema),
  })
}

export async function loadProduct(client: QueryClient, id: string) {
  try {
    return await client.query(productDetailQuery(id))
  } catch (error) {
    if (isHTTPError(error) && error.response.status === 404) throw notFound()
    throw error
  }
}

export function updateProductMutation(client: QueryClient, id: number) {
  return mutationOptions({
    mutationFn: (input: Pick<ProductDetail, 'title' | 'price' | 'description'>) =>
      api.put(`products/${id}`, { json: input }).json(productDetailSchema),
    onSuccess: (product) => {
      // The response is the saved product, so the product page needs no second request
      client.setQueryData(productDetailQuery(String(id)).queryKey, product)
      return client.invalidateQueries({ queryKey: ['products', 'list'] })
    },
  })
}
