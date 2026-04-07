// app/organization/[orgSlug]/houses/[houseSlug]/applications/[formId]/submissions/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth/config"
import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Download,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface SubmissionsPageProps {
  params: Promise<{ orgSlug: string; houseSlug: string; formId: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function SubmissionsPage({ params, searchParams }: SubmissionsPageProps) {
  const session = await getServerSession(authOptions)
  const { orgSlug, houseSlug, formId } = await params
  const { status = "all" } = await searchParams

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

  // Build where clause for submissions
  const where: any = { formId: form.id }
  if (status !== "all") {
    where.status = status.toUpperCase()
  }

  const submissions = await prisma.formSubmission.findMany({
    where,
    include: {
      reviewer: {
        select: { name: true, email: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "REVIEWED":
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "REVIEWED":
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === "PENDING").length,
    reviewed: submissions.filter(s => s.status === "REVIEWED").length,
    approved: submissions.filter(s => s.status === "APPROVED").length,
    rejected: submissions.filter(s => s.status === "REJECTED").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{form.title} - Submissions</h1>
          <p className="text-muted-foreground">
            Review and manage form submissions
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">All</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.all}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions?status=pending`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions?status=reviewed`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.reviewed}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions?status=approved`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.approved}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions?status=rejected`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.rejected}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Submissions</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No submissions yet</h3>
              <p className="mt-2 text-muted-foreground">
                Share the form link to start receiving submissions
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(submission.status)}
                      <div>
                        <p className="font-medium">
                          Submitted on {format(new Date(submission.submittedAt), "MMM d, yyyy • h:mm a")}
                        </p>
                        {submission.userEmail && (
                          <p className="text-sm text-muted-foreground">
                            From: {submission.userEmail}
                          </p>
                        )}
                        {submission.reviewer && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed by {submission.reviewer.name} on {submission.reviewedAt && format(new Date(submission.reviewedAt), "MMM d, yyyy")}
                          </p>
                        )}
                        {submission.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Notes: {submission.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(submission.status)}
                    <Link href={`/organization/${orgSlug}/houses/${houseSlug}/applications/${formId}/submissions/${submission.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}