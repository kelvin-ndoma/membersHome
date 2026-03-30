"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"

export function CTASection() {
  return (
    <section className="py-20 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/90">
          Join thousands of organizations already using MembersHome
        </p>
        <Link href="/auth/register">
          <Button size="lg" variant="secondary" className="mt-8">
            Start Free Trial
          </Button>
        </Link>
      </div>
    </section>
  )
}