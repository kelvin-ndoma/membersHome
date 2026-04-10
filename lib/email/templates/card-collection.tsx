// lib/email/templates/card-collection.tsx
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

interface CardCollectionEmailProps {
  name: string
  organizationName: string
  houseName: string
  planName: string
  amount: string
  setupUrl: string
}

export const CardCollectionEmail = ({
  name,
  organizationName,
  houseName,
  planName,
  amount,
  setupUrl,
}: CardCollectionEmailProps) => (
  <Html>
    <Head />
    <Preview>Add your payment method for {organizationName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Application is Under Review!</Heading>
        
        <Text style={text}>Hi {name},</Text>
        
        <Text style={text}>
          Great news! Your membership application for <strong>{organizationName} - {houseName}</strong> is being reviewed.
        </Text>

        <Section style={highlightBox}>
          <Row>
            <Column align="center">
              <Text style={highlightText}>
                <strong>Selected Plan:</strong> {planName}
              </Text>
              <Text style={highlightText}>
                <strong>Amount:</strong> {amount}
              </Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          To complete your application, please add a payment method. Your card will be securely stored but <strong>NOT charged yet</strong>. 
          You'll only be charged when your membership is fully approved.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={setupUrl}>
            Add Payment Method
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
          This link is secure and will expire in 7 days.
          If you have any questions, please reply to this email.
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