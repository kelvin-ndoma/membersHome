import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/marketing/Navbar"
import { HeroSection } from "@/components/marketing/HeroSection"
import { FeaturesSection } from "@/components/marketing/FeaturesSection"
import { EventsSection } from "@/components/marketing/EventsSection"
import { PricingSection } from "@/components/marketing/PricingSection"
import { CTASection } from "@/components/marketing/CTASection"
import { Footer } from "@/components/marketing/Footer"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is logged in
  if (session?.user?.id) {
    // Check if user is platform admin
    if (session.user.platformRole === "PLATFORM_ADMIN") {
      redirect("/admin")
    }

    // Get user's memberships
    const memberships = await prisma.membership.findMany({
      where: { 
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: { 
        organization: true,
      },
    })

    if (memberships.length > 0) {
      const firstOrg = memberships[0]
      const userRole = firstOrg.organizationRole
      
      // Check if user is organization admin or owner
      const isOrgAdmin = userRole === "ORG_ADMIN" || userRole === "ORG_OWNER"
      
      if (isOrgAdmin) {
        // Organization admins go to organization dashboard
        redirect(`/organization/${firstOrg.organization.slug}/dashboard`)
      } else {
        // Regular members go to member portal
        redirect(`/portal/${firstOrg.organization.slug}/dashboard`)
      }
    } else {
      // No organizations, redirect to create organization
      redirect("/organization/create")
    }
  }

  // Fetch featured events for the homepage
  const featuredEvents = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      startDate: { gte: new Date() },
    },
    take: 6,
    orderBy: { startDate: "asc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: { rsvps: true },
      },
    },
  })

  // If not logged in, show marketing page
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <EventsSection events={featuredEvents} />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}