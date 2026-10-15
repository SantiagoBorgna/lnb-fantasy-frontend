import { linkSitioCompartido } from '../../utils/compartir'
import { formatoPuntos } from './canvasUtils'
import { dibujarCanchita } from './canchitaCanvas'
import ModalImagenCompartible from './ModalImagenCompartible'

/**
 * Imagen de la canchita para compartir. `datos` lo arma CanchitaPage con lo que ya tiene en pantalla
 * (ver dibujarCanchita para el formato). Se carga con React.lazy: trae react-dom/server para las camisetas.
 */
export default function CanchitaCompartirModal({ datos, onCerrar }) {
    const jornada = datos?.jornadaNumero ? ` ${datos.jornadaNumero}` : ''
    const link = linkSitioCompartido('canchita')
    const texto = datos?.conPuntos
        ? `Así salió mi equipo en la jornada${jornada} de Sexto Hombre Fantasy: ${formatoPuntos(datos.total)} puntos 🏀 ¿Te animás a ganarme? ${link}`
        : `Este es mi equipo para la jornada${jornada} de Sexto Hombre Fantasy 🏀 ¿Te animás a ganarme? ${link}`

    return (
        <ModalImagenCompartible
            titulo="Compartí tu equipo"
            mensajeSinDatos="Todavía no armaste tu equipo."
            datos={datos}
            dibujar={dibujarCanchita}
            nombreArchivo={`sexto-hombre-mi-equipo${datos?.jornadaNumero ? `-jornada-${datos.jornadaNumero}` : ''}.png`}
            texto={texto}
            contentType="canchita"
            altImagen="Mi equipo"
            onCerrar={onCerrar}
        />
    )
}
