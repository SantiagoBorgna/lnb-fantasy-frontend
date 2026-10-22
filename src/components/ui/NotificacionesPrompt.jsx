import { useState, useEffect } from 'react'
import { useLigaStore } from '../../store/ligaStore'
import { pushSoportado, activarPush, registrarSiYaHayPermiso } from '../../utils/push'

export default function NotificacionesPrompt() {
    const [mostrar, setMostrar] = useState(false)
    const [cargando, setCargando] = useState(false)
    const ligaId = useLigaStore(state => state.ligaId)

    useEffect(() => {
        if (!pushSoportado()) return
        if (Notification.permission === 'default') {
            const t = setTimeout(() => setMostrar(true), 3000)
            return () => clearTimeout(t)
        }
        // Ya aceptó (quizás en la otra liga): registramos el dispositivo en esta liga sin preguntar
        registrarSiYaHayPermiso()
    }, [ligaId])

    const suscribir = async () => {
        setCargando(true)
        try {
            await activarPush()
            setMostrar(false)
        } catch (error) {
            console.error('Error suscribiendo:', error)
            const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || error.toString()
            const { useUiStore } = await import('../../store/uiStore')
            useUiStore.getState().showToast('Hubo un error al suscribirte: ' + errorMsg, 'error')
        } finally {
            setCargando(false)
        }
    }

    if (!mostrar) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-scale-up text-center">
                {/* Decoration */}
                <div className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center border-4 border-surface shadow-lg mb-6">
                    <span className="text-4xl animate-bounce">🔔</span>
                </div>

                <div>
                    <h3 className="text-textMain text-xl font-bold">¡No te pierdas de nada!</h3>
                    <p className="text-textMuted text-sm mt-3 leading-relaxed">
                        Activá las notificaciones para enterarte al instante cómo le fue a tu equipo en la jornada y recibir alertas antes del cierre del mercado.
                    </p>

                    <div className="flex flex-col gap-3 mt-8">
                        <button
                            onClick={suscribir}
                            disabled={cargando}
                            className="bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold py-3 px-4 rounded-xl active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {cargando ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Activando...
                                </>
                            ) : (
                                'Activar Notificaciones'
                            )}
                        </button>
                        <button
                            onClick={() => setMostrar(false)}
                            className="text-textMuted hover:text-textMain transition-colors text-sm font-semibold py-2 px-4 rounded-xl active:scale-95"
                        >
                            Quizás más tarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
