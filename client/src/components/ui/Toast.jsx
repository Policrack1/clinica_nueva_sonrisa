import {
  useState,
  useCallback,
  createContext,
  useContext
} from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((msg, type = '') => {
    const id = Date.now()

    setToasts(t => [...t, { id, msg, type }])

    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 3500)
  }, [])

  const COLORS = {
    success: 'border-emerald-500',
    error: 'border-red-500',
    warning: 'border-amber-500',
    '': 'border-blue-500',
  }

  const ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    '': 'ℹ️'
  }

  return (
    <ToastCtx.Provider value={push}>
      {children}

      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${COLORS[t.type] || COLORS['']}`}>
            <span>{ICONS[t.type] || 'ℹ️'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}