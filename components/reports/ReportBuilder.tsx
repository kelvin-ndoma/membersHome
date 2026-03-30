"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { CalendarIcon, Download, Eye, Loader2 } from "lucide-react"
import { format } from "date-fns"

const reportSchema = z.object({
  type: z.enum(["MEMBERSHIP_GROWTH", "EVENT_ATTENDANCE", "REVENUE_ANALYSIS", "TICKET_SALES", "PLATFORM_OVERVIEW"]),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  houseId: z.string().optional(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
})

type ReportFormData = z.infer<typeof reportSchema>

interface ReportBuilderProps {
  houses?: Array<{ id: string; name: string }>
  onGenerate: (data: ReportFormData) => Promise<void>
  onPreview?: (data: ReportFormData) => Promise<void>
  isLoading?: boolean
}

const reportTypes = [
  { value: "MEMBERSHIP_GROWTH", label: "Membership Growth", description: "Track member signups over time" },
  { value: "EVENT_ATTENDANCE", label: "Event Attendance", description: "Analyze event participation rates" },
  { value: "REVENUE_ANALYSIS", label: "Revenue Analysis", description: "View revenue trends and breakdowns" },
  { value: "TICKET_SALES", label: "Ticket Sales", description: "Monitor ticket sales performance" },
  { value: "PLATFORM_OVERVIEW", label: "Platform Overview", description: "Comprehensive platform statistics" },
]

export function ReportBuilder({ houses = [], onGenerate, onPreview, isLoading = false }: ReportBuilderProps) {
  const [selectedType, setSelectedType] = useState<string>("MEMBERSHIP_GROWTH")
  const [isPreviewing, setIsPreviewing] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      type: "MEMBERSHIP_GROWTH",
      title: "",
      description: "",
      startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      houseId: "",
      format: "json",
    },
  })

  const watchType = watch("type")
  const watchHouseId = watch("houseId")

  const selectedReportType = reportTypes.find(r => r.value === watchType)

  const handleTypeChange = (value: string) => {
    setSelectedType(value)
    setValue("type", value as any)
    setValue("title", `${reportTypes.find(r => r.value === value)?.label} Report`)
  }

  const handlePreview = async (data: ReportFormData) => {
    if (onPreview) {
      setIsPreviewing(true)
      try {
        await onPreview(data)
      } finally {
        setIsPreviewing(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Builder</CardTitle>
        <CardDescription>
          Create custom reports to analyze your organization's data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="type">Report Type</Label>
            <Select defaultValue={watchType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <p>{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Report Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>

          {houses.length > 0 && watchType !== "PLATFORM_OVERVIEW" && (
            <div className="space-y-2">
              <Label htmlFor="houseId">Filter by House (Optional)</Label>
              <Select onValueChange={(value) => setValue("houseId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Houses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Houses</SelectItem>
                  {houses.map((house) => (
                    <SelectItem key={house.id} value={house.id}>
                      {house.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select defaultValue="json" onValueChange={(value) => setValue("format", value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            {onPreview && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit(handlePreview)}
                disabled={isLoading || isPreviewing}
                className="flex-1"
              >
                {isPreviewing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Preview
              </Button>
            )}
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}