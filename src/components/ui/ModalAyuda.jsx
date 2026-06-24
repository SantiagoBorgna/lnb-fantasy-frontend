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
                className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md md:max-w-lg mx-auto
                   bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                   z-50 p-6 md:p-8 space-y-5 md:space-y-6 animate-slide-up md:animate-none"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

                <h3 className="text-textMain font-black text-xl md:text-2xl">
                    {contenido.titulo}
                </h3>

                <div className="space-y-3">
                    {contenido.pasos.map(({ icono, titulo, texto }) => (
                        <div key={titulo} className="flex items-start gap-3 md:gap-4">
                            <span className="text-2xl md:text-3xl shrink-0 mt-0.5 md:mt-1">{icono}</span>
                            <div>
                                <p className="text-textMain font-semibold text-sm md:text-base">{titulo}</p>
                                <p className="text-textMuted text-xs md:text-sm mt-0.5 md:mt-1 leading-relaxed">
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