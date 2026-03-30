"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/Dialog"
import { Mail, Megaphone, AlertCircle, Sparkles } from "lucide-react"

interface Template {
  id: string
  name: string
  description: string
  subject: string
  body: string
  category: "welcome" | "announcement" | "reminder" | "promotion"
  icon: React.ReactNode
}

const templates: Template[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    description: "Send a warm welcome to new members",
    subject: "Welcome to {{organizationName}}!",
    body: "Dear {{memberName}},\n\nWelcome to {{organizationName}}! We're excited to have you as part of our community.\n\nBest regards,\nThe {{organizationName}} Team",
    category: "welcome",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    id: "announcement",
    name: "General Announcement",
    description: "Share news and updates with members",
    subject: "Announcement: {{title}}",
    body: "Hello {{memberName}},\n\n{{message}}\n\nThank you,\n{{organizationName}} Team",
    category: "announcement",
    icon: <Megaphone className="h-4 w-4" />,
  },
  {
    id: "event_reminder",
    name: "Event Reminder",
    description: "Remind members about upcoming events",
    subject: "Reminder: {{eventName}} is coming up!",
    body: "Hi {{memberName}},\n\nDon't forget! {{eventName}} is happening on {{eventDate}} at {{eventLocation}}.\n\nWe look forward to seeing you there!\n\n{{organizationName}} Team",
    category: "reminder",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  {
    id: "promotion",
    name: "Special Offer",
    description: "Share promotions and discounts",
    subject: "Special Offer for {{memberName}}!",
    body: "Hello {{memberName}},\n\nWe have a special offer just for you: {{offerDetails}}\n\nDon't miss out!\n\n{{organizationName}} Team",
    category: "promotion",
    icon: <Sparkles className="h-4 w-4" />,
  },
]

interface TemplateSelectorProps {
  onSelect: (template: { subject: string; body: string }) => void
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", "welcome", "announcement", "reminder", "promotion"]

  const filteredTemplates = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory)

  const handleSelect = (template: Template) => {
    onSelect({ subject: template.subject, body: template.body })
    setOpen(false)
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        Use Template
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Email Templates</DialogTitle>
            <DialogDescription>
              Choose a template to get started. You can customize it later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 max-h-[500px] overflow-y-auto">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleSelect(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {template.icon}
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-xs font-medium text-muted-foreground">Preview:</p>
                    <p className="text-sm line-clamp-2">{template.body.split("\n")[0]}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}