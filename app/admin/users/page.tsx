"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Search, User, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/Alert-dialog"

interface UserData {
  id: string
  name: string | null
  email: string
  image: string | null
  platformRole: string
  emailVerified: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  _count: {
    memberships: number
    ticketPurchases: number
    payments: number
  }
}

interface SearchParams {
  search?: string
  page?: string
  role?: string
}

export default function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useState<SearchParams>({})
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchParams = async () => {
      const p = await searchParams
      setParams(p)
    }
    fetchParams()
  }, [searchParams])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        if (params.search) query.set("search", params.search)
        if (params.page) query.set("page", params.page)
        if (params.role) query.set("role", params.role)
        
        const res = await fetch(`/api/admin/users?${query.toString()}`)
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      } catch (error) {
        console.error("Failed to fetch users", error)
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [params])

  const handleDelete = async (userId: string, userName: string) => {
    setDeletingUserId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user")
      }
      
      toast.success(`User ${userName} deleted successfully`)
      // Refresh the list
      const query = new URLSearchParams()
      if (params.search) query.set("search", params.search)
      if (params.page) query.set("page", params.page)
      if (params.role) query.set("role", params.role)
      
      const refreshRes = await fetch(`/api/admin/users?${query.toString()}`)
      const refreshData = await refreshRes.json()
      setUsers(refreshData.users)
      setTotal(refreshData.total)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setDeletingUserId(null)
    }
  }

  const page = parseInt(params.page || "1")
  const totalPages = Math.ceil(total / 10)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all users on the platform</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search by name or email..."
                defaultValue={params.search || ""}
                className="pl-9"
              />
            </div>
            <select
              name="role"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue={params.role || ""}
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="PLATFORM_ADMIN">Admin</option>
            </select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left text-sm font-medium">User</th>
                <th className="p-3 text-left text-sm font-medium">Role</th>
                <th className="p-3 text-left text-sm font-medium">Organizations</th>
                <th className="p-3 text-left text-sm font-medium">Tickets</th>
                <th className="p-3 text-left text-sm font-medium">Last Login</th>
                <th className="p-3 text-left text-sm font-medium">Joined</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {user.image ? (
                        <img src={user.image} alt={user.name || ""} className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs ${
                      user.platformRole === "PLATFORM_ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {user.platformRole === "PLATFORM_ADMIN" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{user._count.memberships}</td>
                  <td className="p-3 text-sm">{user._count.ticketPurchases}</td>
                  <td className="p-3 text-sm">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-3 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingUserId === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{user.name || user.email}</strong>? 
                              This action cannot be undone. The user's data will be anonymized and they will lose access to all organizations.
                              {user.platformRole === "PLATFORM_ADMIN" && (
                                <span className="block mt-2 text-yellow-600">
                                  ⚠️ This user is a platform admin. Make sure there is at least one other admin before deleting.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user.id, user.name || user.email)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingUserId === user.id ? "Deleting..." : "Delete User"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}&search=${params.search || ""}&role=${params.role || ""}`}
              className={`px-3 py-1 rounded ${
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}