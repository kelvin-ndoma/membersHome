"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import { Textarea } from "@/components/ui/Textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { toast } from "sonner"
import { Globe, Mail, Shield, Bell, Database, Save } from "lucide-react"

const generalSettingsSchema = z.object({
  siteName: z.string().min(2, "Site name must be at least 2 characters"),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
  supportEmail: z.string().email("Invalid email address"),
  timezone: z.string(),
  dateFormat: z.string(),
})

const emailSettingsSchema = z.object({
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  fromEmail: z.string().email("Invalid email address"),
  fromName: z.string().optional(),
  sendgridApiKey: z.string().optional(),
})

const securitySettingsSchema = z.object({
  requireEmailVerification: z.boolean(),
  sessionTimeout: z.number().int().min(5).max(1440),
  maxLoginAttempts: z.number().int().min(3).max(10),
  mfaRequired: z.boolean(),
  passwordMinLength: z.number().int().min(6).max(32),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSymbols: z.boolean(),
})

type GeneralSettings = z.infer<typeof generalSettingsSchema>
type EmailSettings = z.infer<typeof emailSettingsSchema>
type SecuritySettings = z.infer<typeof securitySettingsSchema>

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const generalForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: "MembersHome",
      siteDescription: "Membership Management Platform",
      contactEmail: "contact@membershome.com",
      supportEmail: "support@membershome.com",
      timezone: "UTC",
      dateFormat: "MM/dd/yyyy",
    },
  })

  const emailForm = useForm<EmailSettings>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: "",
      fromEmail: "noreply@membershome.com",
      fromName: "MembersHome",
      sendgridApiKey: "",
    },
  })

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      requireEmailVerification: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      mfaRequired: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
    },
  })

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.general) generalForm.reset(data.general)
        if (data.email) emailForm.reset(data.email)
        if (data.security) securityForm.reset(data.security)
      })
      .catch((error) => {
        console.error("Failed to load settings", error)
      })
  }, [])

  const onGeneralSubmit = async (data: GeneralSettings) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/settings/general", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("General settings saved")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const onEmailSubmit = async (data: EmailSettings) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/settings/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Email settings saved")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const onSecuritySubmit = async (data: SecuritySettings) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/admin/settings/security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Security settings saved")
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Database className="mr-2 h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic platform information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input id="siteName" {...generalForm.register("siteName")} />
                    {generalForm.formState.errors.siteName && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.siteName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" {...generalForm.register("contactEmail")} />
                    {generalForm.formState.errors.contactEmail && (
                      <p className="text-sm text-red-500">{generalForm.formState.errors.contactEmail.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea id="siteDescription" {...generalForm.register("siteDescription")} rows={3} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input id="supportEmail" type="email" {...generalForm.register("supportEmail")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select id="timezone" className="w-full rounded-md border border-input bg-background px-3 py-2" {...generalForm.register("timezone")}>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <select id="dateFormat" className="w-full rounded-md border border-input bg-background px-3 py-2" {...generalForm.register("dateFormat")}>
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure email delivery settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input id="fromEmail" type="email" {...emailForm.register("fromEmail")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input id="fromName" {...emailForm.register("fromName")} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-4 text-lg font-medium">SMTP Settings</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input id="smtpHost" {...emailForm.register("smtpHost")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input id="smtpPort" type="number" {...emailForm.register("smtpPort", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP Username</Label>
                      <Input id="smtpUser" {...emailForm.register("smtpUser")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input id="smtpPassword" type="password" {...emailForm.register("smtpPassword")} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-4 text-lg font-medium">SendGrid (Alternative)</h3>
                  <div className="space-y-2">
                    <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                    <Input id="sendgridApiKey" type="password" {...emailForm.register("sendgridApiKey")} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure authentication and security policies</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                      <p className="text-sm text-muted-foreground">Users must verify their email before accessing the platform</p>
                    </div>
                    <Switch
                      id="requireEmailVerification"
                      checked={securityForm.watch("requireEmailVerification")}
                      onCheckedChange={(checked) => securityForm.setValue("requireEmailVerification", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="mfaRequired">Require MFA</Label>
                      <p className="text-sm text-muted-foreground">Multi-factor authentication required for all users</p>
                    </div>
                    <Switch
                      id="mfaRequired"
                      checked={securityForm.watch("mfaRequired")}
                      onCheckedChange={(checked) => securityForm.setValue("mfaRequired", checked)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" {...securityForm.register("sessionTimeout", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input id="maxLoginAttempts" type="number" {...securityForm.register("maxLoginAttempts", { valueAsNumber: true })} />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="mb-4 text-lg font-medium">Password Requirements</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Length</Label>
                      <Input id="passwordMinLength" type="number" {...securityForm.register("passwordMinLength", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="passwordRequireUppercase">Require Uppercase</Label>
                        <Switch
                          id="passwordRequireUppercase"
                          checked={securityForm.watch("passwordRequireUppercase")}
                          onCheckedChange={(checked) => securityForm.setValue("passwordRequireUppercase", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="passwordRequireLowercase">Require Lowercase</Label>
                        <Switch
                          id="passwordRequireLowercase"
                          checked={securityForm.watch("passwordRequireLowercase")}
                          onCheckedChange={(checked) => securityForm.setValue("passwordRequireLowercase", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
                        <Switch
                          id="passwordRequireNumbers"
                          checked={securityForm.watch("passwordRequireNumbers")}
                          onCheckedChange={(checked) => securityForm.setValue("passwordRequireNumbers", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="passwordRequireSymbols">Require Symbols</Label>
                        <Switch
                          id="passwordRequireSymbols"
                          checked={securityForm.watch("passwordRequireSymbols")}
                          onCheckedChange={(checked) => securityForm.setValue("passwordRequireSymbols", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure system notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">Notification settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Configure platform maintenance settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">Maintenance settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}