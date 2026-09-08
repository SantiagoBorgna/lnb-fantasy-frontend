import React, { useState, useEffect } from 'react';
import { X, Loader2, Crown, ChevronRight, CheckCircle2, Infinity } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { checkoutPremium, obtenerConsejos } from '../../api/premiumApi';

export default function ConsejeroModal({ isOpen, onClose }) {
    const { usuario, setUsuario } = useAuthStore();
    const showToast = useUiStore((state) => state.showToast);
    const [loading, setLoading] = useState(false);
    const [comprando, setComprando] = useState(false);
    const [consejeroData, setConsejeroData] = useState(null);
    const [mpEmail, setMpEmail] = useState('');

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mpEmail);

    useEffect(() => {
        if (isOpen && usuario?.isPremium) {
            cargarConsejos();
        }
    }, [isOpen, usuario?.isPremium]);

    const cargarConsejos = async () => {
        try {
            setLoading(true);
            const data = await obtenerConsejos();
            setConsejeroData(data);
        } catch (error) {
            showToast("Error al obtener consejos del analista", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleComprarPremium = async () => {
        if (!emailValido) return;
        try {
            setComprando(true);
            const { init_point } = await checkoutPremium(mpEmail.trim());
            window.location.href = init_point; // Redirigir a Mercado Pago
        } catch (error) {
            showToast("Error al conectar con Mercado Pago", "error");
            setComprando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                            {usuario?.isPremium ? (
                                <img src="/consejero.png" alt="Consejero" className="w-7 h-7 object-contain brightness-0 invert" />
                            ) : (
                                <Crown size={20} className="drop-shadow-md" />
                            )}
                        </div>
                        <div>
                            {usuario?.isPremium ? (
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    Analista Consejero
                                    <Crown size={16} className="text-amber-400" />
                                </h2>
                            ) : (
                                <h2 className="text-lg font-bold text-white">
                                    Subscribite al plan premium
                                </h2>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                    {!usuario?.isPremium ? (
                        <div className="flex flex-col gap-6 py-2">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full border border-amber-500 flex items-center justify-center shrink-0 bg-amber-500/10">
                                    <Infinity size={24} className="text-amber-400" />
                                </div>
                                <div className="flex-1 mt-1">
                                    <h3 className="text-white font-bold text-base leading-tight">Transferencias ilimitadas</h3>
                                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                        Realizá todos los cambios que necesites sin preocuparte por el límite de 3 por jornada.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 mb-2">
                                <div className="w-12 h-12 rounded-full border border-amber-500 flex items-center justify-center shrink-0 bg-amber-500/10">
                                    <div 
                                        className="w-6 h-6 bg-amber-400" 
                                        style={{ 
                                            WebkitMaskImage: 'url(/consejero.png)', 
                                            maskImage: 'url(/consejero.png)', 
                                            WebkitMaskSize: 'contain', 
                                            maskSize: 'contain', 
                                            WebkitMaskRepeat: 'no-repeat', 
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskPosition: 'center',
                                            maskPosition: 'center'
                                        }} 
                                    />
                                </div>
                                <div className="flex-1 mt-1">
                                    <h3 className="text-white font-bold text-base leading-tight">Analista Consejero</h3>
                                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                        Nuestra Inteligencia Artificial analizará tu equipo y te dará recomendaciones para que sumes más puntos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-3 mt-2">
                                <div className="w-full">
                                    <label className="text-xs text-gray-400 mb-1.5 block">
                                        Mail de tu cuenta de Mercado Pago
                                    </label>
                                    <input
                                        type="email"
                                        value={mpEmail}
                                        onChange={(e) => setMpEmail(e.target.value)}
                                        placeholder="tumail@ejemplo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                                <button
                                    onClick={handleComprarPremium}
                                    disabled={comprando || !emailValido}
                                    className="w-full relative group overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                                    {comprando ? (
                                        <Loader2 size={20} className="animate-spin relative z-10" />
                                    ) : (
                                        <>
                                            <span className="relative z-10">Activar Premium ($5.000 / mes)</span>
                                            <ChevronRight size={18} className="relative z-10" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {loading || !consejeroData ? (
                                <div className="py-12 flex flex-col items-center justify-center text-amber-500 gap-3">
                                    <Loader2 size={32} className="animate-spin" />
                                    <span className="text-sm font-medium animate-pulse">Analizando tu plantel...</span>
                                </div>
                            ) : (
                                <>
                                    {consejeroData.advertencias?.length > 0 && (
                                        <div className="mb-2">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">⚠️ Puntos de mejora</h4>
                                            <div className="flex flex-col gap-3">
                                                {consejeroData.advertencias.map((adv, idx) => (
                                                    <div key={idx} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm leading-relaxed">
                                                        {adv}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {consejeroData.consejos?.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💡 Análisis General</h4>
                                            <div className="flex flex-col gap-3">
                                                {consejeroData.consejos.map((cons, idx) => (
                                                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start gap-3">
                                                        <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
                                                        <span className="text-gray-300 text-sm leading-relaxed">{cons}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
