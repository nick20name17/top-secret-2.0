import { HttpResponse, http } from 'msw'
import { setupWorker } from 'msw/browser'
import { HttpNetworkFrame } from 'msw/experimental'

// Images in fixtures point to real hosts; the test page itself is served over http
const remoteImages = http.get(
  /^https:.*\.(avif|gif|jpe?g|png|svg|webp)$/,
  () => new HttpResponse(null, { status: 404 }),
)

export const worker = setupWorker(remoteImages)

export const apiUrl = import.meta.env.VITE_API_URL
const absoluteApiUrl = new URL(apiUrl, window.location.origin).href

export async function startWorker() {
  await worker.start({
    quiet: true,
    onUnhandledFrame({ frame, defaults }) {
      if (!(frame instanceof HttpNetworkFrame)) return
      const { url } = frame.data.request
      if (url.startsWith(absoluteApiUrl) || new URL(url).origin !== window.location.origin) {
        defaults.error()
      }
    },
  })
}
