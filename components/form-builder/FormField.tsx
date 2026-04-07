// components/form-builder/FormField.tsx
"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import {
  GripVertical,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { FormFieldType } from "./FormBuilder"

interface FormFieldProps {
  field: FormFieldType
  onUpdate: (id: string, updates: Partial<FormFieldType>) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function FormField({ field, onUpdate, onDelete, onDuplicate }: FormFieldProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [options, setOptions] = useState<string[]>(field.options || [])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const addOption = () => {
    const newOptions = [...options, `Option ${options.length + 1}`]
    setOptions(newOptions)
    onUpdate(field.id, { options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    onUpdate(field.id, { options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    onUpdate(field.id, { options: newOptions })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "shadow-lg" : ""}>
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Input
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                placeholder="Field label"
                className="font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={`required-${field.id}`} className="text-sm">
                  Required
                </Label>
                <Switch
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate(field.id, { required: checked })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(field.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(field.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
            {(field.type === "select" || field.type === "checkbox") && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOption}>
                    Add Option
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={field.description || ""}
                onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                placeholder="Helper text for this field"
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}