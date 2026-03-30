import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components"

interface ResetPasswordEmailProps {
  resetUrl: string
}

export function ResetPasswordEmail({ resetUrl }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section className="text-center">
              <Heading className="text-2xl font-bold text-gray-900">
                Reset Your Password
              </Heading>
              <Text className="mt-4 text-gray-600">
                We received a request to reset your password. Click the button below to create a new password.
              </Text>
              <Button
                href={resetUrl}
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
              >
                Reset Password
              </Button>
              <Text className="mt-6 text-sm text-gray-500">
                This link will expire in 1 hour.
              </Text>
              <Text className="mt-4 text-sm text-gray-500">
                If you didn't request this, you can safely ignore this email.
              </Text>
            </Section>
            <Hr className="my-6" />
            <Text className="text-xs text-gray-400 text-center">
              For security reasons, do not share this link with anyone.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}