import { X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }[size]

  return (
    <div
      className={`modal-overlay ${open ? 'open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`modal-box ${maxW}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>
            <X size={14}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalFooter({
  onClose,
  onConfirm,
  confirmLabel = 'Guardar',
  confirmClass = 'btn-primary',
  loading = false
}) {
  return (
    <div className="modal-footer">
      <button className="btn btn-secondary" onClick={onClose}>
        Cancelar
      </button>

      <button
        className={`btn ${confirmClass}`}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Guardando...' : confirmLabel}
      </button>
    </div>
  )
}