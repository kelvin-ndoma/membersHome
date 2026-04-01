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

interface AccountSetupEmailProps {
  name: string
  organizationName: string
  setupUrl: string
}

export function AccountSetupEmail({ name, organizationName, setupUrl }: AccountSetupEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Complete your {organizationName} membership setup</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section className="text-center">
              <Heading className="text-2xl font-bold text-gray-900">
                Welcome to {organizationName}!
              </Heading>
              <Text className="mt-4 text-gray-600">
                Hi {name},
              </Text>
              <Text className="text-gray-600">
                Your membership application to <strong>{organizationName}</strong> has been approved!
              </Text>
              <Text className="text-gray-600">
                Click the button below to complete your account setup and start enjoying member benefits:
              </Text>
              <Button
                href={setupUrl}
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
              >
                Complete Account Setup
              </Button>
              <Text className="mt-6 text-sm text-gray-500">
                Or copy this link to your browser:
              </Text>
              <Text className="text-sm text-blue-600 break-all">
                {setupUrl}
              </Text>
              <Text className="mt-4 text-sm text-gray-500">
                This link will expire in 7 days.
              </Text>
            </Section>
            <Hr className="my-6" />
            <Text className="text-xs text-gray-400 text-center">
              If you didn't apply for membership, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}