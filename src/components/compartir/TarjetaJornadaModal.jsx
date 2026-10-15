import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMiResumenJornada } from '../../api/rankingApi'
import { getPlantelJornada, getEstadisticasJornada } from '../../api/plantelApi'
import { linkSitioCompartido } from '../../utils/compartir'
import { dibujarTarjetaJornada } from './tarjetaJornadaCanvas'
import ModalImagenCompartible from './ModalImagenCompartible'

// Arma los datos de la tarjeta a partir de las 3 respuestas del backend
function armarDatos(resumen, plantel, estadisticas) {
    const puntosPorJugador = new Map(
        (estadisticas ?? [])
            .filter(e => e.puntajeFantasy != null)
            .map(e => [e.jugadorRealId, e.puntajeFantasy])
    )
    const jugadores = (plantel?.jugadores ?? []).map(j => ({
        nombre: j.nombreCompleto,
        rol: j.rol,
        puntos: puntosPorJugador.get(j.jugadorRealId),
    }))

    const conPuntos = jugadores.filter(j => j.puntos != null)
    const mvp = conPuntos.reduce((mejor, j) => (!mejor || j.puntos > mejor.puntos ? j : mejor), null)
    const capitan = jugadores.find(j => j.rol === 'CAPITAN')

    return {
        jornadaNumero: resumen.jornadaNumero,
        nombreEquipo: resumen.nombreEquipo ?? plantel?.nombreEquipo,
        puntajeFecha: resumen.puntajeFecha,
        posicionFecha: resumen.posicionFecha,
        totalParticipantesFecha: resumen.totalParticipantesFecha,
        posicionGlobal: resumen.posicionGlobal,
        colorClub: resumen.equipoFavoritoColor,
        mvp: mvp && { nombre: mvp.nombre, puntos: mvp.puntos },
        // Si el capitán fue el MVP va en una sola fila ("MVP Y CAPITÁN")
        mvpEsCapitan: !!mvp && mvp.nombre === capitan?.nombre,
        // El capitán siempre aparece: si no sumó (no jugó o sin estadísticas) va con 0
        capitan: capitan && capitan.nombre !== mvp?.nombre
            ? { nombre: capitan.nombre, puntos: capitan.puntos ?? 0 }
            : null,
    }
}

export default function TarjetaJornadaModal({ jornadaId, onCerrar }) {
    const { data: resumen, isLoading: cargandoResumen, isError } = useQuery({
        queryKey: ['miResumenJornada', jornadaId],
        queryFn: () => getMiResumenJornada(jornadaId),
    })
    const { data: plantel, isLoading: cargandoPlantel } = useQuery({
        queryKey: ['plantelJornada', jornadaId],
        queryFn: () => getPlantelJornada(jornadaId),
    })
    const { data: estadisticas, isLoading: cargandoStats } = useQuery({
        queryKey: ['estadisticasJornada', jornadaId],
        queryFn: () => getEstadisticasJornada(jornadaId),
    })

    const cargando = cargandoResumen || cargandoPlantel || cargandoStats

    const datos = useMemo(
        () => (!cargando && !isError && resumen ? armarDatos(resumen, plantel, estadisticas) : null),
        [cargando, isError, resumen, plantel, estadisticas]
    )

    return (
        <ModalImagenCompartible
            titulo="Compartí tu jornada"
            cargando={cargando}
            mensajeSinDatos="No encontramos tu equipo en esta jornada. Cuando juegues una fecha completa vas a poder compartir tu resultado."
            datos={datos}
            dibujar={dibujarTarjetaJornada}
            nombreArchivo={`sexto-hombre-jornada-${resumen?.jornadaNumero ?? ''}.png`}
            texto={resumen
                ? `Hice ${resumen.puntajeFecha?.toLocaleString('es-AR')} puntos en la jornada ${resumen.jornadaNumero} de Sexto Hombre Fantasy 🏀 ¿Te animás a ganarme? ${linkSitioCompartido('tarjeta_jornada')}`
                : ''}
            contentType="tarjeta_jornada"
            altImagen={`Mi jornada ${resumen?.jornadaNumero ?? ''}`}
            onCerrar={onCerrar}
        />
    )
}
