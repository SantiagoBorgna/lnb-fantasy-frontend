import axiosClient from '../api/axiosClient'
import { ligaActual } from '../store/ligaStore'

/**
 * Notificaciones push por liga. El permiso es del navegador (uno solo para el sitio),
 * pero cada liga tiene su backend y guarda sus propios dispositivos: por eso, si el permiso
 * ya está dado, el dispositivo se registra solo en la liga en la que se está jugando.
 * Desactivar desde el perfil apaga solo la liga actual.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

const claveApagado = () => `push-apagado-${ligaActual().id}`
const claveRegistrado = () => `push-registrado-${ligaActual().id}`

function leer(storage, clave) {
    try { return storage.getItem(clave) } catch { return null }
}
function escribir(storage, clave, valor) {
    try {
        if (valor == null) storage.removeItem(clave)
        else storage.setItem(clave, valor)
    } catch { /* sin storage (modo privado): no pasa nada */ }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from(rawData, c => c.charCodeAt(0))
}

export const pushSoportado = () =>
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const pushActivoEnEstaLiga = () =>
    pushSoportado() && Notification.permission === 'granted' && leer(localStorage, claveApagado()) !== '1'

async function suscripcionDelNavegador(crear) {
    const registration = await navigator.serviceWorker.ready
    let suscripcion = await registration.pushManager.getSubscription()
    if (!suscripcion && crear) {
        suscripcion = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
    }
    return suscripcion
}

/** Activa las notificaciones en la liga actual (pide permiso si hace falta). true si quedaron activas. */
export async function activarPush() {
    if (!pushSoportado()) return false
    const permiso = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
    if (permiso !== 'granted') return false
    if (!VAPID_PUBLIC_KEY) throw new Error('VITE_VAPID_PUBLIC_KEY no está configurada.')

    const suscripcion = await suscripcionDelNavegador(true)
    await axiosClient.post('/notificaciones/suscribir', suscripcion.toJSON())
    escribir(localStorage, claveApagado(), null)
    escribir(sessionStorage, claveRegistrado(), '1')
    return true
}

/** Apaga las notificaciones de la liga actual (las de la otra liga siguen como estaban). */
export async function desactivarPush() {
    escribir(localStorage, claveApagado(), '1')
    escribir(sessionStorage, claveRegistrado(), null)
    const suscripcion = await suscripcionDelNavegador(false)
    if (suscripcion) await axiosClient.post('/notificaciones/desuscribir', suscripcion.toJSON())
}

/** Si el permiso ya está dado, registra el dispositivo en la liga actual sin preguntar (una vez por sesión). */
export async function registrarSiYaHayPermiso() {
    if (!pushActivoEnEstaLiga() || !VAPID_PUBLIC_KEY) return
    if (leer(sessionStorage, claveRegistrado()) === '1') return
    try {
        await activarPush()
    } catch (error) {
        console.warn('[push] No se pudo registrar el dispositivo en esta liga:', error)
    }
}
