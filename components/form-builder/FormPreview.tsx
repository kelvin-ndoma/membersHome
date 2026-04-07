// components/form-builder/FormPreview.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Textarea } from "@/components/ui/Textarea"
import { Label } from "@/components/ui/Label"
import { Checkbox } from "@/components/ui/Checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { FormFieldType } from "./FormBuilder"

interface FormPreviewProps {
  title: string
  description: string
  fields: FormFieldType[]
}

export function FormPreview({ title, description, fields }: FormPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Untitled Form"}</CardTitle>
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.type === "textarea" && (
                <Textarea placeholder={field.placeholder} />
              )}
              {field.type === "checkbox" && (
                <div className="space-y-2">
                  {field.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Checkbox id={`${field.id}-${idx}`} />
                      <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
                    </div>
                  ))}
                </div>
              )}
              {field.type === "select" && (
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option, idx) => (
                      <SelectItem key={idx} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {field.type !== "textarea" && field.type !== "checkbox" && field.type !== "select" && (
                <Input type={field.type} placeholder={field.placeholder} />
              )}
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
          <Button type="submit">Submit</Button>
        </form>
      </CardContent>
    </Card>
  )
}