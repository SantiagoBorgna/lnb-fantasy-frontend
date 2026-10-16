import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getArrepentimientos, resolverArrepentimiento } from "../../api/arrepentimientoApi";
import { useUiStore } from "../../store/uiStore";

const formatoFecha = (iso) => (iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—");

/**
 * Pedidos del "Botón de arrepentimiento". La cancelación y la devolución se hacen a mano en
 * Mercado Pago (y se le saca el Premium); acá solo se marca el pedido como resuelto.
 */
export default function AdminArrepentimientos() {
    const showToast = useUiStore(state => state.showToast);
    const queryClient = useQueryClient();
    const { data: pedidos = [], isLoading } = useQuery({
        queryKey: ["adminArrepentimientos"],
        queryFn: getArrepentimientos,
        staleTime: 0,
    });

    const resolver = async (p) => {
        if (!window.confirm(`¿Ya cancelaste la suscripción y devolviste el pago de ${p.email}? Se marca ${p.codigo} como resuelto.`)) return;
        try {
            await resolverArrepentimiento(p.id);
            queryClient.invalidateQueries({ queryKey: ["adminArrepentimientos"] });
        } catch {
            showToast("No se pudo marcar como resuelto", "error");
        }
    };

    const pendientes = pedidos.filter(p => !p.resueltoEn).length;

    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-textMain font-bold">Botón de arrepentimiento {pendientes > 0 && <span className="ml-2 rounded-full bg-red-500/20 text-red-400 text-xs px-2 py-0.5">{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span>}</h3>
                <p className="text-textMuted text-xs mt-1">
                    Hay que responder dentro de las 24 h. Cancelá la suscripción y devolvé el pago desde Mercado Pago, sacale el Premium al usuario y marcá el pedido como resuelto.
                </p>
            </div>
            {isLoading ? (
                <Loader2 className="animate-spin text-textMuted" />
            ) : pedidos.length === 0 ? (
                <p className="text-textMuted text-sm">No hay pedidos.</p>
            ) : (
                <ul className="space-y-2">
                    {pedidos.map(p => (
                        <li key={p.id} className="card flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                            <div className="flex-1 min-w-0">
                                <p className="text-textMain font-bold text-sm">{p.codigo} · <span className="font-medium break-all">{p.email}</span>{!p.usuarioRegistrado && <span className="text-yellow-400 text-xs ml-2">(email sin cuenta)</span>}</p>
                                <p className="text-textMuted text-xs">
                                    Pedido: {formatoFecha(p.creadoEn)} · Contrató: {p.fechaContratacion ?? "sin dato"}
                                </p>
                                {p.motivo && <p className="text-textMuted text-xs mt-1">"{p.motivo}"</p>}
                            </div>
                            {p.resueltoEn ? (
                                <span className="text-green-400 text-xs font-semibold">Resuelto {formatoFecha(p.resueltoEn)}</span>
                            ) : (
                                <button onClick={() => resolver(p)} className="self-start md:self-auto rounded-lg bg-accent text-white text-sm font-bold px-3 py-2">
                                    Marcar resuelto
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
