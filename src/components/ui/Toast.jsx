import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useUiStore } from '../../store/uiStore'
import clsx from 'clsx'

export default function Toast() {
    const { toast, hideToast } = useUiStore()

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(hideToast, 4000)
            return () => clearTimeout(timer)
        }
    }, [toast, hideToast])

    if (!toast) return null

    return createPortal(
        <div className="fixed top-28 md:top-12 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
            <div className={clsx(
                "px-5 py-3 rounded-2xl shadow-xl border font-semibold flex items-center gap-3 text-sm backdrop-blur-md",
                toast.tipo === 'success' 
                    ? "bg-green-950/80 text-green-400 border-green-500/30" 
                    : "bg-red-950/80 text-red-400 border-red-500/30"
            )}>
                {toast.tipo === 'success' ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
                <span className="whitespace-nowrap">{toast.mensaje}</span>
                <button 
                    onClick={hideToast}
                    className="ml-2 text-current opacity-50 hover:opacity-100 transition-opacity"
                >
                    &times;
                </button>
            </div>
        </div>,
        document.body
    )
}
