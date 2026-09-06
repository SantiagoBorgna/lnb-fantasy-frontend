

export default function PreLaunchPage() {
    return (
        <div className="min-h-screen bg-[#101621] flex flex-col items-center justify-center p-6 text-center font-sans">
            
            {/* Contenedor Principal */}
            <div className="max-w-md w-full flex flex-col items-center">
                
                {/* Logo */}
                <img 
                    src="/icons/logo-cuadrado.jpg" 
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
                        href="https://www.instagram.com/sexto.hombre.fantasy/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2 mr-1">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        Seguinos en Instagram
                    </a>

                    <a 
                        href="https://x.com/SextoHombreFant" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm bg-black border border-white/10 hover:bg-white/5 transition-colors shadow-lg shadow-black/50"
                    >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current mr-1">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Seguinos en X (Twitter)
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12">
                <p className="text-gray-500 text-xs font-medium">
                    © 2026 Sexto Hombre Fantasy.
                </p>
            </div>
        </div>
    )
}
