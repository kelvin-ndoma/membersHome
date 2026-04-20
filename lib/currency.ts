// lib/currency.ts
export const currencies = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD', decimals: 2 },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', code: 'KES', decimals: 0 },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP', decimals: 2 },
}

export function formatCurrency(amount: number, currency: string): string {
  const config = currencies[currency as keyof typeof currencies]
  
  if (!config) {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  if (currency === 'KES') {
    // Kenyan Shilling typically doesn't show decimals
    return `${config.symbol} ${amount.toLocaleString()}`
  }
  
  return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getCurrencySymbol(currency: string): string {
  return currencies[currency as keyof typeof currencies]?.symbol || currency
}

export function getCurrencyDecimals(currency: string): number {
  return currencies[currency as keyof typeof currencies]?.decimals || 2
}