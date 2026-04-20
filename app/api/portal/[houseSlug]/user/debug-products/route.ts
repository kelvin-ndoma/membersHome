// app/api/portal/[houseSlug]/user/debug-products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { houseSlug } = params

    // Get all products by this user across all houses
    const allProducts = await prisma.communityProduct.findMany({
      where: {
        sellerId: session.user.id
      },
      include: {
        community: {
          include: {
            house: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      userId: session.user.id,
      allProducts: allProducts.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        houseSlug: p.community.house.slug,
        houseName: p.community.house.name,
        communityName: p.community.name
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}