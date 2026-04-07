// app/organization/[orgSlug]/houses/[houseSlug]/applications/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import {
  Users,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  FileText,
  UserCheck,
  Calendar,
  Mail,
  Phone,
  Home,
  Globe,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface MembershipApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  status: string
  createdAt: string
  reviewedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  membershipPlan: {
    id: string
    name: string
    amount: number
    billingFrequency: string
    house: { id: string; name: string } | null
  }
  reviewer: { name: string } | null
  membership: {
    id: string
    status: string
    startDate: string
    cancelledAt: string | null
  } | null
}

interface Member {
  id: string
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  role: string
  status: string
  joinedAt: string
}

export default function ApplicationsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [orgSlug, setOrgSlug] = useState("")
  const [houseSlug, setHouseSlug] = useState("")
  const [houseName, setHouseName] = useState("")

  useEffect(() => {
    const pathParts = window.location.pathname.split('/')
    const org = pathParts[2]
    const house = pathParts[4]
    setOrgSlug(org)
    setHouseSlug(house)
    
    if (org && house) {
      fetchHouseData(org, house)
      fetchApplications(org, house)
      fetchMembers(org, house)
    }
  }, [])

  const fetchHouseData = async (org: string, house: string) => {
    try {
      const res = await fetch(`/api/organizations/${org}/houses/${house}`)
      if (res.ok) {
        const data = await res.json()
        setHouseName(data.name)
      }
    } catch (error) {
      console.error("Error fetching house:", error)
    }
  }

  const fetchApplications = async (org: string, house: string) => {
    try {
      const res = await fetch(`/api/organizations/${org}/houses/${house}/membership-applications`)
      if (res.ok) {
        const data = await res.json()
        console.log("Fetched applications:", data.applications?.length)
        setApplications(data.applications || [])
      } else {
        console.error("Failed to fetch applications:", res.status)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const fetchMembers = async (org: string, house: string) => {
    try {
      const res = await fetch(`/api/organizations/${org}/houses/${house}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageMember = async (application: MembershipApplication) => {
    if (!application.membership?.id) {
      toast.error("Member not found")
      return
    }

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/members?membershipId=${application.membership.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.members && data.members.length > 0) {
          const houseMembershipId = data.members[0].id
          router.push(`/organization/${orgSlug}/houses/${houseSlug}/members/${houseMembershipId}`)
        } else {
          toast.error("Member not found in this house")
        }
      } else {
        toast.error("Could not find member profile")
      }
    } catch (error) {
      console.error("Error fetching house membership:", error)
      toast.error("Error loading member profile")
    }
  }

  const getStatusBadge = (status: string, membershipStatus?: string) => {
    // If approved but membership is cancelled, show as Cancelled
    if (status === "APPROVED" && membershipStatus === "CANCELLED") {
      return <Badge className="bg-orange-100 text-orange-800">Cancelled</Badge>
    }
    
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "REVIEWING":
        return <Badge className="bg-blue-100 text-blue-800">Reviewing</Badge>
      case "WAITLIST":
        return <Badge className="bg-gray-100 text-gray-800">Waitlist</Badge>
      case "CANCELLED":
        return <Badge className="bg-orange-100 text-orange-800">Cancelled</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HOUSE_ADMIN":
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case "HOUSE_MANAGER":
        return <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
      case "HOUSE_STAFF":
        return <Badge className="bg-green-100 text-green-800">Staff</Badge>
      default:
        return <Badge variant="outline">Member</Badge>
    }
  }

  const copyApplicationLink = () => {
    const link = `${window.location.origin}/apply/${orgSlug}/${houseSlug}/membership`
    navigator.clipboard.writeText(link)
    toast.success("Application link copied to clipboard!")
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter.toUpperCase()
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "PENDING").length,
    reviewing: applications.filter(a => a.status === "REVIEWING").length,
    approved: applications.filter(a => a.status === "APPROVED").length,
    rejected: applications.filter(a => a.status === "REJECTED").length,
    waitlist: applications.filter(a => a.status === "WAITLIST").length,
    cancelled: applications.filter(a => a.status === "CANCELLED").length,
    activeMembers: members.filter(m => m.status === "ACTIVE").length,
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Membership Applications</h1>
        <p className="text-muted-foreground">
          Manage membership applications for {houseName}
        </p>
      </div>

      {/* Application Link Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Application Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Share this link with potential members to apply for membership:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/apply/${orgSlug}/${houseSlug}/membership`}
              readOnly
              className="font-mono text-sm flex-1"
            />
            <Button onClick={copyApplicationLink} variant="outline" className="sm:w-auto">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("all"); setCurrentPage(1) }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-yellow-500/50 bg-yellow-50/50" onClick={() => { setStatusFilter("pending"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
            <p className="text-xs text-yellow-600">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-blue-500/50" onClick={() => { setStatusFilter("reviewing"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.reviewing}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("approved"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("waitlist"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitlist}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("rejected"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setStatusFilter("cancelled"); setCurrentPage(1) }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Members Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Active Members ({stats.activeMembers})
          </CardTitle>
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members`}>
            <Button variant="outline" size="sm">
              View All Members
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.activeMembers === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2">No active members yet</p>
              <p className="text-sm text-muted-foreground">
                Approve applications to add members to this house
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.filter(m => m.status === "ACTIVE").slice(0, 4).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {member.user.image ? (
                        <img src={member.user.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <Users className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.user.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    <Link href={`/organization/${orgSlug}/houses/${houseSlug}/members/${member.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Membership Applications ({filteredApplications.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2">No applications found</p>
              {statusFilter !== "all" && (
                <Button 
                  variant="link" 
                  onClick={() => { setStatusFilter("all"); setCurrentPage(1) }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedApplications.map((app) => (
                      <TableRow key={app.id} className={app.status === "PENDING" ? "bg-yellow-50/30" : ""}>
                        <TableCell className="font-medium">
                          <div>
                            <span className="font-medium">{app.firstName} {app.lastName}</span>
                            {app.status === "PENDING" && (
                              <Badge variant="outline" className="ml-2 text-yellow-600 border-yellow-300 text-xs">New</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{app.email}</span>
                            {app.phone && (
                              <span className="text-xs text-muted-foreground">{app.phone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{app.membershipPlan?.name || "Not assigned"}</span>
                            {app.membershipPlan && (
                              <span className="text-xs text-muted-foreground">
                                ${app.membershipPlan.amount}/{app.membershipPlan.billingFrequency.toLowerCase()}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(app.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status, app.membership?.status)}</TableCell>
                        <TableCell className="text-right">
                          {(app.status === "PENDING" || app.status === "REVIEWING") && (
                            <Link href={`/organization/${orgSlug}/membership-applications/${app.id}?houseId=${houseSlug}`}>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </Link>
                          )}
                          {app.status === "APPROVED" && app.membership?.status !== "CANCELLED" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleManageMember(app)}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          )}
                          {(app.status === "REJECTED" || app.status === "CANCELLED" || (app.status === "APPROVED" && app.membership?.status === "CANCELLED")) && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Completed
                            </Badge>
                          )}
                          {app.status === "WAITLIST" && (
                            <Badge variant="outline" className="text-gray-500">Waitlisted</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length} applications
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}