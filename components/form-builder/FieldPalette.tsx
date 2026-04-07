// components/form-builder/FieldPalette.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
  Type,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  ListChecks,
  TextQuote,
  Hash,
  Image as ImageIcon,
  FileText,
  Globe,
  MapPin,
} from "lucide-react"

const fieldTypes = [
  { type: "text", label: "Short Text", icon: Type },
  { type: "email", label: "Email", icon: Mail },
  { type: "tel", label: "Phone", icon: Phone },
  { type: "date", label: "Date", icon: Calendar },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "select", label: "Dropdown", icon: ListChecks },
  { type: "textarea", label: "Paragraph", icon: TextQuote },
  { type: "number", label: "Number", icon: Hash },
  { type: "url", label: "Website", icon: Globe },
  { type: "address", label: "Address", icon: MapPin },
]

interface FieldPaletteProps {
  onAddField: (type: string) => void
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {fieldTypes.map((field) => (
            <Button
              key={field.type}
              variant="outline"
              className="justify-start"
              onClick={() => onAddField(field.type)}
            >
              <field.icon className="h-4 w-4 mr-2" />
              {field.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}