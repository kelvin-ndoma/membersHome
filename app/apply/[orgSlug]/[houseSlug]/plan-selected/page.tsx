// app/apply/[orgSlug]/[houseSlug]/plan-selected/page.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { CheckCircle, Home } from "lucide-react"
import Link from "next/link"

export default function PlanSelectedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Plan Selected!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Thank you for selecting your membership plan. Our team will review your selection and finalize your membership.
          </p>
          <p className="text-muted-foreground mt-2">
            You will receive an email once your membership is confirmed.
          </p>
          <Link href="/">
            <Button className="mt-6 w-full">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}