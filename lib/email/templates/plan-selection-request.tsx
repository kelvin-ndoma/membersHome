// lib/email/templates/plan-selection-request.tsx
import { Html, Body, Container, Heading, Text, Section, Button } from "@react-email/components"

interface PlanSelectionRequestEmailProps {
  name: string
  houseName: string
  selectPlanUrl: string
}

export function PlanSelectionRequestEmail({ name, houseName, selectPlanUrl }: PlanSelectionRequestEmailProps) {
  return (
    <Html>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Select Your Membership Plan</Heading>
          
          <Text style={text}>Dear {name},</Text>
          
          <Text style={text}>
            Great news! Your application for <strong>{houseName}</strong> has been reviewed and is ready for the next step.
          </Text>
          
          <Text style={text}>
            Please click the button below to select your preferred membership plan:
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={selectPlanUrl}>
              Select Your Plan
            </Button>
          </Section>
          
          <Text style={text}>
            If the button doesn't work, copy and paste this link into your browser:
          </Text>
          
          <Text style={linkText}>{selectPlanUrl}</Text>
          
          <Text style={text}>
            This link will expire in 7 days. Once you select your plan, our team will finalize your membership.
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
}

const button = {
  backgroundColor: "#5469d4",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const linkText = {
  color: "#5469d4",
  fontSize: "14px",
  lineHeight: "24px",
  marginBottom: "16px",
  wordBreak: "break-all" as const,
}