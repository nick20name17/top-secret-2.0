import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'

// Real response: GET https://dummyjson.com/products/1?select=title,price,thumbnail,description
import mascara from '@/test/fixtures/products-1.json'
import { apiUrl, worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'
import { signIn } from '@/test/sign-in'

beforeEach(() => {
  worker.use(http.get(`${apiUrl}/products/1`, () => HttpResponse.json(mascara)))
})

test('a product page shows the product', async () => {
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

test('a product the API sends in another shape shows the error page', async () => {
  worker.use(
    http.get(`${apiUrl}/products/1`, () => HttpResponse.json({ ...mascara, price: '9.99' })),
  )
  await renderRoute('/products/1')

  await expect.element(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  vi.mocked(console.error).mockClear()
})

test('the product page links a signed-in user to its edit form', async () => {
  signIn()
  await renderRoute('/products/1')

  await expect
    .element(page.getByRole('link', { name: 'Edit' }))
    .toHaveAttribute('href', '/products/1/edit')
})

test('a signed-out user sees no link to the edit form', async () => {
  await renderRoute('/products/1')

  await expect
    .element(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' }))
    .toBeVisible()
  await expect.element(page.getByRole('link', { name: 'Edit' })).not.toBeInTheDocument()
})

test('the edit form sends a signed-out user to sign in', async () => {
  await renderRoute('/products/1/edit')

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

// PUT returns the product with the sent fields changed: https://dummyjson.com/docs/products#products-update
function mockProductUpdate() {
  const sent: unknown[] = []
  worker.use(
    http.put(`${apiUrl}/products/1`, async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json({ ...mascara, title: 'Lash Queen', price: 12.5 })
    }),
  )
  return sent
}

test('saving the edit form sends the fields and shows the updated product', async () => {
  const sent = mockProductUpdate()
  signIn()
  await renderRoute('/products/1/edit')

  await userEvent.fill(page.getByLabelText('Title'), ' Lash Queen ')
  await userEvent.fill(page.getByLabelText('Price'), '12.5')
  await userEvent.fill(page.getByLabelText('Description'), 'Longer lashes.')
  await userEvent.click(page.getByRole('button', { name: 'Save' }))

  await expect.element(page.getByRole('heading', { name: 'Lash Queen' })).toBeVisible()
  await expect.element(page.getByText('$12.50')).toBeVisible()
  await expect.poll(() => document.title).toBe('Lash Queen')
  expect(sent).toEqual([{ title: 'Lash Queen', price: 12.5, description: 'Longer lashes.' }])
})

test('an empty title and a zero price show what to fix and send nothing', async () => {
  const sent = mockProductUpdate()
  signIn()
  await renderRoute('/products/1/edit')

  await userEvent.fill(page.getByLabelText('Title'), '  ')
  await userEvent.fill(page.getByLabelText('Price'), '0')
  await userEvent.click(page.getByRole('button', { name: 'Save' }))

  await expect.element(page.getByText('Enter a title')).toBeVisible()
  await expect.element(page.getByText('Enter a price above 0')).toBeVisible()
  expect(sent).toEqual([])
})

test('an API error while saving shows its message and keeps the form', async () => {
  worker.use(
    http.put(`${apiUrl}/products/1`, () =>
      HttpResponse.json({ message: 'Title is taken' }, { status: 400 }),
    ),
  )
  signIn()
  await renderRoute('/products/1/edit')

  await userEvent.click(page.getByRole('button', { name: 'Save' }))

  await expect.element(page.getByRole('alert')).toMatchTextContent('Title is taken')
  await expect.element(page.getByLabelText('Title')).toHaveValue('Essence Mascara Lash Princess')
})
