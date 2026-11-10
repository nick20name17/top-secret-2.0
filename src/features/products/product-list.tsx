import { Link } from '@tanstack/react-router'

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { priceFormat } from '@/features/products/lib/price'
import type { Product } from '@/features/products/queries'

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No products found</EmptyTitle>
          <EmptyDescription>Try a different search.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className='flex flex-col divide-y'>
      {products.map((product) => (
        <li key={product.id}>
          <Link
            to='/products/$id'
            params={{ id: String(product.id) }}
            className='flex items-center gap-3 py-2 hover:bg-muted/50'
          >
            <img
              src={product.thumbnail}
              alt=''
              width={48}
              height={48}
              loading='lazy'
              className='size-12 shrink-0 rounded-md bg-muted object-cover'
            />
            <span className='min-w-0 flex-1 truncate'>{product.title}</span>
            <span className='tabular-nums'>{priceFormat.format(product.price)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
