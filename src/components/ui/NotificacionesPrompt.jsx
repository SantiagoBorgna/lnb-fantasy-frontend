import { useState, useEffect } from 'react'
import axiosClient from '../../api/axiosClient' // Asegurate de que la ruta sea correcta

// 🚨 REEMPLAZÁ ESTO CON TU LLAVE PÚBLICA VAPID EXACTA 🚨
const VAPID_PUBLIC_KEY = 'ACA_VA_TU_LLAVE_PUBLICA_GENERADA_EN_EL_BACKEND'

// Función mágica necesaria para convertir la llave al formato que pide el navegador
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
        // Solo mostramos el cartel si el navegador soporta Service Workers y Notificaciones
        // y si el usuario todavía no tomó una decisión (default).
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            if (Notification.permission === 'default') {
                // Esperamos un par de segundos para no agobiarlo apenas entra
                setTimeout(() => setMostrar(true), 3000)
            }
        }
    }, [])

    const suscribir = async () => {
        setCargando(true)
        try {
            // 1. Pedimos permiso al usuario (acá le salta el popup nativo de Chrome/Safari)
            const permission = await Notification.requestPermission()
            
            if (permission === 'granted') {
                // 2. Buscamos el Service Worker que generó Vite
                const registration = await navigator.serviceWorker.ready
                
                // 3. Generamos el Token único para este celular
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })

                // 4. Se lo mandamos a nuestro Spring Boot
                await axiosClient.post('/notificaciones/suscribir', subscription.toJSON())
                
                setMostrar(false)
            } else {
                setMostrar(false) // Dijo que no, lo ocultamos
            }
        } catch (error) {
            console.error('Error al suscribir:', error)
        } finally {
            setCargando(false)
        }
    }

    if (!mostrar) return null

    return (
        <div className="fixed bottom-20 left-4 right-4 bg-surface border-2 border-primary rounded-2xl p-4 shadow-2xl z-50 animate-slide-up">
            <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0 text-2xl">
                    🔔
                </div>
                <div className="flex-1">
                    <h3 className="text-textMain font-bold">¡Activá las notificaciones!</h3>
                    <p className="text-textMuted text-xs mt-1">
                        Enterate al instante cómo le fue a tu equipo en la jornada y no te olvides de armar tu plantel.
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={suscribir} 
                            disabled={cargando}
                            className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-lg flex-1 active:scale-95"
                        >
                            {cargando ? 'Activando...' : '¡Quiero enterarme!'}
                        </button>
                        <button 
                            onClick={() => setMostrar(false)} 
                            className="bg-card text-textMuted border border-border text-xs font-bold py-2 px-4 rounded-lg active:scale-95"
                        >
                            Ahora no
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}