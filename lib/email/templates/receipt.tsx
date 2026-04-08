import { BaseEmail } from './base'

interface InvoiceEmailProps {
  name: string
  amount: number
  currency: string
  dueDate: string
  invoiceNumber: string
  items: Array<{ description: string; amount: number }>
  invoiceLink: string
}

export const InvoiceEmail = ({ 
  name, 
  amount, 
  currency, 
  dueDate, 
  invoiceNumber,
  items,
  invoiceLink 
}: InvoiceEmailProps) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
  
  return (
    <BaseEmail previewText={`Invoice ${invoiceNumber} - ${formattedAmount} due by ${dueDate}`} title="New Invoice">
      <h2 style={{ marginTop: 0, color: '#1f2937' }}>
        New Invoice Ready
      </h2>
      
      <p>Hello {name},</p>
      
      <p>You have a new invoice <strong>#{invoiceNumber}</strong> for <strong>{formattedAmount}</strong> due by <strong>{dueDate}</strong>.</p>
      
      <div style={{ 
        backgroundColor: '#e5e7eb', 
        padding: '15px', 
        borderRadius: '6px',
        margin: '20px 0'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #9ca3af' }}>
              <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} style={{ borderBottom: index === items.length - 1 ? 'none' : '1px solid #d1d5db' }}>
                <td style={{ padding: '8px' }}>{item.description}</td>
                <td style={{ textAlign: 'right', padding: '8px' }}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency.toUpperCase()
                  }).format(item.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: '2px solid #9ca3af', fontWeight: 'bold' }}>
              <td style={{ padding: '8px' }}>Total</td>
              <td style={{ textAlign: 'right', padding: '8px' }}>{formattedAmount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={invoiceLink} 
          style={{ 
            backgroundColor: '#2563eb', 
            color: 'white', 
            padding: '12px 24px', 
            textDecoration: 'none', 
            borderRadius: '6px', 
            display: 'inline-block' 
          }}
        >
          View & Pay Invoice
        </a>
      </div>
      
      <p style={{ fontSize: '14px', color: '#6b7280' }}>
        Please ensure payment is made by the due date to avoid any service interruption.
      </p>
    </BaseEmail>
  )
}