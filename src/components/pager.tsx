import { Link } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

interface PagerProps {
  page: number
  pageCount: number
}

export function Pager({ page, pageCount }: PagerProps) {
  return (
    <nav aria-label='Pagination' className='flex items-center justify-between gap-2 text-sm'>
      <Link
        to='.'
        search={(prev) => ({ ...prev, page: page - 1 })}
        disabled={page <= 1}
        className={buttonVariants({ variant: 'outline' })}
      >
        Previous page
      </Link>
      <span className='tabular-nums'>
        Page {page} of {pageCount}
      </span>
      <Link
        to='.'
        search={(prev) => ({ ...prev, page: page + 1 })}
        disabled={page >= pageCount}
        className={buttonVariants({ variant: 'outline' })}
      >
        Next page
      </Link>
    </nav>
  )
}
