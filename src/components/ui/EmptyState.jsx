export default function EmptyState({ titulo, descripcion, accion }) {
    return (
        <div className="flex flex-col items-center justify-center
                    py-16 px-6 text-center gap-3">
            <div className="w-16 h-16 bg-card rounded-full flex items-center
                      justify-center text-3xl border border-border">
                🏀
            </div>
            <h3 className="text-textMain font-semibold text-lg">{titulo}</h3>
            {descripcion && (
                <p className="text-textMuted text-sm max-w-xs">{descripcion}</p>
            )}
            {accion && (
                <button onClick={accion.onClick} className="btn-primary mt-2">
                    {accion.label}
                </button>
            )}
        </div>
    )
}