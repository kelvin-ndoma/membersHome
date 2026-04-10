// lib/email/templates/invitation.tsx
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
} from '@react-email/components'

interface InvitationEmailProps {
  name: string
  organizationName: string
  houseName?: string
  setupUrl: string
  role: string
}

export const InvitationEmail = ({
  name,
  organizationName,
  houseName,
  setupUrl,
  role,
}: InvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {organizationName} on MembersHome</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited!</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          You've been invited to join <strong>{organizationName}</strong> as an{' '}
          <strong>{role}</strong>
          {houseName && (
            <> for the <strong>{houseName}</strong> house</>
          )}.
        </Text>

        <Section style={highlightBox}>
          <Row>
            <Column align="center">
              <Text style={highlightText}>
                <strong>Organization:</strong> {organizationName}
              </Text>
              {houseName && (
                <Text style={highlightText}>
                  <strong>House:</strong> {houseName}
                </Text>
              )}
              <Text style={highlightText}>
                <strong>Role:</strong> {role}
              </Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          Click the button below to accept the invitation and set up your account.
          This link will expire in 7 days.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={setupUrl}>
            Accept Invitation & Set Up Account
          </Button>
        </Section>

        <Text style={text}>
          Or copy and paste this link into your browser:
        </Text>
        
        <Text style={linkText}>
          {setupUrl}
        </Text>

        <Section style={divider} />

        <Text style={footerText}>
          If you weren't expecting this invitation, you can safely ignore this email.
          This invitation was sent from MembersHome, the complete membership management platform.
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

const highlightBox = {
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const highlightText = {
  color: '#0369a1',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '4px 0',
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
  border: 'none',
  cursor: 'pointer',
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

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}