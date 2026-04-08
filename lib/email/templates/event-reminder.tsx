import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface EventReminderEmailProps {
  name: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  daysUntil: number
  ticketLink?: string
}

export function EventReminderEmail({ name, eventName, eventDate, eventTime, eventLocation, daysUntil, ticketLink }: EventReminderEmailProps) {
  const reminderText = daysUntil === 0 ? "today" : `in ${daysUntil} days`
  
  return (
    <BaseEmail previewText={`Reminder: ${eventName} is ${reminderText}`} title="Event Reminder">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Event Reminder: {eventName}
      </Heading>
      
      <Text className="text-gray-600">Hello {name},</Text>
      
      <Text className="text-gray-600">
        This is a reminder that <strong>{eventName}</strong> is happening {reminderText}!
      </Text>
      
      <Section className="bg-gray-100 p-4 rounded my-6">
        <Text className="text-gray-600 m-1"><strong>📅 Date:</strong> {eventDate}</Text>
        <Text className="text-gray-600 m-1"><strong>⏰ Time:</strong> {eventTime}</Text>
        <Text className="text-gray-600 m-1"><strong>📍 Location:</strong> {eventLocation}</Text>
      </Section>
      
      {ticketLink && (
        <Section className="text-center my-8">
          <Button href={ticketLink} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
            View Your Tickets
          </Button>
        </Section>
      )}
      
      <Text className="text-gray-500 text-sm">
        We look forward to seeing you there!
      </Text>
    </BaseEmail>
  )
}