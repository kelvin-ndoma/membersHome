import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface AnnouncementEmailProps {
  name: string
  organizationName: string
  title: string
  message: string
  ctaLink?: string
  ctaText?: string
}

export function AnnouncementEmail({ name, organizationName, title, message, ctaLink, ctaText = "Learn More" }: AnnouncementEmailProps) {
  return (
    <BaseEmail previewText={`Announcement from ${organizationName}: ${title}`} title={title}>
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        {title}
      </Heading>
      
      <Text className="text-gray-600">Hello {name},</Text>
      
      <Text className="text-gray-600">
        <strong>{organizationName}</strong> has posted a new announcement:
      </Text>
      
      <Section className="bg-gray-100 p-4 rounded my-6 whitespace-pre-wrap">
        <Text className="text-gray-600">{message}</Text>
      </Section>
      
      {ctaLink && (
        <Section className="text-center my-8">
          <Button href={ctaLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
            {ctaText}
          </Button>
        </Section>
      )}
      
      <Text className="text-gray-500 text-sm">
        You can manage your notification preferences in your account settings.
      </Text>
    </BaseEmail>
  )
}