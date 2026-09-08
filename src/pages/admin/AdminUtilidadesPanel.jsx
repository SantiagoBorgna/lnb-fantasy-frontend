import { useState } from "react";
import { correrCronAdmin } from "../../api/adminApi";
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

export default function AdminUtilidadesPanel() {
    const showToast = useUiStore(state => state.showToast);
    const [ejecutando, setEjecutando] = useState(null);

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
