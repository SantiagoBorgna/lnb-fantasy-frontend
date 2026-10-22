import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import ModalImagenCompartible from '../../components/compartir/ModalImagenCompartible'
import { dibujarFixture, paginarFixture } from '../../components/compartir/fixtureCanvas'
import { getPartidosJornada } from '../../api/jornadaApi'
import { useLigaActual } from '../../store/ligaStore'

/** Imágenes del fixture de una jornada para Instagram (una o varias, según la cantidad de partidos). */
export default function ModalFixtureJornada({ jornada, onCerrar }) {
    const liga = useLigaActual()
    const [pagina, setPagina] = useState(0)
    const { data: partidos, isLoading } = useQuery({
        queryKey: ['adminPartidosJornada', jornada.id],
        queryFn: () => getPartidosJornada(jornada.id),
        staleTime: 0,
    })

    const paginas = useMemo(() => paginarFixture(partidos ?? []), [partidos])
    const datos = useMemo(() => paginas[pagina]
        ? { jornadaNumero: jornada.numero, ligaId: liga.id, dias: paginas[pagina] }
        : null, [paginas, pagina, jornada.numero, liga.id])

    const sufijo = paginas.length > 1 ? `-${pagina + 1}` : ''

    return (
        <ModalImagenCompartible
            key={pagina} // al cambiar de imagen se vuelve a dibujar desde cero
            titulo={`Fixture de la jornada ${jornada.numero}`}
            cargando={isLoading}
            mensajeSinDatos="Esta jornada todavía no tiene partidos cargados."
            datos={datos}
            dibujar={dibujarFixture}
            nombreArchivo={`fixture-jornada-${jornada.numero}${sufijo}.png`}
            contentType="placa_fixture"
            altImagen={`Fixture de la jornada ${jornada.numero}`}
            onCerrar={onCerrar}
        >
            {paginas.length > 1 && (
                <div className="flex gap-2">
                    {paginas.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPagina(i)}
                            className={clsx(
                                'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                                i === pagina ? 'bg-primary border-primary text-white' : 'border-border text-textMuted hover:text-textMain'
                            )}
                        >
                            Imagen {i + 1} de {paginas.length}
                        </button>
                    ))}
                </div>
            )}
        </ModalImagenCompartible>
    )
}
