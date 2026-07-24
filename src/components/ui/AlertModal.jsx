import { createPortal } from 'react-dom'

export default function AlertModal({ isOpen, onClose, titulo, mensaje }) {
    if (!isOpen) return null

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
            <div
                className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-sm mx-auto
                 bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                 z-[70] p-6 space-y-5 animate-slide-up md:animate-none shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-textMain font-bold text-lg">{titulo || 'Atención'}</h2>
                        <p className="text-textMuted text-sm mt-2 leading-relaxed">{mensaje}</p>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl font-bold bg-primary text-white active:scale-95 transition-transform"
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
