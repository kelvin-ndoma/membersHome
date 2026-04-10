// lib/email/templates/placeholder.tsx
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

interface PlaceholderProps {
  name?: string
  title?: string
  message?: string
  buttonText?: string
  buttonUrl?: string
}

export const PlaceholderEmail = ({ 
  name = 'there', 
  title = 'Notification',
  message = 'This is a notification from MembersHome.',
  buttonText,
  buttonUrl
}: PlaceholderProps) => (
  <Html>
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{title}</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>{message}</Text>
        {buttonText && buttonUrl && (
          <Section style={buttonContainer}>
            <Button style={button} href={buttonUrl}>
              {buttonText}
            </Button>
          </Section>
        )}
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
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3B82F6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}