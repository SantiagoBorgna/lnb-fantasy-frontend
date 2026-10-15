import clsx from 'clsx'
import { linkWhatsApp } from '../../utils/compartir'

/**
 * Botón que abre WhatsApp con un mensaje ya escrito.
 * compacto: versión chica para tarjetas/listas.
 */
export default function BotonWhatsApp({ texto, children = 'Invitar por WhatsApp', compacto = false, className = '', onClick }) {
    return (
        <a
            href={linkWhatsApp(texto)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className={clsx(
                'flex items-center justify-center gap-2 font-semibold text-white bg-[#25D366] hover:bg-[#1EBE5A] transition-colors active:scale-95',
                compacto ? 'text-xs rounded-lg px-2 py-1' : 'w-full py-3 rounded-xl',
                className
            )}
        >
            <IconoWhatsApp size={compacto ? 14 : 20} />
            {children}
        </a>
    )
}

export function IconoWhatsApp({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 0 1-4.81-1.32l-.35-.2-3.58.94.96-3.49-.23-.36a9.42 9.42 0 0 1-1.44-5.03c0-5.2 4.24-9.44 9.46-9.44a9.4 9.4 0 0 1 6.69 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.45-9.45 9.45zm8.04-17.49A11.3 11.3 0 0 0 12.04.67C5.77.67.67 5.77.67 12.03c0 2 .52 3.96 1.52 5.68L.57 23.33l5.75-1.51a11.33 11.33 0 0 0 5.72 1.46h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.03-1.18-5.89-3.33-8.03z" />
        </svg>
    )
}
