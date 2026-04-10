// lib/email/templates/welcome.tsx
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

interface WelcomeEmailProps {
  name: string
  verifyUrl: string
}

export const WelcomeEmail = ({ name, verifyUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to MembersHome - Verify your email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome to MembersHome!</Heading>
        <Text style={text}>Hi {name},</Text>
        <Text style={text}>
          Thank you for joining MembersHome. We're excited to have you on board.
          Please verify your email address to get started.
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={verifyUrl}>
            Verify Email Address
          </Button>
        </Section>
        <Text style={text}>
          If you didn't create an account, you can safely ignore this email.
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