// scripts/import-out-of-town-members.ts
import { PrismaClient, BillingFrequency } from '@prisma/client'
import crypto from 'crypto'
import fs from 'fs'
import readline from 'readline'

const prisma = new PrismaClient()

interface ImportMember {
  membershipId: string
  status: string
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  membershipType: string
  joined: string
  plan: string
  nextBilling: string
}

async function importOutOfTownMembers(orgSlug: string, houseSlug: string, csvPath: string) {
  console.log('🚀 Importing Out of Town members...\n')
  
  const house = await prisma.house.findFirst({
    where: {
      slug: houseSlug,
      organization: { slug: orgSlug }
    },
    include: { organization: true }
  })
  
  if (!house) {
    console.error('❌ House not found')
    return
  }
  
  console.log(`✅ Found: ${house.organization.name} / ${house.name}\n`)
  
  // Find the Out of Town Membership plan (you said it's already created)
  const plan = await prisma.membershipPlan.findFirst({
    where: {
      name: { contains: 'Out of Town', mode: 'insensitive' },
      houseId: house.id
    },
    include: { prices: true }
  })
  
  if (!plan) {
    console.error('❌ Out of Town Membership plan not found!')
    console.log('   Please create the plan first or check the name.')
    return
  }
  
  console.log(`✅ Found plan: ${plan.name}\n`)
  
  // Ensure prices exist with correct amounts
  const monthlyPrice = plan.prices.find(p => p.billingFrequency === 'MONTHLY')
  const annualPrice = plan.prices.find(p => p.billingFrequency === 'ANNUAL')
  
  // Monthly: $175 + 3% = $180.25 (not 180.08 - let me recalculate)
  // Actually: $175 * 1.03 = $180.25
  const monthlyAmount = 180.25
  
  // Annual: $2,100 + 3% = $2,163.00
  const annualAmount = 2163.00
  
  if (!monthlyPrice) {
    await prisma.planPrice.create({
      data: {
        membershipPlanId: plan.id,
        billingFrequency: 'MONTHLY',
        amount: monthlyAmount,
        currency: 'USD',
      }
    })
    console.log(`✅ Added Monthly price: $${monthlyAmount}\n`)
  } else if (monthlyPrice.amount !== monthlyAmount) {
    await prisma.planPrice.update({
      where: { id: monthlyPrice.id },
      data: { amount: monthlyAmount }
    })
    console.log(`✅ Updated Monthly price to: $${monthlyAmount}\n`)
  }
  
  if (!annualPrice) {
    await prisma.planPrice.create({
      data: {
        membershipPlanId: plan.id,
        billingFrequency: 'ANNUAL',
        amount: annualAmount,
        currency: 'USD',
      }
    })
    console.log(`✅ Added Annual price: $${annualAmount}\n`)
  } else if (annualPrice.amount !== annualAmount) {
    await prisma.planPrice.update({
      where: { id: annualPrice.id },
      data: { amount: annualAmount }
    })
    console.log(`✅ Updated Annual price to: $${annualAmount}\n`)
  }
  
  // Refresh plan with prices
  const updatedPlan = await prisma.membershipPlan.findUnique({
    where: { id: plan.id },
    include: { prices: true }
  })
  
  const finalMonthlyPrice = updatedPlan!.prices.find(p => p.billingFrequency === 'MONTHLY')
  const finalAnnualPrice = updatedPlan!.prices.find(p => p.billingFrequency === 'ANNUAL')
  
  if (!finalMonthlyPrice || !finalAnnualPrice) {
    console.error('❌ Missing price options')
    return
  }
  
  // Parse CSV
  const members = await parseCSVWithReadline(csvPath)
  console.log(`📄 Found ${members.length} members in CSV\n`)
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  }
  
  for (const member of members) {
    try {
      console.log(`📋 ${member.firstName} ${member.lastName} | ${member.email} | ${member.membershipId}`)
      
      if (!member.email || member.email.trim() === '') {
        results.failed++
        console.log(`   ❌ Missing email`)
        continue
      }
      
      // Check if already imported
      const existingMember = await prisma.houseMembership.findFirst({
        where: {
          membershipNumber: member.membershipId,
          houseId: house.id
        }
      })
      
      // Determine billing frequency from plan column
      const planLower = member.plan?.toLowerCase() || ''
      const isAnnual = planLower.includes('annually') || 
                       planLower.includes('annual') ||
                       planLower.includes('$2,100') ||
                       planLower.includes('2100')
      const billingFrequency: BillingFrequency = isAnnual ? 'ANNUAL' : 'MONTHLY'
      
      // CORRECT AMOUNTS with 3% service fee
      const amount = isAnnual ? annualAmount : monthlyAmount
      const baseAmount = isAnnual ? 2100.00 : 175.00
      const serviceFee = isAnnual ? 63.00 : 5.25
      const priceId = isAnnual ? finalAnnualPrice.id : finalMonthlyPrice.id
      
      console.log(`   📊 Detected: ${billingFrequency} - Amount: $${amount}`)
      
      if (existingMember) {
        // Update existing member's plan
        console.log(`   🔄 Updating existing member`)
        
        const membershipItem = await prisma.membershipItem.findFirst({
          where: {
            houseMembershipId: existingMember.id,
            status: 'ACTIVE'
          }
        })
        
        if (membershipItem) {
          await prisma.membershipItem.update({
            where: { id: membershipItem.id },
            data: {
              amount: amount,
              billingFrequency: billingFrequency,
              planPriceId: priceId,
              vatRate: 3.0,
              metadata: {
                ...(membershipItem.metadata as any || {}),
                basePrice: baseAmount,
                serviceFee: serviceFee,
                serviceFeeRate: 3.0,
                updatedAt: new Date().toISOString(),
              }
            } as any
          })
          console.log(`   ✅ Updated to ${billingFrequency} at $${amount}`)
        }
        
        results.success++
        continue
      }
      
      // Clean phone number
      const cleanPhone = member.mobileNumber.replace(/[^\d]/g, '')
      
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email: member.email.toLowerCase().trim() }
      })
      
      const acceptanceToken = crypto.randomBytes(32).toString('hex')
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: member.email.toLowerCase().trim(),
            name: `${member.firstName} ${member.lastName}`.trim(),
            phone: cleanPhone || null,
          }
        })
        console.log(`   ✅ Created user`)
      } else {
        console.log(`   ✅ Found existing user`)
      }
      
      // Create organization membership
      let membership = await prisma.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: house.organizationId
        }
      })
      
      if (!membership) {
        membership = await prisma.membership.create({
          data: {
            userId: user.id,
            organizationId: house.organizationId,
            role: 'MEMBER',
            status: 'ACTIVE',
          }
        })
      }
      
      const joinDate = parseDate(member.joined)
      const nextBillingDate = parseDate(member.nextBilling)
      
      // Create house membership
      const houseMembership = await prisma.houseMembership.create({
        data: {
          houseId: house.id,
          membershipId: membership.id,
          role: 'HOUSE_MEMBER',
          status: 'ACTIVE',
          membershipNumber: member.membershipId,
          joinedAt: joinDate,
          acceptanceToken: acceptanceToken,
          acceptanceTokenSentAt: new Date(),
        }
      })
      
      // Create membership item with correct amount
      await prisma.membershipItem.create({
        data: {
          organizationId: house.organizationId,
          houseId: house.id,
          houseMembershipId: houseMembership.id,
          membershipPlanId: plan.id,
          planPriceId: priceId,
          userId: user.id,
          status: 'ACTIVE',
          billingFrequency: billingFrequency,
          amount: amount,
          currency: 'USD',
          startDate: joinDate,
          nextBillingDate: nextBillingDate,
          initiationFeePaid: 250, // Already paid
          vatRate: 3.0,
          metadata: {
            importedFrom: 'CSV',
            importedAt: new Date().toISOString(),
            membershipType: 'Out of Town',
            basePrice: baseAmount,
            serviceFee: serviceFee,
            serviceFeeRate: 3.0,
            initiationFeeStatus: 'paid',
          }
        } as any
      })
      
      // Create member profile
      await prisma.memberProfile.upsert({
        where: { houseMembershipId: houseMembership.id },
        update: { phone: cleanPhone },
        create: {
          houseMembershipId: houseMembership.id,
          userId: user.id,
          houseId: house.id,
          phone: cleanPhone,
        }
      })
      
      // Create member dashboard
      await prisma.memberDashboard.upsert({
        where: { houseMembershipId: houseMembership.id },
        update: {},
        create: {
          houseMembershipId: houseMembership.id,
          userId: user.id,
          houseId: house.id,
        }
      })
      
      results.success++
      console.log(`   ✅ Imported: ${billingFrequency} at $${amount}`)
      
    } catch (error) {
      results.failed++
      const errorMsg = error instanceof Error ? error.message : String(error)
      results.errors.push(`${member.email}: ${errorMsg}`)
      console.error(`   ❌ Failed:`, errorMsg)
    }
  }
  
  console.log('\n📊 Import Results:')
  console.log(`   ✅ Success: ${results.success}`)
  console.log(`   ❌ Failed: ${results.failed}`)
  console.log('\n📧 Tokens created but NO emails were sent.')
  console.log('\n💰 Pricing Summary:')
  console.log(`   Monthly: $175 + 3% service fee = $${monthlyAmount}/month`)
  console.log(`   Annual: $2,100 + 3% service fee = $${annualAmount}/year`)
  console.log('   Initiation Fee: $250 (already paid for all members)')
  
  return results
}

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  
  // Try parsing directly
  const parsed = new Date(dateStr)
  if (!isNaN(parsed.getTime())) return parsed
  
  // Try MM/DD/YYYY
  const parts = dateStr.split(' ')[0].split('/')
  if (parts.length === 3) {
    const month = parseInt(parts[0]) - 1
    const day = parseInt(parts[1])
    const year = parseInt(parts[2])
    return new Date(year, month, day)
  }
  
  return new Date()
}

async function parseCSVWithReadline(filePath: string): Promise<ImportMember[]> {
  return new Promise((resolve, reject) => {
    const members: ImportMember[] = []
    let headers: string[] = []
    let isFirstLine = true
    
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    })
    
    rl.on('line', (line) => {
      if (!line.trim()) return
      
      const values = parseCSVLine(line)
      
      if (isFirstLine) {
        headers = values.map(h => h.replace(/^\uFEFF/, '').trim())
        console.log('📋 Headers found:', headers)
        isFirstLine = false
        return
      }
      
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      const email = row['Email'] || row['email'] || row['E-mail'] || ''
      const firstName = row['First Name'] || row['first_name'] || ''
      const lastName = row['Last Name'] || row['last_name'] || ''
      const membershipId = row['Membership Id'] || row['Membership ID'] || row['membership_id'] || ''
      
      members.push({
        membershipId: membershipId.trim(),
        status: (row['Status'] || 'active').toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mobileNumber: (row['Mobile Number'] || row['mobile_number'] || row['Phone Number'] || '').trim(),
        membershipType: (row['Membership Type'] || 'Out of Town').trim(),
        joined: (row['Joine'] || row['Joined'] || row['joined'] || '').trim(),
        plan: (row['Plan'] || row['plan'] || '').trim(),
        nextBilling: (row['Next billing'] || row['next_billing'] || '').trim(),
      })
    })
    
    rl.on('close', () => resolve(members))
    rl.on('error', reject)
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === '\t' && !inQuotes) {
      result.push(current)
      current = ''
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

// Run the import
importOutOfTownMembers('the-burns-brothers', 'main', './out-of-town.csv')
  .catch(console.error)
  .finally(() => prisma.$disconnect())