import { useState, useEffect } from "react";
import { correrCronAdmin, recalcularJornadaAdmin } from "../../api/adminApi";
import { getJornadas } from "../../api/jornadaApi";
import { Play, Loader2 } from "lucide-react";
import { useUiStore } from "../../store/uiStore";

const CRONS = [
    {
        key: "scraper-partidos",
        titulo: "Scraper de partidos",
        descripcion: "Busca partidos finalizados sin estadísticas cargadas y las procesa.",
    },
    {
        key: "transicion-jornadas",
        titulo: "Transición de jornadas",
        descripcion: "Evalúa cambios de estado de jornadas/partidos y calcula puntajes al cierre.",
    },
    {
        key: "precios",
        titulo: "Actualización de precios",
        descripcion: "Recalcula el valor de mercado de todos los jugadores.",
    },
    {
        key: "draft-autopicks",
        titulo: "Auto-picks de draft",
        descripcion: "Resuelve automáticamente los turnos de draft vencidos.",
    },
    {
        key: "showdown-puntajes",
        titulo: "Puntajes Modo Relámpago",
        descripcion: "Actualiza los puntajes de los eventos Relámpago en curso.",
    },
    {
        key: "waivers",
        titulo: "Procesar waivers",
        descripcion: "Fuerza el procesamiento de todos los reclamos de waiver pendientes.",
    },
    {
        key: "premium-vencidos",
        titulo: "Suscripciones Premium vencidas",
        descripcion: "Revoca el Premium de los usuarios cuya suscripción ya venció.",
    },
    {
        key: "tokens-expirados",
        titulo: "Limpieza de tokens",
        descripcion: "Elimina de la lista negra los tokens de sesión ya expirados.",
    },
];

const RECALCULO_KEY = "recalcular-jornada";

export default function AdminUtilidadesPanel() {
    const showToast = useUiStore(state => state.showToast);
    const [ejecutando, setEjecutando] = useState(null);
    const [jornadasCerradas, setJornadasCerradas] = useState([]);
    const [jornadaId, setJornadaId] = useState("");

    useEffect(() => {
        getJornadas()
            .then(lista => {
                const cerradas = lista
                    .filter(j => j.estado === "FINALIZADA")
                    .sort((a, b) => a.numero - b.numero);
                setJornadasCerradas(cerradas);
                if (cerradas.length > 0) {
                    setJornadaId(cerradas[cerradas.length - 1].id.toString());
                }
            })
            .catch(console.error);
    }, []);

    const handleRecalcularJornada = async () => {
        const jornada = jornadasCerradas.find(j => j.id.toString() === jornadaId);
        if (!jornada) return;
        if (!window.confirm(`Se va a recalcular la Jornada ${jornada.numero}: estadísticas faltantes, puntajes de los planteles, rankings, torneos H2H y promedios. ¿Continuar?`)) return;

        setEjecutando(RECALCULO_KEY);
        try {
            const data = await recalcularJornadaAdmin(jornada.id);
            showToast(data?.mensaje || `Recálculo de la Jornada ${jornada.numero} iniciado`, "success");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.mensaje || `Error al recalcular la Jornada ${jornada.numero}`, "error");
        } finally {
            setEjecutando(null);
        }
    };

    const handleEjecutar = async (cron) => {
        setEjecutando(cron.key);
        try {
            const data = await correrCronAdmin(cron.key);
            showToast(data?.mensaje || `${cron.titulo} iniciado`, "success");
        } catch (error) {
            console.error(error);
            showToast(`Error al ejecutar "${cron.titulo}"`, "error");
        } finally {
            setEjecutando(null);
        }
    };

    return (
        <div className="space-y-6 pt-2">
            <div className="bg-surface border border-border p-4 rounded-xl text-sm text-textMuted">
                Estos botones disparan manualmente los procesos automáticos (CronJobs) del juego, sin esperar a su horario programado.
                Cada uno corre en background en el servidor — revisá los logs para confirmar el resultado.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 md:col-span-2">
                    <div>
                        <h3 className="font-bold text-textMain text-sm">Recalcular jornada cerrada</h3>
                        <p className="text-xs text-textMuted mt-1">
                            Corrige una jornada FINALIZADA que se cerró con estadísticas faltantes: completa las stats
                            de los equipos que quedaron sin ninguna, recalcula los puntajes de todos los planteles,
                            reconstruye el ranking global y el de los torneos, rehace la tabla de los H2H y actualiza los
                            promedios. Se puede repetir sin duplicar puntos. No modifica los precios.
                        </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                        <select
                            value={jornadaId}
                            onChange={(e) => setJornadaId(e.target.value)}
                            disabled={jornadasCerradas.length === 0 || ejecutando !== null}
                            className="bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                        >
                            {jornadasCerradas.length === 0 && <option value="">No hay jornadas finalizadas</option>}
                            {jornadasCerradas.map(j => (
                                <option key={j.id} value={j.id}>Jornada {j.numero}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleRecalcularJornada}
                            disabled={!jornadaId || ejecutando !== null}
                            className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {ejecutando === RECALCULO_KEY ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Recalcular
                        </button>
                    </div>
                </div>

                {CRONS.map(cron => (
                    <div key={cron.key} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3">
                        <div>
                            <h3 className="font-bold text-textMain text-sm">{cron.titulo}</h3>
                            <p className="text-xs text-textMuted mt-1">{cron.descripcion}</p>
                        </div>
                        <button
                            onClick={() => handleEjecutar(cron)}
                            disabled={ejecutando !== null}
                            className="mt-auto self-start flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {ejecutando === cron.key ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Ejecutar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
