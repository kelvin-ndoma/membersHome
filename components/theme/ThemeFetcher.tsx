// components/theme/ThemeFetcher.tsx
import { prisma } from '@/lib/prisma'
import { ThemeProvider } from '@/lib/theme/ThemeProvider'
import { headers } from 'next/headers'

// Default colors for organizations (same as in settings page)
const DEFAULT_ORG_COLORS = {
  primaryColor: '#0a387c',
  secondaryColor: '#0596eb',
  accentColor: '#f59e0b',
  backgroundColor: '#f8fafc',
  textColor: '#0f172a',
  borderRadius: '0.5rem',
  buttonStyle: 'rounded',
  fontFamily: 'Inter',
}

export default async function ThemeFetcher({ children }: { children: React.ReactNode }) {
  const headersList = headers()
  const pathname = headersList.get('x-pathname') || ''
  
  let theme: any = {}
  
  try {
    // Check if we're in an organization context (/org/[orgSlug])
    const orgMatch = pathname.match(/^\/org\/([^\/]+)/)
    if (orgMatch) {
      const orgSlug = orgMatch[1]
      const organization = await prisma.organization.findUnique({
        where: { slug: orgSlug },
      })
      
      if (organization) {
        // ALWAYS use organization colors - fallback to defaults if not set
        theme = {
          primaryColor: organization.primaryColor || DEFAULT_ORG_COLORS.primaryColor,
          secondaryColor: organization.secondaryColor || DEFAULT_ORG_COLORS.secondaryColor,
          accentColor: organization.accentColor || DEFAULT_ORG_COLORS.accentColor,
          backgroundColor: organization.backgroundColor || DEFAULT_ORG_COLORS.backgroundColor,
          textColor: organization.textColor || DEFAULT_ORG_COLORS.textColor,
          borderRadius: organization.borderRadius || DEFAULT_ORG_COLORS.borderRadius,
          buttonStyle: organization.buttonStyle || DEFAULT_ORG_COLORS.buttonStyle,
          fontFamily: organization.fontFamily || DEFAULT_ORG_COLORS.fontFamily,
          logoUrl: organization.logoUrl || undefined,
          faviconUrl: organization.faviconUrl || undefined,
          loginPageImage: organization.loginPageImage || undefined,
          customCSS: organization.customCSS || undefined,
        }
      }
    }
    
    // Check if we're in a portal context (/portal/[houseSlug])
    const portalMatch = pathname.match(/^\/portal\/([^\/]+)/)
    if (portalMatch) {
      const houseSlug = portalMatch[1]
      const house = await prisma.house.findFirst({
        where: { slug: houseSlug },
        include: { 
          organization: true
        }
      })
      
      if (house) {
        const houseTheme = house.theme as any
        
        // Priority: House theme → Organization theme → Defaults
        theme = {
          primaryColor: houseTheme?.primaryColor || house.organization?.primaryColor || DEFAULT_ORG_COLORS.primaryColor,
          secondaryColor: houseTheme?.secondaryColor || house.organization?.secondaryColor || DEFAULT_ORG_COLORS.secondaryColor,
          accentColor: houseTheme?.accentColor || house.organization?.accentColor || DEFAULT_ORG_COLORS.accentColor,
          backgroundColor: houseTheme?.backgroundColor || house.organization?.backgroundColor || DEFAULT_ORG_COLORS.backgroundColor,
          textColor: houseTheme?.textColor || house.organization?.textColor || DEFAULT_ORG_COLORS.textColor,
          borderRadius: houseTheme?.borderRadius || house.organization?.borderRadius || DEFAULT_ORG_COLORS.borderRadius,
          buttonStyle: houseTheme?.buttonStyle || house.organization?.buttonStyle || DEFAULT_ORG_COLORS.buttonStyle,
          fontFamily: houseTheme?.fontFamily || house.organization?.fontFamily || DEFAULT_ORG_COLORS.fontFamily,
          logoUrl: houseTheme?.logoUrl || house.organization?.logoUrl || undefined,
          faviconUrl: houseTheme?.faviconUrl || house.organization?.faviconUrl || undefined,
        }
      }
    }
    
    // Public pages (discover, apply, etc.) - use platform settings
    if (Object.keys(theme).length === 0) {
      const platform = await prisma.platform.findFirst()
      if (platform) {
        theme = {
          primaryColor: platform.primaryColor || '#3B82F6',
          secondaryColor: platform.secondaryColor || '#1E40AF',
          accentColor: platform.accentColor || '#10B981',
          backgroundColor: platform.backgroundColor || '#F9FAFB',
          textColor: platform.textColor || '#111827',
          borderRadius: platform.borderRadius || '0.5rem',
          buttonStyle: platform.buttonStyle || 'rounded',
          fontFamily: platform.fontFamily || 'Inter',
          logoUrl: platform.logoUrl || undefined,
          faviconUrl: platform.faviconUrl || undefined,
          loginPageImage: platform.loginPageImage || undefined,
          customCSS: platform.customCSS || undefined,
        }
      } else {
        // Ultimate fallback
        theme = { ...DEFAULT_ORG_COLORS }
      }
    }
  } catch (error) {
    console.error('Failed to fetch theme:', error)
    // Fallback to defaults on error
    theme = { ...DEFAULT_ORG_COLORS }
  }
  
  // Filter out undefined values
  const cleanTheme = Object.fromEntries(
    Object.entries(theme).filter(([_, v]) => v !== undefined && v !== null)
  )

  return (
    <ThemeProvider initialTheme={cleanTheme}>
      {children}
    </ThemeProvider>
  )
}