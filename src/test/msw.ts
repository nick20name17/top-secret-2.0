import { setupWorker } from 'msw/browser'
import { HttpNetworkFrame } from 'msw/experimental'

export const worker = setupWorker()

const apiUrl = new URL(import.meta.env.VITE_API_URL, window.location.origin).href

export async function startWorker() {
  await worker.start({
    quiet: true,
    // Same-origin traffic is Vite and Vitest; mock the API and other origins
    onUnhandledFrame({ frame, defaults }) {
      if (!(frame instanceof HttpNetworkFrame)) return
      const { url } = frame.data.request
      if (url.startsWith(apiUrl) || new URL(url).origin !== window.location.origin) {
        defaults.error()
      }
    },
  })
}
