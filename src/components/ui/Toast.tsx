import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
  type?: 'success' | 'error' | 'info'
}

export default function Toast({
  message,
  isVisible,
  onClose,
  duration = 3000,
  type = 'success'
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsExiting(false)
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 200) // Wait for exit animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible && !isExiting) return null

  const bgColor = type === 'success'
    ? 'bg-accent-600'
    : type === 'error'
    ? 'bg-red-600'
    : 'bg-violet-600'

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto ${
          isExiting ? 'toast-exit' : 'toast-enter'
        }`}
      >
        <CheckCircle size={20} strokeWidth={2} />
        <span className="font-medium text-sm">{message}</span>
        <button
          onClick={() => {
            setIsExiting(true)
            setTimeout(onClose, 200)
          }}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

// Hook for easy toast usage
import { createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, isVisible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
