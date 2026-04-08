import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface MembershipRejectedEmailProps {
  name: string
  organizationName: string
  reason?: string
  contactLink: string
}

export function MembershipRejectedEmail({ name, organizationName, reason, contactLink }: MembershipRejectedEmailProps) {
  return (
    <BaseEmail previewText={`Update on your membership application to ${organizationName}`} title="Membership Application Update">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Hello {name},
      </Heading>
      
      <Text className="text-gray-600">
        Thank you for your interest in joining <strong>{organizationName}</strong>.
      </Text>
      
      <Text className="text-gray-600">
        After careful review, we regret to inform you that your membership application has not been approved at this time.
      </Text>
      
      {reason && (
        <>
          <Text className="text-gray-600 font-semibold">Reason provided:</Text>
          <Text className="text-gray-600 bg-gray-100 p-3 rounded italic">{reason}</Text>
        </>
      )}
      
      <Text className="text-gray-600">
        If you have any questions or would like to discuss this decision, please don't hesitate to reach out.
      </Text>
      
      <Section className="text-center my-8">
        <Button href={contactLink} className="bg-gray-500 text-white px-6 py-3 rounded-md font-medium no-underline">
          Contact Support
        </Button>
      </Section>
    </BaseEmail>
  )
}