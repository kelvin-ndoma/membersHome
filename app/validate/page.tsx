// app/validate/page.tsx
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { QrReader } from 'react-qr-reader'
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Ticket,
  AlertCircle,
  Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ValidatePage() {
  const searchParams = useSearchParams()
  const houseSlug = searchParams.get('house')
  
  const [scanning, setScanning] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  const [entryPoint, setEntryPoint] = useState('Main Entrance')
  const [gateNumber, setGateNumber] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const handleScan = async (data: string | null) => {
    if (!data || validating) return
    
    console.log('📷 Scanned code:', data)
    setScanning(false)
    setValidating(true)
    
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketCode: data,
          houseSlug,
          entryPoint,
          gateNumber: gateNumber || undefined,
        }),
      })

      const result = await response.json()
      console.log('✅ Validation result:', result)
      setResult(result)

      if (result.valid) {
        toast.success('✅ Ticket validated!')
      } else {
        toast.error(result.error || 'Invalid ticket')
      }
    } catch (error) {
      console.error('Validation error:', error)
      toast.error('Validation failed')
      setResult({ valid: false, error: 'Validation failed' })
    } finally {
      setValidating(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    
    await handleScan(manualCode.trim().toUpperCase())
    setManualCode('')
  }

  const handlePreScan = async () => {
    if (!manualCode.trim()) return
    
    try {
      const response = await fetch(`/api/validate?code=${manualCode.trim().toUpperCase()}`)
      const data = await response.json()
      console.log('🔍 Pre-scan info:', data)
      setTicketInfo(data)
    } catch (error) {
      toast.error('Failed to fetch ticket info')
    }
  }

  const reset = () => {
    setResult(null)
    setTicketInfo(null)
    setScanning(true)
    setManualCode('')
    setCameraError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Ticket Scanner</h1>
          <p className="text-purple-100 mt-2">
            Scan QR codes to validate tickets at the entrance
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  QR Scanner
                </h2>
              </div>
              
              <div className="p-4">
                {scanning && !result && (
                  <div className="rounded-lg overflow-hidden">
                    <QrReader
                      onResult={(result) => {
                        if (result?.getText()) {
                          handleScan(result.getText())
                        }
                      }}
                      constraints={{ facingMode: 'environment' }}
                      videoStyle={{ width: '100%', height: 'auto', aspectRatio: '1/1' }}
                      ViewFinder={() => (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '200px',
                          height: '200px',
                          border: '2px solid #8B5CF6',
                          borderRadius: '12px',
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
                        }} />
                      )}
                    />
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Position the QR code within the scanner area
                    </p>
                  </div>
                )}

                {(result || !scanning) && (
                  <div className="space-y-4">
                    {result && (
                      <div className={`p-6 rounded-lg text-center ${
                        result.valid 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        {result.valid ? (
                          <>
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-green-800 mb-2">
                              ✅ Valid Ticket!
                            </h3>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-red-800 mb-2">
                              ❌ {result.error || 'Invalid Ticket'}
                            </h3>
                          </>
                        )}

                        {result.purchase && (
                          <div className="mt-4 text-left bg-white rounded-lg p-4">
                            <p className="font-medium text-gray-900">
                              {result.purchase.ticketName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {result.purchase.customerName}
                            </p>
                            {result.purchase.event && (
                              <p className="text-sm text-gray-500 mt-1">
                                {result.purchase.event.title}
                              </p>
                            )}
                            {result.valid && (
                              <p className="text-sm text-green-600 mt-2">
                                Remaining: {result.purchase.remaining} of {result.purchase.totalQuantity}
                              </p>
                            )}
                            {result.validation && (
                              <p className="text-xs text-gray-400 mt-2">
                                Validated at {new Date(result.validation.validatedAt).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={reset}
                      className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Scan Another Ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Entry & Settings */}
          <div className="space-y-6">
            {/* Manual Entry */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Manual Entry</h2>
              </div>
              
              <div className="p-4">
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Code
                    </label>
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="Enter 12-character code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-lg text-center tracking-wider"
                      maxLength={12}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handlePreScan}
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Check
                    </button>
                    <button
                      type="submit"
                      disabled={validating}
                      className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                    >
                      {validating ? 'Validating...' : 'Validate'}
                    </button>
                  </div>
                </form>

                {/* Ticket Preview */}
                {ticketInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Ticket Information</h3>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{ticketInfo.ticket?.name}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{ticketInfo.attendee?.name}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{ticketInfo.attendee?.email}</span>
                      </p>
                      {ticketInfo.ticket?.event && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{ticketInfo.ticket.event.title}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {ticketInfo.purchase?.usedCount} of {ticketInfo.purchase?.quantity} used
                        </span>
                      </p>
                      {ticketInfo.alreadyScanned && (
                        <p className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>Already scanned at {new Date(ticketInfo.lastValidation?.validatedAt).toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Settings</h2>
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Point
                  </label>
                  <select
                    value={entryPoint}
                    onChange={(e) => setEntryPoint(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>Main Entrance</option>
                    <option>VIP Entrance</option>
                    <option>Side Entrance</option>
                    <option>Back Entrance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gate Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    placeholder="e.g., Gate A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <p className="text-sm text-gray-500">
                  Scanner ready • {new Date().toLocaleString()}
                </p>
                {houseSlug && (
                  <p className="text-sm text-purple-600 mt-1">
                    House: {houseSlug}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}