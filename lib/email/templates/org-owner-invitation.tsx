import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface OrgOwnerInvitationEmailProps {
  organizationName: string
  inviterName?: string
  setupLink: string
}

export function OrgOwnerInvitationEmail({ organizationName, inviterName, setupLink }: OrgOwnerInvitationEmailProps) {
  return (
    <BaseEmail previewText={`You're invited to own ${organizationName}`} title="Organization Owner Invitation">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        You've Been Invited as Organization Owner!
      </Heading>
      
      <Text className="text-gray-600">
        {inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join <strong>{organizationName}</strong> as an <strong>Organization Owner</strong>.
      </Text>
      
      <Text className="text-gray-600">
        As an organization owner, you will be able to:
      </Text>
      
      <ul className="text-gray-600">
        <li>Create and manage houses (chapters/teams)</li>
        <li>Invite members to join your organization</li>
        <li>Create events and sell tickets</li>
        <li>Set up membership plans and subscriptions</li>
        <li>Access analytics and reports</li>
      </ul>
      
      <Text className="text-gray-600">
        Click the button below to complete your account setup and set your password:
      </Text>
      
      <Section className="text-center my-8">
        <Button href={setupLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          Complete Setup
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