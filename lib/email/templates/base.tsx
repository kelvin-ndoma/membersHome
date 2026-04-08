import { Html, Body, Container, Head, Preview, Section, Text, Link, Img } from "@react-email/components"

interface BaseEmailProps {
  children: React.ReactNode
  previewText?: string
  title?: string
}

export const BaseEmail = ({ children, previewText, title }: BaseEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText || "Message from membersHome"}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>membersHome</Text>
          </Section>
          
          <Section style={content}>
            {children}
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} membersHome. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${process.env.NEXTAUTH_URL}/privacy`} style={link}>
                Privacy Policy
              </Link>
              {" | "}
              <Link href={`${process.env.NEXTAUTH_URL}/terms`} style={link}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#f4f4f4',
  padding: '20px 0',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
}

const header = {
  backgroundColor: '#2563eb',
  padding: '20px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '30px',
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 10px 0',
}

const footerLinks = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
}

const link = {
  color: '#6b7280',
  textDecoration: 'none',
}