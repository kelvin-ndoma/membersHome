"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { QRScanner } from "@/components/ui/QRScanner"
import { Camera, X, CheckCircle, XCircle } from "lucide-react"

interface TicketScannerProps {
  onScan: (ticketCode: string) => Promise<{ valid: boolean; message: string }>
  onClose?: () => void
}

export function TicketScanner({ onScan, onClose }: TicketScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [result, setResult] = useState<{ valid: boolean; message: string } | null>(null)

  const handleScan = async (code: string) => {
    if (isValidating) return
    setIsValidating(true)
    setManualCode(code)
    try {
      const res = await onScan(code)
      setResult(res)
      if (res.valid) {
        setTimeout(() => {
          setResult(null)
          setManualCode("")
        }, 3000)
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleManualSubmit = async () => {
    if (manualCode && !isValidating) {
      await handleScan(manualCode)
    }
  }

  const handleQRScan = (result: string) => {
    handleScan(result)
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ticket Scanner</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${
            result.valid ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {result.valid ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span>{result.message}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={scanning ? "default" : "outline"}
            onClick={() => setScanning(!scanning)}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            {scanning ? "Stop Scanning" : "Start Camera"}
          </Button>
        </div>

        {scanning && (
          <div className="relative overflow-hidden rounded-lg border">
            <QRScanner onScan={handleQRScan} />
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Enter ticket code manually"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <Button onClick={handleManualSubmit} disabled={!manualCode || isValidating}>
            Validate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}