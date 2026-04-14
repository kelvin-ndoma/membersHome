// app/portal/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'

export default async function PortalIndexPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const memberships = await prisma.houseMembership.findMany({
    where: {
      membership: {
        userId: session.user.id,
        status: 'ACTIVE',
      },
      status: 'ACTIVE',
    },
    include: { house: true },
    orderBy: { joinedAt: 'desc' },
  })

  if (memberships.length > 0) {
    redirect(`/portal/${memberships[0].house.slug}/dashboard`)
  }

  redirect('/portal/my-houses')
}