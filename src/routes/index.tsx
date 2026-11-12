import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'
import { APP_NAME } from '@/lib/app-name'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className='mx-auto flex max-w-2xl flex-col items-start gap-4 p-6'>
      <h1 className='text-lg font-medium'>{APP_NAME}</h1>
      <Link to='/products' className={buttonVariants()}>
        Browse products
      </Link>
    </div>
  )
}
