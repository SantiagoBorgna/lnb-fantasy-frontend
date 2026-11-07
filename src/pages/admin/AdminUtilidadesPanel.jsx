import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConfigLiga } from "../../api/configApi";
import { aplicarMvpJornadaAdmin, correrCronAdmin, getDiferenciasFixtureAdmin, recalcularJornadaAdmin, sincronizarFixtureAdmin, sincronizarJugadoresAdmin } from "../../api/adminApi";
import { getJornadas } from "../../api/jornadaApi";
import { Play, Loader2, RefreshCw } from "lucide-react";
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
const MVP_KEY = "aplicar-mvp";
const FIXTURE_KEY = "sincronizar-fixture";
const JUGADORES_KEY = "sincronizar-jugadores";

// Las jornadas llegan como "2026-10-12T20:00:00": el día es lo que va antes de la T.
const diaDeLaJornada = (fechaIso) => (fechaIso ? fechaIso.substring(0, 10) : "");

// La URL base del fixture depende de la liga (la da el backend en /config)
const armarUrlFixture = (base, desde, hasta) =>
    `${base}?handler=ProximosPartidos&fechaInicio=${desde}&fechaFin=${hasta}`;

const TIPOS_DIFERENCIA = {
    NUEVO: {
        etiqueta: "Partido nuevo",
        ayuda: "No está cargado. Si corresponde, cargalo con Sincronizar fixture en su jornada, usando ese día en Desde y Hasta.",
    },
    REPROGRAMADO: {
        etiqueta: "Cambió de día",
        ayuda: "Si no tiene estadísticas, eliminá el partido viejo en Partidos y cargá el día nuevo con Sincronizar fixture.",
    },
    NO_PUBLICADO: {
        etiqueta: "Ya no figura",
        ayuda: "Revisá si se postergó o se cambió el rival. Si no se va a jugar en esa fecha, eliminalo en Partidos.",
    },
    HORARIO: {
        etiqueta: "Cambió la hora",
        ayuda: "Corregila con Sincronizar fixture, usando ese día en Desde y Hasta.",
    },
    NO_RECONOCIDO: {
        etiqueta: "No se pudo leer",
        ayuda: "Revisá el nombre de los equipos y la fecha en la web de la liga.",
    },
};

// Las fechas llegan como "2026-11-06T21:35:00": se muestran tal cual, sin convertir de zona horaria.
const formatearFecha = (fechaIso) => (fechaIso
    ? `${fechaIso.substring(8, 10)}/${fechaIso.substring(5, 7)} ${fechaIso.substring(11, 16)}`
    : "");

function DiferenciasFixture() {
    const { data, isLoading, isFetching, isError, refetch } = useQuery({
        queryKey: ['diferenciasFixture'],
        queryFn: getDiferenciasFixtureAdmin,
        staleTime: 5 * 60 * 1000,
        retry: false,
    });

    const diferencias = data?.diferencias ?? [];
    const sinControl = !data?.error && (data?.jornadas ?? []).length === 0;

    return (
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 md:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                    <h3 className="font-bold text-textMain text-sm">Diferencias con la liga</h3>
                    <p className="text-xs text-textMuted mt-1">
                        Compara el fixture oficial con los partidos cargados en las jornadas sin finalizar. Solo muestra
                        las diferencias: no cambia nada. Los partidos procesados y las jornadas sin partidos cargados no
                        se controlan. Cada 6 horas se hace este mismo control y los cambios nuevos llegan por notificación.
                    </p>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-2 bg-card text-textMain border border-border font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Comparar
                </button>
            </div>

            {isLoading && <p className="text-sm text-textMuted">Comparando con el fixture de la liga...</p>}

            {(isError || data?.error) && (
                <p className="text-sm text-red-400">
                    No se pudo hacer la comparación, así que puede haber diferencias que no se ven acá.
                    {data?.error ? ` ${data.error}` : ""}
                </p>
            )}

            {data && !data.error && sinControl && (
                <p className="text-sm text-textMuted">No hay jornadas sin finalizar con partidos cargados.</p>
            )}

            {data && !data.error && !sinControl && diferencias.length === 0 && (
                <p className="text-sm text-textMain">
                    Sin diferencias en {data.jornadas.length === 1 ? "la jornada" : "las jornadas"} {data.jornadas.join(", ")}.
                </p>
            )}

            {diferencias.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {diferencias.map((d, i) => {
                        const tipo = TIPOS_DIFERENCIA[d.tipo];
                        return (
                            <li key={`${d.tipo}-${d.local}-${d.visitante}-${i}`} className="bg-card border border-border rounded-xl p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-primary">{tipo?.etiqueta ?? d.tipo}</span>
                                    {d.jornada != null && <span className="text-xs text-textMuted">Jornada {d.jornada}</span>}
                                </div>
                                <p className="text-sm font-bold text-textMain mt-1 break-words">{d.local} vs {d.visitante}</p>
                                <p className="text-xs text-textMuted mt-1">
                                    {d.fechaBase && `Cargado: ${formatearFecha(d.fechaBase)}`}
                                    {d.fechaBase && d.fechaLiga && " · "}
                                    {d.fechaLiga && `Liga: ${formatearFecha(d.fechaLiga)}`}
                                </p>
                                {tipo && <p className="text-xs text-textMuted mt-1">{tipo.ayuda}</p>}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function AdminUtilidadesPanel() {
    const showToast = useUiStore(state => state.showToast);
    const [ejecutando, setEjecutando] = useState(null);
    const [jornadasCerradas, setJornadasCerradas] = useState([]);
    const [jornadaId, setJornadaId] = useState("");
    const [jornadasEnJuego, setJornadasEnJuego] = useState([]);
    const [mvpJornadaId, setMvpJornadaId] = useState("");
    const [jornadas, setJornadas] = useState([]);
    const [fixtureJornadaId, setFixtureJornadaId] = useState("");
    const [fixtureDesde, setFixtureDesde] = useState("");
    const [fixtureHasta, setFixtureHasta] = useState("");
    const { data: configLiga } = useQuery({ queryKey: ['configLiga'], queryFn: getConfigLiga, staleTime: Infinity });

    // Sin fechas la LNB devuelve de hace 2 días a 2 meses y todo se asignaría a una
    // sola jornada, así que el rango es obligatorio para poder sincronizar.
    const fixtureRangoValido = fixtureDesde !== "" && fixtureHasta !== "" && fixtureDesde <= fixtureHasta;
    const fixtureUrl = fixtureRangoValido && configLiga?.urlFixture
        ? armarUrlFixture(configLiga.urlFixture, fixtureDesde, fixtureHasta) : "";

    const elegirJornadaFixture = (id) => {
        setFixtureJornadaId(id);
        const jornada = jornadas.find(j => j.id.toString() === id);
        if (jornada) {
            setFixtureDesde(diaDeLaJornada(jornada.fechaInicio));
            setFixtureHasta(diaDeLaJornada(jornada.fechaFin));
        }
    };

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

                const enJuego = lista
                    .filter(j => j.estado === "EN_JUEGO")
                    .sort((a, b) => a.numero - b.numero);
                setJornadasEnJuego(enJuego);
                if (enJuego.length > 0) {
                    setMvpJornadaId(enJuego[0].id.toString());
                }

                // El fixture se carga en jornadas que todavía no se jugaron: por defecto
                // la primera que no está finalizada (o la última si ya cerraron todas).
                const todas = [...lista].sort((a, b) => a.numero - b.numero);
                setJornadas(todas);
                const destino = todas.find(j => j.estado !== "FINALIZADA") ?? todas[todas.length - 1];
                if (destino) {
                    setFixtureJornadaId(destino.id.toString());
                    setFixtureDesde(diaDeLaJornada(destino.fechaInicio));
                    setFixtureHasta(diaDeLaJornada(destino.fechaFin));
                }
            })
            .catch(console.error);
    }, []);

    const handleSincronizarFixture = async () => {
        const jornada = jornadas.find(j => j.id.toString() === fixtureJornadaId);
        if (!jornada || !fixtureUrl) return;
        if (!window.confirm(`Se van a cargar en la Jornada ${jornada.numero} los partidos del ${fixtureDesde} al ${fixtureHasta}:\n${fixtureUrl}\n\nLos partidos que ya estén cargados (mismos equipos y día) se actualizan, no se duplican. ¿Continuar?`)) return;

        setEjecutando(FIXTURE_KEY);
        try {
            const data = await sincronizarFixtureAdmin(jornada.id, fixtureUrl);
            showToast(data?.mensaje || `Sincronización del fixture de la Jornada ${jornada.numero} iniciada`, "success");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.mensaje || `Error al sincronizar el fixture de la Jornada ${jornada.numero}`, "error");
        } finally {
            setEjecutando(null);
        }
    };

    const handleSincronizarJugadores = async () => {
        if (!window.confirm(`Se van a cargar los jugadores de todos los planteles de la ${configLiga?.ligaNombre ?? "liga"} desde GES. Los que ya están se actualizan, no se duplican. ¿Continuar?`)) return;

        setEjecutando(JUGADORES_KEY);
        try {
            await sincronizarJugadoresAdmin();
            showToast("Sincronización de jugadores iniciada. Tarda unos minutos: después revisalos en la pestaña Jugadores.", "success");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.mensaje || "Error al iniciar la sincronización de jugadores", "error");
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

    const handleAplicarMvp = async () => {
        const jornada = jornadasEnJuego.find(j => j.id.toString() === mvpJornadaId);
        if (!jornada) return;
        if (!window.confirm(`Se va a sumar el bono de MVP a los partidos ya cargados de la Jornada ${jornada.numero} (se vuelven a leer de GES) y recalcular el puntaje parcial. ¿Continuar?`)) return;

        setEjecutando(MVP_KEY);
        try {
            const data = await aplicarMvpJornadaAdmin(jornada.id);
            showToast(data?.mensaje || `MVP de la Jornada ${jornada.numero} iniciado`, "success");
        } catch (error) {
            console.error(error);
            showToast(error.response?.data?.mensaje || `Error al aplicar el MVP a la Jornada ${jornada.numero}`, "error");
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
                <DiferenciasFixture />

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
                        <h3 className="font-bold text-textMain text-sm">Aplicar MVP a jornada en juego</h3>
                        <p className="text-xs text-textMuted mt-1">
                            Suma el bono de MVP (+10 a la valoración más alta de cada partido, a todos si hay empate) a los
                            partidos ya cargados de una jornada EN_JUEGO, volviendo a leer cada planilla de GES, y
                            recalcula el puntaje parcial. No borra estadísticas y se puede repetir sin duplicar el bono.
                            Los partidos que se carguen de ahora en más ya suman el MVP solos.
                        </p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-3">
                        <select
                            value={mvpJornadaId}
                            onChange={(e) => setMvpJornadaId(e.target.value)}
                            disabled={jornadasEnJuego.length === 0 || ejecutando !== null}
                            className="bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                        >
                            {jornadasEnJuego.length === 0 && <option value="">No hay jornadas en juego</option>}
                            {jornadasEnJuego.map(j => (
                                <option key={j.id} value={j.id}>Jornada {j.numero}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAplicarMvp}
                            disabled={!mvpJornadaId || ejecutando !== null}
                            className="flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {ejecutando === MVP_KEY ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            Aplicar MVP
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 md:col-span-2">
                    <div>
                        <h3 className="font-bold text-textMain text-sm">Sincronizar jugadores</h3>
                        <p className="text-xs text-textMuted mt-1">
                            Recorre los planteles de todos los equipos en GES y carga los jugadores nuevos (los equipos que
                            no existen se crean). Los jugadores nuevos quedan sin posición y con valor 5: completá posición,
                            número y valor antes de abrir el mercado. Corre en segundo plano y tarda unos minutos.
                        </p>
                    </div>
                    <button
                        onClick={handleSincronizarJugadores}
                        disabled={ejecutando !== null}
                        className="mt-auto self-start flex items-center gap-2 bg-primary text-black font-bold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {ejecutando === JUGADORES_KEY ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Sincronizar
                    </button>
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
                            Todo lo que traiga la LNB entre Desde y Hasta se asigna a la jornada elegida. Las fechas se
                            precargan con las de la jornada y se pueden cambiar. La LNB cuenta desde las 00:00 de Desde
                            (sin incluirlas) hasta las 00:00 del día siguiente a Hasta: si un partido tiene la hora
                            pendiente (00:00) de un día, Desde tiene que ser el día anterior.
                        </p>
                    </div>
                    <div className="mt-auto flex flex-col gap-3">
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="flex flex-col gap-1 text-xs text-textMuted">
                                Jornada
                                <select
                                    value={fixtureJornadaId}
                                    onChange={(e) => elegirJornadaFixture(e.target.value)}
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
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-textMuted">
                                Desde
                                <input
                                    type="date"
                                    value={fixtureDesde}
                                    onChange={(e) => setFixtureDesde(e.target.value)}
                                    disabled={ejecutando !== null}
                                    className="bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-textMuted">
                                Hasta
                                <input
                                    type="date"
                                    value={fixtureHasta}
                                    onChange={(e) => setFixtureHasta(e.target.value)}
                                    disabled={ejecutando !== null}
                                    className="bg-card text-textMain border border-border rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                                />
                            </label>
                            <button
                                onClick={handleSincronizarFixture}
                                disabled={!fixtureJornadaId || !fixtureUrl || ejecutando !== null}
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
                        <p className="text-xs text-textMuted break-all">
                            {fixtureRangoValido
                                ? `Se va a pedir: ${fixtureUrl}`
                                : "Elegí un rango válido: las dos fechas son obligatorias y Desde no puede ser posterior a Hasta."}
                        </p>
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
