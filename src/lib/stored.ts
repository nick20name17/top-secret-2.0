import type { z } from 'zod/mini'

export function stored<T>(key: string, schema: z.ZodMiniType<T>) {
  const listeners = new Set<() => void>()
  let raw: string | null = null
  let value: T | undefined

  function get() {
    const next = localStorage.getItem(key)
    if (next === raw) return value
    raw = next
    try {
      const parsed = schema.safeParse(JSON.parse(next ?? 'null'))
      value = parsed.success ? parsed.data : undefined
    } catch {
      value = undefined
    }
    return value
  }

  function set(next: T | undefined) {
    if (next === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(next))
    for (const listener of listeners) listener()
  }

  function subscribe(listener: () => void) {
    function onStorage(event: StorageEvent) {
      if (event.key === key || event.key === null) listener()
    }
    listeners.add(listener)
    window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  }

  return { get, set, subscribe }
}
