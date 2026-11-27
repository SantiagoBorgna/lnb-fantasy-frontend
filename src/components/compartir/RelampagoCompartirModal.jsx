import { linkSitioCompartido } from '../../utils/compartir'
import { formatoPuntos } from './canvasUtils'
import { dibujarCanchita } from './canchitaCanvas'
import ModalImagenCompartible from './ModalImagenCompartible'

// Sin logo de liga: el Relámpago Selección no es de la LNB ni de la Liga Argentina
const dibujar = (canvas, datos, logo) => dibujarCanchita(canvas, datos, logo, null)

/**
 * Imagen del quinteto del Relámpago para compartir: la misma de "Compartir mi equipo" del juego,
 * sin banco, DT ni "¿Te animás a ganarme?". Se carga con React.lazy (trae react-dom/server).
 */
export default function RelampagoCompartirModal({ datos, partido, onCerrar }) {
    const link = linkSitioCompartido('relampago')
    const texto = datos?.conPuntos
        ? `Así salió mi equipo en el Relámpago ${partido} de Sexto Hombre Fantasy: ${formatoPuntos(datos.total)} puntos 🏀 ${link}`
        : `Este es mi equipo para el Relámpago ${partido} de Sexto Hombre Fantasy 🏀 ${link}`

    return (
        <ModalImagenCompartible
            titulo="Compartí tu equipo"
            mensajeSinDatos="Todavía no armaste tu equipo."
            datos={datos}
            dibujar={dibujar}
            nombreArchivo="sexto-hombre-relampago-mi-equipo.png"
            texto={texto}
            contentType="canchita_relampago"
            altImagen="Mi equipo del Relámpago"
            onCerrar={onCerrar}
        />
    )
}
