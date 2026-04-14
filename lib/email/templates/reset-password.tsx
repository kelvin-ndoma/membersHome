// lib/email/templates/reset-password.tsx
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
} from '@react-email/components'

interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
}

export const ResetPasswordEmail = ({ name, resetUrl }: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your MembersHome password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          We received a request to reset your password for your MembersHome account.
          Click the button below to create a new password.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>

        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        
        <Text style={linkText}>
          {resetUrl}
        </Text>

        <Section style={divider} />

        <Text style={warningText}>
          This link will expire in 1 hour.
        </Text>
        
        <Text style={footerText}>
          If you didn't request a password reset, you can safely ignore this email.
          Your password will not be changed.
        </Text>
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
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const linkText = {
  color: '#3B82F6',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0 24px',
  wordBreak: 'break-all' as const,
}

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 0',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  backgroundColor: '#fef3c7',
  padding: '12px',
  borderRadius: '6px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}