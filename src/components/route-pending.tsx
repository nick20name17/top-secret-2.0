import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'

export function RoutePending() {
  return (
    <Empty>
      <Spinner />
    </Empty>
  )
}
