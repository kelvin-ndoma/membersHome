// lib/email/templates/purchase-confirmation.tsx
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
  Link,
  Hr,
} from '@react-email/components'

interface PurchaseConfirmationEmailProps {
  name: string
  productName: string
  quantity: number
  totalAmount: number
  isDigital: boolean
  downloadToken?: string
  houseName?: string
  primaryColor?: string
  secondaryColor?: string
}

export const PurchaseConfirmationEmail = ({
  name,
  productName,
  quantity,
  totalAmount,
  isDigital,
  downloadToken,
  houseName = 'Your Community',
  primaryColor = '#8B5CF6',
  secondaryColor = '#6366F1',
}: PurchaseConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Purchase Confirmation - {productName}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header */}
        <Section style={{
          ...header,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}>
          <Heading style={headerTitle}>Thank You for Your Purchase!</Heading>
        </Section>
        
        {/* Content */}
        <Section style={content}>
          <Text style={greeting}>Hello {name},</Text>
          <Text style={text}>
            Your purchase has been confirmed. Here are your order details:
          </Text>
          
          <Section style={detailsBox}>
            <Heading style={detailsTitle}>Order Details</Heading>
            <Row style={detailRow}>
              <Column style={detailLabel}>Product:</Column>
              <Column style={detailValue}>{productName}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Quantity:</Column>
              <Column style={detailValue}>{quantity}</Column>
            </Row>
            <Row style={detailRow}>
              <Column style={detailLabel}>Total Amount:</Column>
              <Column style={detailValue}>${totalAmount.toFixed(2)}</Column>
            </Row>
            {isDigital && downloadToken && (
              <Row style={detailRow}>
                <Column style={detailLabel}>Download:</Column>
                <Column style={detailValue}>
                  <Link href={`${process.env.NEXT_PUBLIC_APP_URL}/api/download/${downloadToken}`} style={downloadLink}>
                    Click here to download
                  </Link>
                </Column>
              </Row>
            )}
          </Section>
          
          <Text style={text}>
            You can view your purchase history in your account dashboard.
          </Text>
          
          <Text style={text}>
            Thank you for shopping with us!
          </Text>
          
          <Button
            href={`${process.env.NEXT_PUBLIC_APP_URL}/marketplace`}
            style={{
              ...button,
              backgroundColor: primaryColor,
            }}
          >
            Continue Shopping
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

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #e5e7eb',
}

const detailsTitle = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 16px',
  padding: '0',
}

const detailRow = {
  marginBottom: '12px',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  width: '120px',
}

const detailValue = {
  color: '#1a1a1a',
  fontSize: '14px',
  fontWeight: '500',
}

const downloadLink = {
  color: '#8B5CF6',
  textDecoration: 'underline',
}

const button = {
  backgroundColor: '#8B5CF6',
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