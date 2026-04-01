"use client"

import Link from "next/link"
import { format } from "date-fns"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

interface Event {
  id: string
  title: string
  description: string | null
  slug: string
  startDate: Date
  endDate: Date
  location: string | null
  imageUrl: string | null
  isFree: boolean
  price: number | null
  memberOnly: boolean
  status: string
  organization: {
    id: string
    name: string
    slug: string
  }
  _count: {
    rsvps: number
  }
}

interface EventsSectionProps {
  events: Event[]
}

export function EventsSection({ events }: EventsSectionProps) {
  if (events.length === 0) {
    return null
  }

  const isUpcoming = (date: Date) => new Date(date) > new Date()

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Upcoming Events
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover events happening in our community
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.imageUrl && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl line-clamp-1">{event.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{event.organization.name}</p>
                  </div>
                  {event.memberOnly && (
                    <Badge variant="outline" className="gap-1">
                      Members Only
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(event.startDate), "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{event._count.rsvps} attending</span>
                  </div>
                  {isUpcoming(event.startDate) && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Clock className="h-4 w-4" />
                      <span>Upcoming</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {event.isFree ? (
                    <Badge variant="secondary">Free</Badge>
                  ) : (
                    <Badge variant="default">${event.price}</Badge>
                  )}
                  <Link href={`/events/${event.organization.slug}/${event.slug}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/events">
            <Button variant="outline" size="lg">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}