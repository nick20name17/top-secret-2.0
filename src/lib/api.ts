import ky from 'ky'

export const api = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  retry: {
    jitter: true,
    maxRetryAfter: 5000,
  },
})
