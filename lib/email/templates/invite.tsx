import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface InviteEmailProps {
  name: string
  organizationName: string
  inviterName?: string
  acceptLink: string
}

export function InviteEmail({ name, organizationName, inviterName, acceptLink }: InviteEmailProps) {
  return (
    <BaseEmail previewText={`You're invited to join ${organizationName} on membersHome`} title="You're Invited!">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        You're Invited, {name}!
      </Heading>
      
      <Text className="text-gray-600">
        {inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join <strong>{organizationName}</strong> on membersHome.
      </Text>
      
      <Text className="text-gray-600">
        membersHome helps organizations like {organizationName} manage members, events, and communications in one place.
      </Text>
      
      <Section className="text-center my-8">
        <Button href={acceptLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Accept Invitation
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        Or copy and paste this link into your browser: {acceptLink}
      </Text>
      
      <Text className="text-gray-500 text-sm">
        This invitation will expire in 7 days.
      </Text>
      
      <Text className="text-gray-500 text-sm mt-8">
        If you weren't expecting this invitation, you can safely ignore this email.
      </Text>
    </BaseEmail>
  )
}