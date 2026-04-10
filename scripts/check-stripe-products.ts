// scripts/sync-stripe-products.ts
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'

async function syncStripeProducts() {
  console.log('🔄 Syncing membership plans to Stripe...\n')
  
  const plans = await prisma.membershipPlan.findMany({
    include: {
      prices: true,
      organization: true,
      house: true,
    }
  })
  
  if (plans.length === 0) {
    console.log('❌ No membership plans found in database.')
    console.log('Create a membership plan first before running this script.')
    return
  }
  
  console.log(`Found ${plans.length} membership plan(s)\n`)
  
  for (const plan of plans) {
    console.log(`📦 Processing: ${plan.name} (${plan.organization.name})`)
    
    let stripeProductId = plan.stripeProductId
    
    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: `${plan.organization.name} - ${plan.name}`,
        description: plan.description || undefined,
        metadata: {
          planId: plan.id,
          organizationId: plan.organizationId,
          houseId: plan.houseId || '',
        }
      })
      stripeProductId = product.id
      
      await prisma.membershipPlan.update({
        where: { id: plan.id },
        data: { stripeProductId }
      })
      console.log(`  ✅ Created Stripe product: ${product.id}`)
    } else {
      console.log(`  ✅ Using existing Stripe product: ${stripeProductId}`)
    }
    
    const stripePriceIds: Record<string, string> = (plan.stripePriceIds as any) || {}
    
    for (const price of plan.prices) {
      if (!stripePriceIds[price.id]) {
        const stripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(price.amount * 100),
          currency: price.currency.toLowerCase(),
          recurring: {
            interval: price.billingFrequency === 'MONTHLY' ? 'month' :
                      price.billingFrequency === 'QUARTERLY' ? 'month' :
                      price.billingFrequency === 'SEMI_ANNUAL' ? 'month' : 'year',
            interval_count: price.billingFrequency === 'QUARTERLY' ? 3 :
                           price.billingFrequency === 'SEMI_ANNUAL' ? 6 : 1,
          },
          metadata: {
            priceId: price.id,
            planId: plan.id,
          }
        })
        
        stripePriceIds[price.id] = stripePrice.id
        
        await prisma.planPrice.update({
          where: { id: price.id },
          data: { stripePriceId: stripePrice.id }
        })
        
        console.log(`  ✅ Created Stripe price: ${stripePrice.id} (${price.currency} ${price.amount}/${price.billingFrequency})`)
      } else {
        console.log(`  ✅ Using existing Stripe price for ${price.billingFrequency}`)
      }
    }
    
    await prisma.membershipPlan.update({
      where: { id: plan.id },
      data: { stripePriceIds }
    })
    
    console.log('')
  }
  
  console.log('🎉 Sync complete! All membership plans are now in Stripe.')
  console.log('\n📌 Next steps:')
  console.log('   1. Members can now be charged through Stripe')
  console.log('   2. Recurring billing is set up correctly')
  console.log('   3. You can view products in Stripe Dashboard')
}

syncStripeProducts()
  .catch((error) => {
    console.error('❌ Sync failed:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })