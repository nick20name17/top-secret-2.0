import { createContext } from 'react'
import { z } from 'zod/mini'

export const themeSchema = z.enum(['dark', 'light', 'system'])

export type Theme = z.infer<typeof themeSchema>
export type ResolvedTheme = Exclude<Theme, 'system'>

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)
