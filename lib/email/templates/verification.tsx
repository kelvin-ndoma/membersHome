import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface VerificationEmailProps {
  verificationLink: string
  name?: string
}

export function VerificationEmail({ verificationLink, name }: VerificationEmailProps) {
  return (
    <BaseEmail previewText="Verify your email address" title="Verify your email">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Verify your email address
      </Heading>
      
      {name && <Text className="text-gray-600">Hello {name},</Text>}
      
      <Text className="text-gray-600">
        Thank you for signing up for <strong>membersHome</strong>! Please click the button below to verify your email address:
      </Text>
      
      <Section className="text-center my-8">
        <Button href={verificationLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Verify Email
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        Or copy and paste this link into your browser: {verificationLink}
      </Text>
      
      <Text className="text-gray-500 text-sm">
        This link will expire in 24 hours.
      </Text>
      
      <Text className="text-gray-500 text-sm mt-8">
        If you didn't create an account with membersHome, you can safely ignore this email.
      </Text>
    </BaseEmail>
  )
}