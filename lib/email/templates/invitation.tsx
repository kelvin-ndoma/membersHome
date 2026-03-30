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

interface InvitationEmailProps {
  organizationName: string
  inviteUrl: string
}

export function InvitationEmail({ organizationName, inviteUrl }: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section className="text-center">
              <Heading className="text-2xl font-bold text-gray-900">
                You're Invited!
              </Heading>
              <Text className="mt-4 text-gray-600">
                You've been invited to join <strong>{organizationName}</strong> on MembersHome.
              </Text>
              <Button
                href={inviteUrl}
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
              >
                Accept Invitation
              </Button>
              <Text className="mt-6 text-sm text-gray-500">
                This invitation will expire in 7 days.
              </Text>
            </Section>
            <Hr className="my-6" />
            <Text className="text-xs text-gray-400 text-center">
              If you didn't expect this invitation, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}