"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Users, Home, Calendar, Ticket, Mail, BarChart3 } from "lucide-react"

const features = [
  {
    title: "Member Management",
    description: "Easily manage members, roles, and permissions across your organization.",
    icon: Users,
  },
  {
    title: "House Structure",
    description: "Create sub-groups within your organization for better organization.",
    icon: Home,
  },
  {
    title: "Event Planning",
    description: "Create and manage events with RSVP tracking and attendance.",
    icon: Calendar,
  },
  {
    title: "Ticket Sales",
    description: "Sell tickets for events with QR code validation.",
    icon: Ticket,
  },
  {
    title: "Communications",
    description: "Send emails and announcements to your members.",
    icon: Mail,
  },
  {
    title: "Analytics",
    description: "Get insights with detailed reports and analytics.",
    icon: BarChart3,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to manage your community
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features to help you grow and engage your members
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary" />
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}