// lib/email/templates/application-rejected.tsx
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

interface ApplicationRejectedEmailProps {
  name: string
  organizationName: string
  houseName: string
  reason?: string
}

export const ApplicationRejectedEmail = ({
  name,
  organizationName,
  houseName,
  reason,
}: ApplicationRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>Update on your membership application</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application Update</Heading>
        <Text style={text}>Dear {name},</Text>
        <Text style={text}>
          Thank you for your interest in joining {organizationName} - {houseName}.
        </Text>
        <Text style={text}>
          After careful review, we regret to inform you that your membership application 
          has not been accepted at this time.
        </Text>
        {reason && (
          <Section style={reasonBox}>
            <Text style={reasonText}>
              <strong>Reason:</strong> {reason}
            </Text>
          </Section>
        )}
        <Text style={text}>
          We appreciate your interest and wish you the best in your future endeavors.
        </Text>
        <Text style={footer}>
          This is an automated message from MembersHome.
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
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const reasonBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}

const reasonText = {
  color: '#92400e',
  fontSize: '15px',
  margin: '0',
}

const footer = {
  color: '#6b7280',
  fontSize: '13px',
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
}