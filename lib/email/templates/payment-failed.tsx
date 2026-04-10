// lib/email/templates/payment-failed.tsx
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

interface PaymentFailedEmailProps {
  name: string
  organizationName: string
  houseName: string
  amount: string
  retryUrl: string
  failureReason?: string
}

export const PaymentFailedEmail = ({
  name,
  organizationName,
  houseName,
  amount,
  retryUrl,
  failureReason,
}: PaymentFailedEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment failed for your {organizationName} membership</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Unsuccessful</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          We attempted to process your payment for <strong>{organizationName} - {houseName}</strong> but it was unsuccessful.
        </Text>

        <Section style={errorBox}>
          <Text style={errorText}>
            <strong>Amount:</strong> {amount}
          </Text>
          {failureReason && (
            <Text style={errorText}>
              <strong>Reason:</strong> {failureReason}
            </Text>
          )}
        </Section>

        <Text style={text}>
          Don't worry! Your membership application is still active. Please update your payment method to continue.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={retryUrl}>
            Update Payment Method
          </Button>
        </Section>

        <Text style={text}>
          If you need assistance, please contact us.
        </Text>

        <Section style={divider} />

        <Text style={footerText}>
          Your application will remain in "Awaiting Payment" status until payment is successfully processed.
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

const errorBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const errorText = {
  color: '#991b1b',
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