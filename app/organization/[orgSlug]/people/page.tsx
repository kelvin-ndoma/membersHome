import { PeoplePageClient } from "./people-page-client"

export default async function OrganizationPeoplePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>
  searchParams?: Promise<{
    search?: string
    role?: string
    status?: string
    page?: string
  }>
}) {
  const { orgSlug } = await params
  const sp = (await searchParams) || {}

  const initialFilters = {
    search: sp.search || "",
    role: sp.role || "",
    status: sp.status || "",
    page: Number(sp.page || 1),
  }

  return (
    <PeoplePageClient
      orgSlug={orgSlug}
      initialFilters={initialFilters}
    />
  )
}