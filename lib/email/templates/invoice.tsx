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

interface InvoiceEmailProps {
  invoiceNumber: string
  amount: number
  dueDate: Date
  invoiceUrl: string
}

export function InvoiceEmail({ invoiceNumber, amount, dueDate, invoiceUrl }: InvoiceEmailProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(dueDate)

  return (
    <Html>
      <Head />
      <Preview>Invoice {invoiceNumber} from MembersHome</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-[600px] bg-white p-8">
            <Section>
              <Heading className="text-2xl font-bold text-gray-900">
                Invoice {invoiceNumber}
              </Heading>
              <Text className="mt-2 text-gray-600">
                Amount Due: <strong>{formattedAmount}</strong>
              </Text>
              <Text className="text-gray-600">
                Due Date: {formattedDate}
              </Text>
              <Button
                href={invoiceUrl}
                className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium"
              >
                View Invoice
              </Button>
            </Section>
            <Hr className="my-6" />
            <Text className="text-xs text-gray-400">
              Please pay by the due date to avoid late fees.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}