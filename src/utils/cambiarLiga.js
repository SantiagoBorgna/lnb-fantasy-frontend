import { buscarLiga } from '../config/ligas'
import { useLigaStore } from '../store/ligaStore'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useTransferenciaStore } from '../store/transferenciaStore'
import { useDraftStore } from '../store/draftStore'
import { queryClient } from '../queryClient'

/**
 * Pasa a jugar otra liga. Todo lo que había en memoria es de la liga anterior
 * (datos, torneo draft elegido, transferencias a medio hacer, el perfil), así que se descarta;
 * el perfil se vuelve a pedir al backend de la nueva liga (ver OnboardingGuard).
 * @returns true si cambió
 */
export function cambiarLiga(id) {
    if (!buscarLiga(id) || useLigaStore.getState().ligaId === id) return false

    useLigaStore.getState().setLigaId(id)
    queryClient.clear()
    useGameStore.getState().clearGameData()
    const transferencia = useTransferenciaStore.getState()
    transferencia.cancelarTransferencia()
    transferencia.cancelarEntrada()
    useDraftStore.getState().resetDraft()
    useAuthStore.getState().setUsuario(null)
    return true
}

// Links con ?liga=... (invitaciones, QR del Modo Estadio): se abren en esa liga
export function aplicarLigaDeUrl() {
    try {
        const id = new URLSearchParams(window.location.search).get('liga')
        if (id) cambiarLiga(id)
    } catch {
        // sin URL válida seguimos con la liga que había
    }
}
