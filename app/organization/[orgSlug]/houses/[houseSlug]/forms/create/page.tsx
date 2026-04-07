// app/organization/[orgSlug]/houses/[houseSlug]/forms/create/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Plus, Trash2, Loader2, ArrowLeft, GripVertical, Eye, Save, Layout, Columns, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

// Field schema with width property
const fieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  width: z.enum(["full", "half", "one-third", "two-thirds", "quarter", "three-quarters"]).default("full"),
})

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
})

type FormData = z.infer<typeof formSchema>
type FormField = z.infer<typeof fieldSchema>

const fieldTypes = [
  { value: "text", label: "Short Text", icon: "📝" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "tel", label: "Phone", icon: "📞" },
  { value: "textarea", label: "Paragraph", icon: "📄" },
  { value: "select", label: "Dropdown", icon: "📋" },
  { value: "radio", label: "Radio Group", icon: "🔘" },
  { value: "checkbox", label: "Checkbox", icon: "☑️" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "number", label: "Number", icon: "🔢" },
  { value: "url", label: "Website", icon: "🌐" },
]

const widthOptions = [
  { value: "full", label: "Full Width (100%)", className: "col-span-12" },
  { value: "three-quarters", label: "Three Quarters (75%)", className: "col-span-9" },
  { value: "two-thirds", label: "Two Thirds (66%)", className: "col-span-8" },
  { value: "half", label: "Half Width (50%)", className: "col-span-6" },
  { value: "one-third", label: "One Third (33%)", className: "col-span-4" },
  { value: "quarter", label: "Quarter Width (25%)", className: "col-span-3" },
]

const getWidthClass = (width: string) => {
  switch (width) {
    case "full": return "col-span-12"
    case "three-quarters": return "col-span-12 md:col-span-9"
    case "two-thirds": return "col-span-12 md:col-span-8"
    case "half": return "col-span-12 md:col-span-6"
    case "one-third": return "col-span-12 md:col-span-4"
    case "quarter": return "col-span-12 md:col-span-3"
    default: return "col-span-12"
  }
}

export default function CreateFormPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const houseSlug = params.houseSlug as string
  const [isLoading, setIsLoading] = useState(false)
  const [house, setHouse] = useState<{ id: string; name: string } | null>(null)
  const [loadingHouse, setLoadingHouse] = useState(true)
  const [activeTab, setActiveTab] = useState("builder")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      fields: [],
      status: "DRAFT",
    },
  })

  const fields = watch("fields") || []

  useEffect(() => {
    async function fetchHouse() {
      try {
        const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}`)
        if (res.ok) {
          const data = await res.json()
          setHouse(data)
        }
      } catch (error) {
        console.error("Failed to load house:", error)
      } finally {
        setLoadingHouse(false)
      }
    }
    fetchHouse()
  }, [orgSlug, houseSlug])

  const addField = (type: string) => {
    const newField: FormField = {
      id: `${type}-${Date.now()}`,
      type,
      label: `New ${fieldTypes.find(f => f.value === type)?.label || type} field`,
      required: false,
      placeholder: "",
      width: "full",
      options: type === "select" || type === "radio" ? ["Option 1"] : undefined,
    }
    setValue("fields", [...fields, newField])
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields]
    updatedFields[index] = { ...updatedFields[index], ...updates }
    setValue("fields", updatedFields)
  }

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setValue("fields", updatedFields)
  }

  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === fields.length - 1) return
    
    const newIndex = direction === "up" ? index - 1 : index + 1
    const updatedFields = [...fields]
    ;[updatedFields[index], updatedFields[newIndex]] = [updatedFields[newIndex], updatedFields[index]]
    setValue("fields", updatedFields)
  }

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex]
    const currentOptions = field.options || []
    updateField(fieldIndex, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] })
  }

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex]
    const newOptions = [...(field.options || [])]
    newOptions[optionIndex] = value
    updateField(fieldIndex, { options: newOptions })
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex]
    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex)
    updateField(fieldIndex, { options: newOptions })
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          houseId: house?.id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create form")
      }

      toast.success("Form created successfully!")
      router.push(`/organization/${orgSlug}/houses/${houseSlug}/forms`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingHouse) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!house) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Form</h1>
            <p className="text-muted-foreground">House not found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/organization/${orgSlug}/houses/${houseSlug}/forms`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Application Form</h1>
          <p className="text-muted-foreground">
            Build a custom application form for {house.name}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">House</p>
            <p className="font-medium">{house.name}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">
            <Layout className="h-4 w-4 mr-2" />
            Form Builder
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Form Title *</Label>
                <Input 
                  {...register("title")} 
                  placeholder="e.g., Membership Application 2024"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  {...register("description")} 
                  placeholder="Tell applicants what this form is for..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle>Form Fields</CardTitle>
              <div className="flex flex-wrap gap-2">
                {fieldTypes.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addField(type.value)}
                  >
                    <span className="mr-1">{type.icon}</span>
                    {type.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click any button above to add form fields</p>
                  <p className="text-sm mt-2">You can add as many fields as you need</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                          <span className="font-medium">
                            {fieldTypes.find(t => t.value === field.type)?.icon} {fieldTypes.find(t => t.value === field.type)?.label}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, "up")}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveField(index, "down")}
                            disabled={index === fields.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(index, { label: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Column Width</Label>
                            <Select
                              value={field.width || "full"}
                              onValueChange={(value) => updateField(index, { width: value as any })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {widthOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                      <Columns className="h-4 w-4" />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {(field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "number" || field.type === "url") && (
                          <div>
                            <Label>Placeholder</Label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            />
                          </div>
                        )}
                        {(field.type === "select" || field.type === "radio") && (
                          <div>
                            <Label>Options</Label>
                            <div className="space-y-2">
                              {(field.options || []).map((option, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(index, optIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(index)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Option
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`required-${field.id}`}
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`required-${field.id}`} className="text-sm font-normal">
                            Required field
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{watch("title") || "Untitled Form"}</CardTitle>
              {watch("description") && (
                <p className="text-muted-foreground">{watch("description")}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-4">
                {fields.map((field) => (
                  <div key={field.id} className={getWidthClass(field.width || "full")}>
                    <div className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === "textarea" && (
                        <Textarea placeholder={field.placeholder} />
                      )}
                      {field.type === "select" && (
                        <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                          <option value="">Select...</option>
                          {field.options?.map((option, i) => (
                            <option key={i} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      {field.type === "radio" && (
                        <div className="space-y-2">
                          {field.options?.map((option, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input type="radio" name={field.id} value={option} />
                              <Label className="text-sm font-normal">{option}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                      {field.type === "checkbox" && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" />
                          <Label className="text-sm font-normal">{field.label}</Label>
                        </div>
                      )}
                      {(field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "number" || field.type === "url") && (
                        <Input type={field.type} placeholder={field.placeholder} />
                      )}
                      {field.type === "date" && (
                        <Input type="date" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <Button type="button" className="w-full md:w-auto">Submit Application</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Form
            </>
          )}
        </Button>
      </div>
    </div>
  )
}