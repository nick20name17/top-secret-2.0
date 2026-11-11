import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod/mini'

import { api } from '@/lib/api'
import { apiSchema } from '@/lib/api-schema'

export const PAGE_SIZE = 12

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
}

function fetchProducts({ q, page }: ProductListParams, signal: AbortSignal) {
  return api
    .get(q ? 'products/search' : 'products', {
      searchParams: {
        ...(q && { q }),
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
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
