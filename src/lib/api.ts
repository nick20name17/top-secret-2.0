import ky from 'ky'

export const api = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  totalTimeout: 15_000,
  retry: {
    jitter: true,
    maxRetryAfter: 5000,
  },
})
