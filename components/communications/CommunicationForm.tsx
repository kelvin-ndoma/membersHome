"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Switch } from "@/components/ui/Switch"
import { Calendar } from "lucide-react"
import { TemplateSelector } from "./TemplateSelector"

const communicationSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  body: z.string().min(1, "Message body is required"),
  type: z.enum(["EMAIL", "ANNOUNCEMENT", "PUSH_NOTIFICATION"]),
  recipientType: z.enum(["ALL_MEMBERS", "HOUSE_MEMBERS", "EVENT_ATTENDEES", "TICKET_BUYERS", "CUSTOM_SEGMENT"]),
  segmentFilters: z.any().optional(),
  houseId: z.string().optional(),
  eventId: z.string().optional(),
  scheduledFor: z.string().optional(),
})

type CommunicationFormData = z.infer<typeof communicationSchema>

interface CommunicationFormProps {
  houses?: Array<{ id: string; name: string }>
  events?: Array<{ id: string; title: string }>
  onSubmit: (data: CommunicationFormData) => Promise<void>
  isLoading?: boolean
  initialData?: Partial<CommunicationFormData> & { id?: string }
}

export function CommunicationForm({ 
  houses = [], 
  events = [], 
  onSubmit, 
  isLoading = false,
  initialData 
}: CommunicationFormProps) {
  const [scheduleLater, setScheduleLater] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      subject: initialData?.subject || "",
      body: initialData?.body || "",
      type: initialData?.type || "EMAIL",
      recipientType: initialData?.recipientType || "ALL_MEMBERS",
      segmentFilters: initialData?.segmentFilters || {},
      houseId: initialData?.houseId || "",
      eventId: initialData?.eventId || "",
      scheduledFor: initialData?.scheduledFor || "",
    },
  })

  const recipientType = watch("recipientType")
  const type = watch("type")

  const handleTemplateSelect = (template: { subject: string; body: string }) => {
    setSelectedTemplate(template.subject)
    setValue("subject", template.subject)
    setValue("body", template.body)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Communication Type</Label>
          <Select
            defaultValue={initialData?.type || "EMAIL"}
            onValueChange={(value) => setValue("type", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
              <SelectItem value="PUSH_NOTIFICATION">Push Notification</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientType">Recipients</Label>
          <Select
            defaultValue={initialData?.recipientType || "ALL_MEMBERS"}
            onValueChange={(value) => setValue("recipientType", value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_MEMBERS">All Members</SelectItem>
              <SelectItem value="HOUSE_MEMBERS">House Members</SelectItem>
              <SelectItem value="EVENT_ATTENDEES">Event Attendees</SelectItem>
              <SelectItem value="TICKET_BUYERS">Ticket Buyers</SelectItem>
              <SelectItem value="CUSTOM_SEGMENT">Custom Segment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {recipientType === "HOUSE_MEMBERS" && houses.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="houseId">Select House</Label>
          <Select onValueChange={(value) => setValue("houseId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a house" />
            </SelectTrigger>
            <SelectContent>
              {houses.map((house) => (
                <SelectItem key={house.id} value={house.id}>
                  {house.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {recipientType === "EVENT_ATTENDEES" && events.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="eventId">Select Event</Label>
          <Select onValueChange={(value) => setValue("eventId", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {type === "EMAIL" && (
        <div className="space-y-2">
          <Label>Email Template (Optional)</Label>
          <TemplateSelector onSelect={handleTemplateSelect} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...register("subject")} placeholder="Enter subject line" />
        {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          {...register("body")}
          rows={10}
          placeholder={type === "EMAIL" ? "Write your email content..." : "Write your announcement..."}
        />
        {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="schedule"
          checked={scheduleLater}
          onCheckedChange={setScheduleLater}
        />
        <Label htmlFor="schedule">Schedule for later</Label>
      </div>

      {scheduleLater && (
        <div className="space-y-2">
          <Label htmlFor="scheduledFor">Send Date & Time</Label>
          <Input
            id="scheduledFor"
            type="datetime-local"
            {...register("scheduledFor")}
          />
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading 
          ? "Sending..." 
          : scheduleLater 
            ? "Schedule" 
            : initialData?.id 
              ? "Update" 
              : "Send Now"}
      </Button>
    </form>
  )
}