// lib/email/templates/membership-cancellation-admin-notification.tsx
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

interface MembershipCancellationAdminNotificationProps {
  adminName: string
  memberName: string
  memberEmail: string
  organizationName: string
  houseName: string
  reason: string
  reasonDetail: string
  effectiveDate: string
  reviewUrl: string
}

export const MembershipCancellationAdminNotificationEmail = ({
  adminName,
  memberName,
  memberEmail,
  organizationName,
  houseName,
  reason,
  reasonDetail,
  effectiveDate,
  reviewUrl,
}: MembershipCancellationAdminNotificationProps) => {
  const reasonLabels: Record<string, string> = {
    TOO_EXPENSIVE: 'Too expensive',
    NOT_USING: 'Not using the membership',
    MOVING: 'Moving/Relocating',
    HEALTH_REASONS: 'Health reasons',
    SERVICE_ISSUES: 'Service issues',
    OTHER: 'Other'
  }

  return (
    <Html>
      <Head />
      <Preview>Cancellation Request: {memberName} - {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Membership Cancellation Request</Heading>
          
          <Text style={text}>Hi {adminName},</Text>
          
          <Text style={text}>
            <strong>{memberName}</strong> ({memberEmail}) has requested to cancel their membership 
            with <strong>{organizationName} - {houseName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Member:</strong> {memberName} ({memberEmail})
            </Text>
            <Text style={infoText}>
              <strong>Reason:</strong> {reasonLabels[reason] || reason}
            </Text>
            {reasonDetail && (
              <Text style={infoText}>
                <strong>Details:</strong> {reasonDetail}
              </Text>
            )}
            <Text style={infoText}>
              <strong>Effective Date:</strong> {effectiveDate}
            </Text>
            <Text style={infoText}>
              <strong>Notice Period:</strong> 30 days (required)
            </Text>
          </Section>

          <Text style={text}>
            The member has provided the required 30-day notice. Their membership will remain active 
            and they will continue to be billed until the effective date.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={reviewUrl}>
              Review Request
            </Button>
          </Section>

          <Text style={text}>
            You can approve or deny this request from the admin dashboard.
          </Text>

          <Section style={divider} />

          <Text style={footerText}>
            This is an automated notification from MembersHome.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

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

const infoBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fde68a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const infoText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
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
  padding: '12px 24px',
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