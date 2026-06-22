import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function NotificacionesPrompt() {
    const [mostrar, setMostrar] = useState(false)
    const [cargando, setCargando] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            if (Notification.permission === 'default') {
                setTimeout(() => setMostrar(true), 3000)
            }
        }
    }, [])

    const suscribir = async () => {
        setCargando(true)
        console.log('[DEBUG] 1. Iniciando proceso de suscripción...')
        try {
            const permission = await Notification.requestPermission()
            console.log('[DEBUG] 2. Permiso Notification:', permission)
            
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready
                console.log('[DEBUG] 3. Service Worker Listo. Scope:', registration.scope)
                
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })
                console.log('[DEBUG] 4. Suscripción generada:', subscription.toJSON())

                console.log('[DEBUG] 5. Enviando al backend...')
                const response = await axiosClient.post('/notificaciones/suscribir', subscription.toJSON())
                console.log('[DEBUG] 6. Respuesta del backend:', response.status)
                
                setMostrar(false)
            } else {
                console.log('[DEBUG] 2b. El usuario no dio permiso o lo bloqueó')
                setMostrar(false)
            }
        } catch (error) {
            console.error('[DEBUG] Error crítico al suscribir:', error)
            alert('Oops, hubo un error técnico al suscribirte:\n' + (error.response?.data?.error || error.response?.data?.message || error.message || error.toString()))
        } finally {
            console.log('[DEBUG] 7. Finalizando carga')
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