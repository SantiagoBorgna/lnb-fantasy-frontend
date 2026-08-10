import { createPortal } from 'react-dom';
import CamisetaSVG from '../jugador/CamisetaSVG';

export default function ShowdownStatsModal({ isOpen, onClose, jugador }) {
    if (!isOpen || !jugador) return null;
    
    const colorPrincipal = jugador.equipoColorPrincipal || jugador.equipoReal?.colorPrincipal;
    const colorSecundario = jugador.equipoColorSecundario || jugador.equipoReal?.colorSecundario;
    const modelo = jugador.equipoModeloCamiseta || jugador.equipoReal?.modeloCamiseta;
    
    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-6 space-y-4 animate-slide-up md:animate-none" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                
                <div className="flex items-center gap-4">
                    <CamisetaSVG
                        colorPrincipal={colorPrincipal}
                        colorSecundario={colorSecundario}
                        modelo={modelo}
                        numero={jugador.numeroCamiseta}
                        estado={jugador.estado}
                        size={56}
                    />
                    <div>
                        <p className="text-textMain font-bold">{jugador.nombre} {jugador.apellido}</p>
                        <p className="text-textMuted text-sm">{jugador.equipoSigla} · {jugador.posicion.replace('_', ' ')}</p>
                    </div>
                </div>
                
                <div className="bg-surface rounded-xl p-4 border border-border grid grid-cols-3 gap-3">
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Pts</p>
                        <p className="text-textMain font-bold text-lg">{jugador.pts ?? 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Reb</p>
                        <p className="text-textMain font-bold text-lg">{jugador.reb ?? 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Ast</p>
                        <p className="text-textMain font-bold text-lg">{jugador.ast ?? 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Rob</p>
                        <p className="text-textMain font-bold text-lg">{jugador.stl ?? 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Tap</p>
                        <p className="text-textMain font-bold text-lg">{jugador.blk ?? 0}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-textMuted text-xs uppercase">Per</p>
                        <p className="text-textMain font-bold text-lg">{jugador.tov ?? 0}</p>
                    </div>
                </div>
                
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-textMain font-bold">Puntos Fantasy</p>
                        {jugador.esCapitan && <p className="text-yellow-500 text-xs font-bold">Capitán (x1.5)</p>}
                    </div>
                    <p className="text-accent font-black text-2xl">{jugador.puntosAportados?.toFixed(1) ?? '0.0'}</p>
                </div>
                
                <button onClick={onClose} className="w-full py-2 text-textMuted text-sm font-medium mt-2">
                    Cerrar
                </button>
            </div>
        </>,
        document.body
    );
}
