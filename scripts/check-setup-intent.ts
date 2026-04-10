// scripts/check-setup-intent.ts
import { stripe } from '../lib/stripe'

async function checkSetupIntent(setupIntentId: string) {
  console.log('🔍 Checking SetupIntent:', setupIntentId)
  
  try {
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
    
    console.log('\n📋 SetupIntent Details:')
    console.log('───────────────────────────────────────────')
    console.log('  ID:', setupIntent.id)
    console.log('  Status:', setupIntent.status)
    console.log('  Payment Method:', setupIntent.payment_method || '❌ NOT SET')
    console.log('  Customer:', setupIntent.customer)
    console.log('  Usage:', setupIntent.usage)
    console.log('  Created:', new Date(setupIntent.created * 1000).toLocaleString())
    
    if (setupIntent.last_setup_error) {
      console.log('\n❌ Last Setup Error:')
      console.log('  Message:', setupIntent.last_setup_error.message)
      console.log('  Code:', setupIntent.last_setup_error.code)
      console.log('  Type:', setupIntent.last_setup_error.type)
    }
    
    console.log('\n───────────────────────────────────────────')
    
    if (setupIntent.status === 'requires_payment_method') {
      console.log('⚠️  SetupIntent requires payment method - Card was never added')
      console.log('   The customer did not complete the card entry form')
    } else if (setupIntent.status === 'requires_confirmation') {
      console.log('⚠️  SetupIntent requires confirmation - Form submitted but not confirmed')
    } else if (setupIntent.status === 'requires_action') {
      console.log('⚠️  SetupIntent requires additional action (3D Secure)')
    } else if (setupIntent.status === 'processing') {
      console.log('⏳ SetupIntent is still processing')
    } else if (setupIntent.status === 'succeeded') {
      console.log('✅ SetupIntent succeeded - Payment method should be saved')
    } else if (setupIntent.status === 'canceled') {
      console.log('❌ SetupIntent was canceled')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

const setupIntentId = process.argv[2]
if (!setupIntentId) {
  console.log('Usage: npx tsx scripts/check-setup-intent.ts <setupIntentId>')
  process.exit(1)
}

checkSetupIntent(setupIntentId)