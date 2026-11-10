import { priceFormat } from '@/features/products/lib/price'
import type { ProductDetail } from '@/features/products/queries'

export function ProductDetails({ product }: { product: ProductDetail }) {
  return (
    <article className='flex flex-col gap-4'>
      <img
        src={product.thumbnail}
        alt=''
        width={300}
        height={300}
        className='size-72 rounded-lg bg-muted object-cover'
      />
      <div className='flex flex-col gap-1'>
        <h1 className='text-lg font-medium'>{product.title}</h1>
        <p className='tabular-nums'>{priceFormat.format(product.price)}</p>
      </div>
      <p className='text-sm text-muted-foreground'>{product.description}</p>
    </article>
  )
}
