"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          Manage Your Community,
          <br />
          <span className="text-primary">All in One Place</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          MembersHome helps organizations and houses manage members, events, tickets, and communications effortlessly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/auth/register">
            <Button size="lg">Get Started Free</Button>
          </Link>
          <Link href="/marketing/features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}