import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { enviarArrepentimiento } from '../api/arrepentimientoApi'

const MAX_MOTIVO = 500
const hoy = () => new Date().toISOString().substring(0, 10)

/**
 * "Botón de arrepentimiento" (Res. 424/2020): revocar la suscripción Premium dentro de los
 * 10 días corridos de contratada. Se puede usar sin iniciar sesión; al enviar se muestra
 * el código del pedido como constancia.
 */
export default function ArrepentimientoPage() {
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)
    const [email, setEmail] = useState(usuario?.email ?? '')
    const [fecha, setFecha] = useState('')
    const [motivo, setMotivo] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState(null)
    const [resultado, setResultado] = useState(null) // { codigo, creadoEn }

    useEffect(() => {
        document.getElementById('root')?.scrollTo(0, 0)
        window.scrollTo(0, 0)
    }, [])

    const enviar = async (e) => {
        e.preventDefault()
        setError(null)
        setEnviando(true)
        try {
            setResultado(await enviarArrepentimiento({
                email: email.trim(),
                fechaContratacion: fecha || null,
                motivo: motivo.trim() || null,
            }))
        } catch (err) {
            setError(err.response?.data?.mensaje || 'No se pudo enviar el pedido. Probá de nuevo o escribinos a sextohombrefantasy@gmail.com.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface p-6 overflow-y-auto">
            <div className="max-w-xl mx-auto pb-12">
                <button
                    onClick={() => navigate(-1)}
                    className="text-textMuted text-sm mb-6 flex items-center gap-1 hover:text-textMain transition-colors mt-4"
                >
                    ← Volver
                </button>

                <div className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-5">
                    <h1 className="text-2xl font-black text-textMain">Botón de arrepentimiento</h1>
                    <p className="text-textMuted text-sm leading-relaxed">
                        Si contrataste la suscripción Premium, podés revocar la contratación dentro de los
                        <strong className="text-textMain"> 10 días corridos</strong> desde que la hiciste, sin costo
                        y sin dar explicaciones (Ley 24.240 de Defensa del Consumidor y Resolución 424/2020).
                        Te cancelamos la suscripción y te devolvemos lo que pagaste por Mercado Pago.
                    </p>

                    {resultado ? (
                        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-5 space-y-2 text-center">
                            <CheckCircle2 className="mx-auto text-green-400" size={36} />
                            <p className="text-textMain font-bold">Recibimos tu pedido</p>
                            <p className="text-textMuted text-sm">Tu código de constancia es</p>
                            <p className="text-3xl font-black text-textMain tracking-wider">{resultado.codigo}</p>
                            <p className="text-textMuted text-sm">
                                Guardalo. Te vamos a escribir a <strong className="text-textMain">{email.trim()}</strong> para
                                confirmarte la cancelación y la devolución.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={enviar} className="space-y-4">
                            <label className="block space-y-1">
                                <span className="text-sm font-semibold text-textMain">Email de tu cuenta</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="tu@email.com"
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain text-sm focus:outline-none focus:border-accent"
                                />
                            </label>
                            <label className="block space-y-1">
                                <span className="text-sm font-semibold text-textMain">Fecha en que contrataste Premium <span className="text-textMuted font-normal">(opcional)</span></span>
                                <input
                                    type="date"
                                    max={hoy()}
                                    value={fecha}
                                    onChange={e => setFecha(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain text-sm focus:outline-none focus:border-accent"
                                />
                            </label>
                            <label className="block space-y-1">
                                <span className="text-sm font-semibold text-textMain">Motivo <span className="text-textMuted font-normal">(opcional)</span></span>
                                <textarea
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value.slice(0, MAX_MOTIVO))}
                                    rows={3}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain text-sm focus:outline-none focus:border-accent resize-none"
                                />
                            </label>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <button
                                type="submit"
                                disabled={enviando || !email.trim()}
                                className="w-full py-3 rounded-xl font-bold bg-accent text-white flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {enviando && <Loader2 size={16} className="animate-spin" />}
                                Enviar pedido de arrepentimiento
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
