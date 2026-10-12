import { useState, useEffect } from "react";
import { correrCronAdmin, recalcularJornadaAdmin, sincronizarFixtureAdmin } from "../../api/adminApi";
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
const FIXTURE_KEY = "sincronizar-fixture";
const FIXTURE_URL_DEFAULT = "https://www.laliganacional.com.ar/laliga/fixture";

export default function AdminUtilidadesPanel() {
    const showToast = useUiStore(state => state.showToast);
    const [ejecutando, setEjecutando] = useState(null);
    const [jornadasCerradas, setJornadasCerradas] = useState([]);
    const [jornadaId, setJornadaId] = useState("");
    const [jornadas, setJornadas] = useState([]);
    const [fixtureJornadaId, setFixtureJornadaId] = useState("");
    const [fixtureUrl, setFixtureUrl] = useState(FIXTURE_URL_DEFAULT);

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

                // El fixture se carga en jornadas que todavía no se jugaron: por defecto
                // la primera que no está finalizada (o la última si ya cerraron todas).
                const todas = [...lista].sort((a, b) => a.numero - b.numero);
                setJornadas(todas);
                const destino = todas.find(j => j.estado !== "FINALIZADA") ?? todas[todas.length - 1];
                if (destino) {
                    setFixtureJornadaId(destino.id.toString());
                }
            })
            .catch(console.error);
    }, []);

    const handleSincronizarFixture = async () => {
        const jornada = jornadas.find(j => j.id.toString() === fixtureJornadaId);
        const url = fixtureUrl.trim();
        if (!jornada || !url) return;
        if (!window.confirm(`Se van a cargar en la Jornada ${jornada.numero} los partidos de:\n${url}\n\nLos partidos que ya estén cargados (mismos equipos y día) se actualizan, no se duplican. ¿Continuar?`)) return;

        setEjecutando(FIXTURE_KEY);
        try {
            const data = await sincronizarFixtureAdmin(jornada.id, url);
            showToast(data?.mensaje || `Sincronización del fixture de la Jornada ${jornada.numero} iniciada`, "success");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.mensaje || `Error al sincronizar el fixture de la Jornada ${jornada.numero}`, "error");
        } finally {
            setEjecutando(null);
        }
    };

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

                <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 md:col-span-2">
                    <div>
                        <h3 className="font-bold text-textMain text-sm">Sincronizar fixture</h3>
                        <p className="text-xs text-textMuted mt-1">
                            Carga en la jornada elegida los partidos que publica la LNB. Se puede repetir sin duplicar:
                            los partidos que ya están cargados (mismos equipos y día) solo se actualizan, por ejemplo
                            cuando la LNB confirma una hora que estaba en 00:00. No toca los partidos ya procesados.
                        </p>
                        <p className="text-xs text-textMuted mt-2">
                            Sin fechas en la URL trae desde hace 2 días hasta 2 meses y asigna todo a la jornada elegida.
                            Para acotarlo agregá <code className="text-textMain">?handler=ProximosPartidos&amp;fechaInicio=AAAA-MM-DD&amp;fechaFin=AAAA-MM-DD</code>.
                            La LNB toma el rango desde las 00:00 de fechaInicio (sin incluirlas) hasta las 00:00 del día
                            siguiente a fechaFin: para que entren los partidos con hora pendiente (00:00) de un día,
                            fechaInicio tiene que ser el día anterior.
                        </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-3">
                        <input
                            type="text"
                            value={fixtureUrl}
                            onChange={(e) => setFixtureUrl(e.target.value)}
                            disabled={ejecutando !== null}
                            placeholder={FIXTURE_URL_DEFAULT}
                            className="w-full bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={fixtureJornadaId}
                                onChange={(e) => setFixtureJornadaId(e.target.value)}
                                disabled={jornadas.length === 0 || ejecutando !== null}
                                className="bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                            >
                                {jornadas.length === 0 && <option value="">No hay jornadas</option>}
                                {jornadas.map(j => (
                                    <option key={j.id} value={j.id}>
                                        Jornada {j.numero}{j.estado === "FINALIZADA" ? " (finalizada)" : ""}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleSincronizarFixture}
                                disabled={!fixtureJornadaId || !fixtureUrl.trim() || ejecutando !== null}
                                className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {ejecutando === FIXTURE_KEY ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                Sincronizar
                            </button>
                        </div>
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
