import React from 'react';

// Para agregar un sponsor: subir el logo a public/sponsors/ y sumar una entrada acá.
// `url` es opcional: si está, el logo linkea a la web/redes del sponsor.
const sponsors = [
    { id: 'balon-al-aire', name: 'Balón al Aire', logoUrl: '/sponsors/balon-al-aire.jpg', url: null },
];

const SponsorsBanner = ({ className = '' }) => {
    if (sponsors.length === 0) return null;

    return (
        <div className={`w-full bg-background py-4 flex flex-col items-center justify-center gap-3 ${className}`}>
            <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold">Nos acompaña</p>
            <div className="flex flex-row flex-wrap items-center justify-center gap-6 md:gap-12 px-4">
                {sponsors.map(s => {
                    const logo = (
                        <img
                            src={s.logoUrl}
                            alt={s.name}
                            title={s.name}
                            className="h-14 md:h-16 rounded-lg object-contain transition-transform hover:scale-105"
                        />
                    );
                    return s.url ? (
                        <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{logo}</a>
                    ) : (
                        <div key={s.id}>{logo}</div>
                    );
                })}
            </div>
        </div>
    );
};

export default SponsorsBanner;
