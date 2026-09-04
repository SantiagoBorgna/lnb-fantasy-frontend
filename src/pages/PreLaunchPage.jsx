import { CalendarDays } from 'lucide-react'

export default function PreLaunchPage() {
    return (
        <div className="min-h-screen bg-bg dark flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-card border border-border p-8 rounded-2xl max-w-lg w-full flex flex-col items-center shadow-lg shadow-black/20">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                    <CalendarDays className="w-8 h-8" />
                </div>
                
                <h1 className="text-3xl font-bold text-textMain mb-4 font-display uppercase tracking-wider">
                    Sexto Hombre
                </h1>
                
                <h2 className="text-xl text-primary font-bold mb-6">
                    Gran Estreno: 18 de Septiembre
                </h2>
                
                <p className="text-textMuted mb-8 text-lg">
                    Estamos preparando los últimos detalles para abrir la cancha. ¡Preparate para armar tu equipo y demostrar quién sabe más de la Liga!
                </p>

                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}
