// lib/email/templates/membership-cancellation-requested.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from '@react-email/components'

interface MembershipCancellationRequestedProps {
  name: string
  organizationName: string
  houseName: string
  effectiveDate: string
}

export const MembershipCancellationRequestedEmail = ({
  name,
  organizationName,
  houseName,
  effectiveDate,
}: MembershipCancellationRequestedProps) => (
  <Html>
    <Head />
    <Preview>Your membership cancellation request has been received</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Cancellation Request Received</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          We've received your request to cancel your membership with <strong>{organizationName} - {houseName}</strong>.
        </Text>

        <Section style={infoBox}>
          <Text style={infoText}>
            <strong>Effective Date:</strong> {effectiveDate}
          </Text>
          <Text style={infoText}>
            Your membership benefits will remain active until this date.
          </Text>
        </Section>

        <Text style={text}>
          If you didn't request this cancellation, please contact us immediately.
        </Text>

        <Text style={text}>
          We're sorry to see you go. If you have a moment, we'd love to hear your feedback on how we can improve.
        </Text>

        <Section style={divider} />

        <Text style={footerText}>
          Thank you for being a part of our community.
          <br />
          — The {organizationName} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

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

const infoBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const infoText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '4px 0',
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