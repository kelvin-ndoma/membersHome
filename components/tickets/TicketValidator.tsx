"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

interface ValidationResult {
  valid: boolean
  ticketName?: string
  attendeeName?: string
  validatedAt?: Date
  isReentry?: boolean
  usedCount?: number
  totalQuantity?: number
  message?: string
}

interface TicketValidatorProps {
  onValidate: (ticketCode: string, isReentry: boolean) => Promise<ValidationResult>
}

export function TicketValidator({ onValidate }: TicketValidatorProps) {
  const [ticketCode, setTicketCode] = useState("")
  const [isReentry, setIsReentry] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)

  const handleValidate = async () => {
    if (!ticketCode || isValidating) return

    setIsValidating(true)
    try {
      const res = await onValidate(ticketCode, isReentry)
      setResult(res)
      if (res.valid) {
        setTimeout(() => {
          setTicketCode("")
          setResult(null)
        }, 5000)
      }
    } catch (error) {
      setResult({ valid: false, message: "Validation failed" })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Validator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div className={`rounded-lg border p-4 ${
            result.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={result.valid ? "text-green-800" : "text-red-800"}>
                {result.message || (result.valid ? "Ticket is valid" : "Invalid ticket")}
              </span>
            </div>
            {result.valid && result.ticketName && (
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>Ticket:</strong> {result.ticketName}</p>
                {result.attendeeName && <p><strong>Attendee:</strong> {result.attendeeName}</p>}
                {result.usedCount !== undefined && result.totalQuantity && (
                  <p><strong>Usage:</strong> {result.usedCount} / {result.totalQuantity}</p>
                )}
                {result.isReentry && <Badge>Reentry</Badge>}
                {result.validatedAt && (
                  <p className="text-muted-foreground">
                    {new Date(result.validatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Input
            placeholder="Enter ticket code"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
            className="font-mono"
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isReentry}
                onChange={(e) => setIsReentry(e.target.checked)}
                className="rounded"
              />
              Mark as reentry
            </label>
          </div>
        </div>

        <Button onClick={handleValidate} disabled={!ticketCode || isValidating} className="w-full">
          {isValidating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            "Validate Ticket"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}