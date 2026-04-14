// app/api/portal/[houseSlug]/tickets/[ticketId]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string; ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug, ticketId } = await Promise.resolve(params)

    // Find the house through user's memberships
    const userMemberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        status: 'ACTIVE'
      },
      include: {
        organization: {
          select: { primaryColor: true, name: true, logoUrl: true }
        },
        houseMemberships: {
          where: {
            status: 'ACTIVE',
            house: { slug: houseSlug }
          },
          include: { 
            house: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    })

    let targetHouse = null
    let memberAccess = null
    let primaryColor = '#8B5CF6'
    let organizationName = ''

    for (const membership of userMemberships) {
      const hm = membership.houseMemberships[0]
      if (hm) {
        targetHouse = hm.house
        memberAccess = hm
        primaryColor = membership.organization?.primaryColor || '#8B5CF6'
        organizationName = membership.organization?.name || ''
        break
      }
    }

    if (!targetHouse) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const purchase = await prisma.ticketPurchase.findFirst({
      where: {
        id: ticketId,
        OR: [
          { userId: session.user.id },
          { houseMembershipId: memberAccess?.id }
        ]
      },
      include: {
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                address: true,
                imageUrl: true,
                type: true,
              }
            }
          }
        }
      }
    })

    if (!purchase) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = purchase.ticket
    const event = ticket.event
    const ticketCodes = purchase.ticketCodes as string[]
    
    // Format ticket type for display
    const ticketTypeDisplay: Record<string, { label: string; icon: string; color: string }> = {
      GENERAL_ADMISSION: { label: 'General Admission', icon: '🎟️', color: '#3B82F6' },
      VIP: { label: 'VIP', icon: '👑', color: '#F59E0B' },
      EARLY_BIRD: { label: 'Early Bird', icon: '🐦', color: '#10B981' },
      GROUP: { label: 'Group Ticket', icon: '👥', color: '#8B5CF6' },
      SEASON_PASS: { label: 'Season Pass', icon: '🌟', color: '#EC4899' },
      WORKSHOP: { label: 'Workshop', icon: '🛠️', color: '#06B6D4' },
      COURSE: { label: 'Course', icon: '📚', color: '#14B8A6' },
      DONATION: { label: 'Donation', icon: '❤️', color: '#EF4444' },
      CUSTOM: { label: 'Special Ticket', icon: '✨', color: '#6366F1' },
    }
    
    const ticketTypeInfo = ticketTypeDisplay[ticket.type] || { 
      label: ticket.type.replace('_', ' '), 
      icon: '🎫', 
      color: primaryColor 
    }
    
    // Generate QR codes
    const qrCodes = await Promise.all(
      ticketCodes.map(code => 
        QRCode.toDataURL(code, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
      )
    )

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${ticket.name} - ${ticketTypeInfo.label}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 20px; 
      background: #f5f5f5; 
    }
    .container { max-width: 550px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { color: #1a1a1a; font-size: 26px; margin-bottom: 6px; }
    .header p { color: #666; font-size: 14px; }
    .ticket {
      background: white;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    .ticket::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: ${ticketTypeInfo.color};
    }
    .ticket-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: ${ticketTypeInfo.color}15;
      border: 1px solid ${ticketTypeInfo.color}30;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 600;
      color: ${ticketTypeInfo.color};
      margin-bottom: 16px;
    }
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .ticket-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .ticket-price {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    .org-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px dashed #e5e7eb;
    }
    .org-name {
      font-size: 14px;
      color: #666;
    }
    .event-info {
      background: ${primaryColor}08;
      padding: 16px;
      border-radius: 14px;
      margin-bottom: 20px;
      border: 1px solid ${primaryColor}20;
    }
    .event-title {
      font-weight: 700;
      color: #1a1a1a;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .event-detail {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #555;
      margin-bottom: 6px;
    }
    .event-detail svg {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .qr-container {
      text-align: center;
      padding: 16px;
      background: #ffffff;
      border-radius: 12px;
      margin-bottom: 16px;
      border: 1px solid #e5e7eb;
    }
    .qr-container img { 
      max-width: 100%; 
      height: auto; 
      display: block; 
      margin: 0 auto; 
    }
    .ticket-code {
      font-family: 'Courier New', monospace;
      text-align: center;
      background: #f3f4f6;
      padding: 12px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .ticket-footer {
      text-align: center;
      font-size: 12px;
      color: #999;
      margin-top: 16px;
    }
    .purchaser-info {
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
      padding: 14px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .info-row {
      display: flex;
      margin-bottom: 6px;
    }
    .info-label {
      width: 100px;
      font-weight: 500;
      color: #888;
    }
    .info-value {
      flex: 1;
      color: #333;
    }
    .print-button {
      display: block;
      width: 100%;
      padding: 16px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: opacity 0.2s;
    }
    .print-button:hover { opacity: 0.9; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-valid { background: #d1fae5; color: #065f46; }
    .status-used { background: #fef3c7; color: #92400e; }
    .ticket-number {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
    .member-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #8B5CF6;
      color: white;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 8px;
    }
    @media print {
      body { background: white; padding: 10px; }
      .print-button { display: none; }
      .ticket { box-shadow: none; border: 2px solid #000; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${organizationName}</h1>
      <p>${targetHouse.name}</p>
    </div>
    
    <div class="purchaser-info">
      <div class="info-row">
        <span class="info-label">Purchased by</span>
        <span class="info-value">${purchase.customerName || session.user?.name || 'Guest'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${purchase.customerEmail || session.user?.email || ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Purchase Date</span>
        <span class="info-value">${new Date(purchase.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        })}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Order ID</span>
        <span class="info-value">${purchase.id.slice(-8).toUpperCase()}</span>
      </div>
    </div>
    
    ${ticketCodes.map((code, index) => {
      const isUsed = purchase.usedCount > index
      return `
        <div class="ticket">
          <div class="ticket-type-badge">
            ${ticketTypeInfo.icon} ${ticketTypeInfo.label}
            ${ticket.memberOnly ? '<span class="member-badge">Members Only</span>' : ''}
          </div>
          
          <div class="ticket-header">
            <span class="ticket-title">${ticket.name}</span>
            <span class="ticket-price">${ticket.price === 0 ? 'FREE' : `${ticket.currency} ${ticket.price.toFixed(2)}`}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <span style="font-size: 14px; color: #666;">Ticket #${index + 1} of ${purchase.quantity}</span>
            <span class="status-badge ${isUsed ? 'status-used' : 'status-valid'}">
              ${isUsed ? '✓ Used' : '✓ Valid'}
            </span>
          </div>
          
          ${event ? `
            <div class="event-info">
              <div class="event-title">${event.title}</div>
              <div class="event-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${new Date(event.startDate).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</span>
              </div>
              <div class="event-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                ${event.endDate ? ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
              </div>
              ${event.location ? `
                <div class="event-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>${event.location}</span>
                </div>
              ` : ''}
              ${event.type ? `
                <div class="event-detail">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 6v6l4 2"></path>
                  </svg>
                  <span>${event.type.replace('_', ' ')} Event</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="qr-container">
            <img src="${qrCodes[index]}" alt="QR Code" />
          </div>
          
          <div class="ticket-code">${code}</div>
          
          <div class="ticket-footer">
            Present this QR code at the event entrance for scanning
          </div>
        </div>
      `;
    }).join('')}
    
    <button class="print-button" onclick="window.print()">
      🖨️ Print All Tickets
    </button>
    
    <p style="text-align: center; font-size: 12px; color: #999; margin-top: 16px;">
      Total: ${purchase.currency} ${purchase.totalAmount.toFixed(2)} • ${purchase.quantity} ticket${purchase.quantity > 1 ? 's' : ''}
    </p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}