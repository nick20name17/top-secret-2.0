import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { HttpNetworkFrame } from 'msw/experimental'

// Images in the fixtures point to the real CDN
export const worker = setupWorker(
  http.get('https://cdn.dummyjson.com/*', () => new HttpResponse(null, { status: 404 })),
)

const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin).href

export async function startWorker() {
  await worker.start({
    quiet: true,
    onUnhandledFrame({ frame, defaults }) {
      if (!(frame instanceof HttpNetworkFrame)) return
      const { url } = frame.data.request
      if (url.startsWith(apiUrl) || new URL(url).origin !== window.location.origin) {
        defaults.error()
      }
    },
  })
}
