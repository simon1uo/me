'use client'

import { useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type FontPreference = 'sans' | 'serif'
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'atlas-theme-preference'
const FONT_STORAGE_KEY = 'atlas-font-preference'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

function resolveTheme(themePreference: ThemePreference): ResolvedTheme {
  return themePreference === 'system' ? getSystemTheme() : themePreference
}

function applyPreferences(
  themePreference: ThemePreference,
  fontPreference: FontPreference
) {
  const root = document.documentElement
  const resolvedTheme = resolveTheme(themePreference)

  root.dataset.themePreference = themePreference
  root.dataset.theme = resolvedTheme
  root.dataset.font = fontPreference

  window.localStorage.setItem(THEME_STORAGE_KEY, themePreference)
  window.localStorage.setItem(FONT_STORAGE_KEY, fontPreference)

  window.dispatchEvent(
    new CustomEvent('atlas-preferences-change', {
      detail: {
        themePreference,
        fontPreference,
        resolvedTheme,
      },
    })
  )
}

function readStoredPreferences() {
  const root = document.documentElement
  const themePreference =
    (root.dataset.themePreference as ThemePreference | undefined) ||
    (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null) ||
    'system'
  const fontPreference =
    (root.dataset.font as FontPreference | undefined) ||
    (window.localStorage.getItem(FONT_STORAGE_KEY) as FontPreference | null) ||
    'serif'

  return {
    themePreference,
    fontPreference,
    resolvedTheme: resolveTheme(themePreference),
  }
}

export function useThemePreferences() {
  const [state, setState] = useState<{
    themePreference: ThemePreference
    fontPreference: FontPreference
    resolvedTheme: ResolvedTheme
    ready: boolean
  }>({
    themePreference: 'system',
    fontPreference: 'serif',
    resolvedTheme: 'light',
    ready: false,
  })

  useEffect(() => {
    const syncState = () => {
      setState({
        ...readStoredPreferences(),
        ready: true,
      })
    }

    syncState()

    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    const handleSystemThemeChange = () => {
      const currentPreferences = readStoredPreferences()

      if (currentPreferences.themePreference !== 'system') {
        return
      }

      const nextResolvedTheme = getSystemTheme()
      document.documentElement.dataset.theme = nextResolvedTheme
      window.dispatchEvent(
        new CustomEvent('atlas-preferences-change', {
          detail: {
            ...currentPreferences,
            resolvedTheme: nextResolvedTheme,
          },
        })
      )
      syncState()
    }
    const handlePreferenceChange = () => syncState()

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    window.addEventListener(
      'atlas-preferences-change',
      handlePreferenceChange as EventListener
    )

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
      window.removeEventListener(
        'atlas-preferences-change',
        handlePreferenceChange as EventListener
      )
    }
  }, [])

  return {
    ...state,
    setThemePreference(themePreference: ThemePreference) {
      const currentPreferences = readStoredPreferences()
      applyPreferences(themePreference, currentPreferences.fontPreference)
    },
    setFontPreference(fontPreference: FontPreference) {
      const currentPreferences = readStoredPreferences()
      applyPreferences(currentPreferences.themePreference, fontPreference)
    },
  }
}
