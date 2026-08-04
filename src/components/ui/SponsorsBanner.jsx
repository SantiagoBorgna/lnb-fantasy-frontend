import React from 'react';

const SponsorsBanner = ({ className = '' }) => {
    // Placeholder sponsors for now until real ones arrive
    const sponsors = [
        { id: 1, name: 'Sponsor 1', logoUrl: 'https://placehold.co/150x50/333333/FFFFFF?text=Sponsor+1' },
        { id: 2, name: 'Sponsor 2', logoUrl: 'https://placehold.co/150x50/333333/FFFFFF?text=Sponsor+2' },
        { id: 3, name: 'Sponsor 3', logoUrl: 'https://placehold.co/150x50/333333/FFFFFF?text=Sponsor+3' }
    ];

    return (
        <div className={`w-full bg-background py-4 flex flex-col items-center justify-center gap-3 ${className}`}>
            <p className="text-[10px] text-textMuted uppercase tracking-widest font-bold">Nos acompañan</p>
            <div className="flex flex-row flex-wrap items-center justify-center gap-6 md:gap-12 px-4">
                {sponsors.map(s => (
                    <img 
                        key={s.id} 
                        src={s.logoUrl} 
                        alt={s.name} 
                        className="h-8 md:h-10 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0 cursor-pointer object-contain" 
                    />
                ))}
            </div>
        </div>
    );
};

export default SponsorsBanner;
