import { createPortal } from 'react-dom'

export default function ModalAyuda({ contenido, onCerrar, abierto }) {
    if (!contenido || !abierto) return null

    return createPortal(
        <>
            <div
                className="fixed inset-0 bg-black/60 z-40"
                onClick={onCerrar}
            />
            <div
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                   bg-card border-t border-border rounded-t-3xl
                   z-50 p-6 space-y-5 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />

                <h3 className="text-textMain font-black text-xl">
                    {contenido.titulo}
                </h3>

                <div className="space-y-3">
                    {contenido.pasos.map(({ icono, titulo, texto }) => (
                        <div key={titulo} className="flex items-start gap-3">
                            <span className="text-2xl shrink-0 mt-0.5">{icono}</span>
                            <div>
                                <p className="text-textMain font-semibold text-sm">{titulo}</p>
                                <p className="text-textMuted text-xs mt-0.5 leading-relaxed">
                                    {texto}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onCerrar}
                    className="btn-primary w-full"
                >
                    ¡Entendido!
                </button>
            </div>
        </>,
        document.body
    )
}