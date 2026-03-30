"use client"

import { useEffect, useRef } from "react"

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: Error) => void
  constraints?: MediaTrackConstraints
}

export function QRScanner({ onScan, onError, constraints = { facingMode: "environment" } }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanningRef = useRef(true)

  useEffect(() => {
    let stream: MediaStream | null = null

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: constraints })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          scanQRCode()
        }
      } catch (err) {
        onError?.(err as Error)
      }
    }

    const scanQRCode = () => {
      if (!videoRef.current || !canvasRef.current || !scanningRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (video.videoWidth > 0 && context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        // Simple QR code detection - in production use a proper QR library
        // This is a placeholder - you'll need to integrate a proper QR scanner library
        console.log("Scanning for QR codes...")
      }

      requestAnimationFrame(scanQRCode)
    }

    startCamera()

    return () => {
      scanningRef.current = false
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [constraints, onError])

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-48 rounded-lg border-2 border-white shadow-lg" />
      </div>
    </div>
  )
}