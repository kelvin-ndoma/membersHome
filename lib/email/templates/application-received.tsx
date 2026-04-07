// lib/email/templates/application-received.tsx
import { Html, Body, Container, Heading, Text, Section } from "@react-email/components"

interface ApplicationReceivedEmailProps {
  name: string
  houseName: string
  applicationId: string
}

export function ApplicationReceivedEmail({ name, houseName, applicationId }: ApplicationReceivedEmailProps) {
  const applicationRef = applicationId.slice(-8).toUpperCase()
  
  return (
    <Html>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Received</Heading>
          
          <Text style={text}>Dear {name},</Text>
          
          <Text style={text}>
            Thank you for applying to join <strong>{houseName}</strong>. 
            We have received your application and our team will review it shortly.
          </Text>
          
          <Section style={infoBox}>
            <Text style={infoText}>
              Your application reference number is: <strong>{applicationRef}</strong>
            </Text>
          </Section>
          
          <Text style={text}>
            What happens next?
          </Text>
          
          <Text style={text}>
            1. Our team will review your application within 2-3 business days
          </Text>
          <Text style={text}>
            2. You will receive an email to select your membership plan
          </Text>
          <Text style={text}>
            3. Once you select a plan, we will finalize your membership
          </Text>
          
          <Text style={text}>
            If you have any questions, please don't hesitate to contact us.
          </Text>
          
          <Text style={text}>
            Best regards,
          </Text>
          
          <Text style={text}>
            The {houseName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "560px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  textAlign: "center" as const,
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  marginBottom: "16px",
}

const infoBox = {
  backgroundColor: "#f0f4f8",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  textAlign: "center" as const,
}

const infoText = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
}