// app/organization/[orgSlug]/houses/[houseSlug]/applications/[formId]/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { FormBuilder } from "@/components/form-builder/FormBuilder"

interface EditApplicationPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string; formId: string }>
}

export default async function EditApplicationPage({ params }: EditApplicationPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug, formId } = await params

  if (!session?.user?.id) {
    redirect("/auth/login")
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { slug: orgSlug },
      status: "ACTIVE",
    },
  })

  if (!membership) {
    redirect("/organization")
  }

  const isOrgAdmin = membership.organizationRole === "ORG_ADMIN" || membership.organizationRole === "ORG_OWNER"

  if (!isOrgAdmin) {
    redirect(`/portal/${orgSlug}/dashboard`)
  }

  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true },
  })

  if (!organization) {
    notFound()
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: houseSlug,
      organizationId: organization.id,
    },
  })

  if (!house) {
    notFound()
  }

  const form = await prisma.customForm.findFirst({
    where: {
      id: formId,
      houseId: house.id,
      organizationId: organization.id,
    },
  })

  if (!form) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Application Form</h1>
        <p className="text-muted-foreground">
          Edit {form.title} for {house.name}
        </p>
      </div>

      <FormBuilder 
        orgSlug={orgSlug} 
        houseSlug={houseSlug} 
        initialForm={form}
      />
    </div>
  )
}