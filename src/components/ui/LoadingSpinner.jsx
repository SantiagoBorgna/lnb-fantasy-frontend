export default function LoadingSpinner({ mensaje = 'Cargando...' }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent
                      rounded-full animate-spin" />
            <p className="text-textMuted text-sm">{mensaje}</p>
        </div>
    )
}