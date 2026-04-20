// components/ui/ThemeModal.tsx
'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { ThemeButton } from './ThemeButton'

interface ThemeModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: 'primary' | 'danger'
}

export function ThemeModal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  variant = 'primary',
}: ThemeModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const confirmButtonVariant = variant === 'danger' ? 'danger' : 'primary'
  const confirmButtonStyle = variant === 'danger' 
    ? 'bg-red-600 hover:bg-red-700 text-white' 
    : undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6">{children}</div>
        
        <div className="flex justify-end gap-3">
          <ThemeButton variant="outline" onClick={onClose}>
            {cancelText}
          </ThemeButton>
          {onConfirm && (
            <ThemeButton 
              variant={variant === 'danger' ? 'primary' : 'primary'}
              onClick={onConfirm}
              loading={loading}
              className={confirmButtonStyle}
            >
              {confirmText}
            </ThemeButton>
          )}
        </div>
      </div>
    </div>
  )
}