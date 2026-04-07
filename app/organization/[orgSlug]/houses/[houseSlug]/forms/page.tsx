// app/organization/[orgSlug]/houses/[houseSlug]/forms/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { 
  Plus, 
  FileText, 
  Eye, 
  Copy, 
  Globe, 
  Calendar, 
  Users, 
  Loader2,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

interface CustomForm {
  id: string
  title: string
  description: string | null
  status: string
  slug: string
  createdAt: string
  publishedAt: string | null
  _count: {
    submissions: number
  }
}

export default function FormsPage() {
  const { data: session } = useSession()
  const [forms, setForms] = useState<CustomForm[]>([])
  const [loading, setLoading] = useState(true)
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
      fetchForms(org, house)
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

  const fetchForms = async (org: string, house: string) => {
    try {
      const res = await fetch(`/api/organizations/${org}/houses/${house}/forms`)
      if (res.ok) {
        const data = await res.json()
        setForms(data.forms || [])
      }
    } catch (error) {
      console.error("Error fetching forms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (formId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      
      if (res.ok) {
        toast.success("Form published successfully! You can now share the link.")
        fetchForms(orgSlug, houseSlug)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to publish form")
      }
    } catch (error) {
      console.error("Error publishing form:", error)
      toast.error("Error publishing form")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Link copied to clipboard!")
  }

  const handleDelete = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form? All submissions will also be deleted.")) return
    
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}`, {
        method: "DELETE",
      })
      
      if (res.ok) {
        toast.success("Form deleted successfully")
        fetchForms(orgSlug, houseSlug)
      } else {
        toast.error("Failed to delete form")
      }
    } catch (error) {
      toast.error("Error deleting form")
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Forms</h1>
          <p className="text-muted-foreground">
            Create and manage custom application forms for {houseName}
          </p>
        </div>
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
            <p className="mt-2 text-muted-foreground">
              Create your first application form to start collecting submissions
            </p>
            <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/create`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Form
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{form.title}</CardTitle>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                  {form.status === "PUBLISHED" ? (
                    <Badge className="bg-green-100 text-green-800">Published</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created
                  </span>
                  <span>{format(new Date(form.createdAt), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Submissions
                  </span>
                  <span className="font-semibold">{form._count.submissions}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/${form.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms/${form.id}/submissions`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Users className="mr-2 h-4 w-4" />
                      Submissions ({form._count.submissions})
                    </Button>
                  </Link>
                  {form.status === "DRAFT" ? (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handlePublish(form.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Publish
                    </Button>
                  ) : (
                    <>
                      <Link href={`/apply/${orgSlug}/${houseSlug}/${form.slug}`} target="_blank" className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <Globe className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(`${window.location.origin}/apply/${orgSlug}/${houseSlug}/${form.slug}`)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(form.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {form.status === "PUBLISHED" && form.publishedAt && (
                  <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                    Published: {format(new Date(form.publishedAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}