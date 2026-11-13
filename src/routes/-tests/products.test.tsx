import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'

// Real responses: GET https://dummyjson.com/products?limit=12&skip=0&select=title,price,thumbnail
// and GET https://dummyjson.com/products/1?select=title,price,thumbnail,description
import mascara from '@/test/fixtures/products-1.json'
import firstPage from '@/test/fixtures/products.json'
import { apiUrl, worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'

// Titles echo the request; 30 products make 3 pages of 12
function mockProducts(total = 30) {
  function productPage(title: string) {
    return { ...firstPage, products: [{ ...firstPage.products[0], title }], total }
  }
  worker.use(
    http.get(`${apiUrl}/products`, ({ request }) => {
      const params = new URL(request.url).searchParams
      return HttpResponse.json(
        productPage(`Product at ${params.get('skip')} by ${params.get('limit')}`),
      )
    }),
    http.get(`${apiUrl}/products/search`, ({ request }) => {
      const q = new URL(request.url).searchParams.get('q')
      return HttpResponse.json(productPage(`Result for ${q}`))
    }),
  )
}

test('while the products load, the search stays and placeholders take the space of the list', async () => {
  const response = Promise.withResolvers<undefined>()
  worker.use(
    http.get(`${apiUrl}/products`, async () => {
      await response.promise
      return HttpResponse.json(firstPage)
    }),
  )
  await renderRoute('/products')
  await expect.element(page.getByRole('searchbox', { name: 'Search products' })).toBeVisible()
  const placeholderHeight = page
    .getByRole('list', { name: 'Loading products' })
    .element().clientHeight

  response.resolve(undefined)

  await expect.element(page.getByText('Essence Mascara Lash Princess')).toBeVisible()
  expect(page.getByRole('list', { name: 'Products' }).element().clientHeight).toBe(
    placeholderHeight,
  )
})

test('lists the products of the page in the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await expect.element(page.getByText('Product at 12 by 12')).toBeVisible()
})

test('opens the first page of 12 when the page and the page size in the URL are broken', async () => {
  mockProducts()
  await renderRoute('/products?page=abc&limit=7')

  await expect.element(page.getByText('Product at 0 by 12')).toBeVisible()
})

test('page links point to their pages and only the current one is marked', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  const first = page.getByRole('link', { name: 'Page 1' })
  await expect.element(first).toHaveAttribute('href', '/products')
  await expect.element(first).not.toHaveAttribute('aria-current')
  await expect
    .element(page.getByRole('link', { name: 'Page 2' }))
    .toHaveAttribute('aria-current', 'page')
  await expect
    .element(page.getByRole('link', { name: 'Page 3' }))
    .toHaveAttribute('href', '/products?page=3')
})

test('with many pages only the first, the last and the ones around the current are linked', async () => {
  mockProducts(120)
  await renderRoute('/products?page=5')

  const pages = page.getByRole('link', { name: /^Page \d+$/ })
  await expect.element(pages.last()).toHaveAccessibleName('Page 10')
  expect(pages.all().map((link) => link.element().getAttribute('aria-label'))).toEqual([
    'Page 1',
    'Page 4',
    'Page 5',
    'Page 6',
    'Page 10',
  ])
})

test('choosing a page size loads the first page with that size and keeps it in the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await userEvent.click(page.getByRole('combobox', { name: 'Products per page' }))
  await userEvent.click(page.getByRole('option', { name: '24' }))

  await expect.element(page.getByText('Product at 0 by 24')).toBeVisible()
  await expect
    .element(page.getByRole('link', { name: 'Go to next page' }))
    .toHaveAttribute('href', '/products?limit=24&page=2')
  await expect.element(page.getByRole('link', { name: 'Page 3' })).not.toBeInTheDocument()
})

test('searching shows matching products and keeps the trimmed query in the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await userEvent.fill(page.getByRole('searchbox', { name: 'Search products' }), '  phone  ')
  await userEvent.click(page.getByRole('button', { name: 'Search' }))

  await expect.element(page.getByText('Result for phone')).toBeVisible()
  await expect
    .element(page.getByRole('link', { name: 'Go to next page' }))
    .toHaveAttribute('href', '/products?q=phone&page=2')
})

test('a search with no matches says so', async () => {
  worker.use(
    http.get(`${apiUrl}/products/search`, () =>
      // From GET https://dummyjson.com/products/search?q=zzzqqq
      HttpResponse.json({ products: [], total: 0, skip: 0, limit: 0 }),
    ),
  )
  await renderRoute('/products?q=zzz')

  await expect.element(page.getByText('No products found')).toBeVisible()
})

test('a search link with a numeric query keeps the query', async () => {
  mockProducts()
  await renderRoute('/products?q=2024')

  await expect.element(page.getByText('Result for 2024')).toBeVisible()
})

test('searching a number writes it to the URL as plain text', async () => {
  mockProducts()
  await renderRoute('/products')

  await userEvent.fill(page.getByRole('searchbox', { name: 'Search products' }), '2024')
  await userEvent.click(page.getByRole('button', { name: 'Search' }))

  await expect
    .element(page.getByRole('link', { name: 'Go to next page' }))
    .toHaveAttribute('href', '/products?q=2024&page=2')
})

test.each([
  ['/products', 'Go to previous page'],
  ['/products?page=3', 'Go to next page'],
])('on %s the %s link is disabled', async (url, name) => {
  mockProducts()
  await renderRoute(url)

  await expect.element(page.getByRole('link', { name })).toHaveAttribute('aria-disabled', 'true')
})

test('Try again on the error page loads the products once the API is back', async () => {
  mockProducts()
  worker.use(
    http.get(`${apiUrl}/products`, () => HttpResponse.json({ message: 'Gone' }, { status: 404 }), {
      once: true,
    }),
  )
  await renderRoute('/products')
  await expect.element(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()

  await userEvent.click(page.getByRole('button', { name: 'Try again' }))

  await expect.element(page.getByText('Product at 0 by 12')).toBeVisible()
  vi.mocked(console.error).mockClear()
})

test('choosing a product opens its page', async () => {
  mockProducts()
  worker.use(http.get(`${apiUrl}/products/1`, () => HttpResponse.json(mascara)))
  await renderRoute('/products')

  await userEvent.click(page.getByRole('link', { name: /Product at 0/ }))

  await expect
    .element(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' }))
    .toBeVisible()
})
