import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Send, BellRing, RefreshCw } from "lucide-react";
import { getResumenUsuarios, enviarNotificacionAdmin } from "../../api/adminApi";
import { useUiStore } from "../../store/uiStore";
import ConfirmModal from "../../components/ui/ConfirmModal";
import AdminArrepentimientos from "./AdminArrepentimientos";

const MAX_TITULO = 60;
const MAX_MENSAJE = 200;

// Pantallas a las que puede llevar la notificación al tocarla
const DESTINOS = [
    { url: "/", label: "Inicio" },
    { url: "/canchita", label: "Canchita" },
    { url: "/torneos", label: "Torneos" },
    { url: "/mercado", label: "Mercado" },
];

function Numero({ titulo, valor, detalle }) {
    return (
        <div className="card">
            <p className="text-textMuted text-xs font-semibold uppercase tracking-wide">{titulo}</p>
            <p className="text-textMain text-3xl font-black tabular-nums mt-1">{valor ?? "—"}</p>
            {detalle && <p className="text-textMuted text-xs mt-1">{detalle}</p>}
        </div>
    );
}

const porcentaje = (parte, total) => (total ? `${Math.round((parte / total) * 100)}% del total` : null);

export default function AdminComunidadPanel() {
    const showToast = useUiStore(state => state.showToast);
    const { data: resumen, isFetching: cargando, refetch: cargarResumen } = useQuery({
        queryKey: ["adminResumenUsuarios"],
        queryFn: getResumenUsuarios,
        staleTime: 0,
    });
    const [titulo, setTitulo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [url, setUrl] = useState("/");
    const [enviando, setEnviando] = useState(null); // 'prueba' | 'todos'
    const [confirmar, setConfirmar] = useState(false);

    const formularioValido =
        titulo.trim().length > 0 && titulo.length <= MAX_TITULO &&
        mensaje.trim().length > 0 && mensaje.length <= MAX_MENSAJE;

    const enviar = async (soloPrueba) => {
        setConfirmar(false);
        setEnviando(soloPrueba ? "prueba" : "todos");
        try {
            const data = await enviarNotificacionAdmin({ titulo, mensaje, url, soloPrueba });
            if (soloPrueba) {
                showToast(`Prueba enviada a tus ${data.dispositivos} dispositivo(s)`, "success");
            } else {
                showToast(`Enviando a ${data.dispositivos} dispositivos. Puede tardar unos minutos en llegar a todos.`, "success");
                setTitulo("");
                setMensaje("");
                setUrl("/");
            }
        } catch (error) {
            showToast(error.response?.data?.mensaje || "No se pudo enviar la notificación", "error");
        } finally {
            setEnviando(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Números ── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-textMain font-bold text-lg">Usuarios</h2>
                    <button
                        onClick={() => cargarResumen()}
                        disabled={cargando}
                        className="text-textMuted hover:text-textMain text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={cargando ? "animate-spin" : ""} /> Actualizar
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Numero titulo="Registrados" valor={resumen?.registrados} />
                    <Numero
                        titulo="Activos"
                        valor={resumen?.activos}
                        detalle={porcentaje(resumen?.activos, resumen?.registrados) ?? "Terminaron el onboarding"}
                    />
                    <Numero
                        titulo="Sin terminar onboarding"
                        valor={resumen?.sinTerminarOnboarding}
                        detalle={porcentaje(resumen?.sinTerminarOnboarding, resumen?.registrados)}
                    />
                    <Numero
                        titulo="Con notificaciones"
                        valor={resumen?.usuariosConPush}
                        detalle={resumen ? `${resumen.dispositivosPush} dispositivos` : null}
                    />
                </div>
            </section>

            {/* ── Notificación push ── */}
            <section className="card space-y-4">
                <div className="flex items-center gap-2">
                    <BellRing size={18} className="text-accent" />
                    <h2 className="text-textMain font-bold text-lg">Enviar notificación</h2>
                </div>
                <p className="text-textMuted text-sm">
                    Llega a todos los que tienen las notificaciones activadas. Probala primero en tu celular.
                </p>

                <label className="block space-y-1">
                    <span className="flex justify-between text-sm text-textMain font-semibold">
                        Título <span className={titulo.length > MAX_TITULO ? "text-red-400" : "text-textMuted"}>{titulo.length}/{MAX_TITULO}</span>
                    </span>
                    <input
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        placeholder="¡Ahora podés compartir tu equipo!"
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-textMain text-sm focus:outline-none focus:border-primary"
                    />
                </label>

                <label className="block space-y-1">
                    <span className="flex justify-between text-sm text-textMain font-semibold">
                        Mensaje <span className={mensaje.length > MAX_MENSAJE ? "text-red-400" : "text-textMuted"}>{mensaje.length}/{MAX_MENSAJE}</span>
                    </span>
                    <textarea
                        value={mensaje}
                        onChange={e => setMensaje(e.target.value)}
                        rows={3}
                        placeholder="Entrá a la canchita y tocá Compartir para mandarlo por WhatsApp o subirlo a tus historias."
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-textMain text-sm focus:outline-none focus:border-primary resize-none"
                    />
                </label>

                <label className="block space-y-1">
                    <span className="text-sm text-textMain font-semibold">Al tocarla lleva a</span>
                    <select
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-textMain text-sm focus:outline-none focus:border-primary"
                    >
                        {DESTINOS.map(d => <option key={d.url} value={d.url}>{d.label}</option>)}
                    </select>
                </label>

                <div className="flex flex-col md:flex-row gap-3 pt-1">
                    <button
                        onClick={() => enviar(true)}
                        disabled={!formularioValido || enviando !== null}
                        className="flex-1 py-3 rounded-xl font-bold bg-surface border border-border text-textMain flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {enviando === "prueba" ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />}
                        Enviarme una prueba
                    </button>
                    <button
                        onClick={() => setConfirmar(true)}
                        disabled={!formularioValido || enviando !== null}
                        className="flex-1 py-3 rounded-xl font-bold bg-accent text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {enviando === "todos" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Enviar a todos{resumen ? ` (${resumen.dispositivosPush} dispositivos)` : ""}
                    </button>
                </div>
            </section>

            <AdminArrepentimientos />

            <ConfirmModal
                isOpen={confirmar}
                onClose={() => setConfirmar(false)}
                onConfirm={() => enviar(false)}
                titulo="¿Enviar a todos?"
                mensaje={`"${titulo.trim()}" les va a llegar a ${resumen?.dispositivosPush ?? "todos los"} dispositivos. No se puede deshacer.`}
            />
        </div>
    );
}
