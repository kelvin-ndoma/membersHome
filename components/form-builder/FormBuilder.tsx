// components/form-builder/FormBuilder.tsx
"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { FormField } from "./FormField"
import { FieldPalette } from "./FieldPalette"
import { FormPreview } from "./FormPreview"
import { Plus, Save, Eye, Globe, Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export interface FormFieldType {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface FormBuilderProps {
  orgSlug: string
  houseSlug: string
  initialForm?: any
}

export function FormBuilder({ orgSlug, houseSlug, initialForm }: FormBuilderProps) {
  const router = useRouter()
  const [formTitle, setFormTitle] = useState(initialForm?.title || "")
  const [formDescription, setFormDescription] = useState(initialForm?.description || "")
  const [fields, setFields] = useState<FormFieldType[]>(initialForm?.fields || [])
  const [activeTab, setActiveTab] = useState("builder")
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [formId, setFormId] = useState(initialForm?.id || null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addField = (fieldType: string) => {
    const newField: FormFieldType = {
      id: `${fieldType}-${Date.now()}`,
      type: fieldType,
      label: `New ${fieldType} field`,
      required: false,
      placeholder: `Enter ${fieldType}`,
    }
    setFields([...fields, newField])
  }

  const updateField = (fieldId: string, updates: Partial<FormFieldType>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId))
  }

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId)
    if (fieldToDuplicate) {
      const newField = {
        ...fieldToDuplicate,
        id: `${fieldToDuplicate.type}-${Date.now()}`,
        label: `${fieldToDuplicate.label} (Copy)`
      }
      setFields([...fields, newField])
    }
  }

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error("Please enter a form title")
      return
    }

    setIsSaving(true)
    try {
      const url = formId 
        ? `/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}`
        : `/api/organizations/${orgSlug}/houses/${houseSlug}/forms`
      
      const method = formId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          fields,
          status: "DRAFT",
        }),
      })

      if (!res.ok) throw new Error("Failed to save form")

      const data = await res.json()
      if (!formId && data.id) {
        setFormId(data.id)
      }

      toast.success("Form saved successfully")
      router.refresh()
    } catch (error) {
      console.error("Error saving form:", error)
      toast.error("Failed to save form")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formId) {
      // First save the form, then publish
      await handleSave()
      if (!formId) {
        toast.error("Please save the form first")
        return
      }
    }

    setIsPublishing(true)
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/houses/${houseSlug}/forms/${formId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error("Failed to publish form")

      toast.success("Form published successfully!")
      router.refresh()
    } catch (error) {
      console.error("Error publishing form:", error)
      toast.error("Failed to publish form")
    } finally {
      setIsPublishing(false)
    }
  }

  const formUrl = initialForm?.status === "PUBLISHED" && initialForm?.slug
    ? `${window.location.origin}/forms/${orgSlug}/${initialForm.slug}`
    : null

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
                className="text-lg font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="builder">
            <Plus className="h-4 w-4 mr-2" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Field Palette */}
            <div className="lg:col-span-1">
              <FieldPalette onAddField={addField} />
            </div>

            {/* Form Builder Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Form Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Drag and drop fields from the left panel to build your form</p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    >
                      <SortableContext
                        items={fields.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {fields.map((field) => (
                            <FormField
                              key={field.id}
                              field={field}
                              onUpdate={updateField}
                              onDelete={deleteField}
                              onDuplicate={duplicateField}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <FormPreview
            title={formTitle}
            description={formDescription}
            fields={fields}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formUrl && (
                <div>
                  <Label>Public URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={formUrl} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(formUrl)
                        toast.success("URL copied to clipboard")
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
              
              {initialForm?.status === "PUBLISHED" && (
                <div>
                  <Label>Embed Code</Label>
                  <Textarea
                    readOnly
                    value={`<iframe src="${formUrl}/embed" width="100%" height="600" frameborder="0"></iframe>`}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 sticky bottom-4 bg-background p-4 rounded-lg border shadow-lg">
        <Button variant="outline" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </>
          )}
        </Button>
        {initialForm?.status !== "PUBLISHED" && (
          <Button onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Publish Form
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}