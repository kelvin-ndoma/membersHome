"use client"

import { useState } from "react"
import { Calendar, Clock, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

interface Shift {
  id: string
  staffId: string
  staffName: string
  date: Date
  startTime: string
  endTime: string
  role: string
}

interface StaffScheduleProps {
  shifts: Shift[]
  onAddShift?: (shift: Omit<Shift, "id">) => void
  onRemoveShift?: (shiftId: string) => void
  canManage?: boolean
}

export function StaffSchedule({ shifts, onAddShift, onRemoveShift, canManage = false }: StaffScheduleProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const groupedShifts = shifts.reduce((acc, shift) => {
    const dateKey = shift.date.toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(shift)
    return acc
  }, {} as Record<string, Shift[]>)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "HOUSE_ADMIN":
        return "bg-red-100 text-red-800"
      case "HOUSE_MANAGER":
        return "bg-blue-100 text-blue-800"
      case "HOUSE_STAFF":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Staff Schedule</CardTitle>
        {canManage && (
          <Button size="sm" onClick={() => onAddShift?.({
            staffId: "",
            staffName: "",
            date: new Date(),
            startTime: "09:00",
            endTime: "17:00",
            role: "HOUSE_STAFF"
          })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedShifts).map(([dateKey, dateShifts]) => (
            <div key={dateKey}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" />
                {new Date(dateKey).toLocaleDateString("en-US", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </h3>
              <div className="space-y-2">
                {dateShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{shift.staffName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{shift.startTime} - {shift.endTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleColor(shift.role)}>
                        {shift.role.split("_")[1] || shift.role}
                      </Badge>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveShift?.(shift.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {shifts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No shifts scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}