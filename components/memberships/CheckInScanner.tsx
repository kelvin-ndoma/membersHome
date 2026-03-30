"use client"

import { useState } from "react"
import { QRScanner } from "@/components/ui/QRScanner"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { CheckCircle, XCircle, Camera, User, Calendar, RefreshCw, Mail } from "lucide-react"
import { format } from "date-fns"

interface CheckInResult {
  success: boolean
  message: string
  member?: {
    name: string
    email: string
    title?: string | null
  }
  event?: {
    title: string
    startDate: Date
  }
  checkedInAt?: Date
}

interface CheckInScannerProps {
  onScan: (qrData: string) => Promise<CheckInResult>
  eventName?: string
  isLoading?: boolean
}

export function CheckInScanner({ onScan, eventName, isLoading = false }: CheckInScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleScan = async (data: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    try {
      const res = await onScan(data)
      setResult(res)
      if (res.success) {
        setTimeout(() => {
          setResult(null)
          setManualCode("")
        }, 5000)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = async () => {
    if (manualCode && !isProcessing) {
      await handleScan(manualCode)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Check-In Scanner
        </CardTitle>
        {eventName && (
          <CardDescription>
            Scanning for: {eventName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div className={`rounded-lg border p-4 ${
            result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={result.success ? "text-green-800" : "text-red-800"}>
                {result.message}
              </span>
            </div>
            {result.success && result.member && (
              <div className="mt-3 space-y-2 border-t border-green-200 pt-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{result.member.name}</span>
                  {result.member.title && (
                    <Badge variant="outline" className="text-xs">
                      {result.member.title}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Mail className="h-4 w-4" />
                  <span>{result.member.email}</span>
                </div>
                {result.event && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Calendar className="h-4 w-4" />
                    <span>{result.event.title}</span>
                  </div>
                )}
                {result.checkedInAt && (
                  <p className="text-xs text-green-600">
                    Checked in at {format(new Date(result.checkedInAt), "h:mm a")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={scanning ? "default" : "outline"}
            onClick={() => setScanning(!scanning)}
            className="flex-1"
            disabled={isLoading}
          >
            <Camera className="mr-2 h-4 w-4" />
            {scanning ? "Stop Scanning" : "Start Camera"}
          </Button>
        </div>

        {scanning && (
          <div className="relative overflow-hidden rounded-lg border bg-black">
            <QRScanner onScan={handleScan} />
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Enter QR code or member ID manually"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            disabled={isLoading || isProcessing}
            className="font-mono"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualCode || isLoading || isProcessing}
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              "Check In"
            )}
          </Button>
        </div>

        <div className="rounded-lg bg-muted p-3 text-center">
          <p className="text-sm text-muted-foreground">
            {scanning 
              ? "Position the QR code in front of the camera" 
              : "Click 'Start Camera' to scan QR codes or enter manually"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}