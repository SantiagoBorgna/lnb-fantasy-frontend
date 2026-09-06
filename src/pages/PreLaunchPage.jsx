import { Instagram, Twitter } from 'lucide-react'

export default function PreLaunchPage() {
    return (
        <div className="min-h-screen bg-[#101621] flex flex-col items-center justify-center p-6 text-center font-sans">
            
            {/* Contenedor Principal */}
            <div className="max-w-md w-full flex flex-col items-center">
                
                {/* Logo */}
                <img 
                    src="/logo.png" 
                    alt="Sexto Hombre" 
                    className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-[2rem] shadow-2xl mb-8"
                />
                
                {/* Textos */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                    Nos estamos preparando
                </h1>
                
                <p className="text-gray-400 text-sm md:text-base font-medium mb-10 max-w-xs mx-auto">
                    Enterate de las novedades y del lanzamiento en nuestras redes sociales.
                </p>

                {/* Botones */}
                <div className="w-full space-y-4 px-4">
                    <a 
                        href="https://instagram.com/sextohombre" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
                    >
                        <Instagram className="w-5 h-5" />
                        Seguinos en Instagram
                    </a>

                    <a 
                        href="https://twitter.com/sextohombre" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm bg-black border border-white/10 hover:bg-white/5 transition-colors shadow-lg shadow-black/50"
                    >
                        <Twitter className="w-5 h-5" />
                        Seguinos en X (Twitter)
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6">
                <p className="text-gray-500 text-xs font-medium">
                    © 2026 Sexto Hombre Fantasy.
                </p>
            </div>
        </div>
    )
}
