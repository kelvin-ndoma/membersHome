import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { CTASection } from "@/components/marketing/CTASection"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is logged in
  if (session?.user?.id) {
    // Check if user is platform admin
    if (session.user.platformRole === "PLATFORM_ADMIN") {
      redirect("/admin")
    }

    // Regular user flow
    const memberships = await prisma.membership.findMany({
      where: { 
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: { 
        organization: true,
        houseMemberships: {
          where: { status: "ACTIVE" },
          include: { house: true }
        }
      },
    })

    if (memberships.length > 0) {
      redirect(`/organization/${memberships[0].organization.slug}/dashboard`)
    } else {
      redirect("/organization/create")
    }
  }

  // If not logged in, show marketing page
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </main>
  )
}