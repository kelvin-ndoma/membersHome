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

interface WelcomeEmailProps {
  name: string
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to MembersHome!</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section className="text-center">
              <Heading className="text-2xl font-bold text-gray-900">
                Welcome to MembersHome!
              </Heading>
              <Text className="mt-4 text-gray-600">
                Hi {name || "there"}, we're excited to have you on board!
              </Text>
              <Text className="mt-2 text-gray-600">
                MembersHome helps you manage organizations, houses, events, and tickets all in one place.
              </Text>
              <Button
                href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
              >
                Get Started
              </Button>
            </Section>
            <Hr className="my-6" />
            <Text className="text-xs text-gray-400 text-center">
              Need help? Contact us at support@membershome.com
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}