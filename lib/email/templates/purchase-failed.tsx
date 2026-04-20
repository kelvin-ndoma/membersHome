// lib/email/templates/purchase-failed.tsx
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
  Hr,
} from '@react-email/components'

interface PurchaseFailedEmailProps {
  name: string
  productName: string
  amount: string
  failureReason: string
  houseName?: string
  primaryColor?: string
  secondaryColor?: string
}

export const PurchaseFailedEmail = ({
  name,
  productName,
  amount,
  failureReason,
  houseName = 'Your Community',
  primaryColor = '#8B5CF6',
  secondaryColor = '#6366F1',
}: PurchaseFailedEmailProps) => (
  <Html>
    <Head />
    <Preview>Purchase Failed - {productName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={{
          ...header,
          background: `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`,
        }}>
          <Heading style={headerTitle}>Purchase Failed</Heading>
        </Section>
        
        {/* Content */}
        <Section style={content}>
          <Text style={greeting}>Hello {name},</Text>
          <Text style={text}>
            We were unable to process your purchase. Here's what happened:
          </Text>
          
          <Section style={errorBox}>
            <Heading style={errorTitle}>Error Details</Heading>
            <Row style={detailRow}>
              <Column style={detailLabel}>Product:</Column>
              <Column style={detailValue}>{productName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Amount:</Column>
              <Column style={detailValue}>{amount}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Reason:</Column>
              <Column style={detailValue}>{failureReason}</Column>
            </Row>
          </Section>
          
          <Text style={text}>
            Please try again with a different payment method or contact your bank.
          </Text>
          
          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL}/marketplace`}
            style={{
              ...button,
              backgroundColor: primaryColor,
            }}
          >
            Return to Marketplace
          </Button>
        </Section>
        
        {/* Divider */}
        <Hr style={hr} />
        
        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            This is an automated message, please do not reply.
          </Text>
          <Text style={footerText}>
            © {new Date().getFullYear()} {houseName}. All rights reserved.
          </Text>
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
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
}

const header = {
  padding: '48px 24px',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const content = {
  padding: '32px 24px',
}

const greeting = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 16px',
}

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const errorBox = {
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #fecaca',
}

const errorTitle = {
  color: '#991b1b',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
  padding: '0',
}

const detailRow = {
  marginBottom: '12px',
}

const detailLabel = {
  color: '#991b1b',
  fontSize: '14px',
  width: '100px',
}

const detailValue = {
  color: '#7f1d1d',
  fontSize: '14px',
  fontWeight: '500',
}

const button = {
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px 0 0',
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
  margin: '0 0 8px',
  textAlign: 'center' as const,
}