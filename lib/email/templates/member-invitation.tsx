// lib/email/templates/member-invitation.tsx
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

interface MemberInvitationEmailProps {
  name: string
  organizationName: string
  houseName: string
  setupUrl: string
}

export const MemberInvitationEmail = ({
  name,
  organizationName,
  houseName,
  setupUrl,
}: MemberInvitationEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {organizationName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're Invited! 🎉</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          You've been invited to join <strong>{organizationName}</strong> and become a member of{' '}
          <strong>{houseName}</strong>.
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
            </Column>
          </Row>
        </Section>

        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>✨ What you'll get as a member:</Text>
          <ul style={benefitsList}>
            <li style={benefitsItem}>Access to exclusive events</li>
            <li style={benefitsItem}>Connect with like-minded members</li>
            <li style={benefitsItem}>Member-only content and resources</li>
            <li style={benefitsItem}>Direct messaging with the community</li>
          </ul>
        </Section>

        <Text style={text}>
          Click the button below to accept the invitation and set up your account.
          This link will expire in 7 days.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={setupUrl}>
            Accept Invitation & Join
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
          We're excited to have you join our community! If you have any questions, please contact the organization.
          <br /><br />
          This invitation was sent from MembersHome.
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
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const benefitsTitle = {
  color: '#92400e',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const benefitsList = {
  margin: '0',
  paddingLeft: '20px',
}

const benefitsItem = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '8px 0',
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

const footerText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
}