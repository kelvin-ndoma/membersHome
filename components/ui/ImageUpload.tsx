// components/ui/ImageUpload.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  className?: string
}

export default function ImageUpload({ value, onChange, folder = 'events', className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setPreview(URL.createObjectURL(file))

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      onChange(result.url)
      setPreview(result.url)
    } catch (error) {
      console.error('Upload error:', error)
      setPreview(value || null)
    } finally {
      setIsUploading(false)
    }
  }, [onChange, folder, value])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleRemove = () => {
    setPreview(null)
    onChange('')
  }

  return (
    <div className={className}>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={225}
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {isDragActive ? 'Drop the image here' : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF, WebP up to 5MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}