import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getJornadaActiva, getJornadaProxima, getPartidosJornada } from '../api/jornadaApi'

/**
 * Devuelve una función sigla => true si ese equipo no juega en la jornada (DESCANSA).
 * Sin jornadaId mira la jornada activa, o la próxima si no hay ninguna.
 * Mientras no haya partidos cargados no marca a nadie.
 */
export function useEquipoDescansa(jornadaId) {
    const { data: activa } = useQuery({ queryKey: ['jornadaActiva'], queryFn: getJornadaActiva, enabled: !jornadaId })
    const { data: proxima } = useQuery({ queryKey: ['jornadaProxima'], queryFn: getJornadaProxima, enabled: !jornadaId })
    const id = jornadaId ?? activa?.id ?? proxima?.id

    const { data: partidos = [] } = useQuery({
        queryKey: ['partidosJornada', id],
        queryFn: () => getPartidosJornada(id),
        enabled: !!id
    })

    const equiposConPartido = useMemo(
        () => new Set(partidos.flatMap(p => [p.siglaLocal, p.siglaVisitante]).filter(Boolean)),
        [partidos]
    )

    return useCallback(
        (sigla) => partidos.length > 0 && !!sigla && !equiposConPartido.has(sigla),
        [partidos, equiposConPartido]
    )
}
