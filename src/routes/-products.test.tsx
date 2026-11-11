import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'

// Real responses: GET https://dummyjson.com/products?limit=12&skip=0&select=title,price,thumbnail
// and GET https://dummyjson.com/products/1?select=title,price,thumbnail,description
import mascara from '@/test/fixtures/products-1.json'
import firstPage from '@/test/fixtures/products.json'
import { worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'

const apiUrl = import.meta.env.VITE_API_URL

// Images in the fixtures point to the real CDN
beforeEach(() => {
  worker.use(http.get('https://cdn.dummyjson.com/*', () => new HttpResponse(null, { status: 404 })))
})

// An image request that outlives its test reaches the next one, after the handlers are reset
afterEach(async () => {
  await expect.poll(() => [...document.images].every((image) => image.complete)).toBe(true)
})

// Titles echo the request; 30 products make 3 pages
function productPage(title: string) {
  return { ...firstPage, products: [{ ...firstPage.products[0], title }], total: 30 }
}

function mockProducts() {
  worker.use(
    http.get(`${apiUrl}/products`, ({ request }) => {
      const skip = new URL(request.url).searchParams.get('skip')
      return HttpResponse.json(productPage(`Product at ${skip}`))
    }),
    http.get(`${apiUrl}/products/search`, ({ request }) => {
      const q = new URL(request.url).searchParams.get('q')
      return HttpResponse.json(productPage(`Result for ${q}`))
    }),
  )
}

test('lists the products of the page in the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await expect.element(page.getByText('Product at 12')).toBeVisible()
  await expect.element(page.getByText('Page 2 of 3')).toBeVisible()
})

test('opens the first page when the page in the URL is broken', async () => {
  mockProducts()
  await renderRoute('/products?page=abc')

  await expect.element(page.getByText('Product at 0')).toBeVisible()
  await expect.element(page.getByText('Page 1 of 3')).toBeVisible()
})

test('next page link shows the following products', async () => {
  mockProducts()
  await renderRoute('/products')

  await userEvent.click(page.getByRole('link', { name: 'Next page' }))

  await expect.element(page.getByText('Product at 12')).toBeVisible()
})

test('searching shows matching products and keeps the query in the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await userEvent.fill(page.getByRole('searchbox', { name: 'Search products' }), 'phone')
  await userEvent.click(page.getByRole('button', { name: 'Search' }))

  await expect.element(page.getByText('Result for phone')).toBeVisible()
  await expect
    .element(page.getByRole('link', { name: 'Next page' }))
    .toHaveAttribute('href', '/products?q=phone&page=2')
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
    .element(page.getByRole('link', { name: 'Next page' }))
    .toHaveAttribute('href', '/products?q=2024&page=2')
})

test.each([
  ['/products', 'Previous page'],
  ['/products?page=3', 'Next page'],
])('on %s the %s link is disabled', async (url, name) => {
  mockProducts()
  await renderRoute(url)

  await expect.element(page.getByRole('link', { name })).toHaveAttribute('aria-disabled', 'true')
})

test('searching ignores spaces around the query', async () => {
  mockProducts()
  await renderRoute('/products')

  await userEvent.fill(page.getByRole('searchbox', { name: 'Search products' }), '  phone  ')
  await userEvent.click(page.getByRole('button', { name: 'Search' }))

  await expect
    .element(page.getByRole('link', { name: 'Next page' }))
    .toHaveAttribute('href', '/products?q=phone&page=2')
})

test('going back to the first page leaves the page out of the URL', async () => {
  mockProducts()
  await renderRoute('/products?page=2')

  await expect
    .element(page.getByRole('link', { name: 'Previous page' }))
    .toHaveAttribute('href', '/products')
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

  await expect.element(page.getByText('Product at 0')).toBeVisible()
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
