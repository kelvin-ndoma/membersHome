// app/api/download/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Find purchase by download token
    const purchase = await prisma.communityPurchase.findFirst({
      where: {
        downloadToken: token,
        downloadExpires: {
          gt: new Date()
        },
        status: 'COMPLETED'
      },
      include: {
        product: {
          select: {
            fileUrl: true,
            name: true
          }
        }
      }
    })

    if (!purchase || !purchase.product.fileUrl) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 404 }
      )
    }

    // Update download count
    await prisma.communityPurchase.update({
      where: { id: purchase.id },
      data: { downloadCount: { increment: 1 } }
    })

    // Redirect to the file URL or serve the file
    return NextResponse.redirect(purchase.product.fileUrl)
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}