import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface CancellationConfirmationEmailProps {
  name: string
  organizationName: string
  effectiveDate: string
  reason: string
  reactivateLink: string
}

export function CancellationConfirmationEmail({ name, organizationName, effectiveDate, reason, reactivateLink }: CancellationConfirmationEmailProps) {
  return (
    <BaseEmail previewText={`Your membership to ${organizationName} has been cancelled`} title="Membership Cancelled">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Membership Cancellation Confirmed
      </Heading>
      
      <Text className="text-gray-600">Hello {name},</Text>
      
      <Text className="text-gray-600">
        Your membership to <strong>{organizationName}</strong> has been cancelled and will end on <strong>{effectiveDate}</strong>.
      </Text>
      
      <Text className="text-gray-600">
        <strong>Reason for cancellation:</strong> {reason}
      </Text>
      
      <Text className="text-gray-600">
        We're sad to see you go! If this was a mistake or you'd like to reactivate your membership, you can do so at any time.
      </Text>
      
      <Section className="text-center my-8">
        <Button href={reactivateLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Reactivate Membership
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        Thank you for being a part of our community. We hope to see you again soon!
      </Text>
    </BaseEmail>
  )
}