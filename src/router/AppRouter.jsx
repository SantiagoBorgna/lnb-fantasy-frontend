import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

import LoginPage from '../pages/LoginPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import OnboardingPerfilPage from '../pages/onboarding/OnboardingPerfilPage'
import OnboardingReglas from '../pages/onboarding/OnboardingReglasPage'
import OnboardingCanchita from '../pages/onboarding/OnboardingCanchitaPage'
import DashboardPage from '../pages/DashboardPage'
import CanchitaPage from '../pages/CanchitaPage'
import MercadoPage from '../pages/MercadoPage'
import TorneosPage from '../pages/TorneosPage'
import LideresPage from '../pages/LideresPage'
import AppShell from '../components/ui/AppShell'
import TorneoDetallePage from '../pages/TorneoDetallePage'


function PrivateRoute({ children }) {
    const token = useAuthStore(state => state.token)
    return token ? children : <Navigate to="/login" replace />
}

/**
 * Ruta que solo permite acceso si el onboarding está COMPLETO.
 * Redirige al paso correcto según el estado del usuario.
 */
function OnboardingGuard({ children }) {
    const token = useAuthStore(state => state.token)
    const usuario = useAuthStore(state => state.usuario)

    if (!token) return <Navigate to="/login" replace />

    const estado = usuario?.estadoOnboarding

    if (estado === 'NUEVO') return <Navigate to="/onboarding/perfil" replace />
    if (estado === 'PERFIL_COMPLETO') return <Navigate to="/onboarding/canchita" replace />

    return children   // ACTIVO → acceso completo
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ── Públicas ───────────────────────────────────────────── */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* ── Onboarding ─────────────────────────────────────────── */}
                <Route path="/onboarding/perfil" element={
                    <PrivateRoute><OnboardingPerfilPage /></PrivateRoute>
                } />
                <Route path="/onboarding/reglas" element={
                    <PrivateRoute><OnboardingReglas /></PrivateRoute>
                } />
                <Route path="/onboarding/canchita" element={
                    <PrivateRoute><OnboardingCanchita /></PrivateRoute>
                } />
                <Route path="/onboarding/mercado" element={
                    <PrivateRoute><MercadoPage modoOnboarding={true} /></PrivateRoute>
                } />
                <Route path="/onboarding/mercado" element={
                    <PrivateRoute><MercadoPage /></PrivateRoute>
                } />

                {/* ── App principal — solo usuarios ACTIVOS ──────────────── */}
                <Route path="/" element={
                    <PrivateRoute>
                        <OnboardingGuard>
                            <AppShell />
                        </OnboardingGuard>
                    </PrivateRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="canchita" element={<CanchitaPage />} />
                    <Route path="mercado" element={<MercadoPage />} />
                    <Route path="torneos" element={<TorneosPage />} />
                    <Route path="torneos/:torneoId" element={<TorneoDetallePage />} />
                    <Route path="lideres" element={<LideresPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}