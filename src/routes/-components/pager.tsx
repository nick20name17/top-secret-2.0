import { useNavigate } from '@tanstack/react-router'
import { Fragment } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const PAGE_SIZES = [12, 24, 48]

function linkedPages(page: number, pageCount: number) {
  return [1, page - 1, page, page + 1, pageCount].filter(
    (item, index, items) => item >= 1 && item <= pageCount && items.indexOf(item) === index,
  )
}

export function Pager({
  page,
  pageCount,
  limit,
}: {
  page: number
  pageCount: number
  limit: number
}) {
  const navigate = useNavigate()

  return (
    <Pagination className='justify-between'>
      <PaginationContent className='flex-wrap'>
        <PaginationItem>
          <PaginationPrevious
            to='.'
            search={(prev) => ({ ...prev, page: page - 1 })}
            disabled={page <= 1}
          />
        </PaginationItem>
        {linkedPages(page, pageCount).map((item, index, items) => (
          <Fragment key={item}>
            {(items[index - 1] ?? item) < item - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                to='.'
                search={(prev) => ({ ...prev, page: item })}
                isActive={item === page}
                aria-label={`Page ${item}`}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          </Fragment>
        ))}
        <PaginationItem>
          <PaginationNext
            to='.'
            search={(prev) => ({ ...prev, page: page + 1 })}
            disabled={page >= pageCount}
          />
        </PaginationItem>
      </PaginationContent>
      <Select
        value={limit}
        onValueChange={(value) =>
          void navigate({
            to: '.',
            search: (prev) => ({ ...prev, limit: value ?? limit, page: 1 }),
          })
        }
      >
        <SelectTrigger aria-label='Products per page'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Pagination>
  )
}
