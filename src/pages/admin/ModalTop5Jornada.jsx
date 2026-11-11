import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import ModalImagenCompartible from '../../components/compartir/ModalImagenCompartible'
import { dibujarTop5 } from '../../components/compartir/top5Canvas'
import { getRankingJornada } from '../../api/rankingApi'

/** Imagen con los 5 mejores equipos de una jornada, para Instagram. */
export default function ModalTop5Jornada({ jornada, onCerrar }) {
    const { data: ranking, isLoading } = useQuery({
        queryKey: ['adminTop5Jornada', jornada.id],
        // se piden algunos de más porque el ranking puede traer equipos repetidos
        queryFn: () => getRankingJornada(jornada.id, 10),
        staleTime: 0,
    })

    const datos = useMemo(() => {
        const filas = (ranking ?? [])
            .filter((v, i, a) => a.findIndex(t => t.equipoVirtualId === v.equipoVirtualId) === i)
            .slice(0, 5)
            .map(f => ({ posicion: f.posicion, nombreEquipo: f.nombreEquipo, puntos: f.puntajeGlobal }))
        return filas.length > 0 ? { jornadaNumero: jornada.numero, filas } : null
    }, [ranking, jornada.numero])

    return (
        <ModalImagenCompartible
            titulo={`Top 5 de la jornada ${jornada.numero}`}
            cargando={isLoading}
            mensajeSinDatos="Esta jornada todavía no tiene puntajes."
            datos={datos}
            dibujar={dibujarTop5}
            nombreArchivo={`top5-jornada-${jornada.numero}.png`}
            contentType="placa_top5"
            altImagen={`Los 5 mejores de la jornada ${jornada.numero}`}
            onCerrar={onCerrar}
        />
    )
}
