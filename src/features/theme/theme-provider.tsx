import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { z } from 'zod/mini'

import {
  ThemeContext,
  themeSchema,
  type ResolvedTheme,
  type Theme,
} from '@/features/theme/use-theme'

const STORAGE_KEY = 'theme'
const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#ffffff',
  dark: '#0a0a0a',
}
const storedThemeSchema = z.catch(themeSchema, 'system')

function readStoredTheme(): Theme {
  try {
    return storedThemeSchema.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return 'system'
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The theme still applies for this session
  }
}

const systemDarkThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

function subscribeToSystemTheme(onChange: () => void) {
  systemDarkThemeQuery.addEventListener('change', onChange)
  return () => systemDarkThemeQuery.removeEventListener('change', onChange)
}

function getSystemTheme(): ResolvedTheme {
  return systemDarkThemeQuery.matches ? 'dark' : 'light'
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (document.documentElement.classList.contains(resolvedTheme)) return

  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)

  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolvedTheme)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[resolvedTheme])

  window.getComputedStyle(document.body)
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()))
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(readStoredTheme)
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, getSystemTheme)
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  function setTheme(nextTheme: Theme) {
    writeStoredTheme(nextTheme)
    setThemeState(nextTheme)
  }

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  return <ThemeContext value={{ resolvedTheme, setTheme }}>{children}</ThemeContext>
}
