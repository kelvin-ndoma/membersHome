import { Section, Heading, Text, Button } from "@react-email/components"
import { BaseEmail } from "./base"

interface PaymentReceiptEmailProps {
  name: string
  amount: number
  currency: string
  paymentDate: string
  description: string
  transactionId: string
  receiptUrl: string
}

export function PaymentReceiptEmail({ name, amount, currency, paymentDate, description, transactionId, receiptUrl }: PaymentReceiptEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
  
  return (
    <BaseEmail previewText={`Payment receipt for ${formattedAmount}`} title="Payment Receipt">
      <Heading className="text-xl font-semibold text-gray-900 m-0 mb-4">
        Payment Confirmation
      </Heading>
      
      <Text className="text-gray-600">Hello {name},</Text>
      
      <Text className="text-gray-600">
        Thank you for your payment. Your transaction has been completed successfully.
      </Text>
      
      <Section className="bg-gray-100 p-4 rounded my-6">
        <Text className="text-gray-600 m-1"><strong>Amount:</strong> {formattedAmount}</Text>
        <Text className="text-gray-600 m-1"><strong>Date:</strong> {paymentDate}</Text>
        <Text className="text-gray-600 m-1"><strong>Description:</strong> {description}</Text>
        <Text className="text-gray-600 m-1"><strong>Transaction ID:</strong> {transactionId}</Text>
      </Section>
      
      <Section className="text-center my-8">
        <Button href={receiptUrl} className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium no-underline">
          View Receipt
        </Button>
      </Section>
      
      <Text className="text-gray-500 text-sm">
        Save this email for your records.
      </Text>
    </BaseEmail>
  )
}