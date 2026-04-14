// lib/email/templates/announcement.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Section,
  Row,
  Column,
  Img,
  Link,
  Hr,
} from '@react-email/components'

interface AnnouncementEmailProps {
  name: string
  subject: string
  body: string
  houseName?: string
  houseLogo?: string
  primaryColor?: string
  secondaryColor?: string
}

export const AnnouncementEmail = ({
  name,
  subject,
  body,
  houseName = 'Your Community',
  houseLogo,
  primaryColor = '#8B5CF6',
  secondaryColor = '#6366F1',
}: AnnouncementEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo Section */}
        {houseLogo && (
          <Section style={logoContainer}>
            <Img
              src={houseLogo}
              alt={houseName}
              width="120"
              height="auto"
              style={logo}
            />
          </Section>
        )}
        
        {/* Header */}
        <Section style={{
          ...header,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}>
          <Heading style={headerTitle}>{houseName}</Heading>
        </Section>
        
        {/* Greeting */}
        <Section style={content}>
          <Text style={greeting}>Hi {name},</Text>
          
          {/* Main Content - Renders HTML from the editor */}
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </Section>
        
        {/* Divider */}
        <Hr style={hr} />
        
        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            You're receiving this because you're a member of {houseName}.
          </Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} {houseName}. All rights reserved.
          </Text>
          <Row style={footerLinks}>
            <Column align="center">
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Unsubscribe
              </Link>
            </Column>
            <Column align="center">•</Column>
            <Column align="center">
              <Link href="{{preferencesUrl}}" style={footerLink}>
                Email Preferences
              </Link>
            </Column>
            <Column align="center">•</Column>
            <Column align="center">
              <Link href="{{portalUrl}}" style={footerLink}>
                Member Portal
              </Link>
            </Column>
          </Row>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}

const logoContainer = {
  padding: '24px 0 16px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const header = {
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const content = {
  padding: '32px 24px',
}

const greeting = {
  color: '#1a1a1a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '0',
}

const footer = {
  padding: '24px',
  backgroundColor: '#f9fafb',
}

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}

const footerLinks = {
  marginTop: '16px',
}

const footerLink = {
  color: '#8B5CF6',
  fontSize: '13px',
  textDecoration: 'none',
}