import { useState, useEffect } from 'react'
import { getTodosLosShowdowns, getPartidosDisponiblesParaShowdown, crearShowdownManual, eliminarShowdown } from '../../api/adminApi'
import { Loader2, Copy, CheckCircle, Trash2, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'

export default function AdminShowdownPanel() {
    const usuario = useAuthStore(state => state.usuario)
    const showToast = useUiStore(state => state.showToast)
    const navigate = useNavigate()

    const [partidos, setPartidos] = useState([])
    const [showdowns, setShowdowns] = useState([])
    const [loading, setLoading] = useState(true)
    const [copiadoId, setCopiadoId] = useState(null)
    const [creandoId, setCreandoId] = useState(null)

    useEffect(() => {
        if (usuario?.rol !== 'ADMIN') return;
        cargarDatos()
    }, [usuario])

    const cargarDatos = async () => {
        try {
            setLoading(true)
            const [pData, sData] = await Promise.all([
                getPartidosDisponiblesParaShowdown(),
                getTodosLosShowdowns()
            ])
            setPartidos(pData)
            setShowdowns(sData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)))
        } catch (error) {
            console.error("Error al cargar datos del admin panel", error)
            showToast("Error cargando el panel", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleCrear = async (partidoId) => {
        try {
            setCreandoId(partidoId)
            await crearShowdownManual(partidoId)
            showToast("¡Showdown creado exitosamente!", "success")
            cargarDatos()
        } catch (error) {
            showToast("Error al crear showdown", "error")
        } finally {
            setCreandoId(null)
        }
    }

    const handleCopiar = (codigo, id) => {
        const link = `${window.location.origin}/showdown/${codigo}`
        navigator.clipboard.writeText(link)
        setCopiadoId(id)
        setTimeout(() => setCopiadoId(null), 2000)
    }

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este Showdown? Esto borrará también a todos los participantes inscriptos.")) return;
        
        try {
            await eliminarShowdown(id)
            showToast("Showdown eliminado", "success")
            cargarDatos()
        } catch (error) {
            showToast("Error al eliminar showdown", "error")
        }
    }

    if (usuario?.rol !== 'ADMIN') {
        return <Navigate to="/" replace />
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg dark flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg dark flex flex-col p-4 md:p-8">
            <div className="max-w-5xl mx-auto w-full space-y-8">
                
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <ShieldAlert className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-2xl font-black text-textMain tracking-tight">Panel de Administrador</h1>
                        <p className="text-textMuted text-sm">Gestión de herramientas y Showdowns</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Partidos Disponibles */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-textMain">Próximos Partidos (Sin Showdown)</h2>
                        
                        <div className="space-y-3">
                            {partidos.length === 0 ? (
                                <div className="bg-surface rounded-xl p-6 text-center text-textMuted text-sm border border-border">
                                    No hay partidos PROGRAMADOS sin Showdown en este momento.
                                </div>
                            ) : (
                                partidos.map(p => (
                                    <div key={p.id} className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                                        <div>
                                            <p className="font-bold text-textMain">
                                                {p.equipoLocal} vs {p.equipoVisitante}
                                            </p>
                                            <p className="text-xs text-textMuted mt-1">
                                                {new Date(p.fechaHora).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleCrear(p.id)}
                                            disabled={creandoId === p.id}
                                            className="px-4 py-2 bg-primary text-bg font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {creandoId === p.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Crear Link'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Showdowns Creados */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-textMain">Showdowns Históricos</h2>
                        
                        <div className="space-y-3">
                            {showdowns.length === 0 ? (
                                <div className="bg-surface rounded-xl p-6 text-center text-textMuted text-sm border border-border">
                                    Aún no creaste ningún Showdown.
                                </div>
                            ) : (
                                showdowns.map(s => (
                                    <div key={s.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm relative group overflow-hidden">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-black text-textMain text-lg leading-tight">
                                                    {s.localSigla} vs {s.visitanteSigla}
                                                </p>
                                                <p className="text-xs text-textMuted mt-0.5">
                                                    {new Date(s.fecha).toLocaleDateString('es-AR')}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                                                    ${s.estado === 'ABIERTO' ? 'bg-warning/20 text-warning' : 
                                                      s.estado === 'EN_CURSO' ? 'bg-primary/20 text-primary' : 
                                                      'bg-white/10 text-white/50'}`}
                                                >
                                                    {s.estado.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-textMuted font-medium">
                                                    {s.participantesCount} inscriptos
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5">
                                            <button
                                                onClick={() => handleCopiar(s.codigoInscripcion, s.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-semibold text-textMain transition-colors"
                                            >
                                                {copiadoId === s.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                {copiadoId === s.id ? '¡Copiado!' : 'Copiar Link'}
                                            </button>
                                            
                                            <button
                                                onClick={() => handleEliminar(s.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                title="Eliminar evento"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <button onClick={() => navigate('/')} className="text-sm font-medium text-textMuted hover:text-white transition-colors">
                        &larr; Volver a la App
                    </button>
                </div>
            </div>
        </div>
    )
}
