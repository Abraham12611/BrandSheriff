import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

type Toast = {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<{
  toast: (kind: ToastKind, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  error: <XCircle className="w-4 h-4 text-rose-500" />,
  info: <Info className="w-4 h-4 text-sky-500" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++
      setToasts((prev) => [...prev.slice(-4), { id, kind, message }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = {
    toast,
    success: useCallback((m: string) => toast('success', m), [toast]),
    error: useCallback((m: string) => toast('error', m), [toast]),
    info: useCallback((m: string) => toast('info', m), [toast]),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto app-panel animate-toast-in px-4 py-3 flex items-start gap-2.5"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.14)' }}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.kind]}</span>
            <span className="text-sm text-neutral-800 flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 text-neutral-400 hover:text-neutral-700 shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
