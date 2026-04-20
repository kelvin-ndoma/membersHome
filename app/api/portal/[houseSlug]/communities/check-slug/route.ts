// app/api/portal/[houseSlug]/communities/check-slug/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { houseSlug: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const excludeId = searchParams.get('excludeId')

    if (!slug) {
      return NextResponse.json({ error: 'Slug required' }, { status: 400 })
    }

    const house = await prisma.house.findFirst({
      where: { slug: params.houseSlug },
      select: { id: true }
    })

    if (!house) {
      return NextResponse.json({ error: 'House not found' }, { status: 404 })
    }

    const where: any = {
      houseId: house.id,
      slug: slug
    }

    if (excludeId) {
      where.NOT = { id: excludeId }
    }

    const existing = await prisma.community.findFirst({
      where,
      select: { id: true }
    })

    return NextResponse.json({ available: !existing })
  } catch (error) {
    console.error('Error checking slug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}