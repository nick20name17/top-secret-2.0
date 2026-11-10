import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'

// Real response: GET https://dummyjson.com/products/1?select=title,price,thumbnail,description
import mascara from '@/test/fixtures/products-1.json'
import { worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'

const apiUrl = import.meta.env.VITE_API_URL

test('a product page shows the product', async () => {
  worker.use(http.get(`${apiUrl}/products/1`, () => HttpResponse.json(mascara)))
  await renderRoute('/products/1')

  await expect
    .element(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' }))
    .toBeVisible()
  await expect.element(page.getByText('$9.99')).toBeVisible()
})

test('a product the API does not have shows the not found page', async () => {
  worker.use(
    http.get(`${apiUrl}/products/999`, () =>
      // From GET https://dummyjson.com/products/999
      HttpResponse.json({ message: "Product with id '999' not found" }, { status: 404 }),
    ),
  )
  await renderRoute('/products/999')

  await expect.element(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})
