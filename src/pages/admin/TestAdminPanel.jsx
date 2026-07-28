import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import axiosClient from '../../api/axiosClient'
import { Navigate } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import AppShell from '../../components/ui/AppShell'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function TestAdminPanel() {
    const usuario = useAuthStore(state => state.usuario)
    const showToast = useUiStore(state => state.showToast)
    const [loading, setLoading] = useState(false)
    const [jornadaId, setJornadaId] = useState('')

    if (usuario?.rol !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />
    }

    const handleResetDb = async () => {
        if (!window.confirm("ATENCION: Esto va a borrar todos los usuarios, planteles, mercado y partidos. Estas seguro?")) return;
        setLoading(true)
        try {
            const res = await axiosClient.post('/admin/test/reset-db')
            showToast(res.data.message || 'Base de datos limpia', 'success')
        } catch (error) {
            showToast('Error al limpiar DB', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSeedJornadas = async () => {
        setLoading(true)
        try {
            const res = await axiosClient.post('/admin/test/seed-jornadas')
            showToast(res.data.message || 'Jornadas generadas', 'success')
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al generar jornadas', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSimularJornada = async () => {
        if (!jornadaId) {
            showToast('Ingresa el ID de la jornada', 'error')
            return
        }
        setLoading(true)
        try {
            const res = await axiosClient.post(`/admin/test/simular-jornada/${jornadaId}`)
            showToast(res.data.message || 'Jornada simulada', 'success')
        } catch (error) {
            showToast(error.response?.data?.message || 'Error al simular jornada', 'error')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppShell hideNav={true}>
            <div className="p-4 max-w-lg mx-auto">
                <h1 className="text-2xl font-bold text-white mb-2">🛠️ Panel de Pruebas (Admin)</h1>
                <p className="text-gray-400 mb-6 text-sm">
                    Acceso restringido. Estas acciones modifican la base de datos de producción.
                </p>

                <div className="space-y-6">
                    {/* Tarjeta Reset */}
                    <div className="bg-darkCard p-4 rounded-xl border border-red-500/30">
                        <h2 className="text-red-400 font-bold mb-2">1. Reset Transaccional</h2>
                        <p className="text-xs text-gray-400 mb-4">Borra usuarios, torneos, planteles y estadísticas. Mantiene jugadores y equipos reales.</p>
                        <button 
                            onClick={handleResetDb} 
                            disabled={loading}
                            className="w-full bg-red-600/20 text-red-400 border border-red-600/50 py-2 rounded-lg font-bold hover:bg-red-600/30 transition"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : 'LIMPIAR BASE DE DATOS'}
                        </button>
                    </div>

                    {/* Tarjeta Seed */}
                    <div className="bg-darkCard p-4 rounded-xl border border-white/10">
                        <h2 className="text-white font-bold mb-2">2. Generar Fixture Falso</h2>
                        <p className="text-xs text-gray-400 mb-4">Crea 3 jornadas consecutivas y empareja a los 20 equipos reales al azar.</p>
                        <button 
                            onClick={handleSeedJornadas} 
                            disabled={loading}
                            className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary-hover transition"
                        >
                            {loading ? <LoadingSpinner size="sm" /> : 'GENERAR 3 JORNADAS'}
                        </button>
                    </div>

                    {/* Tarjeta Simular */}
                    <div className="bg-darkCard p-4 rounded-xl border border-white/10">
                        <h2 className="text-white font-bold mb-2">3. Simular Resultados</h2>
                        <p className="text-xs text-gray-400 mb-4">Genera estadísticas aleatorias para los jugadores y cierra la jornada indicada.</p>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                placeholder="ID Jornada (Ej: 1)" 
                                value={jornadaId}
                                onChange={(e) => setJornadaId(e.target.value)}
                                className="bg-darkBg border border-white/10 rounded-lg px-3 py-2 text-white w-1/3 outline-none focus:border-primary"
                            />
                            <button 
                                onClick={handleSimularJornada} 
                                disabled={loading}
                                className="w-2/3 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-500 transition"
                            >
                                {loading ? <LoadingSpinner size="sm" /> : 'SIMULAR JORNADA'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
