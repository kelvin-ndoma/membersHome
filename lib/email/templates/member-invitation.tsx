import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface MemberInvitationEmailProps {
  organizationName: string
  houseName: string
  inviterName?: string
  acceptLink: string
}

export function MemberInvitationEmail({ organizationName, houseName, inviterName, acceptLink }: MemberInvitationEmailProps) {
  return (
    <BaseEmail previewText={`You're invited to join ${organizationName}`} title="Member Invitation">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Join {organizationName}
      </Heading>
      
      <Text className="text-gray-600">
        {inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join <strong>{houseName}</strong> at <strong>{organizationName}</strong>.
      </Text>
      
      <Text className="text-gray-600">
        Once you accept, you'll be able to:
      </Text>
      
      <ul className="text-gray-600">
        <li>Access the member portal</li>
        <li>Register for events</li>
        <li>Connect with other members</li>
        <li>Manage your profile and billing</li>
      </ul>
      
      <Section className="text-center my-8">
        <Button href={acceptLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Accept Invitation
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        This invitation will expire in 7 days.
      </Text>
      
      <Text className="text-gray-500 text-sm">
        If you weren't expecting this invitation, you can safely ignore this email.
      </Text>
    </BaseEmail>
  )
}