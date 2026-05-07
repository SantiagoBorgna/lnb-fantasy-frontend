export default function BotonAyuda({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-8 h-8 rounded-full bg-card border border-border
                 flex items-center justify-center
                 text-textMuted hover:text-textMain hover:border-primary
                 transition-colors text-sm font-bold"
            aria-label="Ayuda"
        >
            ?
        </button>
    )
}