import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface MembershipApprovedEmailProps {
  name: string
  organizationName: string
  houseName: string
  portalLink: string
}

export function MembershipApprovedEmail({ name, organizationName, houseName, portalLink }: MembershipApprovedEmailProps) {
  return (
    <BaseEmail previewText={`Your membership to ${organizationName} has been approved!`} title="Membership Approved">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Congratulations, {name}!
      </Heading>
      
      <Text className="text-gray-600">
        Your membership application to <strong>{organizationName}</strong> has been approved!
      </Text>
      
      <Text className="text-gray-600">
        You are now a member of <strong>{houseName}</strong>. You can now:
      </Text>
      
      <Text className="text-gray-600">
        • Access the member portal<br />
        • Register for events<br />
        • Connect with other members<br />
        • Manage your profile and billing
      </Text>
      
      <Section className="text-center my-8">
        <Button href={portalLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Go to Portal
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        We're excited to have you as part of our community!
      </Text>
    </BaseEmail>
  )
}