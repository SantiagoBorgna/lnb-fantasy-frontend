import React from 'react';
import clsx from 'clsx';

export default function JornadaSelector({ jornadas, selectedId, onSelect, className }) {
    if (!jornadas || jornadas.length === 0) return null;

    const currentIndex = jornadas.findIndex(j => j.id === selectedId);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex !== -1 && currentIndex < jornadas.length - 1;

    const handlePrev = () => {
        if (hasPrev) onSelect(jornadas[currentIndex - 1].id);
    };

    const handleNext = () => {
        if (hasNext) onSelect(jornadas[currentIndex + 1].id);
    };

    const selectedJornada = jornadas[currentIndex];

    return (
        <div className={clsx("flex items-center justify-between bg-surface border border-border rounded-xl p-2", className)}>
            <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={clsx(
                    "p-2 rounded-lg transition-colors flex items-center justify-center",
                    hasPrev ? "text-textMain hover:bg-card" : "text-textMuted/30 cursor-not-allowed"
                )}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                </svg>
            </button>

            <div className="relative flex-1 flex justify-center items-center">
                <span className="font-bold text-sm tracking-widest text-textMain uppercase flex items-center gap-1">
                    JORNADA {selectedJornada?.numero}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="opacity-70 mt-0.5">
                        <path d="M6 9l6 6 6-6z" />
                    </svg>
                </span>
                <select
                    value={selectedId ?? ''}
                    onChange={e => onSelect(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-textMain bg-card"
                >
                    {jornadas.map(j => (
                        <option key={j.id} value={j.id} className="bg-card text-textMain">
                            Jornada {j.numero}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleNext}
                disabled={!hasNext}
                className={clsx(
                    "p-2 rounded-lg transition-colors flex items-center justify-center",
                    hasNext ? "text-textMain hover:bg-card" : "text-textMuted/30 cursor-not-allowed"
                )}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
            </button>
        </div>
    );
}
