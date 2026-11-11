import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/app-name'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className='flex p-6'>
      <div className='flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose'>
        <div>
          <h1 className='font-medium'>{APP_NAME}</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button className='mt-2'>Button</Button>
        </div>
      </div>
    </div>
  )
}
