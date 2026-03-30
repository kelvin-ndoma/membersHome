"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { InvoiceForm } from "@/components/commerce/InvoiceForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { toast } from "sonner"

export default function CreateInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [members, setMembers] = useState<Array<{ id: string; user: { name: string; email: string } }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/organizations/${orgSlug}/members`)
      .then((res) => res.json())
      .then((data) => {
        setMembers(data.members || [])
        setLoading(false)
      })
      .catch((error) => {
        console.error("Failed to load members", error)
        toast.error("Failed to load members")
        setLoading(false)
      })
  }, [orgSlug])

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/commerce/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create invoice")
      }

      const invoice = await res.json()
      toast.success("Invoice created successfully!")
      router.push(`/organization/${orgSlug}/commerce/invoices/${invoice.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
          <CardDescription>
            Create a new invoice for a member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            members={members}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}