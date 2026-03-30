"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  title: string
  startDate: Date
  endDate: Date
  type: string
  status: string
}

interface CalendarViewProps {
  events: Event[]
  onEventClick?: (eventId: string) => void
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.startDate), day))
  }

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] rounded-lg border p-2 transition-colors hover:bg-muted/50",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isSameDay(day, new Date()) && "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => onEventClick?.(event.id)}
                    className="w-full truncate rounded bg-primary/10 px-1 text-left text-xs text-primary hover:bg-primary/20"
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}