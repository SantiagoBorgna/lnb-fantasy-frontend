import { useState, useEffect } from 'react'
import { getJornadas } from '../../api/jornadaApi'
import { getQuintetosPorJornada } from '../../api/adminApi'
import { Loader2, Star, ShieldAlert } from 'lucide-react'
import CamisetaSVG from '../../components/jugador/CamisetaSVG'

export default function AdminQuintetosPanel() {
    const [jornadas, setJornadas] = useState([])
    const [jornadaSeleccionada, setJornadaSeleccionada] = useState('')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        cargarJornadas()
    }, [])

    useEffect(() => {
        if (jornadaSeleccionada) {
            cargarQuintetos(jornadaSeleccionada)
        } else {
            setData(null)
        }
    }, [jornadaSeleccionada])

    const cargarJornadas = async () => {
        try {
            const list = await getJornadas()
            // Filtramos solo las que ya empezaron o terminaron
            const jugadas = list.filter(j => j.estado === 'ACTIVA' || j.estado === 'FINALIZADA')
            setJornadas(jugadas)
            if (jugadas.length > 0) {
                setJornadaSeleccionada(jugadas[jugadas.length - 1].id.toString())
            }
        } catch (err) {
            console.error(err)
            setError('Error al cargar jornadas')
        }
    }

    const cargarQuintetos = async (id) => {
        try {
            setLoading(true)
            setError('')
            const response = await getQuintetosPorJornada(id)
            setData(response)
        } catch (err) {
            console.error(err)
            setError('Error al cargar quintetos')
        } finally {
            setLoading(false)
        }
    }

    const formatearPosicion = (pos) => {
        const mapa = {
            'BASE': 'Base',
            'ESCOLTA': 'Escolta',
            'ALERO': 'Alero',
            'ALA_PIVOT': 'Ala Pivot',
            'PIVOT': 'Pivot'
        }
        return mapa[pos] || pos
    }

    const renderJugador = (jugador, index) => (
        <div key={`${jugador.id}-${index}`} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <CamisetaSVG 
                        numero={jugador.numeroCamiseta}
                        modelo={jugador.modeloCamiseta}
                        colorPrincipal={jugador.colorPrincipal}
                        colorSecundario={jugador.colorSecundario}
                        size={48}
                    />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-textMain font-bold">{jugador.nombre} {jugador.apellido}</p>
                        {jugador.esCapitan && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </div>
                    <p className="text-textMuted text-sm">{jugador.clubReal}  {formatearPosicion(jugador.posicion)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-black text-textMain">{jugador.puntosFantasy.toFixed(1)}</p>
                <p className="text-xs font-medium text-textMuted uppercase tracking-wider">pts</p>
            </div>
        </div>
    )

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <ShieldAlert className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">{error}</p>
                <button onClick={cargarJornadas} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold">Reintentar</button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Selector */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-textMain">Seleccionar Jornada</h2>
                <select
                    value={jornadaSeleccionada}
                    onChange={(e) => setJornadaSeleccionada(e.target.value)}
                    className="bg-card text-textMain border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="" disabled>Elegir jornada...</option>
                    {jornadas.map(j => (
                        <option key={j.id} value={j.id}>Jornada {j.numero}</option>
                    ))}
                </select>
            </div>

            {loading && (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            )}

            {!loading && data && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mejor Equipo Usuario */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h3 className="text-xl font-black text-textMain relative z-10">Mejor Quinteto (Usuario)</h3>
                            <p className="text-textMuted mt-1 relative z-10">
                                Ganador de la fecha: <span className="text-primary font-bold">{data.nombreUsuarioGanador}</span>
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg relative z-10">
                                <span className="text-sm font-medium text-textMuted">Puntaje Total:</span>
                                <span className="text-primary font-black">{data.puntajeUsuarioGanador.toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {data.mejorQuintetoUsuario.length === 0 ? (
                                <p className="text-textMuted text-center py-8">No hay datos para esta jornada</p>
                            ) : (
                                data.mejorQuintetoUsuario.map((j, i) => renderJugador(j, i))
                            )}
                        </div>
                    </div>

                    {/* Quinteto Ideal Teórico */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-surface border border-border rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h3 className="text-xl font-black text-textMain relative z-10">Quinteto Ideal (Teórico)</h3>
                            <p className="text-textMuted mt-1 relative z-10">
                                La mejor combinación posible de titulares
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg relative z-10">
                                <span className="text-sm font-medium text-textMuted">Puntaje Teórico:</span>
                                <span className="text-yellow-500 font-black">{data.puntajeQuintetoIdeal.toFixed(1)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {data.quintetoIdealTeorico.length === 0 ? (
                                <p className="text-textMuted text-center py-8">No hay datos para esta jornada</p>
                            ) : (
                                data.quintetoIdealTeorico.map((j, i) => renderJugador(j, i))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
