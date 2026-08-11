import { AlertTriangleIcon } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-bg dark flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full flex flex-col items-center shadow-lg shadow-black/20">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-6">
                    <AlertTriangleIcon className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-bold text-textMain mb-4 font-display">
                    Estamos trabajando...
                </h1>
                
                <p className="text-textMuted mb-6">
                    Volvemos enseguida. Estamos realizando tareas de mantenimiento para mejorar tu experiencia en la cancha.
                </p>

                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}
