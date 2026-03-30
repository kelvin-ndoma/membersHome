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
  Row,
  Column,
} from "@react-email/components"

interface TicketPurchaseEmailProps {
  ticketName: string
  quantity: number
  totalAmount: number
  ticketCodes: string[]
  eventName?: string
  eventDate?: Date
  ticketUrl?: string
}

export function TicketPurchaseEmail({
  ticketName,
  quantity,
  totalAmount,
  ticketCodes,
  eventName,
  eventDate,
  ticketUrl,
}: TicketPurchaseEmailProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalAmount)

  const formattedDate = eventDate
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(eventDate)
    : null

  return (
    <Html>
      <Head />
      <Preview>Your {ticketName} ticket{quantity > 1 ? "s" : ""} are ready!</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section className="text-center">
              <Heading className="text-2xl font-bold text-gray-900">
                Ticket{quantity > 1 ? "s" : ""} Confirmed!
              </Heading>
              <Text className="mt-4 text-gray-600">
                Thank you for your purchase. Your {ticketName} ticket{quantity > 1 ? "s" : ""} are ready.
              </Text>
            </Section>

            {eventName && (
              <Section className="mt-6 rounded-md bg-gray-50 p-4">
                <Text className="font-semibold text-gray-900">Event Details:</Text>
                <Text className="text-gray-600">{eventName}</Text>
                {formattedDate && <Text className="text-gray-600">{formattedDate}</Text>}
              </Section>
            )}

            <Section className="mt-6">
              <Heading className="text-lg font-semibold text-gray-900">
                Order Summary
              </Heading>
              <Row className="mt-2">
                <Column className="text-gray-600">Quantity:</Column>
                <Column className="text-right text-gray-900 font-medium">{quantity}</Column>
              </Row>
              <Row className="mt-1">
                <Column className="text-gray-600">Total:</Column>
                <Column className="text-right text-gray-900 font-medium">{formattedAmount}</Column>
              </Row>
            </Section>

            <Section className="mt-6">
              <Heading className="text-lg font-semibold text-gray-900">
                Ticket{quantity > 1 ? "s" : ""} Code{quantity > 1 ? "s" : ""}
              </Heading>
              {ticketCodes.map((code, index) => (
                <Text key={index} className="mt-1 font-mono text-sm text-gray-700">
                  {code}
                </Text>
              ))}
            </Section>

            {ticketUrl && (
              <Section className="mt-6 text-center">
                <Button
                  href={ticketUrl}
                  className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
                >
                  View Your Tickets
                </Button>
              </Section>
            )}

            <Text className="mt-6 text-sm text-gray-500 text-center">
              Please present your ticket code at the entrance for validation.
            </Text>

            <Hr className="my-6" />
            <Text className="text-xs text-gray-400 text-center">
              Need help? Contact support at support@membershome.com
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}