// lib/theme/ThemeProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface Theme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderRadius: string
  buttonStyle: string
  fontFamily: string
  logoUrl?: string
  faviconUrl?: string
  loginPageImage?: string
  customCSS?: string
}

const defaultTheme: Theme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#1E40AF',
  accentColor: '#10B981',
  backgroundColor: '#F9FAFB',
  textColor: '#111827',
  borderRadius: '0.5rem',
  buttonStyle: 'rounded',
  fontFamily: 'Inter',
}

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Partial<Theme>) => void
}>({
  theme: defaultTheme,
  setTheme: () => {},
})

export function ThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: React.ReactNode
  initialTheme?: Partial<Theme>
}) {
  const [theme, setThemeState] = useState<Theme>({ ...defaultTheme, ...initialTheme })

  const setTheme = (newTheme: Partial<Theme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }))
  }

  useEffect(() => {
    // Apply to CSS variables - matches your globals.css
    const root = document.documentElement
    root.style.setProperty('--theme-primary', theme.primaryColor)
    root.style.setProperty('--theme-secondary', theme.secondaryColor)
    root.style.setProperty('--theme-accent', theme.accentColor)
    root.style.setProperty('--theme-background', theme.backgroundColor)
    root.style.setProperty('--theme-text', theme.textColor)
    root.style.setProperty('--theme-radius', theme.borderRadius)
    root.style.setProperty('--theme-font', theme.fontFamily)
    
    // Update favicon if provided
    if (theme.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (link) link.href = theme.faviconUrl
    }
    
    // Apply custom CSS
    if (theme.customCSS) {
      let styleTag = document.getElementById('custom-theme-css') as HTMLStyleElement
      if (!styleTag) {
        styleTag = document.createElement('style')
        styleTag.id = 'custom-theme-css'
        document.head.appendChild(styleTag)
      }
      styleTag.textContent = theme.customCSS
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)