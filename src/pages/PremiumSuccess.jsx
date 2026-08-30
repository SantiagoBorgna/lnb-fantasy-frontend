import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Crown, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosClient';

export default function PremiumSuccess() {
    const navigate = useNavigate();
    const { usuario, setUsuario } = useAuthStore();

    useEffect(() => {
        // En cuanto llegamos a success, recargamos el usuario desde el backend
        // para asegurarnos de tener el isPremium actualizado por el Webhook
        const fetchUsuario = async () => {
            try {
                const { data } = await api.get('/usuario/me');
                setUsuario(data);
            } catch (error) {
                console.error("Error recargando usuario", error);
            }
        };
        fetchUsuario();
    }, [setUsuario]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 relative">
                <Crown className="w-12 h-12 text-amber-400" />
                <CheckCircle2 className="w-8 h-8 text-green-500 absolute -bottom-2 -right-2 bg-background rounded-full border-[3px] border-background" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-textMain">¡Felicidades, sos Premium!</h1>
            <p className="text-textMuted max-w-md mx-auto mb-8">
                El pago se procesó correctamente. Ya tenés acceso al Analista LNB, transferencias ilimitadas y mucho más.
            </p>
            <button 
                onClick={() => navigate('/canchita')}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
            >
                Ir a mi equipo
            </button>
        </div>
    );
}
