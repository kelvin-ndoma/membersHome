import { QuickActions } from "@/components/dashboard/QuickActions"

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome to your organization workspace.
        </p>
      </div>

      <QuickActions orgSlug={orgSlug} />
    </div>
  )
}