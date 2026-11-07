import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

export function RoutePending() {
  return (
    <div className='flex min-h-svh'>
      <Empty>
        <Spinner />
      </Empty>
    </div>
  )
}
