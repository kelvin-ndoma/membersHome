import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const platform = await prisma.platform.findFirst()
    
    if (!platform) {
      return NextResponse.json({
        allowCustomDomains: true,
        enableMultiTenancy: true,
        enableMemberMessaging: true,
        enableMemberDirectory: true,
        platformFeePercent: 0,
      })
    }

    return NextResponse.json({
      allowCustomDomains: platform.allowCustomDomains,
      enableMultiTenancy: platform.enableMultiTenancy,
      enableMemberMessaging: platform.enableMemberMessaging,
      enableMemberDirectory: platform.enableMemberDirectory,
      platformFeePercent: platform.platformFeePercent || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.platformRole !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    const platform = await prisma.platform.findFirst()
    
    if (!platform) {
      const newPlatform = await prisma.platform.create({
        data: {
          name: "membersHome",
          ...body
        }
      })
      return NextResponse.json(newPlatform)
    }

    const updated = await prisma.platform.update({
      where: { id: platform.id },
      data: body
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}