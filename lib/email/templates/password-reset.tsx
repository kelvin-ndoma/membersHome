import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface PasswordResetEmailProps {
  resetLink: string
  name?: string
}

export function PasswordResetEmail({ resetLink, name }: PasswordResetEmailProps) {
  return (
    <BaseEmail previewText="Reset your password" title="Reset your password">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Reset your password
      </Heading>
      
      {name && <Text className="text-gray-600">Hello {name},</Text>}
      
      <Text className="text-gray-600">
        We received a request to reset your password. Click the button below to create a new password:
      </Text>
      
      <Section className="text-center my-8">
        <Button href={resetLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Reset Password
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        Or copy and paste this link into your browser: {resetLink}
      </Text>
      
      <Text className="text-gray-500 text-sm">
        This link will expire in 1 hour.
      </Text>
      
      <Text className="text-gray-500 text-sm mt-8">
        If you didn't request this, you can safely ignore this email.
      </Text>
    </BaseEmail>
  )
}