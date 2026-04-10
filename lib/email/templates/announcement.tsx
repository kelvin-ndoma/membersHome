// lib/email/templates/announcement.tsx
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

interface AnnouncementEmailProps {
  name: string
  subject: string
  body: string
}

export const AnnouncementEmail = ({ name, subject, body }: AnnouncementEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject}</Heading>
        <Text style={text}>Hi {name},</Text>
        <Section style={content}>
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </Section>
        <Text style={footer}>
          This message was sent from MembersHome.
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

const content = {
  margin: '24px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '13px',
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #e5e7eb',
}