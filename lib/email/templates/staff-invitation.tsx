// lib/email/templates/staff-invitation.tsx
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

interface StaffInvitationEmailProps {
  name: string
  organizationName: string
  houseName: string
  role: string
  setupUrl: string
}

export const StaffInvitationEmail = ({
  name,
  organizationName,
  houseName,
  role,
  setupUrl,
}: StaffInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {organizationName} as a {role}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You've been invited! 🎉</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          You've been invited to join <strong>{organizationName}</strong> as a{' '}
          <strong>{role}</strong> for the <strong>{houseName}</strong> house.
        </Text>

        <Section style={highlightBox}>
          <Row>
            <Column align="center">
              <Text style={highlightText}>
                <strong>Organization:</strong> {organizationName}
              </Text>
              <Text style={highlightText}>
                <strong>House:</strong> {houseName}
              </Text>
              <Text style={highlightText}>
                <strong>Role:</strong> {role}
              </Text>
            </Column>
          </Row>
        </Section>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>✨ As a staff member, you'll receive:</Text>
          <ul style={benefitsList}>
            <li style={benefitsItem}>Full access to the member portal</li>
            <li style={benefitsItem}>Event management capabilities</li>
            <li style={benefitsItem}>Member directory access</li>
            <li style={benefitsItem}>Direct messaging with members</li>
            <li style={benefitsItem}><strong>Complimentary membership</strong> - no payment required</li>
          </ul>
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
          Welcome to the team! If you have any questions, please contact your organization administrator.
          <br /><br />
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

const benefitsBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const benefitsTitle = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const benefitsList = {
  margin: '0',
  paddingLeft: '20px',
}

const benefitsItem = {
  color: '#166534',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#8B5CF6',
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
  color: '#8B5CF6',
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