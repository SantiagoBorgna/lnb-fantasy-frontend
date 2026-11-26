import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { showdownApi } from '../../api/showdownApi'
import ShowdownDraft from './ShowdownDraft'
import ShowdownRanking from './ShowdownRanking'
import { Loader2 } from 'lucide-react'

// api: el del Relámpago de la liga (por defecto) o el de la Selección
export default function ShowdownPage({ api = showdownApi }) {
    const { codigo } = useParams()
    const [evento, setEvento] = useState(null)
    const [loading, setLoading] = useState(true)
    const [uuidDispositivo, setUuidDispositivo] = useState('')
    const [yaParticipo, setYaParticipo] = useState(false)
    const [ranking, setRanking] = useState([])
    const [miEquipo, setMiEquipo] = useState(null)

    useEffect(() => {
        let uuid = localStorage.getItem('showdown_uuid')
        if (!uuid) {
            uuid = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
            localStorage.setItem('showdown_uuid', uuid)
        }
        setUuidDispositivo(uuid)

        cargarEvento(uuid)
    }, [codigo, api])

    const cargarEvento = async (uuid) => {
        try {
            const ev = await api.getEvento(codigo)
            setEvento(ev)

            // Buscar si ya participó cargando el ranking
            const rk = await api.getRanking(codigo, uuid)
            setRanking(rk)
            
            if (rk.some(p => p.esMio)) {
                setYaParticipo(true)
                try {
                    const equipo = await api.getMiEquipo(codigo, uuid)
                    setMiEquipo(equipo)
                } catch (e) {
                    console.error("Error cargando equipo", e)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg dark flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!evento) {
        return (
            <div className="min-h-screen bg-bg dark flex items-center justify-center">
                <div className="text-center text-textMain">
                    <h1 className="text-2xl font-bold mb-2">Evento no encontrado</h1>
                    <p className="text-textMuted">El código escaneado no es válido.</p>
                </div>
            </div>
        )
    }

    // Si ya participó, o si el evento ya no está abierto y no participó
    if (yaParticipo || evento.estado !== 'ABIERTO') {
        return <ShowdownRanking 
                    evento={evento} 
                    ranking={ranking} 
                    miEquipo={miEquipo}
                    codigo={codigo} 
                    uuidDispositivo={uuidDispositivo} 
                />
    }

    // Si el evento está abierto y aún no participó
    return <ShowdownDraft 
                api={api}
                evento={evento} 
                codigo={codigo} 
                uuidDispositivo={uuidDispositivo} 
                onParticiparSuccess={() => cargarEvento(uuidDispositivo)} 
            />
}
