import { createContext, useContext } from 'react'
import { z } from 'zod/mini'

export const themeSchema = z.enum(['dark', 'light', 'system'])

export type Theme = z.infer<typeof themeSchema>
export type ResolvedTheme = Exclude<Theme, 'system'>

export const ThemeContext = createContext<
  { resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void } | undefined
>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
